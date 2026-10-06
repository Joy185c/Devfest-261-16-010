export async function testAiConnection(provider, apiKey) {
  if (provider !== 'gemini' || !apiKey) {
    throw new Error('Invalid provider or API key missing.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: "Respond with exactly 'OK'" }] }]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Connection failed');
  }
  
  const data = await response.json();
  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return true;
  }
  
  throw new Error('Invalid response from AI provider');
}

export async function analyzePackage({ provider, apiKey, requirements, uploadedFiles, matches, statuses }) {
  if (provider !== 'gemini' || !apiKey) {
    throw new Error('Invalid provider or API key missing.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Prepare a prompt providing the context of the package
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

  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('AI analysis failed');
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!rawText) {
    throw new Error('Empty response from AI provider');
  }

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
