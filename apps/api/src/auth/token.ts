import { createHmac, timingSafeEqual } from "node:crypto";
import type { DemoUser, UserRole } from "@request-assistant/shared";

type TokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
};

function getSecret() {
  return process.env.JWT_SECRET ?? "demo-development-secret";
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(data: string) {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createDemoToken(user: DemoUser) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  } satisfies TokenPayload);
  const signature = sign(`${header}.${payload}`);

  return `${header}.${payload}.${signature}`;
}

export function verifyDemoToken(token: string): TokenPayload | null {
  const parts = token.split(".");

  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = sign(`${header}.${payload}`);
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as TokenPayload;

    if (!decoded.sub || !decoded.email || !decoded.name || !decoded.role) return null;

    return decoded;
  } catch {
    return null;
  }
}
