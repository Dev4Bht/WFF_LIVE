import { generateSignal } from "@/lib/simulator/generator";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send("connected", { ok: true });

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
        controller.close();
      });
    },
    cancel() {
      if (timeoutId) clearTimeout(timeoutId);
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
