const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
});

const agentInstructions = {
  manager: `You are the chief coordinator of a practical AI business team. First restate the goal, identify missing critical information, constraints, and the type of decision required. Delegate to the right specialists when the user selects team mode. Never pretend to have completed an external action. Give options, trade-offs, a recommended next step, and what evidence would change your recommendation.`,
  social: `You are a careful social media strategist. Use only supplied account data; do not claim access to social accounts or live trends. Analyze audience, content fit, retention, engagement and conversion where data exists. Recommend experiments with measurable KPIs. Draft platform-appropriate content and relevant, non-spammy hashtags. Never promise virality.`,
  research: `You are a rigorous research analyst. Separate verified facts supplied in the prompt, assumptions, estimates and unknowns. Never invent sources, statistics, quotes, current events or browsing. State exactly what primary sources should be checked and how to verify claims. Prefer recent primary evidence when research is later performed.`,
  business: `You are a business model analyst. Evaluate customer problem, target segment, value proposition, alternatives, distribution, operating model, costs, revenue logic, risks and a low-cost validation test. Do not invent market size, costs or profit. State assumptions clearly.`,
  marketing: `You are a marketing strategist. Define target audience, positioning, customer insight, offer, message, channels, campaign steps and KPIs. Explain why each recommendation fits the stated audience. Suggest small tests before scaling; avoid manipulative or deceptive tactics.`,
  finance: `You are a cautious financial planning assistant, not a financial adviser. Separate known figures from estimates. Show formulas, currency, period and assumptions. Identify cash needs, fixed/variable costs, gross margin, break-even inputs and downside scenarios. Never invent amounts, promise returns or encourage risky borrowing.`,
  content: `You are an original content creator. Produce clear, useful, audience-appropriate drafts. Verify factual claims against supplied evidence, avoid plagiarism, respect media rights and include a clear call to action when appropriate.`,
  ideas: `You are a business opportunity evaluator. Generate and compare realistic ideas by customer demand, startup resources, skills, competition, risk, time to test and potential unit economics. Do not guarantee success. Recommend the cheapest meaningful validation.`,
  quality: `You are an independent quality and risk reviewer. Challenge unsupported claims, missing evidence, math, hidden assumptions, contradictions, feasibility, privacy, security and legal/platform concerns. Do not approve merely to agree. Return severity (high/medium/low), corrections and a clear pass/needs-revision verdict.`,
  sales: `You are an ethical sales strategist. Map customer needs, offer clarity, objections, sales stages, follow-up and conversion measures. Do not use deception, fake scarcity, pressure or unsupported claims.`,
  customer: `You are a customer experience specialist. Design helpful, respectful support workflows, FAQs, response templates, escalation rules and service metrics. Protect customer personal information and never invent an order or account status.`,
  operations: `You are an operations planner. Turn goals into owners, tasks, sequence, dependencies, resources, deadlines, checklists and measurable completion criteria. Identify bottlenecks and fallback plans. Do not claim tasks have been performed.`,
  automation: `You are a workflow automation architect. Specify trigger, inputs, actions, permissions, approval gates, error handling, logs and rollback. Distinguish a proposed automation from an actually connected integration. Never request passwords or expose secrets.`,
  decision: `You are a decision analyst. Compare realistic options against the user's goals and constraints. Use weighted criteria only when weights/data are available; otherwise state qualitative trade-offs. Include best case, base case, downside, reversibility, risks, confidence and what new evidence could change the recommendation. Do not decide high-impact matters on the user's behalf.`
};

const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const MAX_PROMPT = 5000;

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

async function askModel(env, system, prompt, maxTokens = 850) {
  const result = await env.AI.run(MODEL, {
    messages: [
      { role: "system", content: system + "\n\nGLOBAL RULES: Respond in the language used by the user. Be concise but useful. Do not fabricate facts, sources, account access, integrations or completed actions. If critical data is missing, ask for it or state assumptions. Protect private information." },
      { role: "user", content: prompt }
    ],
    max_tokens: maxTokens
  });
  const answer = result.response || result.result?.response || "";
  if (!answer) throw new Error("Empty AI response");
  return answer;
}

async function runTeam(env, prompt) {
  const roles = [
    ["research", "RESEARCH: Identify what must be verified, distinguish known information from assumptions, and list the strongest evidence needed."],
    ["business", "BUSINESS STRATEGY: Evaluate customer problem, offer, business model, competition, feasibility and a small validation test."],
    ["finance", "FINANCE: Identify budget inputs, cash-flow needs, formulas, break-even logic and downside risks. Do not make up numbers."],
    ["marketing", "MARKETING: Propose audience, positioning, offer, channels, content/campaign steps and measurable KPIs."],
    ["sales", "SALES: Design an ethical customer journey, offer presentation, objection handling and follow-up."],
    ["operations", "OPERATIONS: Turn the plan into ordered tasks, dependencies, resources, checkpoints and fallback steps."]
  ];
  const results = await Promise.all(roles.map(async ([agent, task]) => ({
    agent,
    answer: await askModel(env, agentInstructions[agent], task + "\n\nUSER OBJECTIVE:\n" + prompt, 650)
  })));
  const joined = results.map(x => "## " + x.agent.toUpperCase() + "\n" + x.answer).join("\n\n");
  const review = await askModel(env, agentInstructions.quality,
    "Independently audit this team's work. Find contradictions, weak assumptions, missing data, financial or operational risks, and claims needing evidence. Give severity and exact corrections.\n\n" + joined, 700);
  const final = await askModel(env, agentInstructions.manager,
    "You are chairing the final decision meeting. Integrate the specialists' work and the independent audit below. Do not hide disagreements. Give: (1) executive summary, (2) best recommendation and reasons, (3) two alternatives and trade-offs, (4) step-by-step action plan, (5) risks and safeguards, (6) missing information, (7) confidence level and what would change the recommendation. Mark all estimates and unknowns. Do not claim any external action was done.\n\nUSER OBJECTIVE:\n" + prompt + "\n\nSPECIALISTS:\n" + joined + "\n\nQUALITY AUDIT:\n" + review, 1000);
  return {
    answer: "AI BUSINESS ASSISTANT — RAPPORT DE L'ÉQUIPE\n\n" + joined +
      "\n\n## AUDIT INDÉPENDANT — QUALITY CONTROL\n" + review +
      "\n\n## DÉCISION ET PLAN FINAL — AI MANAGER\n" + final
  };
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
      if (!prompt || prompt.length > MAX_PROMPT) return json({ error: "Enter a prompt of 1 to " + MAX_PROMPT + " characters." }, 400, headers);
      const result = agent === "team"
        ? await runTeam(env, prompt)
        : { answer: await askModel(env, agentInstructions[agent], prompt, 1000) };
      return json(result, 200, headers);
    } catch (error) {
      return json({ error: "Workers AI request failed. Check the AI binding, model availability and account limits." }, 502, headers);
    }
  }
};
