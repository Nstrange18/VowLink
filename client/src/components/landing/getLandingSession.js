export const getStoredSession = () => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?._id && !user?.email) return null;

    const partner1 = user.partner1Name || "";
    const partner2 = user.partner2Name || "";
    const initials = [partner1, partner2]
      .filter(Boolean)
      .map((name) => name.trim()[0])
      .filter(Boolean)
      .join(" & ");
    const isSuperAdmin =
      user.role === "admin" ||
      user.email?.toLowerCase() === "nwubachukwuemelie@gmail.com";

    return {
      dashboardPath: isSuperAdmin ? "/super-admin/dashboard" : "/admin/dashboard",
      displayName:
        partner1 && partner2
          ? `${partner1} & ${partner2}`
          : user.email || "Your VowLink account",
      initials: initials || "VL",
      dashboardLabel: isSuperAdmin ? "Return to Admin" : "Return to Dashboard",
    };
  } catch {
    return null;
  }
};

