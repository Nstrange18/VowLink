// Force IPv4 DNS resolution — prevents ENETUNREACH on Render (IPv6 not available)
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

// ── Load environment variables FIRST before any other requires ────────────────
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const rsvpRoutes = require("./routes/rsvpRoutes");
const venueRoutes = require("./routes/venueRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const seatingRoutes = require("./routes/seatingRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
app.set("trust proxy", 1);

const splitEnvList = (value) => String(value || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://vow-link556.vercel.app",
  "https://vowlink.co",
  "https://www.vowlink.co",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.PUBLIC_SITE_URL,
  ...splitEnvList(process.env.FRONTEND_URLS),
  ...splitEnvList(process.env.ALLOWED_ORIGINS),
].filter(Boolean).map((origin) => String(origin).replace(/\/+$/, "")));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ""))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.send("Wedding invitation API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/rsvps", rsvpRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/seating", seatingRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;

const User = require("./models/User");
const { sendWeddingDayCongratulationsEmail } = require("./utils/email");

const checkWeddingDaysToday = async () => {
  try {
    const today = new Date();
    const users = await User.find({
      weddingDate: { $ne: null },
      weddingEmailSent: { $ne: true }
    });

    for (const user of users) {
      const wDate = new Date(user.weddingDate);

      const wYear = wDate.getUTCFullYear();
      const wMonth = wDate.getUTCMonth();
      const wDay = wDate.getUTCDate();

      const tYearLocal = today.getFullYear();
      const tMonthLocal = today.getMonth();
      const tDayLocal = today.getDate();

      const tYearUTC = today.getUTCFullYear();
      const tMonthUTC = today.getUTCMonth();
      const tDayUTC = today.getUTCDate();

      const isWeddingToday = (wYear === tYearLocal && wMonth === tMonthLocal && wDay === tDayLocal) ||
        (wYear === tYearUTC && wMonth === tMonthUTC && wDay === tDayUTC);

      if (isWeddingToday) {
        await sendWeddingDayCongratulationsEmail({
          coupleEmail: user.email,
          coupleName: `${user.partner1Name} & ${user.partner2Name}`,
        });

        user.weddingEmailSent = true;
        await user.save();
        console.log(`[SCHEDULER] Wedding day email sent to ${user.email}`);
      }
    }
  } catch (err) {
    console.error("[SCHEDULER] Error in checkWeddingDaysToday:", err.message);
  }
};

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully (Atlas/Configured)");

    // Run wedding day scheduler check immediately and every 12 hours
    checkWeddingDaysToday();
    setInterval(checkWeddingDaysToday, 12 * 60 * 60 * 1000);
  } catch (error) {
    console.log("MongoDB Atlas connection failed:", error.message);
    try {
      console.log("Attempting local MongoDB fallback...");
      await mongoose.connect("mongodb://127.0.0.1:27017/vowlink");
      console.log("MongoDB connected successfully (Local Fallback)");

      checkWeddingDaysToday();
      setInterval(checkWeddingDaysToday, 12 * 60 * 60 * 1000);
    } catch (localError) {
      console.log("Local MongoDB fallback failed:", localError.message);
      console.log("Server is running but database connection is offline!");
    }
  }
});
// Nodemon trigger comment - forced restart to reconnect to MongoDB Atlas (updated)
