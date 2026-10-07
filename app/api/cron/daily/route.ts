import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runSourceSync } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function validBearer(request: Request, secret: string) {
  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const actualBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "Cron authentication is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!validBearer(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const result = await runSourceSync("cron");
    return NextResponse.json(result, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[cron:daily]", error);
    return NextResponse.json({ error: "Daily source sync failed. Check the private app's sync history and server logs." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
