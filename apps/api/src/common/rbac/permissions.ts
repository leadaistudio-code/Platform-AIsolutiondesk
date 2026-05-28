import { Role } from '@aisolutiondesk/db';

/**
 * The permission vocabulary. A permission is "resource:action".
 * API-key scopes use these exact same strings, so keys and human roles
 * speak one language.
 */
export const PERMISSIONS = [
  'org:manage',
  'members:manage',
  'billing:manage',
  'integrations:manage',
  'apikeys:manage',
  'workflows:manage',
  'audit:read',
  // Service Desk
  'tickets:read',
  'tickets:write',
  'kb:read',
  'kb:write',
  // Employee Assistant
  'documents:read',
  'documents:write',
  'chat:use',
  // Sales
  'leads:read',
  'leads:write',
  'campaigns:read',
  'campaigns:write',
  'proposals:write',
  // Social Media
  'social:read',
  'social:write',
  'social:approve',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Which permissions each role has. Higher roles inherit everything below them.
 * This is the single source of truth the RbacGuard checks against.
 */
const VIEWER: Permission[] = [
  'tickets:read',
  'kb:read',
  'documents:read',
  'leads:read',
  'campaigns:read',
  'social:read',
  'audit:read',
];

const MEMBER: Permission[] = [...VIEWER, 'chat:use'];

const AGENT: Permission[] = [
  ...MEMBER,
  'tickets:write',
  'leads:write',
  'campaigns:write',
  'proposals:write',
  'documents:write',
  'social:write',
];

const MANAGER: Permission[] = [...AGENT, 'kb:write', 'workflows:manage', 'social:approve'];

const ADMIN: Permission[] = [
  ...MANAGER,
  'org:manage',
  'members:manage',
  'integrations:manage',
  'apikeys:manage',
];

const OWNER: Permission[] = [...ADMIN, 'billing:manage'];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  VIEWER,
  MEMBER,
  AGENT,
  MANAGER,
  ADMIN,
  OWNER,
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
