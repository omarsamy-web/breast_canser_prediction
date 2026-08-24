import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CREDIT_PACKS, enforcePredictionAccess, isStaff } from "../src/controllers/payment.controller.js";
import { getPlan, publicPlans, DEFAULT_PLAN } from "../src/config/plans.js";

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
}

describe("plan catalog", () => {
  it("contains free, pro and clinic with positive quotas", () => {
    const plans = publicPlans();
    assert.deepEqual(plans.map((p) => p.id).sort(), ["clinic", "free", "pro"]);
    for (const plan of plans) {
      assert.ok(plan.priceMonthly >= 0);
      assert.ok(getPlan(plan.id).quotas.predictionsPerMonth > 0);
    }
  });
  it("falls back to the default plan for unknown ids", () => {
    assert.equal(getPlan("does-not-exist").id, DEFAULT_PLAN);
  });
});

describe("credit packs", () => {
  it("all packs grant at least one credit at a positive price", () => {
    assert.ok(CREDIT_PACKS.length >= 1);
    for (const pack of CREDIT_PACKS) {
      assert.ok(pack.credits >= 1 && pack.price > 0);
    }
  });
});

describe("role handling", () => {
  it("treats Admin and legacy staff roles as staff", () => {
    for (const role of ["Admin", "Doctor", "Researcher"]) {
      assert.equal(isStaff({ role }), true);
    }
  });
  it("does not treat Patient as staff", () => {
    assert.equal(isStaff({ role: "Patient" }), false);
  });
});

describe("enforcePredictionAccess", () => {
  const middleware = enforcePredictionAccess();

  it("allows staff unconditionally", async () => {
    let called = false;
    await middleware({ user: { role: "Admin", credits: 0 } }, mockRes(), () => { called = true; });
    assert.equal(called, true);
  });

  it("blocks patients with zero credits with 402 PAYMENT_REQUIRED", async () => {
    const req = { user: { role: "Patient", credits: 0 } };
    const res = mockRes();
    let called = false;
    await middleware(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 402);
    assert.equal(res.body.code, "PAYMENT_REQUIRED");
  });

  it("allows patients holding credits", async () => {
    const req = { user: { role: "Patient", credits: 3 } };
    let called = false;
    await middleware(req, mockRes(), () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.predictionBilling.type, "credit");
  });

  it("blocks patients with missing credit fields entirely", async () => {
    const res = mockRes();
    await middleware({ user: { role: "Patient" } }, res, () => assert.fail("should not pass"));
    assert.equal(res.statusCode, 402);
  });
});
