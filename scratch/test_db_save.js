const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../server/.env") });

const Venue = require("../server/models/Venue");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    
    // Create random email to avoid duplication errors
    const randEmail = `test_${Date.now()}@test.com`;

    const testVenue = new Venue({
      name: "Test Venue registration error",
      city: "Lagos",
      generalLocation: "Lekki",
      fullAddress: "Plot 983 ECA Mouneke Crescent, Corridor layout",
      capacity: "300 - 500 guests",
      priceRange: "₦1.5M - ₦2.5M",
      description: "A nice place in someplace for wedding parties of at least twenty characters.",
      phone: "+234 812 345 6789",
      whatsapp: "2348123456789",
      mapLink: "https://www.google.com/maps/place/...",
      ownerEmail: randEmail,
      ownerPassword: "password123",
      style: "Classic",
      claimedFireExits: true,
      claimedCctv: true,
      claimedSecurity: true,
      claimedStructural: true,
      claimedInsurance: true,
    });

    try {
      await testVenue.save();
      console.log("SUCCESS: Venue registered successfully!");
    } catch (error) {
      console.error("ERROR registering venue:", error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error("Connection error:", err);
  });
