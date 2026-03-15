import { EntityBuilder } from "../generator/EntityBuilder.js";
import { LootGenerator } from "../generator/LootGenerator.js";
import { ANCESTRIES } from "../generator/AncestryTables.js";
import { THEMES } from "../generator/ThemeTables.js";
import { AIGeneratorService } from "../generator/AIGeneratorService.js";

export class NPCGeneratorApp extends FormApplication {
    constructor(options = {}) {
        super(null, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "pf2e-npc-gen-app",
            title: "Pathfinder 2e NPC & Loot Generator",
            template: "modules/pf2e-npc-gen/templates/generator-app.hbs",
            width: 450,
            height: "auto",
            classes: ["pf2e-npc-gen-app"],
            resizable: false
        });
    }

    async getData() {
        // Map data for selectOptions
        const ancestries = Object.entries(ANCESTRIES).reduce((acc, [key, val]) => {
            acc[key] = val.name;
            return acc;
        }, {});

        const themes = Object.entries(THEMES).reduce((acc, [key, val]) => {
            acc[key] = val.name;
            return acc;
        }, {});

        return {
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
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Tab switching
        html.find(".tab-item").click(ev => {
            const tab = ev.currentTarget.dataset.tab;
            html.find(".tab-item").removeClass("active");
            $(ev.currentTarget).addClass("active");

            html.find(".tab-content").removeClass("active");
            html.find(`.tab-content[data-tab="${tab}"]`).addClass("active");
        });

        // Generate NPC
        html.find("#generate-npc-btn").click(async ev => {
            ev.preventDefault();
            const level = parseInt(html.find("#npc-level").val() || "1", 10);
            const role = html.find("#npc-role").val() || "brute";
            const ancestry = html.find("#npc-ancestry").val() || "random";
            const theme = html.find("#npc-theme").val() || "none";
            const genEquipment = html.find("#generate-equipment").prop("checked");

            ui.notifications.info(`Generating Level ${level} ${ancestry} ${role}...`);
            
            try {
                const builder = new EntityBuilder(level, role, genEquipment, ancestry, theme);
                const newActor = await builder.generateNPC();
                if (newActor) {
                    ui.notifications.info(`Created NPC: ${newActor.name}`);
                    newActor.sheet.render(true);
                    this.close();
                }
            } catch (error) {
                console.error("PF2e NPC Gen | NPC Error:", error);
                ui.notifications.error("Failed to generate NPC.");
            }
        });

        // Generate Loot
        html.find("#generate-loot-btn").click(async ev => {
            ev.preventDefault();
            const level = parseInt(html.find("#loot-level").val() || "1", 10);
            const type = html.find("#loot-type").val() || "hoard";

            ui.notifications.info(`Generating Level ${level} ${type}...`);

            try {
                const generator = new LootGenerator(level, type);
                await generator.generateLoot();
                ui.notifications.info("Loot generation complete. Check the sidebar.");
                this.close();
            } catch (error) {
                console.error("PF2e NPC Gen | Loot Error:", error);
                ui.notifications.error("Failed to generate loot.");
            }
        });

        // Generate AI NPC
        html.find("#generate-ai-npc-btn").click(async ev => {
            ev.preventDefault();

            const conceptText = html.find("#ai-concept").val()?.trim();
            if (!conceptText) {
                ui.notifications.warn("Please enter a concept description.");
                return;
            }

            const levelInput = html.find("#ai-level").val();
            const optionalLevel = levelInput ? parseInt(levelInput, 10) : null;
            const genEquipment = html.find("#ai-generate-equipment").prop("checked");

            const btn = html.find("#generate-ai-npc-btn");
            const loadingEl = html.find("#ai-loading");
            const errorEl = html.find("#ai-error");

            btn.prop("disabled", true);
            loadingEl.show();
            errorEl.hide().text("");

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
                    this.close();
                }
            } catch (error) {
                console.error("PF2e NPC Gen | AI Error:", error);
                errorEl.text(`Error: ${error.message}`).show();
                ui.notifications.error("AI generation failed. See the error message in the generator.");
            } finally {
                btn.prop("disabled", false);
                loadingEl.hide();
            }
        });
    }

    static render() {
        const app = new NPCGeneratorApp();
        app.render(true);
    }
}
