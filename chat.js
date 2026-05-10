export default async function handler(req, res) {
  const allowedOrigins = [
    "https://abnehmen-zum-letzten-mal.de",
    "https://www.abnehmen-zum-letzten-mal.de"
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "ANTHROPIC_API_KEY is not configured in Vercel."
      });
    }

    let incomingBody = req.body || {};

    if (typeof incomingBody === "string") {
      incomingBody = JSON.parse(incomingBody);
    }

    const maxTokens = Math.min(Number(incomingBody.max_tokens || 350), 500);

    const anthropicBody = {
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      system: incomingBody.system || "",
      messages: Array.isArray(incomingBody.messages)
        ? incomingBody.messages.slice(-6)
        : []
    };

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(anthropicBody)
    });

    const data = await anthropicResponse.json();

    return res.status(anthropicResponse.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Proxy error",
      message: error.message
    });
  }
}
