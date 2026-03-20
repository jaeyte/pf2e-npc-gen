import { ROLE_FEATS, FEAT_SLOT_LEVELS, WIZARD_SPELL_SLOTS } from "./FeatureTables.js";
import { BASIC_EQUIPMENT, ROLE_EQUIPMENT_PREFS } from "./EquipmentTables.js";
import { ROLE_CLASS_MAP } from "./DataTables.js";

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
    },
    groq: {
        url:   "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.3-70b-versatile"
    },
    openrouter: {
        url:   "https://openrouter.ai/api/v1/chat/completions",
        model: "meta-llama/llama-3.3-70b-instruct:free"
    }
};

/**
 * Build the system prompt dynamically based on available feats, spells, and equipment.
 * This tells the AI exactly what it can pick from and how many slots to fill.
 */
function buildSystemPrompt() {
    // Build feat lists per role for the prompt
    const roleFeatInfo = {};
    for (const [roleKey, data] of Object.entries(ROLE_FEATS)) {
        const className = ROLE_CLASS_MAP[roleKey] || roleKey;
        const classFeats = data.class.map(f => `${f.name} (lvl ${f.maxLevel})`).join(", ");
        const generalFeats = data.general.map(f => f.name).join(", ");
        const skillFeats = data.skill.map(f => `${f.name} (lvl ${f.maxLevel})`).join(", ");
        // Collect all unique ancestry feats across all ancestries for this role
        const ancestryFeatsByAncestry = {};
        for (const [ancKey, feats] of Object.entries(data.ancestry || {})) {
            ancestryFeatsByAncestry[ancKey] = feats.map(f => `${f.name} (lvl ${f.maxLevel})`).join(", ");
        }
        roleFeatInfo[roleKey] = { className, classFeats, generalFeats, skillFeats, ancestryFeatsByAncestry };
    }

    // Equipment lists
    const allWeapons = [];
    for (const category of Object.values(BASIC_EQUIPMENT.weapons.melee)) allWeapons.push(...category);
    for (const category of Object.values(BASIC_EQUIPMENT.weapons.ranged)) allWeapons.push(...category);
    const allArmor = [];
    for (const category of Object.values(BASIC_EQUIPMENT.armor)) allArmor.push(...category);

    return `You are a Pathfinder 2e character builder. Given a concept description, you build a COMPLETE, READY-TO-PLAY character by choosing every feat, spell, and piece of equipment. Return ONLY valid JSON.

ROLES (each maps to a PF2e class):
  "brute" → Barbarian: high HP, high melee damage, low AC
  "skirmisher" → Rogue: high AC, high reflex, mobile melee, sneak attack
  "spellcaster" → Wizard: low HP/AC, high Will, high spell DC, prepared arcane spells
  "sniper" → Ranger: high reflex, high ranged attack, ranged damage
  "soldier" → Fighter: high HP, high AC, high Fort, martial weapons

ANCESTRIES: "human" | "elf" | "dwarf" | "orc" | "goblin"

THEMES: "none" | "elite" (+2 AC/attack/saves, +10 HP) | "infernal" (fire) | "frost" (cold) | "undead" (void/vitality) | "shadow" (darkvision)

LEVEL: integer -1 to 25. Infer from concept:
  minion/grunt = 1-3, standard = 4-8, veteran/elite = 7-12, commander/boss = 12-16, legendary/apex = 17-25.

FEAT SLOT COUNTS (you MUST fill exactly this many):
  Ancestry feats: 1 at levels 1,5,9,13,17 → count = how many of [1,5,9,13,17] are ≤ character level
  Class feats: 1 at levels 1,2,4,6,8,10,12,14,16,18,20 → count = how many of those are ≤ character level
  General feats: 1 at levels 3,7,11,15,19 → count = how many of those are ≤ character level
  Skill feats: 1 at levels 2,4,6,8,10,12,14,16,18,20 → count = how many of those are ≤ character level

AVAILABLE CLASS FEATS BY ROLE (pick feats whose level ≤ character level):
${Object.entries(roleFeatInfo).map(([role, info]) => `  ${role} (${info.className}): ${info.classFeats}`).join("\n")}

AVAILABLE ANCESTRY FEATS BY ROLE+ANCESTRY:
${Object.entries(roleFeatInfo).map(([role, info]) =>
    Object.entries(info.ancestryFeatsByAncestry).map(([anc, feats]) =>
        `  ${role}+${anc}: ${feats}`
    ).join("\n")
).join("\n")}

AVAILABLE GENERAL FEATS: ${roleFeatInfo.brute.generalFeats}

AVAILABLE SKILL FEATS (varies by role):
${Object.entries(roleFeatInfo).map(([role, info]) => `  ${role}: ${info.skillFeats}`).join("\n")}

SPELLS (spellcaster role ONLY — Wizard with arcane tradition):
Pick REAL Pathfinder 2e arcane spell names that fit the concept. You must fill:
  Cantrips: 5 (level 1-6), 6 (level 7-12), 7 (level 13-18), 8 (level 19-20)
  Rank 1-10 slots: typically 2-3 per rank. Max spell rank = ceil(level/2), capped at 10.
  Pick spells thematically — a fire mage gets fire spells, a necromancer gets void/death spells, etc.
  For non-spellcaster roles, omit the spells field entirely.

EQUIPMENT — pick from these available items:
  Weapons: ${allWeapons.join(", ")}
  Armor: ${allArmor.join(", ")}
  Shields: ${BASIC_EQUIPMENT.shields.join(", ")}

OUTPUT SCHEMA (return EXACTLY this structure):
{
  "role": string,
  "ancestry": string,
  "theme": string,
  "level": integer,
  "name": string (1-3 word fitting name),
  "biography": string (2-3 sentence HTML with <p> and <strong> tags),
  "personality": string (one vivid sentence, a behavioral quirk),
  "feats": {
    "class": [array of class feat name strings — fill ALL class feat slots],
    "ancestry": [array of ancestry feat name strings — fill ALL ancestry feat slots],
    "general": [array of general feat name strings — fill ALL general feat slots],
    "skill": [array of skill feat name strings — fill ALL skill feat slots]
  },
  "spells": {
    "cantrips": [array of cantrip name strings],
    "1": [array of rank 1 spell names],
    "2": [array of rank 2 spell names],
    ... (up to max rank for level, OMIT empty ranks, OMIT entirely for non-spellcaster)
  },
  "equipment": {
    "weapon": string (weapon name from the list above),
    "armor": string (armor name from the list above),
    "shield": string or null (shield name, only if concept uses a shield)
  }
}

CRITICAL RULES:
- Fill EVERY feat slot. Count the slots for the level and provide exactly that many feats per category.
- Only pick feats whose level requirement ≤ character level.
- For spellcaster: fill EVERY spell slot with real PF2e arcane spells that match the concept theme.
- For non-spellcaster: do NOT include the "spells" field.
- All feat and spell names must be real Pathfinder 2e names (exact spelling).
- Choose feats, spells, and equipment that REINFORCE the concept — themed, synergistic, and combat-effective.`;
}

