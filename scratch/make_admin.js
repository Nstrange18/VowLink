const path = require('path');
module.paths.push('c:/Users/USER/Desktop/Projects/VowLink/server/node_modules');
const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://nwubachukwuemelie_db_user:Nwubaallen%2D12@cluster0.xv3bptq.mongodb.net/VowLink?retryWrites=true&w=majority&appName=Cluster0";

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
