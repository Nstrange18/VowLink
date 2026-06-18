const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("Database connected successfully! ✓");

    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));

    const user = await User.findOne({ email: "test@example.com" });
    if (user) {
      console.log("Found user test@example.com. Updating password...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password123", salt);
      user.password = hashedPassword;
      await user.save();
      console.log("Password updated successfully to 'password123'!");
    } else {
      console.log("User test@example.com not found. Creating it...");
      // Let's also support creating a user if they don't exist
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password123", salt);
      const newUser = new User({
        partner1Name: "Romeo",
        partner2Name: "Juliet",
        email: "test@example.com",
        password: hashedPassword,
        tier: "pro",
        cardTheme: "custom",
        customCardBg: "/templates/Emerald Eucalyptus Frame.png"
      });
      await newUser.save();
      console.log("Created test@example.com user successfully!");
    }

    mongoose.connection.close();
  })
  .catch(err => {
    console.error("Connection error:", err);
  });
