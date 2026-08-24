/**
 * End-to-end smoke test for a deployed environment (localhost OR Railway).
 *
 * Usage:
 *   node scripts/smoke-test.mjs https://your-backend.up.railway.app
 *
 * Verifies the critical flow: health -> register admin & patient ->
 * patient blocked without credits -> checkout -> predict succeeds ->
 * history saved -> admin analysis/evaluation access control.
 * NOTE: run against a disposable/test database — it creates two accounts.
 */
import crypto from "node:crypto";

const BASE = (process.argv[2] || "http://localhost:4000").replace(/\/$/, "");
const stamp = crypto.randomUUID().slice(0, 8);
let failures = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
  return { status: res.status, json };
}

function check(name, condition, extra = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failures++; console.error(`FAIL ${name} ${extra}`); }
}

const health = await call("GET", "/api/health");
check("health endpoint", health.status === 200);

const admin = await call("POST", "/api/auth/register", {
  body: { name: `QA Admin ${stamp}`, email: `qa-admin-${stamp}@test.com`, password: "password123", role: "Admin", consentAccepted: true }
});
check("admin registration", admin.status === 201 && admin.json.user?.role === "Admin", `status=${admin.status}`);

const patient = await call("POST", "/api/auth/register", {
  body: { name: `QA Patient ${stamp}`, email: `qa-patient-${stamp}@test.com`, password: "password123", role: "Patient", consentAccepted: true }
});
check("patient registration", patient.status === 201 && patient.json.user?.role === "Patient", `status=${patient.status}`);

if (!patient.json.token || !admin.json.token) {
  console.error("Cannot continue without tokens.");
  process.exit(1);
}

const noCredits = await call("POST", "/api/ml/predict", {
  token: patient.json.token,
  body: { features: Array(40).fill(1.5) }
});
check("patient blocked without credits (402)", noCredits.status === 402 && noCredits.json.code === "PAYMENT_REQUIRED", `status=${noCredits.status}`);

const checkout = await call("POST", "/api/checkout", { token: patient.json.token, body: { pack: "single" } });
check("checkout grants credits", checkout.status === 200 && checkout.json.credits >= 1);

// 40 real feature values in the expected order.
const features = [13.54,14.36,87.46,566.3,0.09779,0.08129,0.06664,0.04781,0.1885,0.05766,
  0.2699,0.7886,2.058,23.56,0.008462,0.0146,0.02387,0.01315,0.0198,0.0023,
  15.11,19.26,99.7,711.2,0.144,0.1773,0.239,0.1288,0.2977,0.07259,
  50,9,0,2,0.5,0,0.4,0.4,0.35,4];
const prediction = await call("POST", "/api/ml/predict", { token: patient.json.token, body: { features } });
check("paid prediction succeeds with valid diagnosis",
  prediction.status === 200 && ["Benign", "Malignant"].includes(prediction.json.diagnosis),
  `status=${prediction.status} body=${JSON.stringify(prediction.json).slice(0, 120)}`);

const history = await call("GET", "/api/ml/history", { token: patient.json.token });
check("history contains the new prediction", history.json.predictions?.length >= 1);

const patientAnalyze = await call("GET", "/api/ml/analyze", { token: patient.json.token });
check("patient blocked from analysis (403)", patientAnalyze.status === 403);

const adminAnalyze = await call("GET", "/api/ml/analyze", { token: admin.json.token });
check("admin can access analysis", adminAnalyze.status === 200 && typeof adminAnalyze.json.rows === "number");

console.log(failures === 0 ? "\nAll smoke tests passed." : `\n${failures} smoke test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
