const mongoose = require("mongoose");
const { runRsvpTransaction } = require("../utils/rsvpTransactions");
let previousEnv, previousHost, previousDb, transaction, hello;
beforeEach(() => {
  previousEnv = process.env.NODE_ENV; previousHost = mongoose.connection.host; previousDb = mongoose.connection.db;
  hello = jest.fn().mockResolvedValue({});
  mongoose.connection.host = "127.0.0.1"; mongoose.connection.db = { admin: () => ({ command: hello }) };
  transaction = jest.spyOn(mongoose.connection, "transaction").mockImplementation(async (work) => work({ synthetic: true }));
});
afterEach(() => { process.env.NODE_ENV = previousEnv; mongoose.connection.host = previousHost; mongoose.connection.db = previousDb; transaction.mockRestore(); });
test.each(["production", "staging", "test", "unrecognized", ""])("%s requires transaction even for loopback", async (env) => {
  process.env.NODE_ENV = env; const work = jest.fn().mockResolvedValue("done");
  expect(await runRsvpTransaction("id", work)).toBe("done");
  expect(transaction).toHaveBeenCalledTimes(1); expect(hello).not.toHaveBeenCalled();
});
test("absent environment never opts into fallback", async () => {
  delete process.env.NODE_ENV; await runRsvpTransaction("id", async () => {}); expect(transaction).toHaveBeenCalledTimes(1);
});
test("development Atlas host still uses transaction", async () => {
  process.env.NODE_ENV = "development"; mongoose.connection.host = "synthetic.mongodb.net";
  await runRsvpTransaction("id", async () => {}); expect(transaction).toHaveBeenCalledTimes(1);
});
test("development local replica set uses transaction", async () => {
  process.env.NODE_ENV = "development"; hello.mockResolvedValue({ setName: "test-replica" });
  await runRsvpTransaction("id", async () => {}); expect(transaction).toHaveBeenCalledTimes(1);
});
test("development standalone explicitly uses null-session fallback", async () => {
  process.env.NODE_ENV = "development"; const work = jest.fn().mockResolvedValue("local");
  expect(await runRsvpTransaction("id", work)).toBe("local");
  expect(work).toHaveBeenCalledWith(null); expect(transaction).not.toHaveBeenCalled();
});
test("local fallback serializes submissions and repairs for same invitation", async () => {
  process.env.NODE_ENV = "development"; let release, started; const order = [];
  const ready = new Promise((resolve) => { started = resolve; });
  const first = runRsvpTransaction("id", async () => { order.push("first"); started(); await new Promise((resolve) => { release = resolve; }); order.push("finished"); });
  await ready;
  const second = runRsvpTransaction("id", async () => { order.push("second"); });
  release(); await Promise.all([first, second]); expect(order).toEqual(["first", "finished", "second"]);
});
test("production transaction errors do not execute fallback", async () => {
  process.env.NODE_ENV = "production"; const work = jest.fn(); transaction.mockRejectedValue(new Error("transactions unsupported"));
  await expect(runRsvpTransaction("id", work)).rejects.toThrow("transactions unsupported"); expect(work).not.toHaveBeenCalled();
});
