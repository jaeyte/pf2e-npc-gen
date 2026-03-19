import { EntityBuilder } from "../generator/EntityBuilder.js";
import { LootGenerator } from "../generator/LootGenerator.js";
import { ANCESTRIES } from "../generator/AncestryTables.js";
import { THEMES } from "../generator/ThemeTables.js";
import { AIGeneratorService } from "../generator/AIGeneratorService.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class NPCGeneratorApp extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id: "pf2e-npc-gen-app",
        classes: ["pf2e-npc-gen-app"],
        tag: "div",
        window: {
            title: "Pathfinder 2e NPC & Loot Generator",
            icon: "fas fa-hammer",
            resizable: false
        },
        position: {
            width: 450,
            height: "auto"
        },
        actions: {
            switchTab: NPCGeneratorApp.#onSwitchTab,
            generateNPC: NPCGeneratorApp.#onGenerateNPC,
            generateLoot: NPCGeneratorApp.#onGenerateLoot,
            generateAINPC: NPCGeneratorApp.#onGenerateAINPC
        }
    };

    static PARTS = {
        main: {
            template: "modules/pf2e-npc-gen/templates/generator-app.hbs"
        }
    };

    async _prepareContext(options = {}) {
        const context = await super._prepareContext(options);
        const ancestries = Object.entries(ANCESTRIES).reduce((acc, [key, val]) => {
            acc[key] = val.name;
            return acc;
        }, {});

        const themes = Object.entries(THEMES).reduce((acc, [key, val]) => {
            acc[key] = val.name;
            return acc;
        }, {});

        return foundry.utils.mergeObject(context, {
            level: 1,
            roles: {
                "brute": "Brute (High HP, High Damage)",
                "skirmisher": "Skirmisher (High Mobility)",
                "spellcaster": "Spellcaster (High Magic)",
                "sniper": "Sniper (Ranged Focus)",
                "soldier": "Soldier (High AC/Defenses)"
            },
            role: "brute",
            ancestries: ancestries,
            ancestry: "random",
            themes: themes,
            theme: "none",
            generateEquipment: true
        });
    }

    static #onSwitchTab(event, target) {
        const tab = target.dataset.tab;
        const appEl = target.closest(".pf2e-npc-gen-app-content");
        if (!appEl) return;

        // Update tab items
        appEl.querySelectorAll(".tab-item").forEach(el => el.classList.remove("active"));
        target.classList.add("active");

        // Update tab content
        appEl.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
        const content = appEl.querySelector(`.tab-content[data-tab="${tab}"]`);
        if (content) content.classList.add("active");
    }

    static async #onGenerateNPC(event, target) {
        event.preventDefault();
        const app = this;
        const form = target.closest(".pf2e-npc-gen-app-content");

        const level = parseInt(form.querySelector("#npc-level")?.value || "1", 10);
        const role = form.querySelector("#npc-role")?.value || "brute";
        const ancestry = form.querySelector("#npc-ancestry")?.value || "random";
        const theme = form.querySelector("#npc-theme")?.value || "none";
        const genEquipment = form.querySelector("#generate-equipment")?.checked ?? true;

        ui.notifications.info(`Generating Level ${level} ${ancestry} ${role}...`);

        try {
            const builder = new EntityBuilder(level, role, genEquipment, ancestry, theme);
            const newActor = await builder.generateNPC();
            if (newActor) {
                ui.notifications.info(`Created NPC: ${newActor.name}`);
                newActor.sheet.render(true);
                app.close();
            }
        } catch (error) {
            console.error("PF2e NPC Gen | NPC Error:", error);
            ui.notifications.error("Failed to generate NPC.");
        }
    }

    static async #onGenerateLoot(event, target) {
        event.preventDefault();
        const app = this;
        const form = target.closest(".pf2e-npc-gen-app-content");

        const level = parseInt(form.querySelector("#loot-level")?.value || "1", 10);
        const type = form.querySelector("#loot-type")?.value || "hoard";

        ui.notifications.info(`Generating Level ${level} ${type}...`);

        try {
            const generator = new LootGenerator(level, type);
            await generator.generateLoot();
            ui.notifications.info("Loot generation complete. Check the sidebar.");
            app.close();
        } catch (error) {
            console.error("PF2e NPC Gen | Loot Error:", error);
            ui.notifications.error("Failed to generate loot.");
        }
    }

    static async #onGenerateAINPC(event, target) {
        event.preventDefault();
        const app = this;
        const form = target.closest(".pf2e-npc-gen-app-content");

        const conceptText = form.querySelector("#ai-concept")?.value?.trim();
        if (!conceptText) {
            ui.notifications.warn("Please enter a concept description.");
            return;
        }

        const levelInput = form.querySelector("#ai-level")?.value;
        const optionalLevel = levelInput ? parseInt(levelInput, 10) : null;
        const genEquipment = form.querySelector("#ai-generate-equipment")?.checked ?? true;

        const btn = form.querySelector("#generate-ai-npc-btn");
        const loadingEl = form.querySelector("#ai-loading");
        const errorEl = form.querySelector("#ai-error");

        btn.disabled = true;
        loadingEl.style.display = "";
        errorEl.style.display = "none";
        errorEl.textContent = "";

        try {
            const concept = await AIGeneratorService.generate(conceptText, optionalLevel);

            ui.notifications.info(
                `AI: ${concept.ancestry} ${concept.role}, level ${concept.level}, theme: ${concept.theme}. Building NPC...`
            );

            const builder = new EntityBuilder(
                concept.level,
                concept.role,
                genEquipment,
                concept.ancestry,
                concept.theme,
                { name: concept.name, biography: concept.biography, personality: concept.personality }
            );
            const newActor = await builder.generateNPC();

            if (newActor) {
                ui.notifications.info(`Created: ${newActor.name}`);
                newActor.sheet.render(true);
                app.close();
            }
        } catch (error) {
            console.error("PF2e NPC Gen | AI Error:", error);
            errorEl.textContent = `Error: ${error.message}`;
            errorEl.style.display = "";
            ui.notifications.error("AI generation failed. See the error message in the generator.");
        } finally {
            btn.disabled = false;
            loadingEl.style.display = "none";
        }
    }

    static show() {
        const app = new NPCGeneratorApp();
        app.render(true);
    }
}
