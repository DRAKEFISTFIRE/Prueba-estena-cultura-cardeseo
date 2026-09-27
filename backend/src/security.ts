import crypto from "node:crypto";
import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./config.js";

const jwtKey = new TextEncoder().encode(env.JWT_SECRET);

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomChars(length: number): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, b => ALPHABET.charAt(b % ALPHABET.length)).join("");
}

function checkDigit(body: string): string {
  let total = 0;

  for (let i = 0; i < body.length; i++) {
    total = (total + body.charCodeAt(i) * (i + 7)) % 31;
  }

  return ALPHABET.charAt(total);
}
export function generateRegistrationCode(): string {
  const body = randomChars(11);
  return `${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8)}${checkDigit(body)}`;
}

export function normalizeRegistrationCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function validCheckDigit(input: string): boolean {
  const normalized = normalizeRegistrationCode(input);
  if (normalized.length !== 12) return false;
  return checkDigit(normalized.slice(0, 11)) === normalized[11];
}

export function hashRegistrationCode(input: string): string {
  const normalized = normalizeRegistrationCode(input);
  return crypto.createHmac("sha256", env.CODE_PEPPER).update(normalized).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function createSession(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, role: "tutor" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(jwtKey);
}

export async function verifySession(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, jwtKey);
  if (typeof payload.sub !== "string") throw new Error("Invalid session");
  return { userId: payload.sub };
}

export function randomId(): string {
  return crypto.randomUUID();
}
