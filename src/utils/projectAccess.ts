import db from "@/utils/db";

export async function getProjectForAccount(accountId: number, projectId: number) {
  return db("t_project").where({ id: projectId, accountId }).first();
}

export function buildAccountPath(accountId: number, relativePath: string) {
  const normalized = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const prefix = `/${accountId}`;
  if (normalized.startsWith(`${prefix}/`)) return normalized;
  return `${prefix}${normalized}`;
}
