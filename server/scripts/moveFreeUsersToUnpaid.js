require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.updateMany({ tier: "free" }, { $set: { tier: "unpaid" } });

  console.log(`Moved ${result.modifiedCount || 0} free tester account(s) to unpaid.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
