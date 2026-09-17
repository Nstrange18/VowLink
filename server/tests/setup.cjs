const net = require("node:net");

// Never load dotenv or inherit an actual signing secret into these tests.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "vowlink-test-only-signing-secret";

let allowedServer;
const originalConnect = net.Socket.prototype.connect;

// Supertest needs a local HTTP connection. Deny every other TCP destination,
// including local databases, rather than relying on provider mocks alone.
jest.spyOn(net.Socket.prototype, "connect").mockImplementation(function (...args) {
  const options = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = typeof options === "object" ? options.host : args[1];
  const port = typeof options === "object" ? options.port : options;
  const address = allowedServer?.address();

  if (host !== "127.0.0.1" || !address || Number(port) !== address.port) {
    throw new Error("Tests may only connect to their registered Express server");
  }

  return originalConnect.apply(this, args);
});

// Fetch can use connection internals outside the public Socket API.
jest.spyOn(globalThis, "fetch").mockImplementation(() => {
  throw new Error("External fetch calls are disabled in backend tests");
});

afterAll(() => jest.restoreAllMocks());

module.exports = {
  allowTestServer(server) {
    allowedServer = server;
  },
};
