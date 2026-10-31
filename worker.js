const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
});

const agentInstructions = {
  manager: "You are the AI Business Assistant manager. Break the user's business task into practical steps, identify the specialist agents needed, and be honest about uncertainty.",
  social: "You are a responsible social media strategist. Analyze only information provided. Create platform-appropriate content, relevant hashtags and measurable experiments. Never promise virality or claim access to accounts.",
  research: "You are a careful research planner. Separate known facts, assumptions and questions needing sources. Never invent sources or pretend to browse.",
  business: "You are a business analyst. Evaluate customers, value proposition, costs, risks and low-cost tests. Do not invent financial figures.",
  marketing: "You are a marketing strategist. Propose target audience, message, channels, campaign and measurable indicators.",
  finance: "You are a budgeting assistant. Show assumptions and formulas, ask for missing figures, and do not present estimates as facts.",
  content: "You are an original content creator. Draft clear content suited to the platform and audience.",
  ideas: "You are a business ideas assistant. Compare ideas by demand, cost, skills, risk and testability.",
  quality: "You are a quality reviewer. Identify unsupported claims, missing assumptions, contradictions, unclear calculations and privacy risks.",
  sales: "You are a responsible sales strategist. Design ethical customer journeys, helpful follow-ups and clear offers. Never use deception or pressure.",
  automation: "You are a workflow automation designer. Map triggers, actions, approvals, permissions and failure handling. Never claim an integration exists until configured."
};

const MODEL = "@cf/meta/llama-3.1-8b-instruct";

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

async function askModel(env, system, prompt) {
  const result = await env.AI.run(MODEL, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ],
    max_tokens: 900
  });
  const answer = result.response || result.result?.response || "";
  if (!answer) throw new Error("Empty AI response");
  return answer;
}

async function runTeam(env, prompt) {
  const tasks = [
    ["research", "Identify the market questions, customer evidence needed, competitors to investigate, and assumptions. Do not invent current facts."],
    ["business", "Assess the business model, customer problem, value proposition, costs to estimate, risks and a small validation test."],
    ["marketing", "Create a practical target audience, positioning, channels, campaign and metrics."],
    ["finance", "List the budget inputs and formulas needed. Do not invent amounts or promise profits."]
  ];
  const results = await Promise.all(tasks.map(async ([agent, task]) => ({
    agent,
    answer: await askModel(env, agentInstructions[agent], task + "\n\nUser objective: " + prompt)
  })));
  const joined = results.map(x => "## " + x.agent.toUpperCase() + "\n" + x.answer).join("\n\n");
  const reviewed = await askModel(env, agentInstructions.quality,
    "Review this multi-agent work. Point out unsupported claims, missing information, contradictions and practical corrections. Then give a concise integrated action plan. Do not invent facts.\n\n" + joined);
  return { answer: "RAPPORT DE L'ÉQUIPE AI BUSINESS ASSISTANT\n\n" + joined + "\n\n## CONTRÔLE QUALITÉ ET SYNTHÈSE\n" + reviewed };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://stevensonclervrain-maker.github.io";
    if (request.method === "OPTIONS") {
      if (origin !== allowedOrigin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
    }
    if (origin !== allowedOrigin) return json({ error: "Origin not allowed." }, 403, {});
    const headers = corsHeaders(allowedOrigin);
    if (request.method !== "POST") return json({ error: "Use POST." }, 405, headers);
    if (!env.AI) return json({ error: "Cloudflare Workers AI binding is missing. Add the AI binding named AI in Worker settings, then redeploy." }, 503, headers);

    try {
      const body = await request.json();
      const agent = String(body.agent || "manager");
      const prompt = String(body.prompt || "").trim();
      if (agent !== "team" && !agentInstructions[agent]) return json({ error: "Unknown agent." }, 400, headers);
      if (!prompt || prompt.length > 5000) return json({ error: "Enter a prompt of 1 to 5000 characters." }, 400, headers);
      const result = agent === "team"
        ? await runTeam(env, prompt)
        : { answer: await askModel(env, agentInstructions[agent], prompt) };
      return json(result, 200, headers);
    } catch (error) {
      return json({ error: "Workers AI request failed. Check the AI binding, model availability and account limits." }, 502, headers);
    }
  }
};
