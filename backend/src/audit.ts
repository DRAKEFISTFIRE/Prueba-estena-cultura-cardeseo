import { query } from "./db.js";

export async function audit(input: {
  actorType: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await query(
    `INSERT INTO audit_log(actor_type, actor_id, action, entity_type, entity_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      input.actorType,
      input.actorId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(input.metadata ?? {})
    ]
  );
}
