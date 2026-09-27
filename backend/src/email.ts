import { Resend } from "resend";
import { env } from "./config.js";

const resend = new Resend(env.RESEND_API_KEY);

async function sendEmail(
  to: string,
  subject: string,
  text: string
): Promise<void> {
  const { data, error } = await resend.emails.send({
    from: env.RESEND_FROM,
    to: [to],
    subject,
    text
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(`No se pudo enviar el email: ${error.message}`);
  }

  console.log("Email enviado con Resend:", data?.id);
}

export async function sendRegistrationCodeEmail(
  to: string,
  code: string
): Promise<void> {
  await sendEmail(
    to,
    "Estrena Cultura — código de activación",
    [
      "Tu código personal de Estrena Cultura es:",
      "",
      code,
      "",
      "No compartas este código. Si has recibido una reemisión, el código anterior queda anulado."
    ].join("\n")
  );
}

export async function sendPassEmail(
  to: string,
  activityTitle: string,
  passToken: string
): Promise<void> {
  await sendEmail(
    to,
    `Estrena Cultura — entrada para ${activityTitle}`,
    [
      `Tu reserva para ${activityTitle} está confirmada.`,
      "",
      `Pase firmado: ${passToken}`,
      "",
      "Presenta este pase según las instrucciones del recinto."
    ].join("\n")
  );
}