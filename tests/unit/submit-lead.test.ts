import { describe, expect, it, vi } from "vitest";
import { submitLead, type LeadDeps, type StoredLead } from "@/lib/leads/submit";

const valid = {
  fullName: "Jane Client",
  email: "Jane@Company.com ",
  companyName: "",
  serviceRequired: "iOS App Development",
  estimatedBudget: "",
  preferredTimeline: "",
  projectDescription: "We need a native iOS app for our clinic bookings.",
  consent: true,
  submissionId: "4f0c8a7e-1d2b-4c3d-9e8f-1a2b3c4d5e6f",
  website: "",
  elapsedMs: 8000,
};

function deps(overrides: Partial<LeadDeps> = {}) {
  const stored: StoredLead = { id: "lead-1", fullName: "Jane Client", email: "jane@company.com", companyName: null, serviceRequired: "iOS App Development", estimatedBudget: null, preferredTimeline: null, projectDescription: "x", createdAt: "" };
  const d: LeadDeps = {
    hitRateLimit: vi.fn(async () => 1),
    insertLead: vi.fn(async () => ({ lead: stored, duplicate: false })),
    notify: vi.fn(async () => "sent" as const),
    recordNotification: vi.fn(async () => {}),
    ...overrides,
  };
  return d;
}

describe("submitLead", () => {
  it("stores a valid lead, normalises email and notifies", async () => {
    const d = deps();
    const r = await submitLead(valid, "hash", d);
    expect(r.status).toBe(200);
    expect(d.insertLead).toHaveBeenCalledWith(expect.objectContaining({ email: "jane@company.com", companyName: null, consentGiven: true, ipHash: "hash" }));
    expect(d.recordNotification).toHaveBeenCalledWith("lead-1", { status: "sent" });
  });

  it("returns field errors for invalid input without storing", async () => {
    const d = deps();
    const r = await submitLead({ ...valid, email: "nope", projectDescription: "short" }, "hash", d);
    expect(r.status).toBe(400);
    expect(r.body.ok).toBe(false);
    if (!r.body.ok) expect(Object.keys(r.body.fieldErrors ?? {})).toEqual(expect.arrayContaining(["email", "projectDescription"]));
    expect(d.insertLead).not.toHaveBeenCalled();
  });

  it("requires consent", async () => {
    const r = await submitLead({ ...valid, consent: false }, "hash", deps());
    expect(r.status).toBe(400);
  });

  it("silently drops honeypot submissions", async () => {
    const d = deps();
    const r = await submitLead({ ...valid, website: "http://spam" }, "hash", d);
    expect(r.status).toBe(200);
    expect(d.insertLead).not.toHaveBeenCalled();
  });

  it("silently drops submissions faster than a human could type", async () => {
    const d = deps();
    await submitLead({ ...valid, elapsedMs: 400 }, "hash", d);
    expect(d.insertLead).not.toHaveBeenCalled();
  });

  it("rate limits", async () => {
    const d = deps({ hitRateLimit: vi.fn(async () => 6) });
    const r = await submitLead(valid, "hash", d);
    expect(r.status).toBe(429);
    expect(d.insertLead).not.toHaveBeenCalled();
  });

  it("does not report success when storage fails", async () => {
    const d = deps({ insertLead: vi.fn(async () => Promise.reject(new Error("db down"))) });
    const r = await submitLead(valid, "hash", d);
    expect(r.status).toBe(500);
    expect(r.body.ok).toBe(false);
  });

  it("still succeeds and records failure when email fails after storage", async () => {
    const d = deps({ notify: vi.fn(async () => Promise.reject(new Error("smtp"))) });
    const r = await submitLead(valid, "hash", d);
    expect(r.status).toBe(200);
    expect(d.recordNotification).toHaveBeenCalledWith("lead-1", expect.objectContaining({ status: "failed" }));
  });

  it("does not notify twice for a duplicate submission", async () => {
    const d = deps({ insertLead: vi.fn(async () => ({ lead: { id: "lead-1" } as StoredLead, duplicate: true })) });
    const r = await submitLead(valid, "hash", d);
    expect(r.status).toBe(200);
    expect(d.notify).not.toHaveBeenCalled();
  });

  it("strips control characters", async () => {
    const d = deps();
    await submitLead({ ...valid, fullName: "Jane\u0000 Client\u0007" }, "hash", d);
    expect(d.insertLead).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Jane Client" }));
  });
});
