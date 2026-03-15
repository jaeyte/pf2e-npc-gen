import { NPCGeneratorApp } from "./app/NPCGeneratorApp.js";

// Register Initialization Hook
Hooks.once("init", async () => {
    console.log("PF2e NPC Generator | Initializing PF2e NPC Generator module");
    
    // Register temporary configuration setting
    game.settings.register("pf2e-npc-gen", "logGeneration", {
        name: "Log Generation Configuration",
        hint: "Output detailed generation data to the browser console.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    // AI Generator Settings
    game.settings.register("pf2e-npc-gen", "aiProvider", {
        name: "AI Provider",
        hint: "Select the AI service for concept-based NPC generation.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "openai":    "OpenAI (GPT-4o)",
            "anthropic": "Claude (Anthropic)",
            "custom":    "Custom (OpenAI-compatible endpoint)"
        },
        default: "openai"
    });

    game.settings.register("pf2e-npc-gen", "aiApiKey", {
        name: "AI API Key",
        hint: "Your API key, stored locally in your browser only. NOTE: Claude (Anthropic) requires a CORS proxy when using browser-hosted Foundry — use OpenAI or a local Ollama endpoint instead if unsure.",
        scope: "client",
        config: true,
        type: String,
        default: ""
    });

    game.settings.register("pf2e-npc-gen", "aiModel", {
        name: "AI Model (optional)",
        hint: "Override the default model. Leave blank to use the provider default. E.g. 'gpt-4o-mini', 'claude-opus-4-5'.",
        scope: "client",
        config: true,
        type: String,
        default: ""
    });

    game.settings.register("pf2e-npc-gen", "aiCustomEndpoint", {
        name: "Custom API Endpoint URL",
        hint: "Full URL for a custom OpenAI-compatible endpoint or CORS proxy. Used when provider is set to 'Custom'. E.g. 'http://localhost:11434/v1/chat/completions' for Ollama.",
        scope: "client",
        config: true,
        type: String,
        default: ""
    });
});

// Create Toolbar Button Hook
Hooks.on("getActorDirectoryEntryContext", (html, options) => {
    // Add logic here if we decide to add context menus later
});

Hooks.on("renderActorDirectory", (app, html, data) => {
    // Inject a button into the Actors directory
    if (!game.user.isGM) return; // Only GMs should generate NPCs

    // Foundry v13 HTML is a plain HTMLElemnt array, not jQuery.
    const element = html[0] || html; 
    
    // Try to find the action-buttons div (V1) or header-actions (V2)
    const actionButtons = element.querySelector(".directory-header .action-buttons, .header-actions");
    
    if (actionButtons) {
        // Create the button manually
        const generateButton = document.createElement("button");
        generateButton.classList.add("pf2e-npc-generate-prompt");
        generateButton.innerHTML = `<i class="fas fa-hammer"></i> Generate NPC`;
        
        // Add click listener
        generateButton.addEventListener("click", (evt) => {
            evt.preventDefault();
            NPCGeneratorApp.render();
        });

        // Insert underneath/alongside Create Actor
        actionButtons.appendChild(generateButton);
    }
});
