import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { supabaseAdmin } from "./config/supabase";
import { ENTITY_REGISTRY } from "./entities/registry";

/**
 * Base44's `.subscribe(callback)` on an entity gave you live updates. To keep that
 * working without the frontend ever importing @supabase/supabase-js, Express keeps
 * ONE server-side Supabase Realtime subscription per watched table (below) and
 * re-broadcasts changes to Socket.IO clients that joined that table's room. The
 * frontend shim (base44Client.js) just does `socket.on('change:<table>', cb)`.
 */
const WATCHED_TABLES = [
  "artist_bookings",
  "availability_slots",
  "events",
  "notifications",
  "releases",
  "royalty_statements",
  "ticket_purchases",
];

// entity name (e.g. "Release") -> table name (e.g. "releases"), for the client's
// convenience so it can subscribe by entity name exactly like it used to.
const TABLE_TO_ENTITY: Record<string, string> = Object.fromEntries(
  Object.values(ENTITY_REGISTRY).map((e) => [e.table, e.name])
);

export function attachRealtime(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000", credentials: true },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return next(new Error("Invalid or expired token"));
    (socket as any).userId = data.user.id;
    next();
  });

  io.on("connection", (socket) => {
    socket.on("subscribe", (table: string) => {
      if (WATCHED_TABLES.includes(table)) socket.join(table);
    });
    socket.on("unsubscribe", (table: string) => {
      socket.leave(table);
    });
  });

  // One Realtime channel per watched table, fanned out to whichever sockets joined that room.
  for (const table of WATCHED_TABLES) {
    supabaseAdmin
      .channel(`server-${table}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table }, (payload) =>
        io.to(table).emit(`change:${TABLE_TO_ENTITY[table] || table}`, { type: "create", data: payload.new })
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table }, (payload) =>
        io.to(table).emit(`change:${TABLE_TO_ENTITY[table] || table}`, { type: "update", data: payload.new })
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table }, (payload) =>
        io.to(table).emit(`change:${TABLE_TO_ENTITY[table] || table}`, { type: "delete", data: payload.old })
      )
      .subscribe();
  }

  return io;
}
