import { STAT_TABLES, ROLE_TEMPLATES, ROLE_CLASS_MAP, ROLE_BACKGROUND_MAP, ANCESTRY_HERITAGE_MAP } from "./DataTables.js";
import { BASIC_EQUIPMENT, ROLE_EQUIPMENT_PREFS } from "./EquipmentTables.js";
import { ROLE_FEATS } from "./FeatureTables.js";
import { ANCESTRIES, PERSONALITY_QUIRKS } from "./AncestryTables.js";
import { THEMES } from "./ThemeTables.js";

export class EntityBuilder {
    constructor(level, roleKey, generateEquipment, ancestryKey = "random", themeKey = "none", overrides = {}) {
        this.level = Math.max(-1, Math.min(25, level));

        // Setup Role
        this.roleKey = ROLE_TEMPLATES[roleKey] ? roleKey : "brute";
        this.roleTemplate = ROLE_TEMPLATES[this.roleKey];

        // Setup Ancestry
        this.ancestryKey = ancestryKey === "random" ? this._getRandomKey(ANCESTRIES) : ancestryKey;
        this.ancestry = ANCESTRIES[this.ancestryKey] || ANCESTRIES.human;

        // Setup Theme
        this.themeKey = themeKey;
        this.theme = THEMES[this.themeKey] || THEMES.none;

        this.generateEquipment = generateEquipment;
        this.levelIndex = this.level + 1;
        this.overrides = overrides; // { name?, biography?, personality? } from AI generation
    }

