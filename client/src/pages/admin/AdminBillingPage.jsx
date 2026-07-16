import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { Icon } from "@iconify/react";
import GuidedTour from "../../components/GuidedTour";
import PageMiniTour from "../../components/PageMiniTour";

const PLANS = [
  {
    id: "free",
    name: "Classic Plan",
    priceInUsd: 20,
    priceInNgn: 30000,
    period: "one-time",
    description: "A polished starter invitation package for intimate weddings.",
    color: "border-white/10 bg-white/5",
    features: [
      { text: "1 generic invitation link", enabled: true },
      { text: "Up to 20 RSVP responses", enabled: true },
      { text: "Basic invitation dashboard", enabled: true },
      { text: "Classic Floral and Modern Minimalist templates", enabled: true },
      { text: "Limited venue preview", enabled: true },
      { text: "VowLink watermark visible", enabled: true },
      { text: "Guest entry QR and check-in tools", enabled: false },
      { text: "Personalized guest links", enabled: false },
      { text: "Bulk guest import", enabled: false },
      { text: "Photo gallery and music", enabled: false },
      { text: "Full venue details", enabled: false },
    ],
  },
  {
    id: "plus",
    name: "Plus Plan",
    priceInUsd: 45.33,
    priceInNgn: 68000,
    period: "one-time",
    description: "Unlock multiple design choices and contact vendors directly.",
    color: "border-[#7FA6D9]/30 bg-[#7FA6D9]/5 hover:border-[#7FA6D9]/60",
    badge: "Most Popular",
    features: [
      { text: "Up to 100 personalized guest links", enabled: true },
      { text: "Up to 100 RSVP responses", enabled: true },
      { text: "Bulk guest import from CSV", enabled: true },
      { text: "Guest categories and sender groups", enabled: true },
      { text: "Remove VowLink watermark", enabled: true },
      { text: "Individual guest entry QR codes", enabled: true },
      { text: "Event PIN check-in from each QR", enabled: true },
      { text: "Premium templates and page backgrounds", enabled: true },
      { text: "Couple photo overlay and background music", enabled: true },
      { text: "Photo gallery up to 5 images", enabled: true },
      { text: "Full venue contacts, pricing and maps", enabled: true },
      { text: "Staff check-in search mode", enabled: false },
      { text: "Printable QR sheet and check-in reset", enabled: false },
      { text: "RSVP CSV export", enabled: false },
      { text: "Bulk WhatsApp invite sender", enabled: false },
      { text: "Custom design upload and AI theme matcher", enabled: false },
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    priceInUsd: 80,
    priceInNgn: 120000,
    period: "one-time",
    description: "Ultimate wedding invitation and planning experience.",
    color: "border-[#D8B76A]/40 bg-[#D8B76A]/5 hover:border-[#D8B76A] shadow-[0_0_25px_rgba(216,183,106,0.15)]",
    badge: "Ultimate Tier",
    features: [
      { text: "Up to 500 personalized guest links", enabled: true },
      { text: "Up to 500 RSVP responses", enabled: true },
      { text: "Everything in Plus", enabled: true },
      { text: "Staff mode for ushers with event PIN", enabled: true },
      { text: "Printable guest QR sheets", enabled: true },
      { text: "Check-in history and reset controls", enabled: true },
      { text: "RSVP CSV export", enabled: true },
      { text: "Seating chart and table management", enabled: true },
      { text: "Bulk WhatsApp sender with partner queues", enabled: true },
      { text: "WhatsApp sent-status tracking", enabled: true },
      { text: "All Pro templates and animated themes", enabled: true },
      { text: "Custom invitation design upload", enabled: true },
      { text: "Photo gallery up to 15 images", enabled: true },
      { text: "AI theme matcher", enabled: true },
      { text: "Venue shortlist and direct inquiries", enabled: true },
    ],
  },
];

const CURRENCIES = {
  USD: { symbol: "$", rate: 1.0, label: "USD ($) - United States Dollar" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR (€) - Euro" },
  GBP: { symbol: "£", rate: 0.79, label: "GBP (£) - British Pound" },
  NGN: { symbol: "₦", rate: 1500, label: "NGN (₦) - Nigerian Naira (Paystack Main)" },
  GHS: { symbol: "GH₵", rate: 14.5, label: "GHS (GH₵) - Ghanaian Cedi" },
  KES: { symbol: "KSh", rate: 130, label: "KES (KSh) - Kenyan Shilling" },
  ZAR: { symbol: "R", rate: 18.5, label: "ZAR (R) - South African Rand" },
  CAD: { symbol: "C$", rate: 1.36, label: "CAD (C$) - Canadian Dollar" },
  AUD: { symbol: "A$", rate: 1.5, label: "AUD (A$) - Australian Dollar" },
};

const loadPaystackScript = () => {
  return new Promise((resolve) => {
    if (window.PaystackPop) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const PLAN_LABELS = {
  unpaid: "Trial",
  free: "Classic",
  plus: "Plus",
  pro: "Pro",
};

const BILLING_TOUR_STEPS = [
  {
    target: '[data-tour="billing-header"]',
    title: "Current plan",
    body: "Use this area to confirm the plan currently attached to the wedding workspace.",
  },
  {
    target: '[data-tour="plan-comparison"]',
    title: "Plan summary",
    body: "Compare Trial, Classic, Plus, and Pro quickly before choosing what fits the event.",
  },
  {
    target: '[data-tour="plans-grid"]',
    title: "Upgrade cards",
    body: "Each card shows pricing, included features, and what will unlock after successful Paystack payment.",
  },
];

const ACTIVATION_COPY = {
  free: {
    title: "Classic activated",
    body: "You can now create your invitation, collect up to 20 RSVPs, and use the Classic templates.",
  },
  plus: {
    title: "Plus activated",
    body: "You can now use personalized guest links, guest QR codes, event PIN check-in, gallery photos, music, and full venue details.",
  },
  pro: {
    title: "Pro activated",
    body: "You can now use staff mode, printable QR sheets, RSVP export, seating, bulk WhatsApp, custom designs, and AI tools.",
  },
};

const getActivationTourSteps = (tier, name) => {
  if (tier === "free") {
    return [
      {
        target: '[data-tour="activation-notice"]',
        title: `${name} is active`,
        body: "Classic gives you the core invitation workflow for a focused event.",
        items: ["Create 1 invitation link", "Collect up to 20 RSVPs", "Use the Classic template collection"],
      },
      {
        target: '[data-tour="plan-comparison"]',
        title: "Know what stays locked",
        body: "QR check-in, guest-specific links, staff mode, bulk WhatsApp, seating, exports, and advanced design tools become available on higher plans.",
      },
    ];
  }

  if (tier === "plus") {
    return [
      {
        target: '[data-tour="activation-notice"]',
        title: `${name} is active`,
        body: "Plus unlocks the tools most couples need once the guest list becomes more structured.",
        items: ["100 personalized guest links", "Individual guest QR codes", "Event PIN check-in", "Full venue details", "Gallery photos and music"],
      },
      {
        target: '[data-tour="plan-comparison"]',
        title: "What Pro adds later",
        body: "Pro is still the plan for staff search mode, printable QR sheets, RSVP exports, seating, bulk WhatsApp, AI tools, and custom designs.",
      },
    ];
  }

  return [
    {
      target: '[data-tour="activation-notice"]',
      title: `${name} is active`,
      body: "Pro unlocks the full event operations layer for larger weddings and organized teams.",
      items: ["Staff mode for ushers", "Printable QR sheets", "Seating chart", "Bulk WhatsApp sender", "RSVP exports", "AI and custom design tools"],
    },
    {
      target: '[data-tour="plans-grid"]',
      title: "You have the full toolkit",
      body: "Your next step is to customize the invitation, import guests, set the check-in PIN, and prepare WhatsApp sending or QR sheets if needed.",
    },
  ];
};

const AdminBillingPage = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [currency, setCurrency] = useState("USD");
  const [loadingPaystack, setLoadingPaystack] = useState(false);
  const [checkoutLocked, setCheckoutLocked] = useState(false);
  const checkoutSubmittingRef = useRef(false);
  const [devBypassLocked, setDevBypassLocked] = useState(false);
  const devBypassSubmittingRef = useRef(false);
  const [activationNotice, setActivationNotice] = useState(null);
  const [activationTourOpen, setActivationTourOpen] = useState(false);

  const currentTier = user.tier || "unpaid";

  useEffect(() => {
    const stored = sessionStorage.getItem("vowlink-plan-activated");
    if (!stored) return;
    sessionStorage.removeItem("vowlink-plan-activated");
    try {
      const parsed = JSON.parse(stored);
      setActivationNotice(parsed);
      setActivationTourOpen(true);
    } catch {
      setActivationNotice(null);
    }
  }, []);

  const getFormattedPrice = (plan) => {
    if (plan.priceInNgn === 0 || plan.priceInUsd === 0) {
      return CURRENCIES[currency].symbol + "0";
    }
    const baseNgn = plan.priceInNgn;
    const ngnRate = CURRENCIES["NGN"].rate;
    const priceInUsd = baseNgn / ngnRate;

    const conf = CURRENCIES[currency];
    const converted = priceInUsd * conf.rate;
    if (currency === "NGN") {
      return `₦${baseNgn.toLocaleString()}`;
    }
    return `${conf.symbol}${converted.toFixed(2)}`;
  };

  const handleOpenCheckout = async (plan) => {
    if (checkoutSubmittingRef.current) return;

    if (plan.id === currentTier) {
      toast.info(`You are already subscribed to the ${plan.name}.`);
      return;
    }

    checkoutSubmittingRef.current = true;
    setCheckoutLocked(true);
    setLoadingPaystack(true);
    const loaded = await loadPaystackScript();
    setLoadingPaystack(false);

    if (!loaded) {
      checkoutSubmittingRef.current = false;
      setCheckoutLocked(false);
      toast.error("Failed to load Paystack payment gateway. Please check your connection.");
      return;
    }

    const releaseCheckout = () => {
      checkoutSubmittingRef.current = false;
      setCheckoutLocked(false);
    };

    // Paystack account is registered in Nigeria; we must transact in NGN to ensure checkout success.
    // International cards will still pay the NGN equivalent automatically converted by their bank.
    const paystackCurrency = "NGN";
    const amountInMinor = plan.priceInNgn * 100; // Native NGN amount in kobo

    const paystackOptions = {
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_live_c3d7e8c28a21ae50bd22b5d448b1a80d0a00ed07",
      email: user.email,
      amount: amountInMinor,
      currency: paystackCurrency,
      metadata: {
        paymentType: "couple_upgrade",
        tier: plan.id,
        userId: user.id || user._id,
      },
      onSuccess: async (transaction) => {
        toast.info("Payment successful! Verifying with server...");
        try {
          const res = await api.post("/auth/upgrade/verify", {
            reference: transaction.reference,
            tier: plan.id,
          });
          localStorage.setItem("token", res.data.accessToken);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          sessionStorage.setItem(
            "vowlink-plan-activated",
            JSON.stringify({
              tier: plan.id,
              name: plan.name,
              ...(ACTIVATION_COPY[plan.id] || {}),
            }),
          );
          setUser(res.data.user);
          toast.success(`Successfully upgraded to ${plan.name}!`);
          window.location.reload();
        } catch (err) {
          toast.error(err.response?.data?.message || "Verification failed. Please contact support.");
          releaseCheckout();
        }
      },
      onCancel: () => {
        releaseCheckout();
        toast.info("Payment cancelled.");
      },
    };

    // Version-resilient wrapper to handle both v1 (setup) and v2 (new constructor)
    if (typeof window.PaystackPop === "function") {
      try {
        const paystack = new window.PaystackPop();
        paystack.newTransaction(paystackOptions);
        return;
      } catch (e) {
        console.warn("Paystack Pop V2 instantiation failed, falling back to V1 setup", e);
      }
    }

    if (window.PaystackPop && typeof window.PaystackPop.setup === "function") {
      const handler = window.PaystackPop.setup({
        ...paystackOptions,
        callback: paystackOptions.onSuccess,
        onClose: paystackOptions.onCancel
      });
      handler.openIframe();
    } else {
      releaseCheckout();
      toast.error("Paystack payment SDK is not initialized. Please refresh the page.");
    }
  };

  const handleDevBypass = async (plan) => {
    if (devBypassSubmittingRef.current) return;

    devBypassSubmittingRef.current = true;
    setDevBypassLocked(true);
    try {
      const res = await api.post("/auth/upgrade", { tier: plan.id });
      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      sessionStorage.setItem(
        "vowlink-plan-activated",
        JSON.stringify({
          tier: plan.id,
          name: plan.name,
          ...(ACTIVATION_COPY[plan.id] || {}),
        }),
      );
      toast.success(`[DEV BYPASS] Instantly activated ${plan.name}!`);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Dev bypass failed.");
      devBypassSubmittingRef.current = false;
      setDevBypassLocked(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <GuidedTour
        open={activationTourOpen && Boolean(activationNotice)}
        title="Unlocked features"
        steps={activationNotice ? getActivationTourSteps(activationNotice.tier, activationNotice.name) : []}
        storageKey={activationNotice ? `vowlink-tier-tour-seen-${activationNotice.tier}` : undefined}
        onClose={() => setActivationTourOpen(false)}
      />

      {loadingPaystack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-[#090D19] border border-white/10 p-6 rounded-2xl text-center space-y-4 shadow-2xl">
            <div className="h-10 w-10 rounded-full border-4 border-white/10 border-t-[#D8B76A] animate-spin mx-auto" />
            <p className="text-white text-xs font-semibold">Connecting to Paystack Secure Portal...</p>
          </div>
        </div>
      )}

      <div data-tour="billing-header" className="mb-8 flex justify-between items-start gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Pricing Plans</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">Billing & Subscription</h2>
          <p className="text-white/40 text-sm mt-2 max-w-2xl">
            Upgrade your wedding workspace to unlock beautiful designs, customizable themes, bulk guest creation, and suggested venue details.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
            <Icon icon="lucide:badge-check" className="h-3.5 w-3.5 text-[#D8B76A]" />
            Current plan: <span className="text-white">{PLAN_LABELS[currentTier] || currentTier}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
        <PageMiniTour title="Billing tour" storageKey="vowlink-tour-billing" steps={BILLING_TOUR_STEPS} />
        <div className="bg-[#090D19] border border-white/10 p-4 rounded-2xl flex flex-col gap-1.5 min-w-44">
          <label className="block text-[10px] uppercase tracking-wider text-white/50 font-bold">Select Currency</label>
          <select
            className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3 py-2 text-xs text-white outline-none focus:border-[#D8B76A]/60"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {Object.keys(CURRENCIES).map((key) => (
              <option key={key} value={key}>
                {CURRENCIES[key].label}
              </option>
            ))}
          </select>
        </div>
        </div>
      </div>

      {activationNotice && (
        <div data-tour="activation-notice" className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                <Icon icon="lucide:check-circle-2" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300">Payment Confirmed</p>
                <h3 className="mt-1 font-serif text-2xl text-white">{activationNotice.title || `${activationNotice.name} activated`}</h3>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/60">{activationNotice.body}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActivationTourOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#06261B] transition hover:bg-emerald-200"
              >
                <Icon icon="lucide:map" className="h-3.5 w-3.5" />
                Show Tour
              </button>
              <button
                type="button"
                onClick={() => setActivationNotice(null)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-200 transition hover:bg-emerald-400/15"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {currentTier === "unpaid" && (
        <div className="mb-6 rounded-3xl border border-[#D8B76A]/25 bg-[#D8B76A]/10 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D8B76A]/30 bg-[#D8B76A]/10 text-[#D8B76A]">
              <Icon icon="lucide:lock-keyhole" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">Trial Workspace</p>
              <h3 className="mt-1 font-serif text-2xl text-white">Choose a plan to publish invitations</h3>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/60">
                Trial accounts can view the dashboard and compare plans, but live invitations, RSVPs, downloads, venue contacts, WhatsApp sending, and check-in tools stay locked until payment succeeds.
              </p>
            </div>
          </div>
        </div>
      )}

      <div data-tour="plan-comparison" className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          ["Trial", "Account preview. Compare plans and activate billing."],
          ["Classic", "NGN 30,000. 1 invite, 20 RSVPs, 6 Classic templates, no check-in."],
          ["Plus", "NGN 68,000. 100 guests, personalized links, QR codes, event PIN check-in."],
          ["Pro", "NGN 120,000. Staff mode, QR sheets, seating, bulk WhatsApp, exports, AI and custom design."],
        ].map(([label, copy]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D8B76A]">{label}</p>
            <p className="mt-2 text-xs leading-relaxed text-white/55">{copy}</p>
          </div>
        ))}
      </div>

      {/* Plans Grid */}
      <div data-tour="plans-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PLANS.map((plan) => {
          const isActive = plan.id === currentTier;
          return (
            <div
              key={plan.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 relative ${plan.color} ${
                isActive ? "ring-2 ring-[#D8B76A] border-transparent" : ""
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <span className="absolute -top-3 right-6 rounded-full bg-[#D8B76A] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#070A13]">
                  {plan.badge}
                </span>
              )}

              <div>
                <h3 className="text-xl font-medium text-white mb-1">{plan.name}</h3>
                <p className="text-white/40 text-xs mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-white tracking-tight">
                    {getFormattedPrice(plan)}
                  </span>
                  <span className="text-white/40 text-xs">/ {plan.period}</span>
                </div>

                <hr className="border-white/10 mb-6" />

                {/* Features */}
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className={`text-base leading-none select-none ${feature.enabled ? "text-[#D8B76A]" : "text-white/20"}`}>
                        <Icon icon={feature.enabled ? "lucide:check" : "lucide:x"} className="h-4 w-4" />
                      </span>
                      <span className={feature.enabled ? "text-white/80" : "text-white/30 line-through decoration-white/10"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleOpenCheckout(plan)}
                  disabled={checkoutLocked || isActive}
                  className={`w-full py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition duration-300 ${
                    isActive
                      ? "bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] cursor-default"
                      : plan.id === "pro"
                      ? "bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-[#070A13] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(216,183,106,0.2)]"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {isActive ? "Current Plan" : `Upgrade to ${plan.name}`}
                </button>

                {/* Dev Bypass Quick Trigger */}
                {isLocal && !isActive && (
                  <button
                    onClick={() => handleDevBypass(plan)}
                    disabled={checkoutLocked || devBypassLocked}
                    className="w-full text-center text-[10px] text-[#D8B76A]/50 hover:text-[#D8B76A] py-1 border border-dashed border-white/10 rounded-full hover:border-[#D8B76A]/30 transition"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <Icon icon="lucide:zap" className="h-3.5 w-3.5" />
                      Dev Bypass Activation
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminBillingPage;
