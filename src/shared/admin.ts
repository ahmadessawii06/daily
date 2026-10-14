export const ROLES = ['user', 'support', 'admin', 'super_admin'] as const;
export type Role = typeof ROLES[number];
export type Permission = 'users.read' | 'users.write' | 'users.suspend' | 'users.sessions' | 'users.reset' | 'users.delete' | 'users.restore' | 'roles.write' | 'users.impersonate' | 'audit.read';
const permissions: Record<Role, readonly Permission[]> = {
  user: [], support: ['users.read', 'users.impersonate'],
  admin: ['users.read', 'users.write', 'users.suspend', 'users.sessions', 'users.reset', 'users.delete', 'users.restore', 'users.impersonate', 'audit.read'],
  super_admin: ['users.read', 'users.write', 'users.suspend', 'users.sessions', 'users.reset', 'users.delete', 'users.restore', 'roles.write', 'users.impersonate', 'audit.read'],
};
export const rolePermissions = (role?: Role): readonly Permission[] => permissions[role || 'user'] || [];
export const hasPermission = (role: Role | undefined, permission: Permission) => rolePermissions(role).includes(permission);
export interface AuditEntry { id: string; actorId: string; actorName: string; action: string; targetId: string; at: string; reason: string; }
export interface SupportGrant { id: string; actorId: string; targetId: string; actorVersion: number; targetVersion: number; actorSessionId?: string; expiresAt: string; endedAt?: string; }
export interface AuthSession { id: string; createdAt: string; expiresAt: string; revokedAt?: string; }
export interface AdminUser { id: string; userCode: string; username: string; name?: string; email?: string; role: Role; status: 'active' | 'suspended' | 'deleted'; createdAt?: string; lastLoginAt?: string; deletedAt?: string | null; }
