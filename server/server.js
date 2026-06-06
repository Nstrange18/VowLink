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

const app = express();
app.set("trust proxy", 1);

app.use(cors());
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully (Atlas/Configured)");
  } catch (error) {
    console.log("MongoDB Atlas connection failed:", error.message);
    try {
      console.log("Attempting local MongoDB fallback...");
      await mongoose.connect("mongodb://127.0.0.1:27017/vowlink");
      console.log("MongoDB connected successfully (Local Fallback)");
    } catch (localError) {
      console.log("Local MongoDB fallback failed:", localError.message);
      console.log("⚠️ Server is running but database connection is offline!");
    }
  }
});
// Nodemon trigger comment
