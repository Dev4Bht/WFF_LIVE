import { EventEmitter } from "node:events";

// Module-level singleton (survives dev hot-reload via globalThis, same
// pattern as lib/prisma.ts) so every open SSE connection within this
// process can be notified the instant a user submits a real signal, not
// just the simulator's own per-connection timer.
const globalForBroadcast = globalThis as unknown as {
  signalBroadcaster: EventEmitter | undefined;
};

export const signalBroadcaster =
  globalForBroadcast.signalBroadcaster ?? new EventEmitter();
signalBroadcaster.setMaxListeners(0);
globalForBroadcast.signalBroadcaster = signalBroadcaster;

// Accepts the raw Prisma row (Date objects, not the client-side Signal
// type's ISO strings) — this is transport-only, downstream JSON.stringify
// in the SSE route serializes dates correctly regardless.
export function broadcastSignal(signal: object) {
  signalBroadcaster.emit("signal", signal);
}
