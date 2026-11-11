// Opt-in local FAQ QA. Never loads dotenv or starts the production server/scheduler.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const binary = process.argv[2] || path.join(os.homedir(), ".cache", "mongodb-binaries", "mongod-x64-win32-8.2.6.exe");
if (!fs.existsSync(binary)) throw new Error("Pass the path to a locally installed mongod executable as the first argument.");
// Strip inherited provider configuration before loading any application modules.
for (const key of Object.keys(process.env)) {
  if (!/^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|HOME)$/i.test(key)) delete process.env[key];
}
Object.assign(process.env, {
  NODE_ENV: "development", JWT_SECRET: crypto.randomBytes(32).toString("hex"),
  JWT_REFRESH_SECRET: crypto.randomBytes(32).toString("hex"),
  PUBLIC_SITE_URL: "http://localhost:5188", CLIENT_URL: "http://localhost:5188",
});
// This process may contact loopback only, including through imported route helpers.
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const options = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = typeof options === "object" ? options.host : args[1];
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) throw new Error("Local FAQ QA blocks external connections.");
  return connect.apply(this, args);
};
const fetchLocal = globalThis.fetch;
globalThis.fetch = (url, options) => {
  if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname)) throw new Error("Local FAQ QA blocks external fetch.");
  return fetchLocal(url, options);
};

const children = [];
let server;
async function available(port) {
  await new Promise((resolve, reject) => {
    const probe = net.createServer(); probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  });
}
async function main() {
  await available(27027); await available(5055); await available(5188);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "vowlink-faq-qa-"));
  const mongo = spawn(binary, ["--bind_ip", "127.0.0.1", "--port", "27027", "--dbpath", directory, "--logpath", path.join(directory, "mongo.log")], { windowsHide: true, stdio: "ignore" });
  children.push(mongo);
  mongo.on("error", () => { console.error("Could not start local mongod."); shutdown(1); });
  const mongoose = require("mongoose");
  for (let attempt = 0; ; attempt++) {
    try { await mongoose.connect("mongodb://127.0.0.1:27027/vowlink_faq_qa", { serverSelectionTimeoutMS: 1000 }); break; }
    catch { if (attempt >= 15 || mongo.exitCode !== null) throw new Error("Isolated local MongoDB did not start."); }
  }
  const User = require("../models/User");
  const Invitation = require("../models/Invitation");
  const user = await User.create({ partner1Name: "Local", partner2Name: "QA Couple", email: "faq-qa@example.test",
    password: await require("bcryptjs").hash("FaqLocalOnly123!", 10), tier: "pro", weddingDate: new Date("2027-06-12T12:00:00Z"),
    venue: "Local test venue", weddingSite: { faq: { enabled: false, items: [{ question: "Where can we park?", answer: "Use the local test venue car park." }] } } });
  await Invitation.create({ userId: user._id, guestName: "Local QA Guest", slug: "local-faq-qa", greeting: "Hello Local QA Guest",
    customMessage: "You are invited to our local test wedding.", checkInToken: crypto.randomBytes(24).toString("hex") });
  const express = require("express");
  const app = express();
  app.use(require("cors")({ origin: ["http://localhost:5188", "http://127.0.0.1:5188"] }));
  app.use(express.json());
  // Use real handlers, limited to FAQ editing and guest reads. No messaging/payment endpoints.
  app.use((req, res, next) => {
    const allowed = (req.method === "POST" && ["/api/auth/login", "/api/auth/refresh"].includes(req.path)) ||
      (["GET", "PUT"].includes(req.method) && req.path === "/api/auth/me") ||
      (req.method === "GET" && /^\/api\/invitations\/slug\/local-faq-qa(?:\/wishes)?$/.test(req.path));
    return allowed ? next() : res.status(404).json({ message: "This local QA server supports FAQ settings and guest reads only." });
  });
  app.use("/api/auth", require("../routes/authRoutes"));
  app.use("/api/invitations", require("../routes/invitationRoutes"));
  server = await new Promise((resolve) => { const listener = app.listen(5055, "127.0.0.1", () => resolve(listener)); });
  // Self-check the complete real API / database / public-projection round trip.
  const base = "http://127.0.0.1:5055/api";
  const login = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, password: "FaqLocalOnly123!" }) }).then((r) => r.json());
  const faq = { enabled: true, items: [{ question: "Local API check?", answer: "Saved through the real settings handler." }] };
  const save = async (value) => {
    const response = await fetch(`${base}/auth/me`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${login.accessToken}` }, body: JSON.stringify({ weddingSite: { faq: value } }) });
    if (!response.ok) throw new Error("Local FAQ save check failed.");
  };
  await save(faq);
  let guest = await fetch(`${base}/invitations/slug/local-faq-qa`).then((r) => r.json());
  if (guest.userId?.weddingSite?.faq?.items?.[0]?.answer !== faq.items[0].answer) throw new Error("Published FAQ projection check failed.");
  await save({ ...faq, enabled: false });
  guest = await fetch(`${base}/invitations/slug/local-faq-qa`).then((r) => r.json());
  if (guest.userId?.weddingSite) throw new Error("Draft FAQ omission check failed.");
  await save(faq);
  const vite = spawn(process.execPath, [path.resolve(__dirname, "../../client/node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", "5188", "--strictPort"], {
    cwd: path.resolve(__dirname, "../../client"), windowsHide: true, stdio: "inherit",
    env: { ...process.env, VITE_API_URL: `${base}`, VITE_GOOGLE_MAPS_API_KEY: "" },
  });
  children.push(vite);
  vite.on("error", () => shutdown(1));
  console.log("Local API/database/projection checks passed (published and disabled).");
  console.log("Login: http://localhost:5188/admin/login — faq-qa@example.test / FaqLocalOnly123!");
  console.log("Guest: http://localhost:5188/invite/local-faq-qa");
  console.log("Synthetic session only. Restart creates a fresh database. Ctrl+C stops all QA processes.");
}
function shutdown(code = 0) {
  server?.close();
  for (const child of children) child.kill();
  process.exit(code);
}
process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
main().catch((error) => { console.error(error.message); shutdown(1); });
