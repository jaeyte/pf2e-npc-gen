# PF2e NPC & Loot Generator

A Foundry VTT module for Pathfinder 2e that generates combat-ready NPCs and encounter loot on the fly. Stats are pulled directly from the Gamemastery Guide tables, so everything that comes out is properly balanced for your party's level.

![Version 2.2.0](https://img.shields.io/badge/version-2.2.0-green)
![Foundry v13](https://img.shields.io/badge/Foundry-v13-informational)
![PF2e 6.0+](https://img.shields.io/badge/PF2e-6.0%2B-blueviolet)

---

## What it does

There are three tools in one dialog, opened from a button in your Actors sidebar:

**NPC Generator** — Pick a level, role, ancestry, and thematic template. Hit create and a fully-statted NPC shows up in your sidebar ready to drag into a scene.

**AI Generator** — Type a concept in plain English. The AI figures out the role, ancestry, theme, and level for you, writes a biography, and the module builds the stat block. Good for when you need something specific in a hurry.

**Loot Generator** — Set an encounter level and loot type, get a populated loot actor with items and gold pulled from the SRD.

---

## Installation

Paste this manifest URL into Foundry's **Install Module** dialog:

```
https://raw.githubusercontent.com/jaeyte/pf2e-npc-gen/main/module.json
```

**Requirements:** Foundry v13+, PF2e system v6.0+

---

## NPC Generator

Roles determine the stat spread. Ancestries add traits, senses, and minor stat adjustments. Thematic templates layer on top of both.

| Role | Stat Focus |
|------|-----------|
| Brute | High HP and damage, lower AC |
| Skirmisher | High AC and Reflex, mobile melee |
| Spellcaster | High Will and spell DC, low HP |
| Sniper | High Reflex and ranged attack/damage |
| Soldier | High HP, AC, and Fortitude |

| Theme | What it adds |
|-------|-------------|
| Elite | +2 to AC, attack, and saves — +10 HP |
| Infernal | Fire resistance and damage, fiend trait |
| Frost | Cold resistance and damage |
| Undead | Void resistance, vitality weakness, undead trait |
| Shadow | Precision resistance, greater darkvision |

---

## AI Generator

The AI reads your concept and decides the role, ancestry, theme, and level. The stat block is still built from the GMG tables — the AI handles interpretation and flavor, not the math.

**To get started:**

1. Go to **Game Settings → Module Settings → Pathfinder 2e NPC Generator**
2. Set your AI provider and paste in your API key
3. Open the generator and switch to the **AI Generator** tab

### Choosing a provider

**OpenAI** is the easiest option for most setups. The API supports browser-based requests with no extra configuration.
- Get a key at [platform.openai.com](https://platform.openai.com)
- Default model: `gpt-4o-mini`

**Claude (Anthropic)** works great but has a limitation: Anthropic's API blocks direct browser requests (CORS policy). If you're running Foundry as a desktop app this isn't an issue. If you're on a hosted server, you'll need to route through a proxy — point the **Custom** provider at it.

**Custom / Local** covers anything OpenAI-compatible: Ollama, LM Studio, a self-hosted proxy, etc. Set the provider to *Custom* and enter the full endpoint URL.

```
Ollama:    http://localhost:11434/v1/chat/completions
LM Studio: http://localhost:1234/v1/chat/completions
```

If you're using a local model, set the **AI Model** field to whatever your server expects (`llama3`, `mistral`, etc.).

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
