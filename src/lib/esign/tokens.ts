import { createHash, randomBytes } from "crypto";

/**
 * Signing tokens: the raw token exists only in the emailed link. We store a
 * SHA-256 of it, so a database read never exposes a usable signing URL.
 */
export function generateSigningToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sha256Hex(data: Uint8Array | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}
