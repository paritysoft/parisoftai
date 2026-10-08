import { NextResponse, type NextRequest } from "next/server";
import { isServiceRoleConfigured } from "@/lib/env";
import { contactRequestSchema } from "@/lib/validation/lead";
import { submitLead } from "@/lib/leads/submit";
import { clientIp, createLeadDeps, hashIp } from "@/lib/leads/server-deps";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 20_000;

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients; other protections still apply
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const noStore = { "Cache-Control": "no-store" };

  if (!sameOrigin(req)) {
    return NextResponse.json({ ok: false, message: "Cross-origin requests are not allowed." }, { status: 403, headers: noStore });
  }
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, message: "Your message is too large." }, { status: 413, headers: noStore });
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400, headers: noStore });
  }

  if (!isServiceRoleConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      // Development without Supabase: validate, then report honestly that nothing was stored.
      const parsed = contactRequestSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json({ ok: false, message: "Please check the highlighted fields and try again." }, { status: 400, headers: noStore });
      }
      console.info("[contact] development mode — inquiry validated but not stored:", { service: parsed.data.serviceRequired });
      return NextResponse.json(
        { ok: true, message: "Development mode: your inquiry passed validation but was not stored because the database is not configured." },
        { headers: noStore },
      );
    }
    return NextResponse.json(
      { ok: false, message: "The contact form is temporarily unavailable. Please try again later." },
      { status: 503, headers: noStore },
    );
  }

  const result = await submitLead(raw, hashIp(clientIp(req.headers)), createLeadDeps());
  return NextResponse.json(result.body, { status: result.status, headers: noStore });
}
