import crypto from "crypto";

const EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

export function generateCheckinToken(): string {
  const secret = process.env.ADMIN_PASSWORD ?? "seminar-checkin-secret";
  const timestamp = Date.now().toString();
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${hmac}`;
}

export function validateCheckinToken(
  token: string,
): { valid: boolean; error?: string } {
  if (!token) return { valid: false, error: "No token provided." };

  const dotIdx = token.indexOf(".");
  if (dotIdx === -1) return { valid: false, error: "Invalid token." };

  const timestamp = token.slice(0, dotIdx);
  const givenHmac = token.slice(dotIdx + 1);

  const secret = process.env.ADMIN_PASSWORD ?? "seminar-checkin-secret";
  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  let valid = expectedHmac.length === givenHmac.length;
  if (valid) {
    try {
      valid = crypto.timingSafeEqual(
        Buffer.from(expectedHmac, "hex"),
        Buffer.from(givenHmac, "hex"),
      );
    } catch {
      valid = false;
    }
  }

  if (!valid) return { valid: false, error: "Invalid token." };

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Date.now() - ts > EXPIRY_MS) {
    return {
      valid: false,
      error:
        "Check-in session has expired. Ask the admin to generate a new QR code.",
    };
  }

  return { valid: true };
}
