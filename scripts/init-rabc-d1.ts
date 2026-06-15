/**
 * RBAC D1 seed SQL generator
 *
 * Generates `.wrangler/seed-rbac.sql` from the default RBAC definitions
 * Then apply to a remote Cloudflare D1 database with:
 *
 *   npx wrangler d1 execute DB --remote --file=.wrangler/seed-rbac.sql
 *
 * Usage:
 *   pnpm rbac:init:d1 --admin-email=admin@example.com --admin-password=your-password
 */

import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { hashPassword } from 'better-auth/crypto';

const defaultPermissions = [
  { code: 'admin.access', resource: 'admin', action: 'access', title: 'Admin Access', description: 'Access to admin area' },
  { code: 'admin.users.read', resource: 'users', action: 'read', title: 'Read Users', description: 'View user list and details' },
  { code: 'admin.users.write', resource: 'users', action: 'write', title: 'Write Users', description: 'Create and update users' },
  { code: 'admin.users.delete', resource: 'users', action: 'delete', title: 'Delete Users', description: 'Delete users' },
  { code: 'admin.posts.read', resource: 'posts', action: 'read', title: 'Read Posts', description: 'View post list and details' },
  { code: 'admin.posts.write', resource: 'posts', action: 'write', title: 'Write Posts', description: 'Create and update posts' },
  { code: 'admin.posts.delete', resource: 'posts', action: 'delete', title: 'Delete Posts', description: 'Delete posts' },
  { code: 'admin.categories.read', resource: 'categories', action: 'read', title: 'Read Categories', description: 'View category list and details' },
  { code: 'admin.categories.write', resource: 'categories', action: 'write', title: 'Write Categories', description: 'Create and update categories' },
  { code: 'admin.categories.delete', resource: 'categories', action: 'delete', title: 'Delete Categories', description: 'Delete categories' },
  { code: 'admin.payments.read', resource: 'payments', action: 'read', title: 'Read Payments', description: 'View payment list and details' },
  { code: 'admin.subscriptions.read', resource: 'subscriptions', action: 'read', title: 'Read Subscriptions', description: 'View subscription list and details' },
  { code: 'admin.credits.read', resource: 'credits', action: 'read', title: 'Read Credits', description: 'View credit list and details' },
  { code: 'admin.credits.write', resource: 'credits', action: 'write', title: 'Write Credits', description: 'Grant or consume credits' },
  { code: 'admin.apikeys.read', resource: 'apikeys', action: 'read', title: 'Read API Keys', description: 'View API key list and details' },
  { code: 'admin.apikeys.write', resource: 'apikeys', action: 'write', title: 'Write API Keys', description: 'Create and update API keys' },
  { code: 'admin.apikeys.delete', resource: 'apikeys', action: 'delete', title: 'Delete API Keys', description: 'Delete API keys' },
  { code: 'admin.settings.read', resource: 'settings', action: 'read', title: 'Read Settings', description: 'View system settings' },
  { code: 'admin.settings.write', resource: 'settings', action: 'write', title: 'Write Settings', description: 'Update system settings' },
  { code: 'admin.roles.read', resource: 'roles', action: 'read', title: 'Read Roles', description: 'View roles and permissions' },
  { code: 'admin.roles.write', resource: 'roles', action: 'write', title: 'Write Roles', description: 'Create and update roles' },
  { code: 'admin.roles.delete', resource: 'roles', action: 'delete', title: 'Delete Roles', description: 'Delete roles' },
  { code: 'admin.permissions.read', resource: 'permissions', action: 'read', title: 'Read Permissions', description: 'View permission list and details' },
  { code: 'admin.permissions.write', resource: 'permissions', action: 'write', title: 'Write Permissions', description: 'Create and update permissions' },
  { code: 'admin.permissions.delete', resource: 'permissions', action: 'delete', title: 'Delete Permissions', description: 'Delete permissions' },
  { code: 'admin.ai-tasks.read', resource: 'ai-tasks', action: 'read', title: 'Read AI Tasks', description: 'View AI task list and details' },
  { code: 'admin.ai-tasks.write', resource: 'ai-tasks', action: 'write', title: 'Write AI Tasks', description: 'Create and update AI tasks' },
  { code: 'admin.ai-tasks.delete', resource: 'ai-tasks', action: 'delete', title: 'Delete AI Tasks', description: 'Delete AI tasks' },
  { code: '*', resource: 'all', action: 'all', title: 'Super Admin', description: 'All permissions (super admin only)' },
] as const;

