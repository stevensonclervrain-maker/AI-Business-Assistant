const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
});

const agentInstructions = {
  manager: "You are the AI Business Assistant manager. Break the user's business task into practical steps, identify which specialist agent should help, and be honest about uncertainty.",
  social: "You are a responsible social media strategist. Analyze only the information the user provides. Create platform-appropriate content, relevant hashtags, and measurable experiments. Never promise virality or claim access to connected accounts unless data is actually provided.",
  research: "You are a careful research planner. Separate verified facts, assumptions, and questions that need sources. Never invent sources.",
  business: "You are a business analyst. Evaluate customers, value proposition, costs, risks, and low-cost ways to test an idea. Do not invent financial figures.",
  marketing: "You are a marketing strategist. Propose a target audience, message, channel, campaign, and measurable indicators.",
  finance: "You are a budgeting assistant. Show assumptions and formulas, ask for missing figures, and do not present estimates as facts.",
  content: "You are a content creator. Draft clear, original content suited to the user's platform and audience.",
  ideas: "You are a business ideas assistant. Compare ideas by demand, cost, skills, risk, and testability.",
  quality: "You are a quality reviewer. Identify unsupported claims, missing assumptions, contradictions, unclear calculations, and privacy risks."
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://stevensonclervrain-maker.github.io";

    if (origin !== allowedOrigin) {
      return json({ error: "Origin not allowed." }, 403, {});
    }

    const headers = corsHeaders(allowedOrigin);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return json({ error: "Use POST." }, 405, headers);
    }
    if (!env.OPENAI_API_KEY) {
      return json({ error: "AI backend is not configured yet." }, 503, headers);
    }

    try {
      const body = await request.json();
      const agent = String(body.agent || "manager");
      const prompt = String(body.prompt || "").trim();

      if (!agentInstructions[agent]) {
        return json({ error: "Unknown agent." }, 400, headers);
      }
      if (!prompt || prompt.length > 5000) {
        return json({ error: "Enter a prompt of 1 to 5000 characters." }, 400, headers);
      }

      const upstream = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-6-luna",
          instructions: agentInstructions[agent],
          input: prompt,
          max_output_tokens: 900
        })
      });

      const data = await upstream.json();
      if (!upstream.ok) {
        return json({ error: "The AI provider returned an error. Check the server configuration." }, 502, headers);
      }

      const answer = data.output_text || (data.output || [])
        .flatMap(item => item.content || [])
        .filter(part => part.type === "output_text")
        .map(part => part.text)
        .join("\n");

      if (!answer) {
        return json({ error: "The AI returned an empty response." }, 502, headers);
      }
      return json({ answer }, 200, headers);
    } catch (error) {
      return json({ error: "Invalid request or temporary server error." }, 400, headers);
    }
  }
};
