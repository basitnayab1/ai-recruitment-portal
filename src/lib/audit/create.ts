import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditAction, AuditActorRole, AuditEntityType, AuditLogMetadata } from "@/lib/audit/types";

export type CreateAuditLogInput = {
  actorId: string;
  actorRole: AuditActorRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  description: string;
  metadata?: AuditLogMetadata;
};

/**
 * Inserts an audit log row via the service-role client.
 * Never throws — failures are logged only so Server Actions keep working.
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  const description = input.description.trim();
  if (!input.actorId || !description) {
    return;
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: input.actorId,
      actor_role: input.actorRole,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      description,
      metadata: input.metadata ?? {},
    });

    if (error) {
      console.error("[audit] Failed to create audit log:", error.message, {
        action: input.action,
        entityType: input.entityType,
      });
    }
  } catch (error) {
    console.error("[audit] Failed to create audit log.", {
      error: error instanceof Error ? error.message : String(error),
      action: input.action,
    });
  }
}