const defaultRoles = [
  {
    name: 'super_admin',
    title: 'Super Admin',
    description: 'Full system access with all permissions',
    status: 'active',
    sort: 1,
    permissions: ['*'],
  },
  {
    name: 'admin',
    title: 'Admin',
    description: 'Administrator with most permissions',
    status: 'active',
    sort: 2,
    permissions: [
      'admin.access',
      'admin.users.*',
      'admin.posts.*',
      'admin.categories.*',
      'admin.payments.*',
      'admin.subscriptions.*',
      'admin.credits.*',
      'admin.apikeys.*',
      'admin.settings.read',
      'admin.ai-tasks.*',
    ],
  },
  {
    name: 'editor',
    title: 'Editor',
    description: 'Content editor with limited permissions',
    status: 'active',
    sort: 3,
    permissions: [
      'admin.access',
      'admin.posts.read',
      'admin.posts.write',
      'admin.categories.read',
      'admin.categories.write',
    ],
  },
  {
    name: 'viewer',
    title: 'Viewer',
    description: 'Read-only access to admin area',
    status: 'active',
    sort: 4,
    permissions: [
      'admin.access',
      'admin.users.read',
      'admin.posts.read',
      'admin.categories.read',
      'admin.payments.read',
      'admin.subscriptions.read',
      'admin.credits.read',
    ],
  },
] as const;

function sqlString(value: string | null | undefined) {
  if (value == null) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    adminEmail: args.find((arg) => arg.startsWith('--admin-email='))?.split('=')[1],
    adminPassword: args.find((arg) => arg.startsWith('--admin-password='))?.split('=')[1],
    outFile: args.find((arg) => arg.startsWith('--out='))?.split('=')[1] ?? '.wrangler/seed-rbac.sql',
  };
}

function resolvePermissionCodes(patterns: readonly string[]) {
  const permissionCodes = new Set<string>();

  for (const pattern of patterns) {
    if (pattern === '*') {
      permissionCodes.add('*');
      continue;
    }

    if (pattern.endsWith('.*')) {
      const prefix = `${pattern.slice(0, -2)}.`;
      for (const permission of defaultPermissions) {
        if (permission.code.startsWith(prefix)) {
          permissionCodes.add(permission.code);
        }
      }
      continue;
    }

    const exact = defaultPermissions.find((permission) => permission.code === pattern);
    if (exact) {
      permissionCodes.add(exact.code);
    } else {
      console.warn(`Skipping unresolved permission pattern: ${pattern}`);
    }
  }

  return [...permissionCodes];
}

function buildPermissionSql() {
  return defaultPermissions.map((permission) => [
    `-- permission: ${permission.code}`,
    'INSERT INTO permission (id, code, resource, action, title, description)',
    `SELECT ${sqlString(randomUUID())}, ${sqlString(permission.code)}, ${sqlString(permission.resource)}, ${sqlString(permission.action)}, ${sqlString(permission.title)}, ${sqlString(permission.description)}`,
    `WHERE NOT EXISTS (SELECT 1 FROM permission WHERE code = ${sqlString(permission.code)});`,
    '',
  ].join('\n')).join('\n');
}

