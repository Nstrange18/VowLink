const express = require("express");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");
const cloudinary = require("cloudinary").v2;
const Venue = require("../models/Venue");
const User = require("../models/User");
const Inquiry = require("../models/Inquiry");
const { protect } = require("../middleware/auth");
const { sendNewVenueRegistrationAdminAlert } = require("../utils/email");

const router = express.Router();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const isFilled = (value) => typeof value === "string" && value.trim().length > 0;

const getVenueCompleteness = (venue) => {
  const photos = Array.isArray(venue?.photos) ? venue.photos.filter(Boolean) : [];
  const proofUrls = Array.isArray(venue?.verificationProofUrls) ? venue.verificationProofUrls.filter(Boolean) : [];
  const checks = [
    { key: "Description", complete: isFilled(venue?.description) && venue.description.trim().length >= 80 },
    { key: "Address", complete: isFilled(venue?.city) && isFilled(venue?.generalLocation) && isFilled(venue?.fullAddress) },
    { key: "WhatsApp", complete: isFilled(venue?.whatsapp) },
    { key: "Map link", complete: isFilled(venue?.mapLink) },
    { key: "Photos", complete: photos.length >= 3 },
    { key: "Proof documents", complete: proofUrls.length > 0 || isFilled(venue?.verificationProofUrl) },
    { key: "Price range", complete: isFilled(venue?.priceRange) },
  ];

  return {
    checks,
    missing: checks.filter((item) => !item.complete).map((item) => item.key),
    isComplete: checks.every((item) => item.complete),
  };
};

const isVenuePubliclyVisible = (venue) => {
  return Boolean(venue?.isApproved && venue?.isActive !== false && getVenueCompleteness(venue).isComplete);
};

const getVenuePublicReadiness = (venue) => {
  const completeness = getVenueCompleteness(venue);
  const reasons = [];

  if (!venue) {
    reasons.push("Venue record was not found");
  } else {
    if (!venue.isApproved) reasons.push("Not approved by VowLink admin yet");
    if (venue.isActive === false) reasons.push("Listing is currently inactive or suspended");
    if (!completeness.isComplete) {
      reasons.push(`Missing profile details: ${completeness.missing.join(", ")}`);
    }
  }

  return {
    isReady: Boolean(venue && reasons.length === 0),
    missing: completeness.missing,
    reasons,
  };
};

const isVenueUnlockedForFreeCouples = (venue) => ["listed", "featured"].includes(venue?.subscriptionTier);

const normalizeProofUrls = (venue) => {
  const urls = [
    ...((Array.isArray(venue?.verificationProofUrls) ? venue.verificationProofUrls : []) || []),
    ...(venue?.verificationProofUrl ? [venue.verificationProofUrl] : []),
  ].filter(Boolean);

  return [...new Set(urls)];
};

const sanitizeVenueForCouple = (venue, { redactContact = false } = {}) => {
  const source = typeof venue?.toObject === "function" ? venue.toObject() : venue;
  const safeVenue = {
    _id: source._id,
    name: source.name,
    city: source.city,
    generalLocation: source.generalLocation,
    capacity: source.capacity,
    description: source.description,
    photos: redactContact ? (source.photos || []).slice(0, 1) : (source.photos || []),
    isFeatured: source.isFeatured,
    style: source.style,
    subscriptionTier: source.subscriptionTier,
    verificationStatus: source.verificationStatus,
    trustScore: source.trustScore,
    safetyFireExits: source.safetyFireExits,
    safetyCctv: source.safetyCctv,
    safetySecurity: source.safetySecurity,
    safetyStructural: source.safetyStructural,
    safetyInsurance: source.safetyInsurance,
  };

  if (redactContact) {
    return {
      ...safeVenue,
      fullAddress: "[Locked - Upgrade to Plus]",
      priceRange: "[Locked - Upgrade to Plus]",
      phone: "[Locked]",
      whatsapp: "[Locked]",
      mapLink: "[Locked]",
      email: "[Locked]",
      website: "[Locked]",
    };
  }

  return {
    ...safeVenue,
    fullAddress: source.fullAddress,
    priceRange: source.priceRange,
    phone: source.phone,
    whatsapp: source.whatsapp,
    mapLink: source.mapLink,
    email: source.email,
    website: source.website,
    tags: source.tags || [],
  };
};

