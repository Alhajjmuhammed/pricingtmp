import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for the Client Management (clientmng) GraphQL API.
// clientmng's endpoint requires a shared secret (X-Admin-Api-Key) since it
// used to have no authentication at all -- this route keeps that secret on
// the server, since the caller (app/register/page.tsx via
// services/provisioning/destinationSystems.ts) is a public, unauthenticated
// "use client" registration page, and a secret embedded there would be
// visible to any visitor via browser devtools, defeating the point.
const CLIENT_MGMT_BACKEND_URL =
  process.env.CLIENT_MGMT_BACKEND_URL || "https://backclientall.eopsprimax.com/graphql/";
const CLIENT_MGMT_API_SECRET = process.env.CLIENT_MGMT_API_SECRET || "";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const upstream = await fetch(CLIENT_MGMT_BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Api-Key": CLIENT_MGMT_API_SECRET,
    },
    body,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
