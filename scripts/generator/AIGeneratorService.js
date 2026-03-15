const VALID_ROLES      = ["brute", "skirmisher", "spellcaster", "sniper", "soldier"];
const VALID_ANCESTRIES = ["human", "elf", "dwarf", "orc", "goblin"];
const VALID_THEMES     = ["none", "elite", "infernal", "frost", "undead", "shadow"];

const PROVIDER_DEFAULTS = {
    anthropic: {
        url:   "https://api.anthropic.com/v1/messages",
        model: "claude-opus-4-5"
    },
    openai: {
        url:   "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o-mini"
    }
};

const SYSTEM_PROMPT = `You are a Pathfinder 2e NPC design assistant. Your job is to interpret a concept description and select mechanical parameters for a combat-ready NPC. Return ONLY a valid JSON object with no markdown fences, no explanation, and no text outside the JSON.

VALID role values (pick the best match):
  "brute"       - high HP, high melee damage, low AC. Berserkers, ogres, enforcers.
  "skirmisher"  - high AC, high reflex, mobile melee. Rogues, duelists, scouts.
  "spellcaster" - low HP/AC, high Will, high spell DC. Wizards, witches, shamans.
  "sniper"      - low HP, high reflex, high ranged attack and damage. Archers, gunslingers.
  "soldier"     - high HP, high AC, high Fort. Guards, paladins, heavy infantry.

VALID ancestry values (pick the most thematically fitting):
  "human" | "elf" | "dwarf" | "orc" | "goblin"

VALID theme values (pick the best match, or "none"):
  "none"     - no special modifier
  "elite"    - battle-hardened veteran: +2 AC/attack/saves, +10 HP
  "infernal" - devil cultist, hellknight: fire resistance, fire damage, fiend trait
  "frost"    - arctic warrior, frost shaman: cold resistance, cold damage
  "undead"   - risen dead, vampire spawn: void resistance, vitality weakness, undead trait
  "shadow"   - shadow assassin, nightshade: precision resistance, greater darkvision

level: integer from -1 to 25. Infer from power words in the concept:
  minion/grunt/low = 1-3, standard/soldier = 4-8, veteran/lieutenant/elite = 7-12,
  commander/boss/champion = 12-16, legendary/ancient/apex = 17-25.
  If the user explicitly specifies a level, use that exact number.

OUTPUT SCHEMA (return exactly this structure):
{
  "role":        string,
  "ancestry":    string,
  "theme":       string,
  "level":       integer,
  "name":        string (a fitting 1-3 word name, no title or rank),
  "biography":   string (2-3 sentence HTML using <p> and <strong> tags, third person, mentions ancestry and role naturally, describes background and motivation),
  "personality": string (one vivid sentence describing a behavioral quirk or mannerism)
}

Optimize for combat effectiveness: match role to the concept archetype, choose theme that reinforces the flavor, and infer level from power words.`;

export class AIGeneratorService {

    /**
     * Generate an NPC concept from a free-text description.
     * @param {string} conceptPrompt - Free-text concept, e.g. "veteran fire cult lieutenant"
     * @param {number|null} optionalLevel - GM-specified level override, or null to let AI decide
     * @returns {Promise<{role, ancestry, theme, level, name, biography, personality}>}
     */
    static async generate(conceptPrompt, optionalLevel = null) {
        const provider = game.settings.get("pf2e-npc-gen", "aiProvider");
        const apiKey   = game.settings.get("pf2e-npc-gen", "aiApiKey");

        if (!apiKey) {
            throw new Error("No API key configured. Go to Module Settings and enter your AI API key.");
        }

        const userMessage = optionalLevel !== null
            ? `Concept: "${conceptPrompt}". The GM has set the level to ${optionalLevel} — use this exact level value.`
            : `Concept: "${conceptPrompt}"`;

        const rawText = await AIGeneratorService._callProvider(provider, apiKey, userMessage);
        return AIGeneratorService._parseAndValidate(rawText, optionalLevel);
    }