    _getRandomKey(obj) {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    async generateNPC() {
        const firstName = this.ancestry.names[Math.floor(Math.random() * this.ancestry.names.length)];
        const prefix = this.theme.prefix ? this.theme.prefix + " " : "";
        const className = ROLE_CLASS_MAP[this.roleKey] || "Fighter";
        const actorName = this.overrides.name
            ? this.overrides.name
            : `${prefix}${firstName} (${this.ancestry.name} ${className})`;

        let bio;
        if (this.overrides.biography) {
            bio = this.overrides.biography;
            if (this.overrides.personality) bio += `<p><em>${this.overrides.personality}</em></p>`;
        } else {
            bio = this._generateBio(firstName, className);
        }

        // Convert modifiers to ability scores (mod * 2 + 10)
        const modToScore = (mod) => (mod ?? 0) * 2 + 10;

        let actorData = {
            name: actorName,
            type: "character",
            system: {
                abilities: {
                    str: { value: modToScore(this.roleTemplate.abilityMods?.str) },
                    dex: { value: modToScore(this.roleTemplate.abilityMods?.dex) },
                    con: { value: modToScore(this.roleTemplate.abilityMods?.con) },
                    int: { value: modToScore(this.roleTemplate.abilityMods?.int) },
                    wis: { value: modToScore(this.roleTemplate.abilityMods?.wis) },
                    cha: { value: modToScore(this.roleTemplate.abilityMods?.cha) }
                },
                attributes: {
                    speed: { value: this.ancestry.speed },
                    hp: {},
                    immunities: [],
                    resistances: [],
                    weaknesses: []
                },
                details: {
                    level: { value: this.level },
                    alliance: "opposition",
                    biography: {
                        public: bio
                    }
                },
                traits: {
                    value: [...new Set([...this.ancestry.traits, ...(this.theme.traits || [])])],
                    rarity: "common",
                    size: { value: "med" }
                },
                resources: {}
            },
            items: []
        };

        // Apply theme resistances/weaknesses
        if (this.theme.resistances) {
            actorData.system.attributes.resistances = this.theme.resistances.map(r => ({
                type: r.type,
                value: r.value === "Level" ? this.level : r.value
            }));
        }
        if (this.theme.weaknesses) {
            actorData.system.attributes.weaknesses = this.theme.weaknesses.map(w => ({
                type: w.type,
                value: w.value === "Level" ? this.level : w.value
            }));
        }

        // Pull ancestry, heritage, background, and class from compendiums
        const compendiumItems = await this._generateCompendiumFoundation();
        actorData.items.push(...compendiumItems);

        // Add spellcasting entry + spells for spellcaster role
        if (this.roleTemplate.spellDC) {
            const spellcastingEntry = this._generateSpellcastingEntry();
            spellcastingEntry._id = foundry.utils.randomID();
            actorData.items.push(spellcastingEntry);
            const spellItems = await this._generateSpells(spellcastingEntry._id);
            actorData.items.push(...spellItems);
        }

        // Add equipment (weapons, armor, shields, gear)
        if (this.generateEquipment) {
            const equipmentItems = await this._generateEquipment();
            actorData.items.push(...equipmentItems);
        }

        // Add feats (class, ancestry, general, skill)
        const featItems = await this._generateFeats();
        actorData.items.push(...featItems);

        if (game.settings.get("pf2e-npc-gen", "logGeneration")) {
            console.log("PF2e NPC Gen | Actor data:", JSON.parse(JSON.stringify(actorData)));
        }

        const newActor = await Actor.create(actorData);
        console.log("PF2e NPC Gen | Created PC actor:", newActor?.id, newActor?.name);
        return newActor;
    }

    _generateBio(name, className) {
        const quirk = PERSONALITY_QUIRKS[Math.floor(Math.random() * PERSONALITY_QUIRKS.length)];
        return `<p><strong>${name}</strong> is a ${this.ancestry.name} ${className}. ${this.theme.description}</p><p><em>Quirk: ${quirk}</em></p>`;
    }

    /**
     * Pull ancestry, heritage, background, and class items from PF2e compendiums.
     * These are the foundation items that the PC sheet uses to compute proficiencies,
     * HP, class features, etc.
     */
    async _generateCompendiumFoundation() {
        const items = [];

        // Ancestry (e.g., "Human" from pf2e.ancestries)
        const ancestryItem = await this._findItemInCompendium("pf2e.ancestries", this.ancestry.name);
        if (ancestryItem) {
            items.push(ancestryItem.toObject());
        }

        // Heritage (e.g., "Versatile Human" from pf2e.heritages)
        const heritageName = ANCESTRY_HERITAGE_MAP[this.ancestryKey];
        if (heritageName) {
            const heritageItem = await this._findItemInCompendium("pf2e.heritages", heritageName);
            if (heritageItem) {
                items.push(heritageItem.toObject());
            }
        }

        // Background (e.g., "Warrior" from pf2e.backgrounds)
        const backgroundName = ROLE_BACKGROUND_MAP[this.roleKey];
        if (backgroundName) {
            const bgItem = await this._findItemInCompendium("pf2e.backgrounds", backgroundName);
            if (bgItem) {
                items.push(bgItem.toObject());
            }
        }

        // Class (e.g., "Barbarian" from pf2e.classes)
        const className = ROLE_CLASS_MAP[this.roleKey];
        if (className) {
            const classItem = await this._findItemInCompendium("pf2e.classes", className);
            if (classItem) {
                items.push(classItem.toObject());
            }
        }

        return items;
    }

    async _findItemInCompendium(compendiumKey, itemName) {
        const pack = game.packs.get(compendiumKey);
        if (!pack) {
            console.warn(`PF2e NPC Gen | Compendium not found: ${compendiumKey}`);
            return null;
        }
        const index = await pack.getIndex({ fields: ["name", "type"] });
        const match = index.find(entry => entry.name.toLowerCase() === itemName.toLowerCase());
        if (match) return await pack.getDocument(match._id);
        console.warn(`PF2e NPC Gen | Item "${itemName}" not found in ${compendiumKey}`);
        return null;
    }

    _generateSpellcastingEntry() {
        const dcVal = STAT_TABLES.spellDC[this.roleTemplate.spellDC][this.levelIndex];
        const attackVal = STAT_TABLES.attack.high[this.levelIndex];

        return {
            name: "Arcane Spells",
            type: "spellcastingEntry",
            system: {
                spelldc: { dc: dcVal, value: attackVal, mod: 0 },
                tradition: { value: "arcane" },
                prepared: { value: "prepared" },
                showSlotlessLevels: { value: false }
            }
        };
    }

    async _generateEquipment() {
        const prefs = ROLE_EQUIPMENT_PREFS[this.roleKey] || ROLE_EQUIPMENT_PREFS["brute"];
        const items = [];

        // Select weapon
        let weaponCategory = BASIC_EQUIPMENT.weapons.melee;
        if (prefs.weapon === "bows") weaponCategory = BASIC_EQUIPMENT.weapons.ranged;
        const weaponList = weaponCategory[prefs.weapon] || weaponCategory.simple;
        const chosenWeaponName = weaponList[Math.floor(Math.random() * weaponList.length)];

        // Select armor
        const armorList = BASIC_EQUIPMENT.armor[prefs.armor] || BASIC_EQUIPMENT.armor.unarmored;
        const chosenArmorName = armorList[Math.floor(Math.random() * armorList.length)];

        try {
            // Add weapon — equipped in main hand
            const weaponItem = await this._findItemInCompendium("pf2e.equipment-srd", chosenWeaponName);
            if (weaponItem) {
                const weaponData = weaponItem.toObject();
                // Scale runes based on level
                const potency = Math.floor(this.level / 4);
                const striking = Math.floor((this.level - 1) / 3);
                if (potency > 0) weaponData.system.potencyRune = { value: Math.min(3, potency) };
                if (striking > 0) weaponData.system.strikingRune = { value: Math.min(3, striking) };
                // Equip the weapon (held in one or two hands)
                const isTwo = weaponData.system?.traits?.value?.includes("two-hand") ||
                              ["Greatsword", "Greataxe", "Maul", "Longbow"].includes(chosenWeaponName);
                weaponData.system.equipped = {
                    carryType: "held",
                    handsHeld: isTwo ? 2 : 1,
                    invested: null
                };
                items.push(weaponData);
            }

            // Add armor — equipped and invested
            const armorItem = await this._findItemInCompendium("pf2e.equipment-srd", chosenArmorName);
            if (armorItem) {
                const armorData = armorItem.toObject();
                // Scale resilient rune based on level
                const resilient = Math.floor((this.level + 1) / 5);
                if (resilient > 0) armorData.system.resilientRune = { value: Math.min(3, resilient) };
                armorData.system.equipped = {
                    carryType: "worn",
                    inSlot: true,
                    invested: true
                };
                items.push(armorData);
            }

            // Add shield if role prefers one
            if (prefs.shield) {
                const shieldName = BASIC_EQUIPMENT.shields[Math.floor(Math.random() * BASIC_EQUIPMENT.shields.length)];
                const shieldItem = await this._findItemInCompendium("pf2e.equipment-srd", shieldName);
                if (shieldItem) {
                    const shieldData = shieldItem.toObject();
                    shieldData.system.equipped = {
                        carryType: "held",
                        handsHeld: 1,
                        invested: null
                    };
                    items.push(shieldData);
                }
            }

            // Add basic adventuring gear
            for (const gearName of BASIC_EQUIPMENT.adventuringGear) {
                const gearItem = await this._findItemInCompendium("pf2e.equipment-srd", gearName);
                if (gearItem) {
                    const gearData = gearItem.toObject();
                    gearData.system.equipped = {
                        carryType: "stowed",
                        invested: null
                    };
                    items.push(gearData);
                }
            }

            // Add a healing potion appropriate for level
            const potionIndex = Math.min(
                BASIC_EQUIPMENT.consumables.healing.length - 1,
                Math.floor(this.level / 5)
            );
            const potionName = BASIC_EQUIPMENT.consumables.healing[potionIndex];
            const potionItem = await this._findItemInCompendium("pf2e.equipment-srd", potionName);
            if (potionItem) {
                items.push(potionItem.toObject());
            }
        } catch (e) {
            console.error("PF2e NPC Gen | Equipment generation error:", e);
        }

        return items;
    }

    /**
     * Generate feats from pf2e.feats-srd compendium.
     * Pulls class feats, ancestry feats, general feats, and skill feats
     * based on role and ancestry with probabilistic selection.
     */
    async _generateFeats() {
        const items = [];
        const roleFeatData = ROLE_FEATS[this.roleKey];
        if (!roleFeatData) return items;

        const addFeats = async (featList, category) => {
            if (!featList) return;
            for (const feat of featList) {
                if (Math.random() <= feat.chance) {
                    const doc = await this._findItemInCompendium("pf2e.feats-srd", feat.name);
                    if (doc) {
                        const data = doc.toObject();
                        // Tag the feat category for sheet display
                        if (data.system && category) {
                            data.system.category = category;
                        }
                        items.push(data);
                    }
                }
            }
        };

        // Class feats
        await addFeats(roleFeatData.class, "class");

        // Ancestry feats (specific to chosen ancestry)
        const ancestryFeats = roleFeatData.ancestry?.[this.ancestryKey];
        await addFeats(ancestryFeats, "ancestry");

        // General feats
        await addFeats(roleFeatData.general, "general");

        // Skill feats
        await addFeats(roleFeatData.skill, "skill");

        return items;
    }

    async _generateSpells(spellcastingEntryId) {
        const items = [];
        const pack = game.packs.get("pf2e.spells-srd");
        if (!pack) return items;
        const index = await pack.getIndex({ fields: ["name", "system.level.value", "system.traits.value"] });
        const maxRank = Math.max(1, Math.ceil(this.level / 2));
        const ranks = [0];
        for (let r = 1; r <= maxRank; r++) ranks.push(r);

        for (const targetRank of ranks) {
            const matchingSpells = index.filter(entry => {
                const isCantrip = entry.system?.traits?.value?.includes("cantrip");
                if (targetRank === 0 && !isCantrip) return false;
                if (targetRank > 0 && (isCantrip || entry.system?.level?.value !== targetRank)) return false;
                return entry.system?.traits?.value?.includes("arcane");
            });
            if (matchingSpells.length === 0) continue;
            const num = targetRank === 0 ? 3 : Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < num; i++) {
                const match = matchingSpells[Math.floor(Math.random() * matchingSpells.length)];
                try {
                    const doc = await pack.getDocument(match._id);
                    if (doc) {
                        const data = doc.toObject();
                        if (!data.system.location) data.system.location = {};
                        data.system.location.value = spellcastingEntryId;
                        items.push(data);
                    }
                } catch (e) { console.error(e); }
            }
        }
        return items;
    }
}
