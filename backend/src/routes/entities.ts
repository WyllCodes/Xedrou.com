import { Router } from "express";
import { supabaseAdmin } from "../config/supabase";
import { ENTITY_REGISTRY } from "../entities/registry";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

function resolveEntity(name: string) {
  return ENTITY_REGISTRY[name];
}

/** Base44's `.list(sort, limit)` / `.filter(query, sort, limit)` both funnel through here. */
function applySort(query: any, sort?: string) {
  if (!sort) return query;
  const desc = sort.startsWith("-");
  const column = desc ? sort.slice(1) : sort;
  return query.order(column, { ascending: !desc });
}

// GET /api/entities/:entity  ?filter={"field":"value"}&sort=-created_date&limit=50
router.get("/:entity", requireAuth, async (req: AuthedRequest, res) => {
  const entity = resolveEntity(req.params.entity);
  if (!entity) return res.status(404).json({ error: `Unknown entity: ${req.params.entity}` });

  let query = supabaseAdmin.from(entity.table).select("*");

  if (typeof req.query.filter === "string" && req.query.filter.length > 0) {
    try {
      const filter = JSON.parse(req.query.filter as string);
      for (const [key, value] of Object.entries(filter)) {
        query = query.eq(key, value as any);
      }
    } catch {
      return res.status(400).json({ error: "filter must be valid JSON" });
    }
  }

  query = applySort(query, req.query.sort as string | undefined);

  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/entities/:entity/:id
router.get("/:entity/:id", requireAuth, async (req: AuthedRequest, res) => {
  const entity = resolveEntity(req.params.entity);
  if (!entity) return res.status(404).json({ error: `Unknown entity: ${req.params.entity}` });

  const { data, error } = await supabaseAdmin.from(entity.table).select("*").eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Not found" });
  res.json(data);
});

// POST /api/entities/:entity
router.post("/:entity", requireAuth, async (req: AuthedRequest, res) => {
  const entity = resolveEntity(req.params.entity);
  if (!entity) return res.status(404).json({ error: `Unknown entity: ${req.params.entity}` });

  const payload = { ...req.body, created_by: req.user!.id };
  const { data, error } = await supabaseAdmin.from(entity.table).insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/entities/:entity/:id
router.put("/:entity/:id", requireAuth, async (req: AuthedRequest, res) => {
  const entity = resolveEntity(req.params.entity);
  if (!entity) return res.status(404).json({ error: `Unknown entity: ${req.params.entity}` });

  const ok = await canMutate(entity.table, req.params.id, req.user!);
  if (!ok) return res.status(403).json({ error: "Not allowed to modify this record" });

  const { data, error } = await supabaseAdmin
    .from(entity.table)
    .update(req.body)
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/entities/:entity/bulk-update   body: [{ id, ...fields, $inc?: { field: number } }]
router.post("/:entity/bulk-update", requireAuth, async (req: AuthedRequest, res) => {
  const entity = resolveEntity(req.params.entity);
  if (!entity) return res.status(404).json({ error: `Unknown entity: ${req.params.entity}` });
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "Body must be an array of {id, ...fields}" });

  const results = [];
  for (const item of req.body) {
    const { id, $inc, ...fields } = item;
    if (!id) continue;

    const ok = await canMutate(entity.table, id, req.user!);
    if (!ok) continue;

    if ($inc && typeof $inc === "object") {
      const { data: current } = await supabaseAdmin.from(entity.table).select("*").eq("id", id).maybeSingle();
      for (const [field, amount] of Object.entries($inc)) {
        fields[field] = (Number(current?.[field]) || 0) + Number(amount);
      }
    }

    const { data, error } = await supabaseAdmin.from(entity.table).update(fields).eq("id", id).select().maybeSingle();
    if (!error) results.push(data);
  }
  res.json(results);
});

// DELETE /api/entities/:entity/:id
router.delete("/:entity/:id", requireAuth, async (req: AuthedRequest, res) => {
  const entity = resolveEntity(req.params.entity);
  if (!entity) return res.status(404).json({ error: `Unknown entity: ${req.params.entity}` });

  const ok = await canMutate(entity.table, req.params.id, req.user!);
  if (!ok) return res.status(403).json({ error: "Not allowed to delete this record" });

  const { error } = await supabaseAdmin.from(entity.table).delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

/** Mirrors the RLS policy in SQL: owner or admin may update/delete. */
async function canMutate(table: string, id: string, user: { id: string; role?: string }): Promise<boolean> {
  if (user.role === "admin") return true;
  const { data } = await supabaseAdmin.from(table).select("created_by").eq("id", id).maybeSingle();
  return !!data && data.created_by === user.id;
}

export default router;
