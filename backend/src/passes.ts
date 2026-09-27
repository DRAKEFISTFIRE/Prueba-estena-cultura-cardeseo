import crypto from "node:crypto";
import { SignJWT } from "jose";
import { env } from "./config.js";

const key = new TextEncoder().encode(env.JWT_SECRET);

// Los pases dejan de ser válidos justo después de la ventana de
// consumo de las actividades (marzo-abril 2027).
const PASS_EXPIRATION_DATE = new Date("2027-05-01T00:00:00Z");

export async function issueSignedPass(input: {
  reservationId: string;
  activityId: string;
  tutorId: string;
  quantity: 2;
}) {
  const jti = crypto.randomUUID();

  // setExpirationTime necesita segundos Unix (número) o una duración
  // relativa tipo "2h" — nunca una fecha ISO en string directamente.
  const expirationSeconds = Math.floor(PASS_EXPIRATION_DATE.getTime() / 1000);

  const token = await new SignJWT({
    type: "estrena-cultura-pass",
    reservationId: input.reservationId,
    activityId: input.activityId,
    tutorId: input.tutorId,
    quantity: 2
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expirationSeconds)
    .sign(key);

  return { jti, token };
}