const sendVenueInquiryReminderEmail = async ({ venue, inquiry, user }) => {
  if (!process.env.SENDGRID_API_KEY || !venue?.ownerEmail || !user) return;

  const coupleName = [user.partner1Name, user.partner2Name].filter(Boolean).join(" & ") || "A VowLink couple";

  try {
    await sgMail.send({
      to: venue.ownerEmail,
      from: "noreplybiru556@gmail.com",
      subject: `Reminder: ${coupleName} is still waiting for your venue reply`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:28px;background:#fdf8f0;border-radius:16px;border:1px solid #e2d1b9">
          <h2 style="margin:0 0 12px;color:#1A2E4A">Venue inquiry waiting for reply</h2>
          <p style="color:#444;line-height:1.6">A couple contacted <strong>${venue.name}</strong> through VowLink and the request has been waiting for more than 48 hours.</p>
          <div style="background:#fff;padding:18px;border-radius:10px;margin:18px 0;border-left:4px solid #D8B76A">
            <p style="margin:0 0 8px;color:#555"><strong>Couple:</strong> ${coupleName}</p>
            <p style="margin:0 0 8px;color:#555"><strong>Email:</strong> <a href="mailto:${user.email}" style="color:#1A2E4A">${user.email}</a></p>
            <p style="margin:0;color:#555"><strong>Message:</strong> ${inquiry.message}</p>
          </div>
          <p style="color:#777;font-size:12px">Please reply, mark unavailable, or archive the inquiry from your VowLink venue dashboard.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("SendGrid venue inquiry reminder error:", err.response?.body || err.message);
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper base64 SVGs for placeholder venue photos
const PLACEHOLDER_PHOTOS = {
  classic: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%23F5EBE6'/><text x='50%' y='50%' font-family='serif' font-size='24' fill='%23B8963A' text-anchor='middle'>The Grand Ballroom - Classic Elegance</text></svg>",
  garden: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%23E8EFE9'/><text x='50%' y='50%' font-family='serif' font-size='24' fill='%235A7C5F' text-anchor='middle'>Royal Gardens - Lush Greenery</text></svg>",
  rustic: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%23EFE9E4'/><text x='50%' y='50%' font-family='serif' font-size='24' fill='%238C6239' text-anchor='middle'>Woodland Retreat - Warm Rustic Timber</text></svg>",
  beach: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%23E6EFF5'/><text x='50%' y='50%' font-family='serif' font-size='24' fill='%233B7FA3' text-anchor='middle'>Coastal Resort - Sunny Shoreline</text></svg>",
  modern: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%23ECECEC'/><text x='50%' y='50%' font-family='serif' font-size='24' fill='%231F2A38' text-anchor='middle'>Modern Gallery - Sleek Minimalist</text></svg>",
};

// Automatic seeding helper function
const seedVenues = async () => {
  try {
    const count = await Venue.countDocuments();
    if (count === 0) {
      console.log("Database: No venues found. Seeding default suggested venues...");
      await Venue.create([
        {
          name: "The Grand Ballroom",
          city: "Lekki, Lagos",
          generalLocation: "Lekki Phase 1",
          fullAddress: "Plot 14, Admiralty Way, Lekki Phase 1, Lagos, Nigeria",
          capacity: "300 - 500 guests",
          priceRange: "₦1.5M - ₦2.5M",
          description: "An opulent hall featuring breathtaking crystal chandeliers, marble flooring, and full catering service. Perfect for high-profile classic weddings.",
          phone: "+234 812 345 6789",
          whatsapp: "2348123456789",
          mapLink: "https://maps.google.com/?q=Admiralty+Way+Lekki+Lagos",
          photos: [PLACEHOLDER_PHOTOS.classic],
          isFeatured: true,
          style: "Classic",
          isApproved: true,
          views: 148,
          inquiries: 12,
        },
        {
          name: "Royal Gardens & Pavilions",
          city: "Maitama, Abuja",
          generalLocation: "Maitama District",
          fullAddress: "5 Crescent Road, Maitama, Abuja, Nigeria",
          capacity: "500 - 1000 guests",
          priceRange: "₦2.0M - ₦4.0M",
          description: "Sprawling beautifully landscaped lawns under majestic trees, complete with luxury marquee tents. An idyllic sanctuary for grand outdoor garden ceremonies.",
          phone: "+234 809 987 6543",
          whatsapp: "2348099876543",
          mapLink: "https://maps.google.com/?q=Maitama+Abuja+Nigeria",
          photos: [PLACEHOLDER_PHOTOS.garden],
          isFeatured: true,
          style: "Garden",
          isApproved: true,
          views: 95,
          inquiries: 8,
        },
        {
          name: "Whimsical Woodland Retreat",
          city: "Ikeja, Lagos",
          generalLocation: "GRA Ikeja",
          fullAddress: "22 Joel Ogunnaike Street, GRA Ikeja, Lagos, Nigeria",
          capacity: "100 - 250 guests",
          priceRange: "₦800k - ₦1.5M",
          description: "A gorgeous wood-wrapped structure with warm fairy lights and exposed timber beams, offering cozy, rustic intimate forest vibes right in the city center.",
          phone: "+234 802 111 2222",
          whatsapp: "2348021112222",
          mapLink: "https://maps.google.com/?q=GRA+Ikeja+Lagos",
          photos: [PLACEHOLDER_PHOTOS.rustic],
          isFeatured: false,
          style: "Rustic",
          isApproved: true,
          views: 45,
          inquiries: 3,
        },
        {
          name: "Coastal Breeze Resort",
          city: "Port Harcourt",
          generalLocation: "Trans Amadi",
          fullAddress: "1 Marine Road, Trans Amadi, Port Harcourt, Nigeria",
          capacity: "150 - 300 guests",
          priceRange: "₦1.2M - ₦2.2M",
          description: "Overlooking the tranquil waterfront, this beachside resort offers scenic sunset backdrops, cool coastal winds, and dynamic seafood reception catering.",
          phone: "+234 815 333 4444",
          whatsapp: "2348153334444",
          mapLink: "https://maps.google.com/?q=Trans+Amadi+Port+Harcourt",
          photos: [PLACEHOLDER_PHOTOS.beach],
          isFeatured: false,
          style: "Beach",
          isApproved: true,
          views: 32,
          inquiries: 2,
        },
        {
          name: "Monochrome Modern Gallery",
          city: "Victoria Island, Lagos",
          generalLocation: "Victoria Island",
          fullAddress: "Plot 89, Karimu Kotun Street, Victoria Island, Lagos, Nigeria",
          capacity: "50 - 150 guests",
          priceRange: "₦600k - ₦1.2M",
          description: "A striking art-deco inspired concrete and glass gallery with high ceilings, customizable spotlighting, and a sleek layout tailored for contemporary boutique weddings.",
          phone: "+234 818 777 8888",
          whatsapp: "2348187778888",
          mapLink: "https://maps.google.com/?q=Victoria+Island+Lagos",
          photos: [PLACEHOLDER_PHOTOS.modern],
          isFeatured: false,
          style: "Modern",
          isApproved: true,
          views: 64,
          inquiries: 5,
        },
      ]);
      console.log("Database: Default venues seeded successfully.");
    }
  } catch (error) {
    console.error("Database: Seeding venues failed:", error.message);
  }
};

// ── GET /api/venues (Fetch Suggested Venues) ──────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    if (process.env.NODE_ENV !== "production") {
      await seedVenues();
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Increment views for all approved venues by 1
    try {
      await Venue.updateMany({ isApproved: true, isActive: { $ne: false } }, { $inc: { views: 1 } });
    } catch (e) {
      console.error("Failed to increment views:", e.message);
    }

    const venues = (await Venue.find({ isApproved: true, isActive: { $ne: false } }).sort({ isFeatured: -1, createdAt: -1 }))
      .filter(isVenuePubliclyVisible);

    const response = venues.map((venue) => {
      const shouldRedact =
        (user.tier || "unpaid") === "unpaid" ||
        (user.tier === "free" && !isVenueUnlockedForFreeCouples(venue));
      return sanitizeVenueForCouple(venue, { redactContact: shouldRedact });
    });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to load venues", error: error.message });
  }
});

// ── POST /api/venues/shortlist/:id (Pro: Toggle Shortlist) ─────────────────
router.post("/shortlist/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.tier !== "pro") {
      return res.status(403).json({ message: "Shortlisting venues is a Pro feature. Please upgrade." });
    }

    const venueId = req.params.id;
    const index = user.shortlistedVenues.indexOf(venueId);

    let isShortlisted = false;
    if (index === -1) {
      user.shortlistedVenues.push(venueId);
      isShortlisted = true;
    } else {
      user.shortlistedVenues.splice(index, 1);
    }

    await user.save();
    res.status(200).json({
      message: isShortlisted ? "Venue added to shortlist" : "Venue removed from shortlist",
      shortlistedVenues: user.shortlistedVenues,
      isShortlisted,
    });
  } catch (error) {
    res.status(500).json({ message: "Operation failed", error: error.message });
  }
});

