const mongoose = require("mongoose");
const localLocks = new Map();

// Never downgrade an Atlas/production transaction failure to separate writes.
const runRsvpTransaction = async (key, work) => {
  const connection = mongoose.connection;
  const local = process.env.NODE_ENV === "development" &&
    ["localhost", "127.0.0.1", "::1"].includes(connection.host);
  if (local) {
    const hello = await connection.db.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== "isdbgrid") {
      const previous = localLocks.get(String(key)) || Promise.resolve();
      const pending = previous.catch(() => {}).then(() => work(null));
      localLocks.set(String(key), pending);
      try { return await pending; }
      finally { if (localLocks.get(String(key)) === pending) localLocks.delete(String(key)); }
    }
  }
  return connection.transaction(work, {
    readConcern: { level: "snapshot" }, writeConcern: { w: "majority" }, readPreference: "primary",
  });
};
module.exports = { runRsvpTransaction };
