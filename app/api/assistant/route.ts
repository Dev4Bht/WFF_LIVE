import Anthropic from "@anthropic-ai/sdk";

interface AssistantContext {
  chapterCount?: number;
  activeSignalCount?: number;
  topTypes?: string[];
}

function stubAnswer(question: string, context: AssistantContext): string {
  const q = question.toLowerCase();

  if (q.includes("how many chapter")) {
    return `There are currently ${context.chapterCount ?? "several"} active WFF chapters visible on the map.`;
  }
  if (q.includes("active") && q.includes("signal")) {
    return `There are ${context.activeSignalCount ?? "a number of"} active signals right now across the network.`;
  }
  if (q.includes("trend") || q.includes("increasing")) {
    return `The most common signal types right now are: ${
      context.topTypes?.join(", ") ?? "problems and solutions"
    }. Set an ANTHROPIC_API_KEY to enable deeper trend analysis.`;
  }

  return "I can share basic stats about chapters and signals right now. Set an ANTHROPIC_API_KEY to enable full natural-language answers.";
}

export async function POST(request: Request) {
  const { question, context } = (await request.json()) as {
    question: string;
    context: AssistantContext;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ answer: stubAnswer(question, context), stubbed: true });
  }

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system:
      "You are the WFF Signal Map assistant. Answer briefly and only using the provided context about chapters and signals.",
    messages: [
      {
        role: "user",
        content: `Context:\n${JSON.stringify(context)}\n\nQuestion: ${question}`,
      },
    ],
  });

  const text = message.content.find((block) => block.type === "text");

  return Response.json({
    answer: text && "text" in text ? text.text : "",
    stubbed: false,
  });
}
