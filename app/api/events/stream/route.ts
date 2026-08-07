import { generateSignal } from "@/lib/simulator/generator";
import { signalBroadcaster } from "@/lib/simulator/broadcast";

export const dynamic = "force-dynamic";
// Vercel serverless functions are killed after this many seconds regardless
// of the open connection; the browser's EventSource reconnects automatically
// when that happens, so the stream keeps working — just as periodic
// reconnects instead of one persistent connection. 60s is the max duration
// available on the Hobby plan.
export const maxDuration = 60;

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let onExternalSignal: ((signal: unknown) => void) | undefined;

  // A tick spends most of its life awaiting a database round trip, so the
  // client can disconnect *mid-tick* — at which point clearTimeout has
  // nothing pending to cancel. Without this flag the resolved tick enqueues
  // onto a closed controller ("Invalid state: Controller is already closed")
  // and, worse, reschedules itself, leaving an immortal timer writing signals
  // for a viewer who left. One leaked timer per disconnect, forever.
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (onExternalSignal) signalBroadcaster.off("signal", onExternalSignal);
      };

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // The connection dropped between the check above and the enqueue.
          cleanup();
        }
      };

      send("connected", { ok: true });

      onExternalSignal = (signal: unknown) => send("signal", signal);
      signalBroadcaster.on("signal", onExternalSignal);

      const tick = async () => {
        if (closed) return;
        try {
          const signal = await generateSignal();
          if (closed) return;
          if (signal) send("signal", signal);
        } catch (err) {
          console.error("Signal simulator tick failed:", err);
        }
        if (closed) return;
        const jitteredDelay = 3000 + Math.random() * 5000;
        timeoutId = setTimeout(tick, jitteredDelay);
      };

      timeoutId = setTimeout(tick, 2000);

      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed by the runtime
        }
      });
    },
    cancel() {
      if (closed) return;
      closed = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (onExternalSignal) signalBroadcaster.off("signal", onExternalSignal);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
