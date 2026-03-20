# PF2e NPC & Loot Generator

A Foundry VTT module for Pathfinder 2e that generates combat-ready characters and encounter loot on the fly. Characters are built as full PC-type actors with real classes, ancestries, heritages, backgrounds, feats, equipment, and spells pulled from the PF2e compendiums. Everything uses the standard character sheet so gear, spells, and feats are fully interactive.

![Version 3.0.0](https://img.shields.io/badge/version-3.0.0-green)
![Foundry v13](https://img.shields.io/badge/Foundry-v13-informational)
![PF2e 6.0+](https://img.shields.io/badge/PF2e-6.0%2B-blueviolet)

---

## What it does

There are three tools in one dialog, opened from a button in your Actors sidebar:

**Character Generator** — Pick a level, role, ancestry, and thematic template. Hit create and a fully-built PC-type character shows up in your sidebar with a proper character sheet, equipped gear, feats, and spells ready to go.

**AI Generator** — Type a concept in plain English. The AI figures out the role, ancestry, theme, and level for you, writes a biography, and the module builds the full character. Good for when you need something specific in a hurry.

**Loot Generator** — Set an encounter level and loot type, get a populated loot actor with items and gold pulled from the SRD.

---

## Installation

Paste this manifest URL into Foundry's **Install Module** dialog:

```
https://raw.githubusercontent.com/jaeyte/pf2e-npc-gen/main/module.json
```

**Requirements:** Foundry v13+, PF2e system v6.0+

---

## Character Generator

Roles map to actual PF2e classes. Each generated character gets a real ancestry, heritage, background, class, feats, equipment, and (for spellcasters) a prepared spellbook.

| Role | PF2e Class | Focus |
|------|-----------|-------|
| Brute | Barbarian | High HP and damage, lower AC |
| Skirmisher | Rogue | High AC and Reflex, mobile melee |
| Spellcaster | Wizard | High Will and spell DC, prepared arcane spells |
| Sniper | Ranger | High Reflex and ranged attack/damage |
| Soldier | Fighter | High HP, AC, and Fortitude |

| Theme | What it adds |
|-------|-------------|
| Elite | +2 to AC, attack, and saves — +10 HP |
| Infernal | Fire resistance and damage, fiend trait |
| Frost | Cold resistance and damage |
| Undead | Void resistance, vitality weakness, undead trait |
| Shadow | Precision resistance, greater darkvision |

---

## AI Generator

The AI reads your concept and decides the role, ancestry, theme, and level. The character is still built using real PF2e compendium data — the AI handles interpretation and flavor, not the mechanics.

**To get started:**

1. Go to **Game Settings → Module Settings → Pathfinder 2e NPC Generator**
2. Set your AI provider and paste in your API key
3. Open the generator and switch to the **AI Generator** tab

### Choosing a provider

#### Free options

**Groq** is the recommended free option. Fast inference with generous free-tier limits.
- Sign up at [console.groq.com](https://console.groq.com) — free API key, no credit card required
- Default model: `llama-3.3-70b-versatile` (excellent for structured JSON output)

**OpenRouter** aggregates many models including free ones. Good if you want to experiment with different models.
- Sign up at [openrouter.ai](https://openrouter.ai) — free API key, free models available
- Default model: `meta-llama/llama-3.3-70b-instruct:free`
- Browse free models at openrouter.ai/models (filter by "free")

**Ollama / LM Studio** — run models locally for free with zero API costs. Set the provider to *Custom* and enter the endpoint URL:

```
Ollama:    http://localhost:11434/v1/chat/completions
LM Studio: http://localhost:1234/v1/chat/completions
```

If you're using a local model, set the **AI Model** field to whatever your server expects (`llama3`, `mistral`, etc.).

#### Paid options

**OpenAI** is the easiest paid option. The API supports browser-based requests with no extra configuration.
- Get a key at [platform.openai.com](https://platform.openai.com)
- Default model: `gpt-4o-mini`

**Claude (Anthropic)** works great but has a limitation: Anthropic's API blocks direct browser requests (CORS policy). If you're running Foundry as a desktop app this isn't an issue. If you're on a hosted server, you'll need to route through a proxy — point the **Custom** provider at it.

### Module settings reference

| Setting | Scope | Notes |
|---------|-------|-------|
| AI Provider | World | Applies to everyone in the game |
| AI API Key | Client | Stored in your browser only, never touches the server |
| AI Model | Client | Leave blank to use the provider default |
| Custom Endpoint URL | Client | Required when provider is set to Custom |

### Writing prompts

Vague is fine. Specific is better. A few examples:

```
goblin pirate captain
veteran fire cult lieutenant, level 8
disgraced dwarf soldier turned bandit lord
ancient elven archmage, cold and calculating
```

If you want a specific level, type it in the Level Override field — the AI will handle everything else.

---

## Loot Generator

Generates a loot actor with items pulled from the PF2e SRD. Encounter level determines item quality and gold value.

| Type | Contents |
|------|---------|
| Treasure Hoard | Mixed permanent items, consumables, and gold |
| Consumables Only | Potions, scrolls, and similar |
| Permanent Items Only | Weapons, armor, and equipment |

---

*Made by Antigravity*