function buildRoleSql() {
  return defaultRoles.map((role) => [
    `-- role: ${role.name}`,
    'INSERT INTO role (id, name, title, description, status, sort)',
    `SELECT ${sqlString(randomUUID())}, ${sqlString(role.name)}, ${sqlString(role.title)}, ${sqlString(role.description)}, ${sqlString(role.status)}, ${role.sort}`,
    `WHERE NOT EXISTS (SELECT 1 FROM role WHERE name = ${sqlString(role.name)});`,
    '',
    `DELETE FROM role_permission WHERE role_id = (SELECT id FROM role WHERE name = ${sqlString(role.name)});`,
    '',
    ...resolvePermissionCodes(role.permissions).map((permissionCode) => [
      'INSERT INTO role_permission (id, role_id, permission_id)',
      `SELECT ${sqlString(randomUUID())},`,
      `  (SELECT id FROM role WHERE name = ${sqlString(role.name)}),`,
      `  (SELECT id FROM permission WHERE code = ${sqlString(permissionCode)})`,
      `WHERE EXISTS (SELECT 1 FROM role WHERE name = ${sqlString(role.name)})`,
      `  AND EXISTS (SELECT 1 FROM permission WHERE code = ${sqlString(permissionCode)});`,
      '',
    ].join('\n')),
  ].join('\n')).join('\n');
}

function buildAdminSql(adminEmail: string, passwordHash: string | null) {
  const lines = [
    `-- admin bootstrap: ${adminEmail}`,
  ];

  if (passwordHash) {
    const userId = randomUUID();
    const accountId = randomUUID();

    lines.push(
      'INSERT INTO user (id, name, email, email_verified)',
      `SELECT ${sqlString(userId)}, 'Admin', ${sqlString(adminEmail)}, 1`,
      `WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = ${sqlString(adminEmail)});`,
      '',
      'INSERT INTO account (id, account_id, provider_id, user_id, password)',
      `SELECT ${sqlString(accountId)}, u.id, 'credential', u.id, ${sqlString(passwordHash)}`,
      `FROM user u`,
      `WHERE u.email = ${sqlString(adminEmail)}`,
      `  AND NOT EXISTS (`,
      '    SELECT 1 FROM account a',
      "    WHERE a.provider_id = 'credential'",
      '      AND a.user_id = u.id',
      '  );',
      ''
    );
  } else {
    lines.push(
      `-- user creation skipped because --admin-password was not provided`,
      ''
    );
  }

  lines.push(
    'INSERT INTO user_role (id, user_id, role_id)',
    `SELECT ${sqlString(randomUUID())}, u.id, r.id`,
    'FROM user u',
    'JOIN role r ON r.name = \'super_admin\'',
    `WHERE u.email = ${sqlString(adminEmail)}`,
    '  AND NOT EXISTS (',
    '    SELECT 1 FROM user_role ur',
    '    WHERE ur.user_id = u.id',
    '      AND ur.role_id = r.id',
    '  );',
    ''
  );

  return lines.join('\n');
}

async function main() {
  const { adminEmail, adminPassword, outFile } = parseArgs();

  if (!adminPassword) {
    console.error('Error: --admin-password is required.');
    process.exit(1);
  }
  const outputPath = resolve(process.cwd(), outFile);
  const passwordHash = adminPassword ? await hashPassword(adminPassword) : null;

  const sql = [
    '-- Generated by scripts/init-rabc-d1.ts',
    '-- Apply with: npx wrangler d1 execute DB --remote --file=.wrangler/seed-rbac.sql',
    'PRAGMA foreign_keys = ON;',
    '',
    buildPermissionSql(),
    buildRoleSql(),
    adminEmail ? buildAdminSql(adminEmail, passwordHash) : '-- admin bootstrap skipped',
    '',
  ].join('\n');

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, sql, 'utf8');

  console.log(`Generated ${outputPath}`);
  console.log('');
  executeSeed(outFile);
}

function executeSeed(seedFileArg: string) {
  const command = `npx wrangler d1 execute DB --remote --file=${seedFileArg}`;

  console.log(`▶️  Executing: ${command}`);

  execSync(command, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
