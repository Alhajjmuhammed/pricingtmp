import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for the Client Management (clientmng) GraphQL API.
// clientmng's endpoint requires a shared secret (X-Admin-Api-Key) since it
// used to have no authentication at all -- this route keeps that secret on
// the server, since the caller (app/register/page.tsx via
// services/provisioning/destinationSystems.ts) is a public, unauthenticated
// "use client" registration page, and a secret embedded there would be
// visible to any visitor via browser devtools, defeating the point.
//
// This route is itself public (no auth on the incoming request -- it has
// to be, the caller is an anonymous visitor filling out the register form).
// That means anyone can POST directly to it, not just the register page's
// own JS. Forwarding whatever body they send, verbatim, with the admin
// secret attached, would hand every visitor the same unrestricted access
// the secret exists to prevent -- an open tunnel to clientmng's entire
// GraphQL API. So this route only forwards the exact 3 named operations
// destinationSystems.ts actually issues; everything else is rejected here,
// before the secret is ever attached.
const CLIENT_MGMT_BACKEND_URL =
  process.env.CLIENT_MGMT_BACKEND_URL || "https://backclientall.eopsprimax.com/graphql/";
const CLIENT_MGMT_API_SECRET = process.env.CLIENT_MGMT_API_SECRET || "";

const ALLOWED_OPERATIONS = [
  { keyword: "query", name: "InvitationDetails" },
  { keyword: "mutation", name: "FinalizeClientFromInvitation" },
  { keyword: "mutation", name: "CompleteOnboarding" },
];

function matchesAllowedOperation(query: string): boolean {
  const trimmed = query.trim();
  const matched = ALLOWED_OPERATIONS.some(({ keyword, name }) => {
    const pattern = new RegExp(`^${keyword}\\s+${name}\\s*[({]`);
    return pattern.test(trimmed);
  });
  if (!matched) return false;

  // Reject a document that smuggles a second operation definition after
  // the allowed one (GraphQL requires operationName to disambiguate a
  // multi-operation document, and this proxy never forwards a
  // client-supplied operationName -- but reject outright rather than
  // depend on that).
  const secondOpPattern = /\}\s*(query|mutation|subscription)\s+\w+\s*[({]/;
  return !secondOpPattern.test(trimmed);
}

export async function POST(req: NextRequest) {
  let parsed: { query?: unknown; variables?: unknown };
  try {
    parsed = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ errors: [{ message: "Invalid request body" }] }, { status: 400 });
  }

  if (typeof parsed.query !== "string" || !matchesAllowedOperation(parsed.query)) {
    return NextResponse.json({ errors: [{ message: "Operation not permitted" }] }, { status: 403 });
  }

  // Re-serialize a clean body -- only query/variables from the validated
  // request, never a client-supplied operationName or anything else.
  const forwardBody = JSON.stringify({
    query: parsed.query,
    variables: parsed.variables ?? {},
  });

  const upstream = await fetch(CLIENT_MGMT_BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Api-Key": CLIENT_MGMT_API_SECRET,
    },
    body: forwardBody,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
