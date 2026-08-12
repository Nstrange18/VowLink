const crypto = require("crypto");
const express = require("express");
const SiteVisit = require("../models/SiteVisit");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const allowedPageTypes = new Set(["landing", "marketing", "invite", "check_in", "public", "unknown"]);
const allowedDeviceTypes = new Set(["desktop", "mobile", "tablet", "unknown"]);

const cleanString = (value, max = 240) =>
  String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return cleanString((raw || req.ip || "").split(",")[0], 80);
};

const hashValue = (value) => {
  if (!value) return "";
  return crypto.createHash("sha256").update(value).digest("hex");
};

const protectAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.role === "admin" && user.email?.toLowerCase() === "nwubachukwuemelie@gmail.com") {
      return next();
    }
    return res.status(403).json({ message: "Access denied. Super Admins only." });
  } catch (error) {
    return res.status(500).json({ message: "Server error during admin verification", error: error.message });
  }
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getSinceDate = (range) => {
  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 1;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
};

router.post("/visit", async (req, res) => {
  try {
    const body = req.body || {};
    const visitorId = cleanString(body.visitorId, 80);
    const path = cleanString(body.path, 300);

    if (!visitorId || !path || !path.startsWith("/")) {
      return res.status(400).json({ message: "Invalid visit payload." });
    }

    const pageType = allowedPageTypes.has(body.pageType) ? body.pageType : "unknown";
    const deviceType = allowedDeviceTypes.has(body.deviceType) ? body.deviceType : "unknown";
    const userAgent = cleanString(req.headers["user-agent"], 300);
    const ipHash = hashValue(getClientIp(req));

    await SiteVisit.create({
      visitorId,
      sessionId: cleanString(body.sessionId, 80),
      pageType,
      path,
      slug: cleanString(body.slug, 160),
      referrer: cleanString(body.referrer, 300),
      deviceType,
      userAgent,
      ipHash,
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to track visit", error: error.message });
  }
});

router.get("/summary", protect, protectAdmin, async (req, res) => {
  try {
    const range = ["24h", "7d", "30d"].includes(req.query.range) ? req.query.range : "7d";
    const since = getSinceDate(range);
    const today = startOfDay(new Date());

    const [
      totalVisits,
      uniqueVisitors,
      todayVisits,
      todayUniqueVisitors,
      topPages,
      pageTypes,
      devices,
      referrers,
      daily,
    ] = await Promise.all([
      SiteVisit.countDocuments({ createdAt: { $gte: since } }),
      SiteVisit.distinct("visitorId", { createdAt: { $gte: since } }).then((items) => items.length),
      SiteVisit.countDocuments({ createdAt: { $gte: today } }),
      SiteVisit.distinct("visitorId", { createdAt: { $gte: today } }).then((items) => items.length),
      SiteVisit.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$path", visits: { $sum: 1 }, uniqueVisitors: { $addToSet: "$visitorId" }, pageType: { $first: "$pageType" } } },
        { $project: { path: "$_id", pageType: 1, visits: 1, uniqueVisitors: { $size: "$uniqueVisitors" }, _id: 0 } },
        { $sort: { visits: -1 } },
        { $limit: 8 },
      ]),
      SiteVisit.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$pageType", visits: { $sum: 1 } } },
        { $project: { label: "$_id", visits: 1, _id: 0 } },
        { $sort: { visits: -1 } },
      ]),
      SiteVisit.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$deviceType", visits: { $sum: 1 } } },
        { $project: { label: "$_id", visits: 1, _id: 0 } },
        { $sort: { visits: -1 } },
      ]),
      SiteVisit.aggregate([
        { $match: { createdAt: { $gte: since }, referrer: { $ne: "" } } },
        { $group: { _id: "$referrer", visits: { $sum: 1 } } },
        { $project: { referrer: "$_id", visits: 1, _id: 0 } },
        { $sort: { visits: -1 } },
        { $limit: 6 },
      ]),
      SiteVisit.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            visits: { $sum: 1 },
            uniqueVisitors: { $addToSet: "$visitorId" },
          },
        },
        { $project: { date: "$_id", visits: 1, uniqueVisitors: { $size: "$uniqueVisitors" }, _id: 0 } },
        { $sort: { date: 1 } },
      ]),
    ]);

    res.status(200).json({
      range,
      totalVisits,
      uniqueVisitors,
      todayVisits,
      todayUniqueVisitors,
      topPages,
      pageTypes,
      devices,
      referrers,
      daily,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
});

module.exports = router;
