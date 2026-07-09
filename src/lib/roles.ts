import type { RoleName } from "@/types/domain";
import { SSNIT_ROLES, TRUST_HOSPITAL_ROLES } from "@/types/domain";

export function isTrustHospitalRole(roles: RoleName[]): boolean {
  return roles.some((r) => TRUST_HOSPITAL_ROLES.includes(r));
}

export function isSsnitRole(roles: RoleName[]): boolean {
  return roles.some((r) => SSNIT_ROLES.includes(r));
}

export function isSystemAdmin(roles: RoleName[]): boolean {
  return roles.includes("System Admin");
}

export function canEditEntries(roles: RoleName[]): boolean {
  return roles.includes("Trust Hospital Admin") || roles.includes("Trust Hospital Data Entry Officer");
}

// Broader than canEditEntries: the entries_update RLS policy also allows
// System Admin to correct existing rows, though System Admin cannot create
// new ones (no entries_insert grant).
export function canModifyEntries(roles: RoleName[]): boolean {
  return canEditEntries(roles) || isSystemAdmin(roles);
}

// Narrower than canModifyEntries: fn_guard_soft_delete only allows Trust
// Hospital Admin or System Admin to flip is_deleted — a Data Entry Officer
// can edit a row's fields but cannot delete it.
export function canDeleteEntries(roles: RoleName[]): boolean {
  return roles.includes("Trust Hospital Admin") || isSystemAdmin(roles);
}

export function canReviewEntries(roles: RoleName[]): boolean {
  return roles.includes("Trust Hospital Reviewer") || roles.includes("Trust Hospital Admin");
}

export function canManageUsers(roles: RoleName[]): boolean {
  return roles.includes("System Admin");
}

export function canManageConfig(roles: RoleName[]): boolean {
  return roles.includes("System Admin");
}

export function canViewAuditLogs(roles: RoleName[]): boolean {
  return roles.includes("System Admin") || roles.includes("Trust Hospital Admin");
}
