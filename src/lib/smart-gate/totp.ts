// Time-based One-Time Password (TOTP) — RFC 6238 implementation.
// Used to generate dynamic QR codes that refresh every 30 seconds, so a
// photographed/scanned code becomes invalid within seconds. Each student has a
// private `qrSecret` (32 random bytes, stored as hex); the QR payload is
// `<qrToken>:<6-digit-code>` where the code is derived from the secret + time.

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const TIME_STEP = 30; // seconds
const DIGITS = 6;

/** Generate a fresh random secret (32 bytes, hex-encoded). */
export function generateSecret(): string {
  return randomBytes(32).toString("hex");
}

/** Compute the 6-digit TOTP for a given unix time. */
export function generateTotp(secretHex: string, unixSeconds = Math.floor(Date.now() / 1000)): string {
  const counter = Math.floor(unixSeconds / TIME_STEP);
  const buf = Buffer.alloc(8);
  // 64-bit big-endian counter
  buf.writeBigUInt64BE(BigInt(counter));
  const key = Buffer.from(secretHex, "hex");
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const slice = hmac.subarray(offset, offset + 4);
  const num = (slice.readUInt32BE(0) & 0x7fffffff) % 10 ** DIGITS;
  return num.toString().padStart(DIGITS, "0");
}

/**
 * Verify a token against the secret, allowing ±window time steps to absorb
 * small clock drift between the phone (display) and the server (scan).
 */
export function verifyTotp(
  token: string,
  secretHex: string,
  window = 1
): boolean {
  if (!secretHex || token.length !== DIGITS) return false;
  const now = Math.floor(Date.now() / 1000);
  for (let offset = -window; offset <= window; offset++) {
    const candidate = generateTotp(secretHex, now + offset * TIME_STEP);
    const a = Buffer.from(token);
    const b = Buffer.from(candidate);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

/** Seconds remaining until the current TOTP window expires. */
export function secondsUntilExpiry(unixSeconds = Math.floor(Date.now() / 1000)): number {
  return TIME_STEP - (unixSeconds % TIME_STEP);
}

/** The TOTP format constants (shared with client countdown logic). */
export const TOTP_TIME_STEP = TIME_STEP;
