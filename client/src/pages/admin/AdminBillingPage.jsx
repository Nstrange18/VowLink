import { useState } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { Icon } from "@iconify/react";

const PLANS = [
  {
    id: "free",
    name: "Free Plan",
    priceInUsd: 0,
    period: "forever",
    description: "Perfect for testing and small intimate gatherings.",
    color: "border-white/10 bg-white/5",
    features: [
      { text: "1 generic invite link", enabled: true },
      { text: "Max 20 RSVP responses", enabled: true },
      { text: "Watermark visible", enabled: true },
      { text: "Basic template only", enabled: true },
      { text: "No personalized guest links", enabled: false },
      { text: "No guest grouping", enabled: false },
      { text: "No RSVP export", enabled: false },
    ],
  },
  {
    id: "plus",
    name: "Plus Plan",
    priceInUsd: 29,
    priceInNgn: 2000,
    period: "one-time",
    description: "Unlock multiple design choices and contact vendors directly.",
    color: "border-[#7FA6D9]/30 bg-[#7FA6D9]/5 hover:border-[#7FA6D9]/60",
    badge: "Most Popular",
    features: [
      { text: "Up to 100 personalized guest links", enabled: true },
      { text: "Up to 100 RSVP responses", enabled: true },
      { text: "Remove watermark", enabled: true },
      { text: "Premium templates", enabled: true },
      { text: "Guest list dashboard", enabled: true },
      { text: "Google Maps navigation", enabled: true },
      { text: "Photo gallery", enabled: true },
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    priceInUsd: 69,
    priceInNgn: 5000,
    period: "one-time",
    description: "Ultimate wedding invitation and planning experience.",
    color: "border-[#D8B76A]/40 bg-[#D8B76A]/5 hover:border-[#D8B76A] shadow-[0_0_25px_rgba(216,183,106,0.15)]",
    badge: "Ultimate Tier",
    features: [
      { text: "Up to 500 personalized guest links", enabled: true },
      { text: "Advanced RSVP tracking", enabled: true },
      { text: "Seating chart & guest management", enabled: true },
      { text: "Venue recommendations", enabled: true },
      { text: "Background music", enabled: true },
      { text: "Cosmic & Forest animations", enabled: true },
      { text: "Export RSVP list", enabled: true },
      { text: "Custom design upload", enabled: true },
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

const AdminBillingPage = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [currency, setCurrency] = useState("USD");
  const [loadingPaystack, setLoadingPaystack] = useState(false);

  const currentTier = user.tier || "free";

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
    if (plan.id === currentTier) {
      toast.info(`You are already subscribed to the ${plan.name}.`);
      return;
    }

    setLoadingPaystack(true);
    const loaded = await loadPaystackScript();
    setLoadingPaystack(false);

    if (!loaded) {
      toast.error("Failed to load Paystack payment gateway. Please check your connection.");
      return;
    }

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
          setUser(res.data.user);
          toast.success(`Successfully upgraded to ${plan.name}!`);
          window.location.reload();
        } catch (err) {
          toast.error(err.response?.data?.message || "Verification failed. Please contact support.");
        }
      },
      onCancel: () => {
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
      toast.error("Paystack payment SDK is not initialized. Please refresh the page.");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {loadingPaystack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-[#090D19] border border-white/10 p-6 rounded-2xl text-center space-y-4 shadow-2xl">
            <div className="h-10 w-10 rounded-full border-4 border-white/10 border-t-[#D8B76A] animate-spin mx-auto" />
            <p className="text-white text-xs font-semibold">Connecting to Paystack Secure Portal...</p>
          </div>
        </div>
      )}

      <div className="mb-8 flex justify-between items-start gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Pricing Plans</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">Billing & Subscription</h2>
          <p className="text-white/40 text-sm mt-2 max-w-2xl">
            Upgrade your wedding workspace to unlock beautiful designs, customizable themes, bulk guest creation, and suggested venue details.
          </p>
        </div>
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

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
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
                  disabled={isActive && plan.id === "free"}
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
                    onClick={() => {
                      api.post("/auth/upgrade", { tier: plan.id }).then((res) => {
                        localStorage.setItem("token", res.data.accessToken);
                        localStorage.setItem("user", JSON.stringify(res.data.user));
                        toast.success(`[DEV BYPASS] Instantly activated ${plan.name}!`);
                        window.location.reload();
                      });
                    }}
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
