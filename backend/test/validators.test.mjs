import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loginSchema, predictSchema, registerSchema, validate } from "../src/utils/validators.js";

describe("registerSchema", () => {
  const base = { name: "Test User", email: "a@b.com", password: "password123", consentAccepted: true };

  it("accepts a valid patient registration", () => {
    const data = validate(registerSchema, base);
    assert.equal(data.role, "Patient");
  });

  it("accepts an explicit Admin role", () => {
    const data = validate(registerSchema, { ...base, role: "Admin" });
    assert.equal(data.role, "Admin");
  });

  it("rejects legacy or invalid roles", () => {
    assert.throws(() => validate(registerSchema, { ...base, role: "Doctor" }));
  });

  it("requires consent", () => {
    assert.throws(() => validate(registerSchema, { ...base, consentAccepted: false }));
    assert.throws(() => validate(registerSchema, { name: base.name, email: base.email, password: base.password }));
  });

  it("rejects short passwords and bad emails", () => {
    assert.throws(() => validate(registerSchema, { ...base, password: "short" }));
    assert.throws(() => validate(registerSchema, { ...base, email: "not-an-email" }));
  });
});

describe("loginSchema", () => {
  it("accepts credentials", () => {
    assert.deepEqual(validate(loginSchema, { email: "a@b.com", password: "x" }), { email: "a@b.com", password: "x" });
  });
  it("rejects empty password", () => {
    assert.throws(() => validate(loginSchema, { email: "a@b.com", password: "" }));
  });
});

describe("predictSchema", () => {
  it("accepts numeric feature arrays", () => {
    const data = validate(predictSchema, { features: [1.2, 3, 4.5] });
    assert.equal(data.features.length, 3);
  });
  it("rejects non-numeric features", () => {
    assert.throws(() => validate(predictSchema, { features: ["abc"] }));
  });
  it("rejects missing features", () => {
    assert.throws(() => validate(predictSchema, {}));
  });
});