// ── POST /api/venues/inquire (Pro: Submit Direct Inquiry) ─────────────────────
router.post("/inquire", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.tier !== "pro") {
      return res.status(403).json({ message: "Direct inquiries are a Pro feature. Please upgrade." });
    }

    const { venueId, message } = req.body;
    if (!venueId || !message) {
      return res.status(400).json({ message: "Venue ID and inquiry message are required." });
    }

    const venue = await Venue.findById(venueId);
    if (!venue) return res.status(404).json({ message: "Venue not found" });

    // Increment inquiries count
    try {
      venue.inquiries = (venue.inquiries || 0) + 1;
      await venue.save();
    } catch (e) {
      console.error("Failed to increment inquiries:", e.message);
    }

    const targetEmail = venue.ownerEmail || venue.email;
    if (targetEmail && process.env.SENDGRID_API_KEY) {
      const emailContent = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#fdf8f0;border-radius:16px;border:1px solid #e2d1b9">
          <h2 style="color:#1A2E4A;font-size:22px;margin-bottom:16px;border-bottom:2px solid #D8B76A;padding-bottom:8px">New Venue Inquiry from VowLink</h2>
          <p style="color:#444;line-height:1.6;font-size:16px">You have received a new inquiry for <strong>${venue.name}</strong>.</p>
          
          <div style="background:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #D8B76A">
            <h3 style="color:#1A2E4A;margin-top:0;margin-bottom:12px">Couple Details</h3>
            <p style="margin:6px 0;color:#555"><strong>Names:</strong> ${user.partner1Name} & ${user.partner2Name}</p>
            <p style="margin:6px 0;color:#555"><strong>Email:</strong> <a href="mailto:${user.email}" style="color:#1A2E4A">${user.email}</a></p>
            <p style="margin:6px 0;color:#555"><strong>Wedding Date:</strong> ${user.weddingDate ? new Date(user.weddingDate).toLocaleDateString() : "Not set"}</p>
          </div>

          <div style="background:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #1A2E4A">
            <h3 style="color:#1A2E4A;margin-top:0;margin-bottom:12px">Message</h3>
            <p style="margin:0;color:#444;line-height:1.6;white-space:pre-wrap">${message}</p>
          </div>

          <p style="color:#777;font-size:12px;margin-top:32px;text-align:center;border-top:1px solid #eee;padding-top:16px">
            This inquiry was sent automatically via VowLink. Please reply directly to the couple's email.
          </p>
        </div>
      `;

      try {
        await sgMail.send({
          to: targetEmail,
          from: "noreplybiru556@gmail.com",
          subject: `VowLink Venue Inquiry: ${user.partner1Name} & ${user.partner2Name}`,
          html: emailContent,
        });
        console.log(`Direct inquiry email sent successfully to ${targetEmail}`);
      } catch (err) {
        console.error("SendGrid error sending inquiry:", err.response ? err.response.body : err);
      }
    } else {
      console.warn("SendGrid not configured or target email missing for venue inquiry");
    }

    // Save inquiry to database log
    try {
      const mongoose = require("mongoose");
      const inquiry = new Inquiry({
        user: new mongoose.Types.ObjectId(req.user.id),
        venue: new mongoose.Types.ObjectId(venueId),
        message,
      });
      await inquiry.save();
    } catch (e) {
      console.error("Failed to save inquiry to database:", e);
    }

    res.status(200).json({
      message: `Inquiry successfully sent to ${venue.name}! The venue manager will review it and contact you via email (${user.email}) or phone.`,
    });
  } catch (error) {
    res.status(500).json({ message: "Inquiry submission failed", error: error.message });
  }
});

// ── COUPLES: My Venue Inquiry History ───────────────────────────────────────
router.get("/my-inquiries", protect, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ user: req.user.id })
      .populate("venue", "name city generalLocation photos isFeatured style email whatsapp mapLink")
      .sort({ createdAt: -1 })
      .limit(100);

    const response = inquiries.map((inquiry) => {
      const rawStatus = inquiry.status || "new";
      const status = rawStatus === "archived" ? (inquiry.repliedAt ? "replied" : "waiting") : rawStatus;

      return {
        _id: inquiry._id,
        message: inquiry.message,
        createdAt: inquiry.createdAt,
        repliedAt: inquiry.repliedAt || null,
        status,
        venue: inquiry.venue
          ? {
              _id: inquiry.venue._id,
              name: inquiry.venue.name,
              city: inquiry.venue.city,
              generalLocation: inquiry.venue.generalLocation,
              photos: inquiry.venue.photos || [],
              isFeatured: inquiry.venue.isFeatured,
              style: inquiry.venue.style,
              email: inquiry.venue.email,
              whatsapp: inquiry.venue.whatsapp,
              mapLink: inquiry.venue.mapLink,
            }
          : null,
      };
    });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch venue inquiry history", error: error.message });
  }
});

// ── JWT Helper for Venues ───────────────────────────────────────────────────
const jwt = require("jsonwebtoken");

const generateVenueToken = (venue) => {
  return jwt.sign(
    { id: venue._id, role: "venue", email: venue.ownerEmail },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

const generateVenueRefreshToken = (venue) => {
  return jwt.sign(
    { id: venue._id, role: "venue" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "90d" }
  );
};

// Middleware to protect venue owner endpoints
const protectVenue = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorised. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "venue") {
      return res.status(403).json({ message: "Access denied. Not logged in as a venue owner." });
    }
    const venue = await Venue.findById(decoded.id);
    if (!venue) {
      return res.status(404).json({ message: "Venue owner profile not found." });
    }
    req.venue = venue;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Session expired or invalid token. Please log in again." });
  }
};

// ── VENUE OWNER: Register ──────────────────────────────────────────────────
router.post("/auth/register", async (req, res) => {
  try {
    const {
      name,
      city,
      generalLocation,
      fullAddress,
      capacity,
      priceRange,
      description,
      phone,
      whatsapp,
      mapLink,
      ownerEmail,
      ownerPassword,
      style,
      email,
      website,
      tags,
      claimedFireExits,
      claimedCctv,
      claimedSecurity,
      claimedStructural,
      claimedInsurance
    } = req.body;

    if (!name || !city || !generalLocation || !fullAddress || !capacity || !priceRange || !description || !phone || !whatsapp || !mapLink || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ message: "All fields are required to register your venue." });
    }

    // Guard: reject email addresses entered in the fullAddress field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(fullAddress.trim())) {
      return res.status(400).json({ message: "Full Address cannot be an email address. Please enter your venue's physical street address." });
    }

    // Check if email already registered
    const existing = await Venue.findOne({ ownerEmail: ownerEmail.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "A venue has already been registered with this owner email." });
    }

    const newVenue = new Venue({
      name,
      city,
      generalLocation,
      fullAddress,
      capacity,
      priceRange,
      description,
      phone,
      whatsapp,
      mapLink,
      ownerEmail: ownerEmail.toLowerCase().trim(),
      ownerPassword,
      style: style || "Classic",
      email: email || "", // Public contact email — left empty until owner sets it explicitly
      website: website || "",
      tags: tags || [],
      subscriptionTier: "basic",
      claimedFireExits: !!claimedFireExits,
      claimedCctv: !!claimedCctv,
      claimedSecurity: !!claimedSecurity,
      claimedStructural: !!claimedStructural,
      claimedInsurance: !!claimedInsurance,
      isApproved: false, // Must be verified and approved by admin
      isActive: true,
    });

    await newVenue.save();

    // Notify administrator about the new venue registration
    sendNewVenueRegistrationAdminAlert(newVenue).catch((err) => {
      console.error("[MAIL] Failed to send admin venue registration alert:", err.message);
    });
    
    res.status(201).json({
      message: "Venue registered successfully! Welcome to VowLink Venues. Your listing is pending admin review.",
      token: generateVenueToken(newVenue),
      refreshToken: generateVenueRefreshToken(newVenue),
      venue: {
        id: newVenue._id,
        name: newVenue.name,
        ownerEmail: newVenue.ownerEmail,
        subscriptionTier: newVenue.subscriptionTier,
        photos: newVenue.photos,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

// ── VENUE OWNER: Login ─────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  try {
    const { ownerEmail, ownerPassword } = req.body;
    if (!ownerEmail || !ownerPassword) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const venue = await Venue.findOne({ ownerEmail: ownerEmail.toLowerCase().trim() });
    if (!venue) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await venue.comparePassword(ownerPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    res.status(200).json({
      message: "Logged in successfully! Welcome back.",
      token: generateVenueToken(venue),
      refreshToken: generateVenueRefreshToken(venue),
      venue: {
        id: venue._id,
        name: venue.name,
        ownerEmail: venue.ownerEmail,
        subscriptionTier: venue.subscriptionTier,
        photos: venue.photos,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// ── VENUE OWNER: Refresh Session ────────────────────────────────────────────
router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required." });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.role !== "venue") {
      return res.status(403).json({ message: "Invalid venue refresh token." });
    }

    const venue = await Venue.findById(decoded.id);
    if (!venue) {
      return res.status(401).json({ message: "Venue account not found." });
    }

    res.status(200).json({ token: generateVenueToken(venue) });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired venue refresh token." });
  }
});

// ── VENUE OWNER: Get Profile ───────────────────────────────────────────────
router.get("/auth/me", protectVenue, async (req, res) => {
  res.status(200).json(req.venue);
});

// ── VENUE OWNER: Check public sharing readiness ────────────────────────────
router.get("/auth/public-readiness", protectVenue, async (req, res) => {
  const readiness = getVenuePublicReadiness(req.venue);

  res.status(200).json({
    ...readiness,
    publicUrlPath: `/venues/${req.venue._id}`,
    status: {
      isApproved: Boolean(req.venue.isApproved),
      isActive: req.venue.isActive !== false,
      verificationStatus: req.venue.verificationStatus || "not_submitted",
      subscriptionTier: req.venue.subscriptionTier || "basic",
    },
  });
});

// ── VENUE OWNER: Get Live Stats (views + inquiries only) ──────────────────
router.get("/auth/stats", protectVenue, async (req, res) => {
  try {
    // Re-fetch directly from DB so we get the latest counts (not stale req.venue snapshot)
    const fresh = await Venue.findById(req.venue._id).select("views inquiries");
    if (!fresh) return res.status(404).json({ message: "Venue not found" });
    res.status(200).json({ views: fresh.views, inquiries: fresh.inquiries });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
});

// ── VENUE OWNER: Inquiry Inbox ──────────────────────────────────────────────
router.get("/auth/inquiries", protectVenue, async (req, res) => {
  try {
    const status = String(req.query.status || "active").toLowerCase();
    const validStatuses = ["new", "replied", "unavailable", "archived"];
    const filter = { venue: req.venue._id };

    if (status === "new") {
      filter.$or = [{ status: "new" }, { status: { $exists: false } }, { status: null }];
    } else if (validStatuses.includes(status)) {
      filter.status = status;
    } else if (status !== "all") {
      filter.status = { $ne: "archived" };
    }

    const [inquiries, counts] = await Promise.all([
      Inquiry.find(filter)
      .populate("user", "partner1Name partner2Name email weddingDate")
      .sort({ createdAt: -1 })
        .limit(50),
      Inquiry.aggregate([
        { $match: { venue: req.venue._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = counts.reduce((acc, item) => {
      acc[item._id || "new"] = item.count;
      return acc;
    }, {});

    const now = new Date();
    const reminderCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const reminderThrottle = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const overdueInquiries = inquiries.filter((inquiry) => {
      const status = inquiry.status || "new";
      const createdAt = inquiry.createdAt ? new Date(inquiry.createdAt) : null;
      const lastReminderAt = inquiry.lastReminderAt ? new Date(inquiry.lastReminderAt) : null;

      return (
        status === "new" &&
        createdAt &&
        createdAt <= reminderCutoff &&
        (!lastReminderAt || lastReminderAt <= reminderThrottle)
      );
    });

    overdueInquiries.forEach((inquiry) => {
      sendVenueInquiryReminderEmail({ venue: req.venue, inquiry, user: inquiry.user }).catch(() => {});
      inquiry.lastReminderAt = now;
      inquiry.save().catch((err) => console.error("Failed to update inquiry reminder timestamp:", err.message));
    });

    res.status(200).json(
      {
        counts: {
          all: counts.reduce((total, item) => total + item.count, 0),
          active: (countMap.new || 0) + (countMap.replied || 0) + (countMap.unavailable || 0),
          new: countMap.new || 0,
          replied: countMap.replied || 0,
          unavailable: countMap.unavailable || 0,
          archived: countMap.archived || 0,
          overdue: inquiries.filter((inquiry) => {
            const createdAt = inquiry.createdAt ? new Date(inquiry.createdAt) : null;
            return (inquiry.status || "new") === "new" && createdAt && createdAt <= reminderCutoff;
          }).length,
        },
        inquiries: inquiries.map((inquiry) => {
        const partnerNames = [inquiry.user?.partner1Name, inquiry.user?.partner2Name]
          .filter(Boolean)
          .join(" & ");

        return {
          _id: inquiry._id,
          message: inquiry.message,
          status: inquiry.status || "new",
          createdAt: inquiry.createdAt,
          repliedAt: inquiry.repliedAt || null,
          archivedAt: inquiry.archivedAt || null,
          lastReminderAt: inquiry.lastReminderAt || null,
          needsReply: (inquiry.status || "new") === "new" && inquiry.createdAt && new Date(inquiry.createdAt) <= reminderCutoff,
          coupleName: partnerNames || "VowLink couple",
          coupleEmail: inquiry.user?.email || "",
          weddingDate: inquiry.user?.weddingDate || null,
        };
        }),
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch venue inquiries", error: error.message });
  }
});

// ── VENUE OWNER: Update Inquiry Status ──────────────────────────────────────
router.patch("/auth/inquiries/:id/status", protectVenue, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["new", "replied", "unavailable", "archived"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid inquiry status." });
    }

    const updates = { status };
    if (status === "replied" || status === "unavailable") {
      updates.repliedAt = new Date();
      updates.archivedAt = null;
    } else if (status === "archived") {
      updates.archivedAt = new Date();
    } else {
      updates.repliedAt = null;
      updates.archivedAt = null;
    }

    const inquiry = await Inquiry.findOneAndUpdate(
      {
      _id: req.params.id,
      venue: req.venue._id,
      },
      updates,
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    res.status(200).json({
      message: status === "archived" ? "Inquiry archived." : `Inquiry marked as ${status}.`,
      inquiry,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update inquiry status", error: error.message });
  }
});

// ── VENUE OWNER: Update Listing & Photos ────────────────────────────────────
router.put("/auth/me", protectVenue, async (req, res) => {
  try {
    const {
      name,
      city,
      generalLocation,
      fullAddress,
      capacity,
      priceRange,
      description,
      phone,
      whatsapp,
      mapLink,
      photos,
      style,
      email,
      website,
      tags,
      claimedFireExits,
      claimedCctv,
      claimedSecurity,
      claimedStructural,
      claimedInsurance,
      verificationProofUrl,
      verificationProofUrls
    } = req.body;

    const venue = req.venue;

    if (name) venue.name = name;
    if (city) venue.city = city;
    if (generalLocation) venue.generalLocation = generalLocation;
    if (fullAddress) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(fullAddress.trim())) {
        return res.status(400).json({ message: "Full Address cannot be an email address. Please enter your venue's physical street address." });
      }
      venue.fullAddress = fullAddress;
    }
    if (capacity) venue.capacity = capacity;
    if (priceRange) venue.priceRange = priceRange;
    if (description) venue.description = description;
    if (phone) venue.phone = phone;
    if (whatsapp) venue.whatsapp = whatsapp;
    if (mapLink) venue.mapLink = mapLink;
    if (style) venue.style = style;
    if (email) venue.email = email;
    if (website) venue.website = website;
    if (Array.isArray(tags)) venue.tags = tags;

    const previousClaims = {
      claimedFireExits: venue.claimedFireExits,
      claimedCctv: venue.claimedCctv,
      claimedSecurity: venue.claimedSecurity,
      claimedStructural: venue.claimedStructural,
      claimedInsurance: venue.claimedInsurance,
    };
    const previousProofUrls = normalizeProofUrls(venue);

    if (claimedFireExits !== undefined) venue.claimedFireExits = claimedFireExits;
    if (claimedCctv !== undefined) venue.claimedCctv = claimedCctv;
    if (claimedSecurity !== undefined) venue.claimedSecurity = claimedSecurity;
    if (claimedStructural !== undefined) venue.claimedStructural = claimedStructural;
    if (claimedInsurance !== undefined) venue.claimedInsurance = claimedInsurance;
    if (verificationProofUrl !== undefined) venue.verificationProofUrl = verificationProofUrl;
    if (Array.isArray(verificationProofUrls)) {
      // Enforce max 5 proof documents
      venue.verificationProofUrls = verificationProofUrls.slice(0, 5);
    }

    const currentClaims = {
      claimedFireExits: venue.claimedFireExits,
      claimedCctv: venue.claimedCctv,
      claimedSecurity: venue.claimedSecurity,
      claimedStructural: venue.claimedStructural,
      claimedInsurance: venue.claimedInsurance,
    };
    const currentProofUrls = normalizeProofUrls(venue);
    const claimsChanged = Object.keys(currentClaims).some((key) => currentClaims[key] !== previousClaims[key]);
    const proofChanged = JSON.stringify(currentProofUrls) !== JSON.stringify(previousProofUrls);
    const hasVerificationSubmission = Object.values(currentClaims).some(Boolean) || currentProofUrls.length > 0;

    if ((claimsChanged || proofChanged) && hasVerificationSubmission) {
      venue.verificationStatus = "pending_review";
      venue.verificationSubmittedAt = new Date();
      venue.verificationReviewedAt = undefined;
    } else if (!hasVerificationSubmission) {
      venue.verificationStatus = "not_submitted";
      venue.verificationSubmittedAt = undefined;
      venue.verificationReviewedAt = undefined;
    }

    // Enforce photo counts based on subscription tiers
    if (Array.isArray(photos)) {
      let maxPhotos = 3;
      if (venue.subscriptionTier === "listed") maxPhotos = 8;
      if (venue.subscriptionTier === "featured") maxPhotos = 15;
      
      venue.photos = photos.slice(0, maxPhotos);
    }

    await venue.save();
    res.status(200).json({
      message: "Venue listing updated successfully!",
      venue,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
});

// ── VENUE OWNER: Change Password ───────────────────────────────────────────
router.put("/auth/change-password", protectVenue, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required." });
    }
    const venue = req.venue;
    const isMatch = await venue.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }
    venue.ownerPassword = newPassword;
    await venue.save();
    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Password change failed", error: error.message });
  }
});

// ── VENUE OWNER: Delete Account ──────────────────────────────────────────────
router.delete("/auth/delete-account", protectVenue, async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    if (!confirmPassword) {
      return res.status(400).json({ message: "Please enter your password to confirm deletion." });
    }
    const venue = req.venue;
    const isMatch = await venue.comparePassword(confirmPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }
    await Venue.findByIdAndDelete(venue._id);
    res.status(200).json({ message: "Venue account deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Account deletion failed", error: error.message });
  }
});

// ── VENUE OWNER: Mock Subscribe Payment ─────────────────────────────────────
router.post("/subscribe", protectVenue, async (req, res) => {
  try {
    const { tier } = req.body;
    if (!["listed", "featured"].includes(tier)) {
      return res.status(400).json({ message: "Invalid subscription tier selection." });
    }

    const price = tier === "listed" ? 20000 : 50000;
    
    // In a real app, this would query Paystack API:
    // POST https://api.paystack.co/transaction/initialize
    // We return a mock checkout details structure for the UI to render.
    const reference = "VOWLINK-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    res.status(200).json({
      message: "Payment transaction initialized",
      authorization_url: `https://checkout.paystack.com/mock-gateway-reference=${reference}`,
      reference,
      amount: price * 100, // Paystack works in kobo (Nigeria)
      email: req.venue.ownerEmail,
      tier,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to initialize payment", error: error.message });
  }
});

