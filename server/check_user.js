const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("Database connected successfully! ✓");

    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));

    // Find the first user in the collection
    const user = await User.findOne({});
    if (user) {
      console.log("\nUser Document details:");
      console.log("ID:", user._id);
      console.log("Email:", user.email);
      console.log("Wedding Colors:", user.weddingColors);
      console.log("Card Theme:", user.cardTheme);
      console.log("Custom Card Bg:", user.customCardBg);
      console.log("Custom Text Color:", user.customTextColor);
    } else {
      console.log("No user found.");
    }

    mongoose.connection.close();
  })
  .catch(err => {
    console.error("Connection error:", err);
  });
