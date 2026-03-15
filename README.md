# Pathfinder 2e NPC & Loot Generator

A modern, high-performance module for **Foundry VTT** designed to streamline the creation of NPCs and encounter loot for the **Pathfinder 2e** system.

## ✨ Features

### 🤖 AI NPC Generator *(New!)*
- **Concept-Driven Generation**: Type a free-text description like *"veteran fire cult lieutenant"* or *"ancient elven spy"* and the AI infers the role, ancestry, theme, level, name, and biography automatically.
- **Combat-Optimized**: All mechanical stats (HP, AC, saves, attack, damage) are still generated from the PF2e Gamemastery Guide stat tables — the AI handles interpretation and flavor, not balance.
- **Multi-Provider Support**: Works with **OpenAI** (GPT-4o), **Claude** (Anthropic), or any **custom OpenAI-compatible endpoint** (local Ollama, LM Studio, etc.).
- **Level Override**: Optionally pin a specific level and let the AI handle everything else.
- **Rich Flavor**: AI writes a unique biography and personality quirk for every NPC.

### 🎲 NPC Generator
- **Level Scaling**: Generates NPCs from Level -1 to 25 with accurate statistics based on the Gamemastery Guide guidelines.
- **Ancestry System**: NPCs have random or selectable ancestries (Human, Elf, Dwarf, Orc, Goblin) that affect traits, speeds, senses, and stats.
- **Thematic Templates**: Apply powerful overlays like **Infernal**, **Undead**, **Shadow**, or **Elite** to add resistances, weaknesses, and unique damage types.
- **Role-Based Templates**: Choose from Brute, Skirmisher, Spellcaster, Sniper, or Soldier roles for automatic balancing.
- **Handcrafted Flavor**: Automatically generates unique names and biographical quirks for every NPC.
- **Intelligent Feat Selection**: Dynamically queries the full PF2e Feat compendium, filtering by level and role traits.

### 💰 Loot Generator
- **Encounter-Based Loot**: Generate treasure hoards, consumables, or permanent items for levels 1-25.
- **Currency Calculation**: Automatically adds gold pieces based on encounter level.
- **Foundry Integration**: Creates a "Loot" type actor and populates it instantly with items from the official SRD.

### 🎨 Modern UI/UX
- **Sleek Interface**: Features a "Glassmorphism" aesthetic with premium typography and a tabbed layout.
- **Consolidated Entry**: Accessed via a single violet "Generate NPC" button in the **Actor Directory** header.

---

## 🚀 Installation

1. Open the Foundry VTT Setup screen.
2. Go to the **Add-on Modules** tab.
3. Search for "PF2e NPC Generator" or install via manifest URL:
   `https://github.com/jaeyte/pf2e-npc-gen/releases/latest/download/module.json`

---

## 🛠 Usage

1. Open the **Actors** tab in your Foundry world.
2. Click the **Generate NPC** button in the header.
3. Use the **NPC Generator** tab for quick template-based NPCs, or the **AI Generator** tab for concept-driven generation.
4. The new actor will appear in your sidebar automatically.

---

## 🤖 AI Generator Setup

### 1. Configure Module Settings
Go to **Game Settings → Module Settings → Pathfinder 2e NPC Generator** and set:

| Setting | Description |
|---------|-------------|
| **AI Provider** | Choose OpenAI, Claude (Anthropic), or Custom |
| **AI API Key** | Your personal API key (stored locally in your browser only — never sent to the Foundry server) |
| **AI Model** *(optional)* | Override the default model (e.g. `gpt-4o-mini`, `claude-opus-4-5`) |
| **Custom API Endpoint URL** | Required when provider is set to *Custom* |

### 2. Choose a Provider

#### OpenAI *(Recommended for browser-hosted Foundry)*
OpenAI's API supports browser `fetch()` calls directly — no proxy needed.
- Get a key at [platform.openai.com](https://platform.openai.com)
- Default model: `gpt-4o-mini` (fast and cheap)

#### Claude / Anthropic
Anthropic's production API **does not allow direct browser requests** due to CORS restrictions. To use Claude with browser-hosted Foundry, point the **Custom** provider at a CORS proxy that forwards to Anthropic's API.

> **Foundry Desktop (Electron app)**: CORS restrictions do not apply — Claude works directly.

#### Local / Custom Endpoint (Ollama, LM Studio, etc.)
Set provider to **Custom** and enter the full URL to your OpenAI-compatible endpoint.

Examples:
- Ollama: `http://localhost:11434/v1/chat/completions`
- LM Studio: `http://localhost:1234/v1/chat/completions`

Set **AI Model** to the model name your server expects (e.g. `llama3`, `mistral`).

### 3. Generate an NPC
1. Click **Generate NPC** in the Actors sidebar.
2. Switch to the **AI Generator** tab.
3. Type a concept description — be as specific or vague as you like:
   - *"goblin pirate captain"*
   - *"ancient undead elven archmage, cold and calculating"*
   - *"a disgraced dwarf soldier turned bandit"*
4. Optionally set a **Level Override** — leave blank and the AI will infer it from your description.
5. Click **Generate with AI**.

The AI will select the role, ancestry, theme, and level, then the module builds a fully stat-complete, combat-ready NPC using the PF2e GMG tables.

---

*Created by Antigravity*
