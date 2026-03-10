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

    // Register LLM API Key Setting
    game.settings.register("pf2e-npc-gen", "llmApiKey", {
        name: "LLM API Key (OpenAI/Gemini)",
        hint: "Enter your API key here to enable the AI prompt generator feature.",
        scope: "world",
        config: true,
        type: String,
        default: ""
    });
});

// Add a button to the left-side Scene Controls (Token layer)
Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user.isGM) return;

    const tokenControls = controls.find(c => c.name === "token");
    if (tokenControls) {
        tokenControls.tools.push({
            name: "generate-npc",
            title: "Generate PF2e NPC",
            icon: "fas fa-hammer",
            button: true,
            onClick: () => {
                NPCGeneratorApp.render();
            }
        });
    }
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
