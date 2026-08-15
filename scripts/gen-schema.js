#!/usr/bin/env node
/**
 * Generates:
 *  - supabase/migrations/0001_init.sql   (tables, RLS, policies, indexes)
 *  - backend/src/entities/registry.ts    (table name + column list per entity, used by generic CRUD routes)
 *
 * Source of truth: base44_entities_src/*.jsonc (copied verbatim from the exported Base44 project's
 * base44/entities folder). These are plain JSON (despite the .jsonc extension), one JSON-Schema
 * object per file: { name, type, properties, required }.
 */
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "base44_entities_src");
const SQL_OUT = path.join(__dirname, "..", "supabase", "migrations", "0001_init.sql");
const TS_OUT = path.join(__dirname, "..", "backend", "src", "entities", "registry.ts");

// Base44 auto-manages these on every entity; we replicate them as real columns.
const BASE_COLUMNS_SQL = `
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()`;

function toSnakeCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

// Entity name -> table name. Kept singular + snake_case to mirror the entity 1:1.
// "User" is special-cased to "user_profiles" since Supabase already owns `auth.users`.
function tableNameFor(entityName) {
  if (entityName === "User") return "user_profiles";
  return toSnakeCase(entityName) + "s".replace(/ss$/, "s"); // simple pluralization
}

function pgTypeFor(prop) {
  if (!prop) return "jsonb";
  switch (prop.type) {
    case "string":
      if (prop.format === "date") return "date";
      if (prop.format === "date-time") return "timestamptz";
      return "text";
    case "number":
      return "numeric";
    case "integer":
      return "integer";
    case "boolean":
      return "boolean";
    case "array":
      return "jsonb"; // arrays of strings/objects both stored as jsonb for flexibility
    case "object":
      return "jsonb";
    default:
      return "jsonb";
  }
}

function sqlDefault(prop, pgType) {
  if (prop.default === undefined) return "";
  if (pgType === "boolean") return ` default ${prop.default ? "true" : "false"}`;
  if (pgType === "jsonb") return ` default '${JSON.stringify(prop.default)}'::jsonb`;
  if (typeof prop.default === "string") return ` default '${prop.default.replace(/'/g, "''")}'`;
  return ` default ${prop.default}`;
}

function checkConstraint(colName, prop) {
  if (prop.type === "string" && Array.isArray(prop.enum)) {
    const list = prop.enum.map((v) => `'${v}'`).join(", ");
    return `check (${colName} in (${list}))`;
  }
  return "";
}

function main() {
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith(".jsonc") || f.endsWith(".json"));
  const entities = files.map((f) => {
    const raw = fs.readFileSync(path.join(SRC_DIR, f), "utf8");
    const schema = JSON.parse(raw);
    return schema;
  });

  let sql = `-- Auto-generated from base44/entities/*.jsonc by scripts/gen-schema.js
-- Safe to hand-edit after generation; re-running the generator will overwrite this file.

create extension if not exists "pgcrypto";

`;

  const registryEntries = [];

  for (const entity of entities) {
    const table = tableNameFor(entity.name);
    const required = new Set(entity.required || []);
    const cols = [];
    const colMeta = [];

    for (const [propName, prop] of Object.entries(entity.properties || {})) {
      const col = toSnakeCase(propName);
      const pgType = pgTypeFor(prop);
      const notNull = required.has(propName) ? " not null" : "";
      const def = sqlDefault(prop, pgType);
      const check = checkConstraint(col, prop);
      cols.push(`  ${col} ${pgType}${def}${notNull}${check ? " " + check : ""}`);
      colMeta.push({ column: col, jsonProp: propName, type: pgType });
    }

    sql += `-- ${entity.name}\n`;
    sql += `create table if not exists ${table} (\n${BASE_COLUMNS_SQL},\n${cols.join(",\n")}\n);\n\n`;
    sql += `create index if not exists idx_${table}_created_by on ${table}(created_by);\n`;
    sql += `create index if not exists idx_${table}_created_date on ${table}(created_date desc);\n\n`;

    sql += `alter table ${table} enable row level security;\n`;
    sql += `drop policy if exists "${table}_select_authenticated" on ${table};\n`;
    sql += `create policy "${table}_select_authenticated" on ${table} for select using (auth.role() = 'authenticated');\n`;
    sql += `drop policy if exists "${table}_insert_own" on ${table};\n`;
    sql += `create policy "${table}_insert_own" on ${table} for insert with check (auth.uid() = created_by);\n`;
    sql += `drop policy if exists "${table}_update_own_or_admin" on ${table};\n`;
    sql += `create policy "${table}_update_own_or_admin" on ${table} for update using (\n`;
    sql += `  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')\n`;
    sql += `);\n`;
    sql += `drop policy if exists "${table}_delete_own_or_admin" on ${table};\n`;
    sql += `create policy "${table}_delete_own_or_admin" on ${table} for delete using (\n`;
    sql += `  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')\n`;
    sql += `);\n\n`;

    sql += `create or replace function set_updated_date_${table}() returns trigger as $$\n`;
    sql += `begin new.updated_date = now(); return new; end;\n$$ language plpgsql;\n`;
    sql += `drop trigger if exists trg_updated_date_${table} on ${table};\n`;
    sql += `create trigger trg_updated_date_${table} before update on ${table} for each row execute function set_updated_date_${table}();\n\n`;

    registryEntries.push({ name: entity.name, table, columns: colMeta });
  }

  // user_profiles is keyed 1:1 to auth.users, so its id column should reference auth.users(id),
  // not have its own default. Patch that in generated SQL for the User entity specifically.
  sql = sql.replace(
    /create table if not exists user_profiles \(\n  id uuid primary key default gen_random_uuid\(\),/,
    "create table if not exists user_profiles (\n  id uuid primary key references auth.users(id) on delete cascade,"
  );

  fs.mkdirSync(path.dirname(SQL_OUT), { recursive: true });
  fs.writeFileSync(SQL_OUT, sql);
  console.log(`Wrote ${SQL_OUT}`);

  // ---- TS registry for backend generic CRUD ----
  let ts = `// AUTO-GENERATED by scripts/gen-schema.js. Do not hand-edit; re-run the generator instead.
export interface EntityColumn {
  column: string;
  jsonProp: string;
  type: string;
}

export interface EntityDef {
  name: string;
  table: string;
  columns: EntityColumn[];
}

export const ENTITY_REGISTRY: Record<string, EntityDef> = {
`;
  for (const e of registryEntries) {
    ts += `  ${e.name}: ${JSON.stringify(e, null, 2)},\n`;
  }
  ts += `};\n`;

  fs.mkdirSync(path.dirname(TS_OUT), { recursive: true });
  fs.writeFileSync(TS_OUT, ts);
  console.log(`Wrote ${TS_OUT}`);
}

main();
