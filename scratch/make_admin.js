const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vowlink";

const emailToMakeAdmin = process.argv[2];

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB");
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    if (emailToMakeAdmin) {
      const email = emailToMakeAdmin.trim().toLowerCase();
      const result = await usersCollection.updateOne(
        { email },
        { $set: { role: 'admin' } }
      );
      if (result.matchedCount > 0) {
        console.log(`Successfully elevated ${email} to Super Admin!`);
      } else {
        console.log(`User with email ${email} not found.`);
      }
    } else {
      const users = await usersCollection.find({}).toArray();
      console.log("Users in DB:");
      users.forEach(u => {
        console.log(`- Email: ${u.email}, Role: ${u.role || 'user'}, Tier: ${u.tier}`);
      });
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("Error:", err);
    process.exit(1);
  });