    static async _callProvider(provider, apiKey, userMessage) {
        const modelOverride = game.settings.get("pf2e-npc-gen", "aiModel");
        let url, headers, body;

        if (provider === "anthropic") {
            url = PROVIDER_DEFAULTS.anthropic.url;
            const model = modelOverride || PROVIDER_DEFAULTS.anthropic.model;
            headers = {
                "Content-Type":    "application/json",
                "x-api-key":       apiKey,
                "anthropic-version": "2023-06-01"
            };
            body = {
                model,
                max_tokens: 600,
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: userMessage }]
            };

        } else if (provider === "openai" || provider === "custom") {
            if (provider === "custom") {
                url = game.settings.get("pf2e-npc-gen", "aiCustomEndpoint");
                if (!url) throw new Error("Custom endpoint URL is not configured. Set it in Module Settings.");
            } else {
                url = PROVIDER_DEFAULTS.openai.url;
            }
            const model = modelOverride || PROVIDER_DEFAULTS.openai.model;
            headers = {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${apiKey}`
            };
            body = {
                model,
                max_tokens: 600,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user",   content: userMessage }
                ],
                response_format: { type: "json_object" }
            };

        } else {
            throw new Error(`Unknown AI provider: "${provider}". Check Module Settings.`);
        }

        let response;
        try {
            response = await fetch(url, {
                method:  "POST",
                headers,
                body: JSON.stringify(body)
            });
        } catch (err) {
            if (err instanceof TypeError) {
                throw new Error(
                    "Network error: Could not reach the AI API. " +
                    "If using Claude (Anthropic), a CORS proxy is required for browser-hosted Foundry. " +
                    "Use OpenAI, a local Ollama endpoint, or configure a CORS proxy via the Custom provider."
                );
            }
            throw err;
        }

        if (!response.ok) {
            let detail = "";
            try { detail = await response.text(); } catch (_) { /* ignore */ }
            if (response.status === 401) throw new Error("Invalid API key. Double-check your key in Module Settings.");
            if (response.status === 429) throw new Error("AI rate limit exceeded. Wait a moment and try again.");
            throw new Error(`AI API error ${response.status}: ${detail.slice(0, 200)}`);
        }

        const data = await response.json();

        if (provider === "anthropic") {
            return data?.content?.[0]?.text ?? "";
        } else {
            return data?.choices?.[0]?.message?.content ?? "";
        }
    }

    static _parseAndValidate(rawText, optionalLevel) {
        let parsed;
        try {
            // Strip accidental markdown code fences some models emit
            const cleaned = rawText
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/```\s*$/i, "")
                .trim();
            parsed = JSON.parse(cleaned);
        } catch (_) {
            throw new Error("AI returned malformed JSON. Try again or switch to a different model.");
        }

        const role     = VALID_ROLES.includes(parsed.role)       ? parsed.role      : "brute";
        const ancestry = VALID_ANCESTRIES.includes(parsed.ancestry) ? parsed.ancestry : "human";
        const theme    = VALID_THEMES.includes(parsed.theme)     ? parsed.theme     : "none";

        let level;
        if (optionalLevel !== null) {
            level = optionalLevel;
        } else {
            const aiLevel = parseInt(parsed.level, 10);
            level = (!isNaN(aiLevel) && aiLevel >= -1 && aiLevel <= 25) ? aiLevel : 4;
        }

        const name      = (typeof parsed.name === "string" && parsed.name.trim())      ? parsed.name.trim()      : null;
        const biography = (typeof parsed.biography === "string" && parsed.biography.trim()) ? parsed.biography.trim() : null;
        const personality = (typeof parsed.personality === "string" && parsed.personality.trim()) ? parsed.personality.trim() : null;

        if (game.settings.get("pf2e-npc-gen", "logGeneration")) {
            console.log("PF2e NPC Gen | AI raw response:", rawText);
            console.log("PF2e NPC Gen | AI parsed concept:", { role, ancestry, theme, level, name, biography, personality });
        }

        return { role, ancestry, theme, level, name, biography, personality };
    }
}
