// Universal LLM Provider Adapter (OpenAI, Gemini, Anthropic) using Native Fetch

export class LlmProvider {
  constructor(config) {
    this.config = config;
  }

  hasValidKey() {
    return Boolean(
      this.config.openaiApiKey ||
      this.config.geminiApiKey ||
      this.config.anthropicApiKey
    );
  }

  async generateJson(systemPrompt, userPrompt) {
    if (this.config.openaiApiKey) {
      return this.callOpenAI(systemPrompt, userPrompt);
    } else if (this.config.geminiApiKey) {
      return this.callGemini(systemPrompt, userPrompt);
    } else if (this.config.anthropicApiKey) {
      return this.callAnthropic(systemPrompt, userPrompt);
    } else {
      throw new Error('No LLM API Key configured. Please set OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY.');
    }
  }

  async callOpenAI(systemPrompt, userPrompt) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: this.config.openaiModel || 'gpt-4o',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  }

  async callGemini(systemPrompt, userPrompt) {
    const primaryModel = this.config.geminiModel || 'gemini-3.8-flash';
    const modelsToTry = [
      primaryModel,
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    const uniqueModels = [...new Set(modelsToTry)];
    let lastError = null;

    for (const model of uniqueModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.geminiApiKey}`;
        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nStrict requirement: Output ONLY raw valid JSON matching the schema.\n\nInput:\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 404 && model !== uniqueModels[uniqueModels.length - 1]) {
            console.warn(`[ASIE Gemini] Model "${model}" not available on endpoint (404). Falling back...`);
            lastError = new Error(`Gemini API Error (${res.status}): ${errText}`);
            continue;
          }
          throw new Error(`Gemini API Error (${res.status}): ${errText}`);
        }

        const data = await res.json();
        const text = data.candidates[0].content.parts[0].text;
        const cleaned = text.trim().replace(/^```json\n?|\n?```$/g, '');
        return JSON.parse(cleaned);
      } catch (err) {
        lastError = err;
        if (err.message && err.message.includes('404') && model !== uniqueModels[uniqueModels.length - 1]) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('All Gemini model endpoints failed.');
  }

  async callAnthropic(systemPrompt, userPrompt) {
    const url = 'https://api.anthropic.com/v1/messages';
    const payload = {
      model: this.config.anthropicModel || 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `${userPrompt}\n\nRespond ONLY with a valid JSON object matching the requested schema. No conversational preamble.` }
      ]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const raw = data.content[0].text.trim().replace(/^```json\n?|\n?```$/g, '');
    return JSON.parse(raw);
  }
}
