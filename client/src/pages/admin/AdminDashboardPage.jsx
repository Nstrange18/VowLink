import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import Skeleton from "../../components/common/Skeleton";
import { Icon } from "@iconify/react";
import GuidedTour from "../../components/GuidedTour";

const CATEGORIES = ["VIP", "Family", "Friend", "Colleague", "Guest"];

const categoryColors = {
  VIP: {
    ring: "border-[#D8B76A]/40",
    bg: "bg-[#D8B76A]/10",
    text: "text-[#D8B76A]",
    dot: "bg-[#D8B76A]",
  },
  Family: {
    ring: "border-[#7FA6D9]/40",
    bg: "bg-[#7FA6D9]/10",
    text: "text-[#7FA6D9]",
    dot: "bg-[#7FA6D9]",
  },
  Friend: {
    ring: "border-emerald-400/40",
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  Colleague: {
    ring: "border-purple-400/40",
    bg: "bg-purple-400/10",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  Guest: {
    ring: "border-white/20",
    bg: "bg-white/5",
    text: "text-white/60",
    dot: "bg-white/40",
  },
};

const getPlanLabel = (tier) => {
  if (tier === "free") return "Classic";
  if (tier === "plus") return "Plus";
  if (tier === "pro") return "Pro";
  return "Trial";
};

const getTierRank = (tier) =>
  ({
    unpaid: 0,
    free: 1,
    plus: 2,
    pro: 3,
  })[tier] ?? 0;

const openSidebarGroup = (groupId) => () => {
  window.dispatchEvent(
    new CustomEvent("vowlink:open-sidebar-group", { detail: groupId }),
  );
};

const getUpgradeTourSteps = (tier) => {
  const plan = getPlanLabel(tier);
  const shared = [
    {
      target: '[data-tour="dashboard-stats"]',
      title: `${plan} is active`,
      body: "Your dashboard now reflects the limits and tools for your active plan. Use this area to track invitations, RSVPs, attendance, and response gaps.",
    },
    {
      target: '[data-tour="customize-invite"]',
      title: "Customize the invitation",
      body: "Start with your card design, theme, colors, music, and sharing preview. This is where the guest experience begins.",
    },
  ];

  if (tier === "free") {
    return [
      ...shared,
      {
        target: '[data-tour="dashboard-checkin"]',
        title: "Classic plan limits",
        body: "Classic gives you one invitation link and up to 20 RSVPs. QR check-in and staff tools stay locked until Plus or Pro.",
      },
    ];
  }

  if (tier === "plus") {
    return [
      ...shared,
      {
        target: '[data-tour="dashboard-checkin"]',
        title: "QR check-in is available",
        body: "Plus unlocks guest QR codes and event PIN check-in, so ushers can confirm guests at the entrance from each QR link.",
      },
      {
        target: '[data-tour="dashboard-categories"]',
        title: "Use guest groups",
        body: "Organize guests by category and sender group so RSVP follow-up stays easy as the list grows.",
      },
    ];
  }

  return [
    ...shared,
    {
      target: '[data-tour="dashboard-checkin"]',
      title: "Pro event operations",
      body: "Pro unlocks staff mode, printable QR sheets, check-in reset controls, exports, seating, bulk WhatsApp, AI, and custom design tools.",
    },
    {
      target: '[data-tour="dashboard-categories"]',
      title: "Manage at scale",
      body: "Use guest categories, RSVP breakdowns, seating, and WhatsApp queues to manage a larger event without losing structure.",
    },
  ];
};

const DASHBOARD_TOUR_STEPS = [
  {
    target: '[data-tour="admin-sidebar-profile"]',
    title: "Your wedding profile",
    body: "The sidebar keeps your couple name, plan badge, email, and wedding date visible so you always know which workspace you are managing.",
  },
  {
    target: '[data-tour="admin-nav-dashboard"]',
    title: "Dashboard",
    body: "This is the home base for your wedding workspace. It summarizes invitations, RSVP progress, guest groups, and event-day check-in activity.",
  },
  {
    target: '[data-tour="admin-nav-invitations-group"]',
    title: "Invitations",
    body: "This dropdown holds the core invitation workflow: creating guest links, reviewing RSVPs, and sending WhatsApp invitations.",
  },
  {
    target: '[data-tour="admin-nav-invitations"]',
    prepare: openSidebarGroup("invitations"),
    title: "Create Invitations",
    body: "Add guests and create their invite links here. Paid plans unlock live invitation sharing, QR codes, and guest management tools based on the selected tier.",
  },
  {
    target: '[data-tour="admin-nav-rsvps"]',
    prepare: openSidebarGroup("invitations"),
    title: "RSVPs",
    body: "This page collects guest responses, attendance status, meal preferences, and notes. Trial users need to activate a plan before collecting live RSVP responses.",
  },
  {
    target: '[data-tour="admin-nav-whatsapp"]',
    prepare: openSidebarGroup("invitations"),
    title: "WhatsApp Sender",
    body: "Use this to queue and send invitation messages faster. Trial accounts see it locked so they know the feature exists before activating a plan.",
  },
  {
    target: '[data-tour="admin-nav-seating"]',
    title: "Seating Chart",
    body: "Use this for table planning and guest placement. It is intended for larger events and stays locked until the plan supports seating tools.",
  },
  {
    target: '[data-tour="admin-nav-venues-group"]',
    title: "Venues",
    body: "This dropdown keeps venue discovery and venue request follow-up together.",
  },
  {
    target: '[data-tour="admin-nav-venues"]',
    prepare: openSidebarGroup("venues"),
    title: "Suggested Venues",
    body: "Browse approved venue partners and contact details here. Trial accounts can see the entry point, but venue details unlock after plan activation.",
  },
  {
    target: '[data-tour="admin-nav-venue-requests"]',
    prepare: openSidebarGroup("venues"),
    title: "Venue Requests",
    body: "Track venues you have contacted and whether they have replied, are waiting, or are unavailable. This keeps venue follow-up from getting lost.",
  },
  {
    target: '[data-tour="admin-nav-billing"]',
    title: "Billing and tiers",
    body: "Choose Classic, Plus, or Pro here. Trial users should start here when they are ready to unlock live tools.",
  },
  {
    target: '[data-tour="admin-nav-settings"]',
    title: "Settings",
    body: "Customize the invitation theme, templates, colors, background photos, music, sharing text, and wedding details from this page.",
  },
  {
    target: '[data-tour="admin-nav-support"]',
    title: "Contact support",
    body: "Use this when you need help with billing, invite setup, QR check-in, or anything blocking your wedding workspace.",
  },
  {
    target: '[data-tour="dashboard-heading"]',
    title: "Welcome to your workspace",
    body: "This dashboard is your control center. It shows the state of your invitations, RSVPs, guest groups, and event-day check-in.",
  },
  {
    target: '[data-tour="customize-invite"]',
    title: "Personalize the invitation",
    body: "Set the look and feel first: card design, couple photo, colors, music, text positioning, and the social preview guests will see.",
  },
  {
    target: '[data-tour="dashboard-countdown"]',
    title: "Check the wedding timeline",
    body: "Your countdown and wedding date help you keep the planning timeline visible every time you log in.",
  },
  {
    target: '[data-tour="dashboard-stats"]',
    title: "Track responses",
    body: "These cards show invitations, RSVPs, attending guests, guests not attending, and people who still need follow-up.",
  },
  {
    target: '[data-tour="dashboard-checkin"]',
    title: "Prepare for entry check-in",
    body: "On Plus and Pro, QR codes and event PINs help ushers check guests in at the hall without using the couple account.",
  },
  {
    target: '[data-tour="dashboard-categories"]',
    title: "Review guest groups",
    body: "Use categories to see how VIPs, family, friends, colleagues, and general guests are responding.",
  },
  {
    target: '[data-tour="admin-sidebar-actions"]',
    title: "Account actions",
    body: "Use the lower sidebar for admin access when available and logout. The Super Admin panel only appears for the platform admin account.",
  },
];

const MOBILE_DASHBOARD_TOUR_STEPS = [
  {
    target: '[data-tour="admin-mobile-menu"]',
    title: "Open the menu",
    body: "Tap this menu to reach invitations, RSVPs, WhatsApp sending, seating, venues, billing, settings, and support. Locked links send Trial accounts to billing.",
  },
  {
    target: '[data-tour="dashboard-heading"]',
    title: "Dashboard",
    body: "This is your mobile control center. Use it to check the state of your wedding workspace quickly.",
  },
  {
    target: '[data-tour="customize-invite"]',
    title: "Customize first",
    body: "Start with your invitation look: template, colors, photos, music, details, and sharing preview.",
  },
  {
    target: '[data-tour="dashboard-stats"]',
    title: "Track progress",
    body: "These cards summarize invitations, RSVPs, attendance, no response, and the bride/groom invite split.",
  },
  {
    target: '[data-tour="dashboard-checkin"]',
    title: "Check-in tools",
    body: "Plus and Pro plans unlock QR and staff check-in tools for the wedding entrance.",
  },
  {
    target: '[data-tour="dashboard-categories"]',
    title: "Guest groups",
    body: "Use guest categories to review how VIPs, family, friends, colleagues, and guests are responding.",
  },
];

const getDashboardTourConfig = () => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  return {
    steps: isMobile ? MOBILE_DASHBOARD_TOUR_STEPS : DASHBOARD_TOUR_STEPS,
    storageKey: isMobile
      ? "vowlink-dashboard-mobile-tour-seen"
      : "vowlink-dashboard-tour-seen",
  };
};

const StatCard = ({ label, value, color, sub, loading, breakdown }) => (
  <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-4 sm:p-6">
    <p className="text-[10px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-widest text-white/40 mb-2 leading-tight wrap-break-word">
      {label}
    </p>
    {loading ? (
      <div className="space-y-4">
        <Skeleton className="h-10 w-16 mt-1" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    ) : (
      <>
        <p className={`font-serif text-4xl sm:text-5xl font-light ${color}`}>
          {value}
        </p>
        {breakdown && (
          <div className="mt-4 space-y-1.5 border-t border-white/5 pt-3">
            {breakdown.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 text-[10px] sm:text-xs"
              >
                <span className="min-w-0 text-white/35">{item.label}</span>
                <span
                  className={`font-semibold ${item.color || "text-white/70"}`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    )}
    {sub && !loading && (
      <p className="mt-2 text-[10px] sm:text-xs text-white/30">{sub}</p>
    )}
  </div>
);

// ── Wedding Countdown Widget ──────────────────────────────────────────────────
const CountdownWidget = ({ weddingDate, loading }) => {
  const [daysLeft, setDaysLeft] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);
  }, []);

  useEffect(() => {
    if (!weddingDate) return;
    const update = () => {
      const now = new Date();
      const target = new Date(weddingDate);
      target.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const diff = Math.round((target - now) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [weddingDate]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#0D1220]/60 px-6 py-7 h-28 flex items-center justify-between animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
      </div>
    );
  }

  if (!weddingDate) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D8B76A]/20 bg-[#D8B76A]/5 px-6 py-8 text-center">
        <Icon icon="mdi:ring" className="mx-auto mb-3 h-8 w-8 text-[#D8B76A]" />
        <p className="text-white/60 text-sm mb-3">
          Your wedding date isn't set yet.
        </p>
        <Link
          to="/admin/settings"
          className="inline-block rounded-full bg-[#D8B76A]/20 border border-[#D8B76A]/30 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#D8B76A] hover:bg-[#D8B76A]/30 transition"
        >
          <span className="inline-flex items-center gap-1">
            Set Your Date{" "}
            <Icon icon="lucide:arrow-right" className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    );
  }

  if (daysLeft === null) return null;

  const formattedDate = new Date(weddingDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (daysLeft < 0) {
    const coupleNames =
      user?.partner1Name && user?.partner2Name
        ? `${user.partner1Name} & ${user.partner2Name}`
        : "Allen & Justina";
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0A0D16] p-8 text-center relative overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.3)] min-h-55 flex flex-col justify-center items-center">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes textShimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .gold-text-gradient {
            background: linear-gradient(to right, #FFF4D4, #D8B76A, #FFF4D4, #E5C07B);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: textShimmer 5s linear infinite;
          }
        `,
          }}
        />

        {/* Soft gold glow overlay */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: "#D8B76A" }}
        />

        <div className="relative z-10 mb-3 flex justify-center">
          <Icon
            icon="lucide:party-popper"
            className="text-5xl text-[#D8B76A]"
          />
        </div>
        <div className="relative z-10 space-y-1">
          <h3 className="font-serif text-2xl text-white font-light">
            You're Married!
          </h3>
          <p className="text-[#D8B76A] font-serif text-lg font-light">
            {coupleNames}
          </p>
          <p className="text-white/40 text-xs mt-2">
            Congratulations on your beautiful journey — {formattedDate}
          </p>
        </div>
      </div>
    );
  }

  if (daysLeft === 0) {
    const coupleNames =
      user?.partner1Name && user?.partner2Name
        ? `${user.partner1Name} & ${user.partner2Name}`
        : "Allen & Justina";
    return (
      <div className="rounded-3xl border border-[#D8B76A]/40 bg-[#0B0F19] p-8 text-center relative overflow-hidden shadow-[0_15px_50px_rgba(216,183,106,0.15)] min-h-60 flex flex-col justify-center items-center">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes floatUp {
            0% {
              transform: translateY(100px) rotate(0deg) translateX(0);
              opacity: 0;
            }
            10% { opacity: 0.8; }
            90% { opacity: 0.8; }
            100% {
              transform: translateY(-260px) rotate(360deg) translateX(var(--drift));
              opacity: 0;
            }
          }
          @keyframes pulseGlow {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.12; }
            50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.28; }
          }
          @keyframes textShimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes heartBeat {
            0%, 100% { transform: scale(1); }
            20% { transform: scale(1.15); }
            40% { transform: scale(1.05); }
            60% { transform: scale(1.2); }
            80% { transform: scale(1.1); }
          }
          .gold-sparkle {
            position: absolute;
            bottom: 0;
            background: radial-gradient(circle, #FFF4D4 10%, #D8B76A 60%, transparent 100%);
            border-radius: 50%;
            pointer-events: none;
            animation: floatUp var(--duration) ease-in-out infinite;
            animation-delay: var(--delay);
            filter: drop-shadow(0 0 4px #D8B76A);
          }
          .gold-text-gradient {
            background: linear-gradient(to right, #FFF4D4, #D8B76A, #FFF4D4, #E5C07B);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: textShimmer 5s linear infinite;
          }
        `,
          }}
        />

        {/* Glow overlay */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none animate-[pulseGlow_6s_ease-in-out_infinite]"
          style={{ background: "#D8B76A" }}
        />

        {/* Floating sparkles */}
        {Array.from({ length: 20 }).map((_, i) => {
          const left = `${Math.random() * 100}%`;
          const size = `${Math.random() * 8 + 4}px`;
          const delay = `${Math.random() * 8}s`;
          const duration = `${Math.random() * 6 + 6}s`;
          const drift = `${Math.random() * 100 - 50}px`;
          return (
            <div
              key={i}
              className="gold-sparkle"
              style={{
                left,
                width: size,
                height: size,
                "--delay": delay,
                "--duration": duration,
                "--drift": drift,
              }}
            />
          );
        })}

        {/* Floating Heart / Ring */}
        <div className="flex justify-center">
          <Icon
            icon="ph:rings-bold"
            className="text-6xl text-[#D8B76A] filter drop-shadow-[0_0_12px_rgba(216,183,106,0.5)]"
          />
        </div>

        <div className="relative z-10 space-y-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#D8B76A] font-bold block mb-1">
            Happy Wedding Day!
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl gold-text-gradient font-light leading-tight">
            Today's the Big Day
          </h3>
          <p className="text-white/80 font-serif text-lg sm:text-xl font-light">
            {coupleNames}
          </p>
          <p className="text-white/40 text-xs font-mono uppercase tracking-wider mt-2">
            <span className="inline-flex items-center justify-center gap-1.5">
              <Icon icon="lucide:sparkles" className="h-3.5 w-3.5" />
              {formattedDate}
              <Icon icon="lucide:sparkles" className="h-3.5 w-3.5" />
            </span>
          </p>
        </div>
      </div>
    );
  }

  const weeks = Math.floor(daysLeft / 7);
  const months = Math.floor(daysLeft / 30);

  return (
    <div className="rounded-2xl border border-[#D8B76A]/25 bg-linear-to-br from-[#0D1220] to-[#111827] px-6 py-7 relative overflow-hidden">
      {/* Gold glow top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#D8B76A]/40 to-transparent" />
      <div
        className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full opacity-8 blur-2xl"
        style={{ background: "#D8B76A" }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A]/70 mb-1">
            Wedding Countdown
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-7xl font-light text-white leading-none">
              {daysLeft}
            </span>
            <span className="text-white/40 text-lg">days to go</span>
          </div>
          <p className="mt-2 text-xs text-white/40">{formattedDate}</p>
        </div>

        {/* Sub-metrics */}
        <div className="flex gap-4 sm:flex-col sm:gap-2 sm:items-end">
          {months > 0 && (
            <div className="text-right">
              <p className="text-[#D8B76A] font-serif text-2xl font-light">
                {months}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-white/30">
                months
              </p>
            </div>
          )}
          {weeks > 0 && (
            <div className="text-right">
              <p className="text-[#7FA6D9] font-serif text-2xl font-light">
                {weeks}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-white/30">
                weeks
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar towards the big day */}
      {daysLeft <= 365 && (
        <div className="mt-5 relative z-10">
          <div className="flex justify-between text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
            <span>Today</span>
            <span>
              {Math.round(((365 - daysLeft) / 365) * 100)}% to the big day
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(((365 - daysLeft) / 365) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboardPage = () => {
  const [invitations, setInvitations] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weddingDate, setWeddingDate] = useState(null);
  const [tourOpen, setTourOpen] = useState(false);
  const initialTourConfig = getDashboardTourConfig();
  const [tourStorageKey, setTourStorageKey] = useState(
    initialTourConfig.storageKey,
  );
  const [tourTitle, setTourTitle] = useState("Getting started");
  const [tourSteps, setTourSteps] = useState(initialTourConfig.steps);
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const tier = storedUser.tier || "unpaid";
  const isUnpaid = tier === "unpaid";

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser?.weddingDate) setWeddingDate(storedUser.weddingDate);
    const load = async () => {
      try {
        const [invRes, rsvpRes, profileRes] = await Promise.all([
          api.get("/invitations"),
          api.get("/rsvps"),
          api.get("/auth/me"),
        ]);
        setInvitations(invRes.data);
        setRsvps(rsvpRes.data);

        const profile = profileRes.data || {};
        const backendTier = profile.tier || "unpaid";
        const storedTier = storedUser.tier || "unpaid";
        if (backendTier !== storedTier) {
          const nextUser = {
            ...storedUser,
            tier: backendTier,
            partner1Name: profile.partner1Name || storedUser.partner1Name,
            partner2Name: profile.partner2Name || storedUser.partner2Name,
            email: profile.email || storedUser.email,
            weddingDate: profile.weddingDate || storedUser.weddingDate,
          };
          localStorage.setItem("user", JSON.stringify(nextUser));
          if (getTierRank(backendTier) > getTierRank(storedTier)) {
            setTourTitle(`${getPlanLabel(backendTier)} unlocked`);
            setTourSteps(getUpgradeTourSteps(backendTier));
            setTourStorageKey(`vowlink-tier-tour-seen-${backendTier}`);
            setTourOpen(true);
          }
        } else {
          const dashboardTourConfig = getDashboardTourConfig();
          if (localStorage.getItem(dashboardTourConfig.storageKey)) return;
          setTourTitle("Getting started");
          setTourSteps(dashboardTourConfig.steps);
          setTourStorageKey(dashboardTourConfig.storageKey);
          window.setTimeout(() => setTourOpen(true), 500);
        }
      } catch (err) {
        const status = err.response?.status;
        const message =
          status === 401
            ? "Your session has expired. Please sign in again to continue."
            : status === 403
              ? "Your account does not have access to this dashboard."
              : err.response?.data?.message ||
                "We could not load your dashboard right now. Please check your connection and try again.";
        setError({ status, message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl rounded-3xl border border-red-400/20 bg-[#0D1220] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/25 bg-red-500/10 text-red-300">
            <Icon
              icon={
                error.status === 401 ? "lucide:shield-alert" : "lucide:wifi-off"
              }
              className="h-5 w-5"
            />
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-red-300">
            Dashboard unavailable
          </p>
          <h2 className="mt-2 font-serif text-2xl text-white">
            We could not load your workspace
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">
            {error.message}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#070A13] transition hover:bg-[#F2D894]"
            >
              <Icon icon="lucide:refresh-cw" className="h-4 w-4" />
              Retry
            </button>
            {error.status === 401 && (
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Sign in again
              </Link>
            )}
          </div>
          <p className="mt-5 text-[10px] leading-relaxed text-white/30">
            If this keeps happening after retrying, contact VowLink support with
            the time of the error and the email on this account.
          </p>
        </div>
      </div>
    );
  }

  const attending = rsvps.filter((r) => r.attending === "Yes").length;
  const notAttending = rsvps.filter((r) => r.attending === "No").length;

  const isDeadlinePassed =
    storedUser?.rsvpDeadline && new Date() > new Date(storedUser.rsvpDeadline);
  const pending = !isDeadlinePassed
    ? invitations.filter((i) => !i.hasRSVPed).length
    : 0;
  const noResponse = isDeadlinePassed
    ? invitations.filter((i) => !i.hasRSVPed).length
    : 0;
  const pendingInvitations = invitations.filter((i) => !i.hasRSVPed);
  const attendingRsvps = rsvps.filter((r) => r.attending === "Yes");
  const notAttendingRsvps = rsvps.filter((r) => r.attending === "No");
  const checkedInInvitations = invitations.filter((i) => i.checkedIn);
  const checkedInCount = checkedInInvitations.length;
  const checkedInPercent =
    invitations.length > 0
      ? Math.round((checkedInCount / invitations.length) * 100)
      : 0;

  const countBySenderGroup = (items, getSenderGroup) =>
    items.reduce(
      (acc, item) => {
        const senderGroup = getSenderGroup(item) || "general";
        if (senderGroup === "bride") acc.bride += 1;
        else if (senderGroup === "groom") acc.groom += 1;
        else if (senderGroup === "both") acc.both += 1;
        else acc.general += 1;
        return acc;
      },
      { bride: 0, groom: 0, both: 0, general: 0 },
    );

  const makeSenderBreakdown = (counts) =>
    [
      { label: "Bride invited", value: counts.bride, color: "text-rose-300" },
      { label: "Groom invited", value: counts.groom, color: "text-[#7FA6D9]" },
      counts.both > 0
        ? { label: "Both invited", value: counts.both, color: "text-[#D8B76A]" }
        : null,
      counts.general > 0
        ? { label: "General", value: counts.general, color: "text-white/55" }
        : null,
    ].filter(Boolean);

  const invitationBreakdown = makeSenderBreakdown(
    countBySenderGroup(invitations, (invitation) => invitation.senderGroup),
  );
  const rsvpBreakdown = makeSenderBreakdown(
    countBySenderGroup(rsvps, (rsvp) => rsvp.invitationId?.senderGroup),
  );
  const attendingBreakdown = makeSenderBreakdown(
    countBySenderGroup(
      attendingRsvps,
      (rsvp) => rsvp.invitationId?.senderGroup,
    ),
  );
  const notAttendingBreakdown = makeSenderBreakdown(
    countBySenderGroup(
      notAttendingRsvps,
      (rsvp) => rsvp.invitationId?.senderGroup,
    ),
  );
  const pendingBreakdown = makeSenderBreakdown(
    countBySenderGroup(
      pendingInvitations,
      (invitation) => invitation.senderGroup,
    ),
  );

  // Group invitations by category
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    const guests = invitations.filter((i) => (i.category || "Guest") === cat);
    if (guests.length > 0) acc[cat] = guests;
    return acc;
  }, {});

  // Categories with any invitations
  const activeCategories = Object.entries(byCategory);

  return (
    <div className="p-4 sm:p-8 space-y-10">
      <GuidedTour
        open={tourOpen}
        title={tourTitle}
        steps={tourSteps}
        storageKey={tourStorageKey}
        onClose={() => setTourOpen(false)}
      />

      <div>
        <div
          data-tour="dashboard-heading"
          className="mb-4 flex flex-col items-start gap-3"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">
              Overview
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              Dashboard
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              const dashboardTourConfig = getDashboardTourConfig();
              setTourTitle("Getting started");
              setTourSteps(dashboardTourConfig.steps);
              setTourStorageKey(dashboardTourConfig.storageKey);
              setTourOpen(true);
            }}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-[#D8B76A]/25 bg-red-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-600 transition hover:bg-red-400"
          >
            <Icon icon="lucide:map" className="h-3.5 w-3.5" />
            Take Tour
          </button>
        </div>

        {isUnpaid && (
          <div className="mb-6 rounded-3xl border border-[#D8B76A]/25 bg-[#D8B76A]/10 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D8B76A]/30 bg-[#D8B76A]/10 text-[#D8B76A]">
                  <Icon icon="lucide:lock-keyhole" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D8B76A]">
                    Trial Workspace
                  </p>
                  <h3 className="mt-1 font-serif text-2xl text-white">
                    Choose a plan to publish invitations
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/60">
                    Your account is in trial mode. Billing is available, but
                    live invitations, RSVP collection, downloads, WhatsApp
                    sending, venue contacts, and check-in tools are locked until
                    payment succeeds.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/billing"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#070A13] transition hover:bg-[#F2D894]"
              >
                <Icon icon="lucide:credit-card" className="h-3.5 w-3.5" />
                Activate Plan
              </Link>
            </div>
          </div>
        )}

        {/* Customization Tip Banner */}
        <div
          data-tour="customize-invite"
          className="mb-6 rounded-2xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-5 py-4 flex items-start gap-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] animate-fade-in"
        >
          <Icon
            icon="lucide:palette"
            className="text-xl text-[#D8B76A] mt-0.5 shrink-0"
          />
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D8B76A]">
              Personalize Your Invitation
            </h4>
            <p className="text-white/60 text-xs leading-relaxed">
              Want to customize your card design, change theme templates, upload
              a couple photo overlay, pick background music, or fine-tune fonts?
              Head over to the{" "}
              <Link
                to="/admin/settings?tab=design"
                className="text-[#D8B76A] font-semibold underline hover:text-[#D8B76A]/80 transition"
              >
                Settings Page
              </Link>{" "}
              to customize your VowLink experience!
            </p>
          </div>
        </div>

        {/* Wedding Countdown */}
        <div data-tour="dashboard-countdown" className="mb-6">
          <CountdownWidget weddingDate={weddingDate} loading={loading} />
        </div>

        {/* Stats row */}
        <div
          data-tour="dashboard-stats"
          className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
        >
          <StatCard
            label="Total Invitations"
            value={invitations.length}
            color="text-white"
            loading={loading}
            breakdown={invitationBreakdown}
          />
          <StatCard
            label="RSVPs"
            value={rsvps.length}
            color="text-[#7FA6D9]"
            loading={loading}
            breakdown={rsvpBreakdown}
          />
          <StatCard
            label="Attending"
            value={attending}
            color="text-emerald-400"
            loading={loading}
            breakdown={attendingBreakdown}
          />
          <StatCard
            label="Not Attending"
            value={notAttending}
            color="text-red-400"
            loading={loading}
            breakdown={notAttendingBreakdown}
          />
          {isDeadlinePassed ? (
            <StatCard
              label="No Response"
              value={noResponse}
              color="text-rose-400"
              sub="deadline passed"
              loading={loading}
              breakdown={pendingBreakdown}
            />
          ) : (
            <StatCard
              label="Pending"
              value={pending}
              color="text-[#D8B76A]"
              sub="awaiting response"
              loading={loading}
              breakdown={pendingBreakdown}
            />
          )}
        </div>

        <div
          data-tour="dashboard-checkin"
          className="mt-6 rounded-3xl border border-emerald-400/15 bg-emerald-400/10 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <Icon icon="lucide:scan-line" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300">
                  Event Check-in
                </p>
                <h3 className="mt-1 font-serif text-2xl text-white">
                  {checkedInCount} / {invitations.length} guests checked in
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-white/45">
                  Track entrance progress as ushers scan guest QR codes on event
                  day.
                </p>
              </div>
            </div>
            <Link
              to="/admin/invitations"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 transition hover:bg-emerald-400/15"
            >
              <Icon icon="lucide:list-checks" className="h-3.5 w-3.5" />
              Manage Check-ins
            </Link>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-700"
              style={{ width: `${checkedInPercent}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/40">
            <span>{checkedInPercent}% complete</span>
            <span>
              {Math.max(invitations.length - checkedInCount, 0)} remaining
            </span>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div data-tour="dashboard-categories">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">
          Breakdown
        </p>
        <h3 className="font-serif text-2xl text-white mb-6">
          Guests by Category
        </h3>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-white/3 px-4 sm:px-6 py-4 sm:py-5 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-white/10 animate-pulse" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        ) : activeCategories.length === 0 ? (
          <p className="text-white/30 text-sm">
            No invitations yet. Create your first one!
          </p>
        ) : (
          <div className="space-y-4">
            {activeCategories.map(([category, guests]) => {
              const colors = categoryColors[category] || categoryColors.Guest;
              const rsvpedCount = guests.filter((g) => g.hasRSVPed).length;
              const pct =
                guests.length > 0
                  ? Math.round((rsvpedCount / guests.length) * 100)
                  : 0;

              return (
                <div
                  key={category}
                  className={`rounded-2xl border ${colors.ring} ${colors.bg} px-4 sm:px-6 py-4 sm:py-5`}
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${colors.dot}`}
                      />
                      <span
                        className={`text-sm font-semibold uppercase tracking-widest ${colors.text}`}
                      >
                        {category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6 text-xs text-white/50 flex-wrap">
                      <span>
                        <span className="text-white font-medium">
                          {guests.length}
                        </span>{" "}
                        invited
                      </span>
                      <span>
                        <span className="text-white font-medium">
                          {rsvpedCount}
                        </span>{" "}
                        RSVPed
                      </span>
                      <span>
                        <span className={`font-medium ${colors.text}`}>
                          {pct}%
                        </span>{" "}
                        rate
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.dot} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Guest chips */}
                  <div className="flex flex-wrap gap-2">
                    {guests.map((g) => (
                      <span
                        key={g._id}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                          g.hasRSVPed
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                            : "border-white/10 bg-white/5 text-white/50"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${g.hasRSVPed ? "bg-emerald-400" : "bg-white/20"}`}
                        />
                        {g.guestName}
                        {g.hasRSVPed && (
                          <Icon
                            icon="lucide:check"
                            className="ml-0.5 h-3 w-3"
                          />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
