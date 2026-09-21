import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type LoginTicket = {
  challenge: string;
  clientOrigin: "https://st-oauthapp.vercel.app" | "https://businesstimes.test";
  csrfCookie: string;
  csrfToken: string;
  expiresAt: number;
  flowId: string;
  identifier?: string;
};

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for login handoff tickets.");
  return createHash("sha256").update(secret).digest();
}

export function sealLoginTicket(ticket: LoginTicket) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(ticket), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function openLoginTicket(value: string) {
  const data = Buffer.from(value, "base64url");
  if (data.length < 29) throw new Error("Invalid login ticket.");
  const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  const ticket = JSON.parse(Buffer.concat([
    decipher.update(data.subarray(28)),
    decipher.final(),
  ]).toString("utf8")) as LoginTicket;
  if (ticket.expiresAt < Date.now()) throw new Error("Expired login ticket.");
  return ticket;
}
