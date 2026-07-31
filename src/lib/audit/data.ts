import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  AUDIT_LOG_PAGE_SIZE,
  isAuditAction,
  type AuditAction,
  type AuditActorRole,
  type AuditEntityType,
  type AuditLogFilterOptions,
  type AuditLogFilters,
  type AuditLogItem,
  type AuditLogMetadata,
  type AuditLogsPage,
} from "@/lib/audit/types";

type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: AuditLogMetadata | null;
  created_at: string;
};

function isAuditActorRole(value: string): value is AuditActorRole {
  return value === "candidate" || value === "hr" || value === "admin";
}

function isAuditEntityType(value: string): value is AuditEntityType {
  return value === "job" || value === "application" || value === "interview" || value === "application_note";
}

function mapAuditLogRow(row: AuditLogRow): AuditLogItem | null {
  if (!isAuditAction(row.action) || !isAuditActorRole(row.actor_role) || !isAuditEntityType(row.entity_type)) {
    return null;
  }

  return {
    id: row.id,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    description: row.description,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function sanitizeSearchTerm(value: string): string {
  return value.replace(/[,()]/g, " ").trim();
}

export async function getAuditLogFilterOptions(): Promise<AuditLogFilterOptions> {
  const supabase = await createClient();

  const [hrResult, jobsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["hr", "admin"])
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase.from("jobs").select("id, title").order("title", { ascending: true }),
  ]);

  if (hrResult.error) {
    console.error("[audit/data] Failed to load HR filter options:", hrResult.error.message);
  }
  if (jobsResult.error) {
    console.error("[audit/data] Failed to load job filter options:", jobsResult.error.message);
  }

  return {
    hrUsers: ((hrResult.data ?? []) as { id: string; full_name: string }[]).map((row) => ({
      id: row.id,
      name: row.full_name,
    })),
    jobs: ((jobsResult.data ?? []) as { id: string; title: string }[]).map((row) => ({
      id: row.id,
      title: row.title,
    })),
  };
}

export async function getAuditLogsPage(filters: AuditLogFilters): Promise<AuditLogsPage> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page);
  const from = (page - 1) * AUDIT_LOG_PAGE_SIZE;
  const to = from + AUDIT_LOG_PAGE_SIZE - 1;

  let query = supabase
    .from("audit_logs")
    .select(
      "id, actor_id, actor_role, action, entity_type, entity_id, description, metadata, created_at",
      { count: "exact" }
    );

  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
  }
  if (filters.action) {
    query = query.eq("action", filters.action);
  }
  if (filters.hrId) {
    query = query.eq("actor_id", filters.hrId);
  }
  if (filters.jobId) {
    query = query.eq("metadata->>jobId", filters.jobId);
  }

  const candidateQ = filters.candidateQ ? sanitizeSearchTerm(filters.candidateQ) : "";
  if (candidateQ) {
    query = query.ilike("metadata->>candidateName", `%${candidateQ}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[audit/data] Failed to load audit logs:", error.message);
    return { logs: [], total: 0, page, pageSize: AUDIT_LOG_PAGE_SIZE };
  }

  const logs = ((data ?? []) as AuditLogRow[])
    .map(mapAuditLogRow)
    .filter((row): row is AuditLogItem => row !== null);

  return {
    logs,
    total: count ?? logs.length,
    page,
    pageSize: AUDIT_LOG_PAGE_SIZE,
  };
}
