import { PgBoss } from "pg-boss";
import { scheduleRetention, purgeExpiredTutors } from "./jobs/retention.js";

let boss: PgBoss | null = null;

export const QUEUE_CONFIRM_RETRY = "ticketing-confirm-retry";
export const QUEUE_WEBHOOK_PROCESS = "webhook-process";
export const QUEUE_RETENTION_DAILY = "retention-daily";

type ConfirmRetryJob = {
  data: {
    reservationId: string;
  };
};

type WebhookProcessJob = {
  data: {
    provider: string;
    body: unknown;
  };
};

export async function startJobs() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no definida — necesaria para pg-boss");
  }

  boss = new PgBoss({ connectionString });

  boss.on("error", error => {
    console.error("[pg-boss]", error);
  });

  await boss.start();

  // pg-boss v9+ ya no crea las colas implícitamente al llamar work()
  // o send() — hay que crearlas explícitamente primero, o el worker
  // arranca y repite en bucle "Queue ... does not exist". createQueue
  // es idempotente: no falla si la cola ya existe.
  await boss.createQueue(QUEUE_CONFIRM_RETRY);
  await boss.createQueue(QUEUE_WEBHOOK_PROCESS);
  await boss.createQueue(QUEUE_RETENTION_DAILY);

  await boss.work(
    QUEUE_CONFIRM_RETRY,
    async (job: ConfirmRetryJob) => {
      const { reservationId } = job.data;

      const { retryConfirmReservation } =
        await import("./controllers/reservations.controller.js");

      await retryConfirmReservation(reservationId);
    }
  );

  await boss.work(
    QUEUE_WEBHOOK_PROCESS,
    async (job: WebhookProcessJob) => {
      const { provider, body } = job.data;

      console.log(`[webhook-process] provider=${provider}`, body);

      // Aquí irá la lógica real de sincronización
      // con Onebox / Koobin / Janto.
    }
  );

  await boss.work(QUEUE_RETENTION_DAILY, async () => {
    await scheduleRetention();
    await purgeExpiredTutors();
  });

  // Cron: todos los días a las 04:00. schedule() también es
  // idempotente — no duplica el cron si ya estaba registrado.
  await boss.schedule(QUEUE_RETENTION_DAILY, "0 4 * * *");

  return boss;
}

export async function enqueueConfirmRetry(
  reservationId: string,
  delaySeconds = 30
) {
  if (!boss) {
    throw new Error("Cola de trabajos no iniciada");
  }

  await boss.send(
    QUEUE_CONFIRM_RETRY,
    { reservationId },
    {
      startAfter: delaySeconds,
      retryLimit: 5,
      retryBackoff: true
    }
  );
}

export async function enqueueWebhookProcess(
  provider: string,
  body: unknown
) {
  if (!boss) {
    throw new Error("Cola de trabajos no iniciada");
  }

  await boss.send(QUEUE_WEBHOOK_PROCESS, {
    provider,
    body
  });
}