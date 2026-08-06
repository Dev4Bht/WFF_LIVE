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

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send("connected", { ok: true });

      onExternalSignal = (signal: unknown) => send("signal", signal);
      signalBroadcaster.on("signal", onExternalSignal);

      const tick = async () => {
        try {
          const signal = await generateSignal();
          if (signal) send("signal", signal);
        } catch (err) {
          console.error("Signal simulator tick failed:", err);
        }
        const jitteredDelay = 3000 + Math.random() * 5000;
        timeoutId = setTimeout(tick, jitteredDelay);
      };

      timeoutId = setTimeout(tick, 2000);

      request.signal.addEventListener("abort", () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (onExternalSignal) signalBroadcaster.off("signal", onExternalSignal);
        controller.close();
      });
    },
    cancel() {
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
