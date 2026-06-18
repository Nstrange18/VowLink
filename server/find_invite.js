const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("Database connected successfully! ✓");

    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    const Invitation = mongoose.model("Invitation", new mongoose.Schema({}, { strict: false }));

    const users = await User.find({});
    console.log("\n--- Users ---");
    for (const u of users) {
      console.log(`ID: ${u._id} | Email: ${u.email} | Tier: ${u.tier} | CardTheme: ${u.cardTheme} | CustomBg: ${u.customCardBg}`);
    }

    const invites = await Invitation.find({});
    console.log("\n--- Invitations ---");
    for (const invite of invites) {
      console.log(`Guest: ${invite.guestName} | Slug: ${invite.slug} | UserID: ${invite.userId}`);
    }

    mongoose.connection.close();
  })
  .catch(err => {
    console.error("Connection error:", err);
  });
