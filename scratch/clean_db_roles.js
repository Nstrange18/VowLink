const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vowlink";

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB database.");
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Demote any user that is not nwubachukwuemelie@gmail.com to role 'user'
    const demoteRes = await usersCollection.updateMany(
      { email: { $ne: "nwubachukwuemelie@gmail.com" }, role: "admin" },
      { $set: { role: "user" } }
    );
    console.log(`Successfully demoted ${demoteRes.modifiedCount} account(s) to 'user' role.`);
    
    // Ensure nwubachukwuemelie@gmail.com has 'admin' role (if it exists)
    const promoteRes = await usersCollection.updateOne(
      { email: "nwubachukwuemelie@gmail.com" },
      { $set: { role: "admin" } }
    );
    if (promoteRes.matchedCount > 0) {
      console.log("Verified nwubachukwuemelie@gmail.com is set to Super Admin (admin role).");
    } else {
      console.log("Warning: nwubachukwuemelie@gmail.com user not found in the database.");
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error("Database connection or processing error:", err);
    process.exit(1);
  });
