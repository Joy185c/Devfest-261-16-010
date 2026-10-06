async function getGroqModel(apiKey) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': `Bearer ${apiKey}` } });
    if (!res.ok) return 'llama-3.1-8b-instant';
    const data = await res.json();
    const ids = data.data.map(m => m.id);
    const chatModels = ids.filter(id => !id.includes('whisper') && !id.includes('prompt-guard') && !id.includes('safeguard'));
    return chatModels.find(id => id.includes('llama') || id.includes('allam')) || chatModels[0];
  } catch(e) {
    return 'llama-3.1-8b-instant';
  }
}

export async function testAiConnection(provider, apiKey) {
  if (!apiKey) throw new Error('API key missing.');

  if (provider === 'gemini') {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Respond with exactly 'OK'" }] }] })
    });
    if (!response.ok) throw new Error('Gemini connection failed');
    return true;
  }

  if (provider === 'openai' || provider === 'groq') {
    const endpoint = provider === 'groq' 
      ? 'https://api.groq.com/openai/v1/chat/completions' 
      : 'https://api.openai.com/v1/chat/completions';
    const model = provider === 'groq' ? await getGroqModel(apiKey) : 'gpt-3.5-turbo';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "Respond with exactly 'OK'" }]
      })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`${provider} connection failed: ${err}`);
    }
    return true;
  }

  if (provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: "user", content: "Respond with exactly 'OK'" }]
      })
    });
    if (!response.ok) throw new Error('Anthropic connection failed');
    return true;
  }

  throw new Error('Unsupported provider');
}

export async function analyzePackage({ provider, apiKey, requirements, uploadedFiles, matches, statuses }) {
  if (!apiKey) throw new Error('API key missing.');

  const reqContext = requirements.map(r => 
    `Req ID: ${r.id}, Name: ${r.title_en}, Mandatory: ${r.mandatory}, Status: ${statuses[r.id]?.status}`
  ).join('\n');

  const filesContext = uploadedFiles.map(f => 
    `File ID: ${f.id}, Name: ${f.name}, Pages: ${f.pages}`
  ).join('\n');

  const matchesContext = Object.entries(matches).map(([reqId, fileId]) => 
    `Matched Req ${reqId} to File ${fileId}`
  ).join('\n');

  const promptText = `
You are an AI assistant for a Tender Document Package Builder app.
Your task is to analyze the current state of a user's document package and provide helpful insights.
Do NOT output markdown. Output ONLY a valid JSON object in the exact format below.

Context:
Requirements:
${reqContext}

Uploaded Files:
${filesContext}

Current Matches:
${matchesContext}

Return exactly this JSON format:
{
  "summary": "A human-friendly 1-2 sentence summary of the package readiness.",
  "issues": [
    "Explanation of blocking issue 1 (e.g. Trade License is missing)",
    "Explanation of blocking issue 2"
  ],
  "suggestions": [
    { "filename": "example.pdf", "suggestedRequirementId": "R01", "confidence": "90%" }
  ]
}

If no issues, leave issues array empty.
If no suggestions, leave suggestions array empty.
Make sure the suggestedRequirementId exactly matches an ID from the Requirements list.
  `;

  let rawText = '';

  if (provider === 'gemini') {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
      })
    });
    if (!response.ok) throw new Error('Gemini API failed');
    const data = await response.json();
    rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  } 
  else if (provider === 'openai' || provider === 'groq') {
    const endpoint = provider === 'groq' 
      ? 'https://api.groq.com/openai/v1/chat/completions' 
      : 'https://api.openai.com/v1/chat/completions';
    const model = provider === 'groq' ? await getGroqModel(apiKey) : 'gpt-3.5-turbo';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: promptText }]
      })
    });
    if (!response.ok) throw new Error(`${provider} API failed`);
    const data = await response.json();
    rawText = data?.choices?.[0]?.message?.content;
  }
  else if (provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: "user", content: promptText }]
      })
    });
    if (!response.ok) throw new Error('Anthropic API failed');
    const data = await response.json();
    rawText = data?.content?.[0]?.text;
  }

  if (!rawText) throw new Error('Empty response from AI provider');

  try {
    const result = JSON.parse(rawText);
    return {
      summary: result.summary || '',
      issues: result.issues || [],
      suggestions: result.suggestions || []
    };
  } catch (e) {
    console.error("AI JSON Parse Error", e);
    throw new Error('Failed to parse AI response');
  }
}