// ── VENUE OWNER: Verify Subscribe Payment & Upgrade ────────────────────────
router.post("/subscribe/verify", protectVenue, async (req, res) => {
  try {
    const { reference, tier } = req.body;
    if (!reference || !tier) {
      return res.status(400).json({ message: "Reference and tier are required to verify." });
    }

    if (!["listed", "featured"].includes(tier)) {
      return res.status(400).json({ message: "Invalid subscription tier." });
    }

    // Dev bypass for local testing
    if (reference && reference.startsWith("MOCK-")) {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ message: "Test payments are disabled in production." });
      }
      const venue = req.venue;
      venue.subscriptionTier = tier;
      venue.isFeatured = tier === "featured";
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      venue.subscriptionExpiry = expiry;
      await venue.save();
      return res.status(200).json({
        message: `[DEV BYPASS] Payment verified! Subscription upgraded to ${tier.toUpperCase()} successfully! `,
        venue,
      });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {

      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (response.data.status !== true || response.data.data.status !== "success") {
      return res.status(400).json({ message: "Payment verification failed on Paystack." });
    }

    const paystackData = response.data.data;
    const expectedAmount = tier === "listed" ? 20000 * 100 : 50000 * 100;
    const paystackAmount = paystackData.amount;
    const paystackCurrency = paystackData.currency;

    let isValidAmount = false;
    if (paystackCurrency === "NGN") {
      isValidAmount = paystackAmount >= expectedAmount - 50 * 100; // Small tolerance allowance
    } else {
      isValidAmount = paystackAmount > 0;
    }

    if (!isValidAmount) {
      return res.status(400).json({ message: `Payment amount mismatch. Expected amount for ${tier.toUpperCase()}.` });
    }

    const venue = req.venue;
    venue.subscriptionTier = tier;
    
    // Featured tier sets the featured sorting flag
    venue.isFeatured = tier === "featured";
    
    // Set subscription expiry to 30 days from now
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    venue.subscriptionExpiry = expiry;

    await venue.save();

    res.status(200).json({
      message: `Payment verified! Subscription upgraded to ${tier.toUpperCase()} successfully! `,
      venue,
    });
  } catch (error) {
    console.error("Venue Paystack verification error:", error.response?.data || error.message);
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
});

