const express = require("express");
const axios = require("axios");
const Venue = require("../models/Venue");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

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
      console.log("🌱 Database: No venues found. Seeding default suggested venues...");
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
        },
      ]);
      console.log("✅ Database: Default venues seeded successfully.");
    }
  } catch (error) {
    console.error("❌ Database: Seeding venues failed:", error.message);
  }
};

// ── GET /api/venues (Fetch Suggested Venues) ──────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    // Run seed checking asynchronously
    await seedVenues();

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const venues = await Venue.find({ isApproved: true }).sort({ isFeatured: -1, createdAt: -1 });

    // Conditional Display logic based on User tier
    if (user.tier === "free") {
      // REDACT info for free users
      const redactedVenues = venues.map((venue) => ({
        _id: venue._id,
        name: venue.name,
        city: venue.city,
        generalLocation: venue.generalLocation,
        capacity: venue.capacity,
        description: venue.description,
        photos: venue.photos.slice(0, 1), // Only allow 1 image
        isFeatured: venue.isFeatured,
        style: venue.style,
        // Block private fields
        fullAddress: "[Locked - Upgrade to Plus]",
        priceRange: "[Locked - Upgrade to Plus]",
        phone: "[Locked]",
        whatsapp: "[Locked]",
        mapLink: "[Locked]",
      }));
      return res.status(200).json(redactedVenues);
    }

    // Return full details for plus & pro users
    res.status(200).json(venues);
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

// ── POST /api/venues/inquire (Pro: Submit Mock Direct Inquiry) ─────────────
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

    // In a real app, this would send an email/notification to the venue manager.
    // For this mockup, we return a successful response instantly.
    res.status(200).json({
      message: `Inquiry successfully sent to ${venue.name}! The venue manager will review it and contact you via email (${user.email}) or phone.`,
    });
  } catch (error) {
    res.status(500).json({ message: "Inquiry submission failed", error: error.message });
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
      tags
    } = req.body;

    if (!name || !city || !generalLocation || !fullAddress || !capacity || !priceRange || !description || !phone || !whatsapp || !mapLink || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ message: "All fields are required to register your venue." });
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
      email: email || ownerEmail,
      website: website || "",
      tags: tags || [],
      subscriptionTier: "basic",
      isApproved: true,
      isActive: true,
    });

    await newVenue.save();
    
    res.status(201).json({
      message: "Venue registered successfully! 🎉 Welcome to VowLink Venues.",
      token: generateVenueToken(newVenue),
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
      message: "Logged in successfully! ✓ Welcome back.",
      token: generateVenueToken(venue),
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

// ── VENUE OWNER: Get Profile ───────────────────────────────────────────────
router.get("/auth/me", protectVenue, async (req, res) => {
  res.status(200).json(req.venue);
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
      tags
    } = req.body;

    const venue = req.venue;

    if (name) venue.name = name;
    if (city) venue.city = city;
    if (generalLocation) venue.generalLocation = generalLocation;
    if (fullAddress) venue.fullAddress = fullAddress;
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

    // Enforce photo counts based on subscription tiers
    if (Array.isArray(photos)) {
      let maxPhotos = 3;
      if (venue.subscriptionTier === "listed") maxPhotos = 8;
      if (venue.subscriptionTier === "featured") maxPhotos = 15;
      
      venue.photos = photos.slice(0, maxPhotos);
    }

    await venue.save();
    res.status(200).json({
      message: "Venue listing updated successfully! ✓",
      venue,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
});

// ── VENUE OWNER: Mock Subscribe Payment ─────────────────────────────────────
router.post("/subscribe", protectVenue, async (req, res) => {
  try {
    const { tier } = req.body;
    if (!["listed", "featured"].includes(tier)) {
      return res.status(400).json({ message: "Invalid subscription tier selection." });
    }

    const price = tier === "listed" ? 5000 : 15000;
    
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
    const expectedAmount = tier === "listed" ? 5000 * 100 : 15000 * 100;
    const paystackAmount = paystackData.amount;
    const paystackCurrency = paystackData.currency;

    let isValidAmount = false;
    if (paystackCurrency === "NGN") {
      isValidAmount = paystackAmount >= expectedAmount - 100 * 100;
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
      message: `Payment verified! Subscription upgraded to ${tier.toUpperCase()} successfully! 🚀`,
      venue,
    });
  } catch (error) {
    console.error("Venue Paystack verification error:", error.response?.data || error.message);
    res.status(500).json({ message: "Verification failed", error: error.message });
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

    // Redaction check for free tier couples
    if (user.tier === "free") {
      return res.status(200).json({
        _id: venue._id,
        name: venue.name,
        city: venue.city,
        generalLocation: venue.generalLocation,
        capacity: venue.capacity,
        description: venue.description,
        photos: venue.photos.slice(0, 1),
        isFeatured: venue.isFeatured,
        style: venue.style,
        fullAddress: "[Locked - Upgrade to Plus]",
        priceRange: "[Locked - Upgrade to Plus]",
        phone: "[Locked]",
        whatsapp: "[Locked]",
        mapLink: "[Locked]",
        email: "[Locked]",
        website: "[Locked]",
      });
    }

    res.status(200).json(venue);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch venue details", error: error.message });
  }
});

// ── DEMO: Simulate Admin Approval of a Venue ────────────────────────────────
router.post("/approve/:id", async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    venue.isApproved = true;
    await venue.save();

    res.status(200).json({
      message: "Venue listing approved successfully! 🎉 It is now visible to couples.",
      venue,
    });
  } catch (error) {
    res.status(500).json({ message: "Approval failed", error: error.message });
  }
});

module.exports = router;