export class AIGeneratorService {

    /**
     * Generate a full character build from a free-text description.
     * Returns role, ancestry, theme, level, name, biography, personality,
     * plus specific feat, spell, and equipment selections.
     */
    static async generate(conceptPrompt, optionalLevel = null) {
        const provider = game.settings.get("pf2e-npc-gen", "aiProvider");
        const apiKey   = game.settings.get("pf2e-npc-gen", "aiApiKey");

        if (!apiKey) {
            throw new Error("No API key configured. Go to Module Settings and enter your AI API key.");
        }

        const userMessage = optionalLevel !== null
            ? `Build a complete Pathfinder 2e character for this concept: "${conceptPrompt}". The GM has set the level to ${optionalLevel} — use this exact level value. Fill every feat slot, spell slot (if spellcaster), and choose equipment.`
            : `Build a complete Pathfinder 2e character for this concept: "${conceptPrompt}". Fill every feat slot, spell slot (if spellcaster), and choose equipment.`;

        const rawText = await AIGeneratorService._callProvider(provider, apiKey, userMessage);
        return AIGeneratorService._parseAndValidate(rawText, optionalLevel);
    }

    static async _callProvider(provider, apiKey, userMessage) {
        const modelOverride = game.settings.get("pf2e-npc-gen", "aiModel");
        const systemPrompt = buildSystemPrompt();
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
                max_tokens: 2048,
                system: systemPrompt,
                messages: [{ role: "user", content: userMessage }]
            };

        } else if (["openai", "groq", "openrouter", "custom"].includes(provider)) {
            if (provider === "custom") {
                url = game.settings.get("pf2e-npc-gen", "aiCustomEndpoint");
                if (!url) throw new Error("Custom endpoint URL is not configured. Set it in Module Settings.");
            } else {
                url = PROVIDER_DEFAULTS[provider].url;
            }
            const model = modelOverride || PROVIDER_DEFAULTS[provider]?.model || PROVIDER_DEFAULTS.openai.model;
            headers = {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${apiKey}`
            };
            if (provider === "openrouter") {
                headers["HTTP-Referer"] = window.location.origin;
                headers["X-Title"] = "PF2e NPC Generator";
            }
            body = {
                model,
                max_tokens: 2048,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user",   content: userMessage }
                ]
            };
            if (provider === "openai" || provider === "groq") {
                body.response_format = { type: "json_object" };
            }

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
            const cleaned = rawText
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/```\s*$/i, "")
                .trim();
            parsed = JSON.parse(cleaned);
        } catch (_) {
            throw new Error("AI returned malformed JSON. Try again or switch to a different model.");
        }

        const role     = VALID_ROLES.includes(parsed.role)         ? parsed.role      : "brute";
        const ancestry = VALID_ANCESTRIES.includes(parsed.ancestry) ? parsed.ancestry : "human";
        const theme    = VALID_THEMES.includes(parsed.theme)       ? parsed.theme     : "none";

        let level;
        if (optionalLevel !== null) {
            level = optionalLevel;
        } else {
            const aiLevel = parseInt(parsed.level, 10);
            level = (!isNaN(aiLevel) && aiLevel >= -1 && aiLevel <= 25) ? aiLevel : 4;
        }

        const name        = (typeof parsed.name === "string" && parsed.name.trim())            ? parsed.name.trim()        : null;
        const biography   = (typeof parsed.biography === "string" && parsed.biography.trim())   ? parsed.biography.trim()   : null;
        const personality = (typeof parsed.personality === "string" && parsed.personality.trim()) ? parsed.personality.trim() : null;

        // Parse feat selections (arrays of feat name strings)
        const feats = {};
        if (parsed.feats && typeof parsed.feats === "object") {
            for (const category of ["class", "ancestry", "general", "skill"]) {
                if (Array.isArray(parsed.feats[category])) {
                    feats[category] = parsed.feats[category].filter(f => typeof f === "string" && f.trim());
                }
            }
        }

        // Parse spell selections (object with "cantrips", "1", "2", ... keys)
        let spells = null;
        if (parsed.spells && typeof parsed.spells === "object") {
            spells = {};
            if (Array.isArray(parsed.spells.cantrips)) {
                spells.cantrips = parsed.spells.cantrips.filter(s => typeof s === "string" && s.trim());
            }
            for (let rank = 1; rank <= 10; rank++) {
                const key = String(rank);
                if (Array.isArray(parsed.spells[key])) {
                    spells[key] = parsed.spells[key].filter(s => typeof s === "string" && s.trim());
                }
            }
        }

        // Parse equipment selections
        let equipment = null;
        if (parsed.equipment && typeof parsed.equipment === "object") {
            equipment = {
                weapon: typeof parsed.equipment.weapon === "string" ? parsed.equipment.weapon.trim() : null,
                armor:  typeof parsed.equipment.armor === "string"  ? parsed.equipment.armor.trim()  : null,
                shield: typeof parsed.equipment.shield === "string" ? parsed.equipment.shield.trim() : null
            };
        }

        if (game.settings.get("pf2e-npc-gen", "logGeneration")) {
            console.log("PF2e NPC Gen | AI raw response:", rawText);
            console.log("PF2e NPC Gen | AI parsed concept:", { role, ancestry, theme, level, name, biography, personality, feats, spells, equipment });
        }

        return { role, ancestry, theme, level, name, biography, personality, feats, spells, equipment };
    }
}