// ── PUBLIC: Approved venue profile preview/share page ───────────────────────
router.get("/public/:id", async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id).select(
      "name city generalLocation fullAddress capacity description photos isFeatured subscriptionTier style priceRange email ownerEmail website mapLink whatsapp verificationStatus trustScore safetyFireExits safetySecurity safetyStructural safetyInsurance safetyCctv isApproved isActive verificationProofUrl verificationProofUrls"
    );

    if (!venue) {
      return res.status(404).json({ message: "This venue link does not exist." });
    }

    const readiness = getVenuePublicReadiness(venue);

    if (!venue.isApproved) {
      return res.status(403).json({
        message: "This venue is still under review and is not public yet.",
        missing: readiness.missing,
        reasons: readiness.reasons,
      });
    }

    if (venue.isActive === false) {
      return res.status(403).json({
        message: "This venue listing is currently inactive.",
        missing: readiness.missing,
        reasons: readiness.reasons,
      });
    }

    if (!readiness.isReady) {
      return res.status(409).json({
        message: "This venue profile is not ready for public sharing yet.",
        missing: readiness.missing,
        reasons: readiness.reasons,
      });
    }

    const publicVenue = venue.toObject();
    delete publicVenue.ownerEmail;
    delete publicVenue.verificationProofUrl;
    delete publicVenue.verificationProofUrls;

    res.status(200).json(publicVenue);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch public venue profile", error: error.message });
  }
});

// ── COUPLES: Get single venue public profile details ────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const shouldRedact =
      (user.tier || "unpaid") === "unpaid" ||
      (user.tier === "free" && !isVenueUnlockedForFreeCouples(venue));
    res.status(200).json(sanitizeVenueForCouple(venue, { redactContact: shouldRedact }));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch venue details", error: error.message });
  }
});

// ── DEMO: Simulate Admin Approval of a Venue ────────────────────────────────
router.post("/approve/:id", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Mock approvals are disabled in production." });
  }
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    venue.isApproved = true;
    await venue.save();

    res.status(200).json({
      message: "Venue listing approved successfully! It is now visible to couples.",
      venue,
    });
  } catch (error) {
    res.status(500).json({ message: "Approval failed", error: error.message });
  }
});

// ── POST /api/venues/auth/upload (Cloudinary upload helper for venues) ────────
router.post("/auth/upload", protectVenue, async (req, res) => {
  try {
    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ message: "No file provided for upload." });
    }

    const result = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
      folder: "vowlink/venues",
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error("Cloudinary venue upload error:", error);
    res.status(500).json({ message: "Upload to Cloudinary failed", error: error.message });
  }
});

module.exports = router;
