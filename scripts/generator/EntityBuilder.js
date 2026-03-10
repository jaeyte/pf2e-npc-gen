import { STAT_TABLES, ROLE_TEMPLATES } from "./DataTables.js";
import { BASIC_EQUIPMENT, ROLE_EQUIPMENT_PREFS } from "./EquipmentTables.js";
import { ROLE_FEATURES } from "./FeatureTables.js";

export class EntityBuilder {
    constructor(params = {}) {
        const {
            level = 1,
            roleKey = "brute",
            generateEquipment = true,
            name = null,
            biography = null,
            templateAdjustment = null,
            spellTradition = "arcane",
            spellcastingType = "innate",
            equipmentList = [],
            spellList = [],
            featureList = [],
            skillList = []
        } = params;

        // Clamp level between -1 and 25
        this.level = Math.max(-1, Math.min(25, level));

        // Use brute as fallback if role is invalid
        this.roleKey = ROLE_TEMPLATES[roleKey] ? roleKey : "brute";
        this.roleTemplate = ROLE_TEMPLATES[this.roleKey];

        this.generateEquipment = generateEquipment;
        this.name = name;
        this.biography = biography;
        this.templateAdjustment = templateAdjustment;
        this.spellTradition = spellTradition || "arcane";
        this.spellcastingType = spellcastingType || "innate";

        this.customEquipment = Array.isArray(equipmentList) ? equipmentList : [];
        this.customSpells = Array.isArray(spellList) ? spellList : [];
        this.customFeatures = Array.isArray(featureList) ? featureList : [];
        this.customSkills = Array.isArray(skillList) ? skillList : [];

        this.levelIndex = this.level + 1; // Array index: -1 is index 0, 0 is index 1, etc.
    }

    async generateNPC() {
        const fallbackName = `Generated ${this.roleKey.charAt(0).toUpperCase() + this.roleKey.slice(1)} (Level ${this.level})`;
        const actorName = this.name || fallbackName;

        let actorData = {
            name: actorName,
            type: "npc",
            system: { ...this._generateBaseStats() },
            items: []
        };

        if (this.biography) {
            actorData.system.details.publicNotes = this.biography;
        }

        // Add standard strike if it's a martial-ish concept
        if (this.roleTemplate.attack) {
            actorData.items.push(this._generateBaseStrike());
        }

        // Add dummy spellcasting entry if it's a caster concept
        if (this.roleTemplate.spellDC) {
            const spellcastingEntry = this._generateSpellcastingEntry();
            // Generate a random ID so we can link spells to it
            spellcastingEntry._id = foundry.utils.randomID();
            actorData.items.push(spellcastingEntry);

            const spellItems = await this._generateSpells(spellcastingEntry._id);
            actorData.items.push(...spellItems);
        }

        if (this.generateEquipment) {
            const equipmentItems = await this._generateEquipment();
            actorData.items.push(...equipmentItems);
        }

        // Add Role Features
        const featureItems = await this._generateFeatures();
        actorData.items.push(...featureItems);

        // Create the Actor in Foundry
        const newActor = await Actor.create(actorData);
        return newActor;
    }

    _generateBaseStats() {
        const hpVal = STAT_TABLES.hp[this.roleTemplate.hp][this.levelIndex];
        const acVal = STAT_TABLES.ac[this.roleTemplate.ac][this.levelIndex];

        const fortVal = STAT_TABLES.saves[this.roleTemplate.fortitude][this.levelIndex];
        const refVal = STAT_TABLES.saves[this.roleTemplate.reflex][this.levelIndex];
        const willVal = STAT_TABLES.saves[this.roleTemplate.will][this.levelIndex];

        // Calculate a competitive skill mod for this level
        const highSkillMod = STAT_TABLES.attack.high[this.levelIndex] - 2; // Rough approximation for good skills
        const skillsObj = {};

        // If AI provided specific skills, use them exclusively
        if (this.customSkills.length > 0) {
            for (const skill of this.customSkills) {
                if (skill.id && typeof skill.mod === 'number') {
                    skillsObj[skill.id] = { base: skill.mod };
                }
            }
        } else {
            // Otherwise fallback to Role defaults
            if (this.roleKey === "skirmisher" || this.roleKey === "sniper") {
                skillsObj.acr = { base: highSkillMod };
                skillsObj.ste = { base: highSkillMod };
            } else if (this.roleKey === "spellcaster") {
                skillsObj.arc = { base: highSkillMod };
                skillsObj.occ = { base: highSkillMod };
                skillsObj.med = { base: highSkillMod };
            } else {
                // Brute / Soldier
                skillsObj.ath = { base: highSkillMod };
                skillsObj.itm = { base: highSkillMod };
            }
        }

        // Calculate Ability Modifiers
        const primaryMod = Math.max(1, Math.floor(this.level / 4) + 3);
        const secondaryMod = Math.max(0, primaryMod - 2);
        const averageMod = Math.max(0, Math.floor(this.level / 5));

        const abilitiesObj = {
            str: { mod: averageMod },
            dex: { mod: averageMod },
            con: { mod: averageMod },
            int: { mod: averageMod },
            wis: { mod: averageMod },
            cha: { mod: averageMod }
        };

        if (this.roleKey === "brute" || this.roleKey === "soldier") {
            abilitiesObj.str.mod = primaryMod;
            abilitiesObj.con.mod = secondaryMod;
        } else if (this.roleKey === "skirmisher" || this.roleKey === "sniper") {
            abilitiesObj.dex.mod = primaryMod;
            abilitiesObj.wis.mod = secondaryMod;
        } else if (this.roleKey === "spellcaster") {
            abilitiesObj.int.mod = primaryMod; // Alternatively CHA/WIS based on tradition, but INT is a safe base.
            abilitiesObj.cha.mod = secondaryMod;
        }

        const baseStats = {
            details: {
                level: { value: this.level }
            },
            attributes: {
                hp: {
                    value: hpVal,
                    max: hpVal,
                    temp: 0,
                    details: ""
                },
                ac: {
                    value: acVal,
                    details: ""
                }
            },
            saves: {
                fortitude: { value: fortVal, saveDetail: "" },
                reflex: { value: refVal, saveDetail: "" },
                will: { value: willVal, saveDetail: "" }
            },
            skills: skillsObj,
            abilities: abilitiesObj
        };

        if (this.templateAdjustment) {
            baseStats.attributes.adjustment = this.templateAdjustment; // "elite" or "weak"
        }

        return baseStats;
    }

    _generateBaseStrike() {
        const attackBonus = STAT_TABLES.attack[this.roleTemplate.attack][this.levelIndex];
        const damageFormula = STAT_TABLES.damage[this.roleTemplate.damage][this.levelIndex];

        return {
            name: "Default Strike",
            type: "melee",
            system: {
                damageRolls: {
                    damage1: { damage: damageFormula, damageType: "bludgeoning" }
                },
                bonus: { value: attackBonus },
                weaponType: { value: "simple" },
            }
        };
    }

    _generateSpellcastingEntry() {
        const dcVal = STAT_TABLES.spellDC[this.roleTemplate.spellDC][this.levelIndex];
        const attackVal = STAT_TABLES.attack.high[this.levelIndex]; // Assume high relative attack for casters

        return {
            name: `${this.spellTradition.charAt(0).toUpperCase() + this.spellTradition.slice(1)} Spells`,
            type: "spellcastingEntry",
            system: {
                spelldc: { dc: dcVal, value: attackVal, mod: 0 },
                tradition: { value: this.spellTradition },
                prepared: {
                    value: this.spellcastingType,
                    flexible: false,
                    validPriorities: this.spellcastingType === "prepared" ? [] : [0]
                },
                showSlotlessLevels: { value: false },
                slots: this._generateSpellSlots()
            }
        }
    }

    _generateSpellSlots() {
        const slots = {};
        // innate doesn't use slots on the entry level
        if (this.spellcastingType === "innate") return slots;

        // Max rank is roughly half level rounded up
        const maxRank = Math.max(1, Math.ceil(this.level / 2));
        for (let r = 1; r <= 10; r++) {
            // Standard NPC caster might get 3 slots per level up to their max rank
            if (r <= maxRank) {
                slots[`slot${r}`] = { max: 3, value: 3 };
            } else {
                slots[`slot${r}`] = { max: 0, value: 0 };
            }
        }
        return slots;
    }

    async _findItemInCompendium(compendiumKey, itemName) {
        const pack = game.packs.get(compendiumKey);
        if (!pack) {
            console.warn(`PF2e NPC Gen | Compendium ${compendiumKey} not found.`);
            return null;
        }

        // Use the index for fast searching by name
        const index = await pack.getIndex({ fields: ["name", "type", "system.level.value", "system.traits.value", "system.spellType"] });

        // Find exact match (case-insensitive for robustness)
        const match = index.find(entry => entry.name.toLowerCase() === itemName.toLowerCase());

        if (match) {
            return await pack.getDocument(match._id);
        }
        return null;
    }

    async _generateEquipment() {
        const items = [];

        // If AI explicitly requested equipment, use ONLY that equipment.
        if (this.customEquipment.length > 0) {
            // Define packs to search for gear
            const packsToSearch = ["pf2e.equipment-srd", "pf2e.pathfinder-society-boons", "pf2e.gm-core-srd"];

            for (const itemName of this.customEquipment) {
                // Handle "Gold" or "Coins" specifically if we want, but PF2e has coin items
                try {
                    let itemDoc = null;
                    for (const packPrefix of packsToSearch) {
                        if (!itemDoc) {
                            itemDoc = await this._findItemInCompendium(packPrefix, itemName);
                        }
                    }

                    if (itemDoc) {
                        const itemData = itemDoc.toObject();
                        // Auto-equip armor
                        if (itemData.type === 'armor') {
                            itemData.system.equipped = { inSlot: true };
                        }

                        // Roughly scale weapon runes based on level
                        if (itemData.type === 'weapon') {
                            const potency = Math.floor(this.level / 4);
                            const striking = Math.floor((this.level - 1) / 3);
                            itemData.system.potencyRune = { value: Math.max(0, Math.min(3, potency)) };
                            itemData.system.strikingRune = { value: Math.max(0, Math.min(3, striking)) };
                        }
                        items.push(itemData);
                    } else {
                        console.warn(`PF2e NPC Gen | AI requested Equipment '${itemName}' not found in any standard equipment comps.`);
                    }
                } catch (e) {
                    console.error(`PF2e NPC Gen | Error fetching AI equipment ${itemName}:`, e);
                }
            }
            return items;
        }

        // Fallback to randomized equipment table
        const prefs = ROLE_EQUIPMENT_PREFS[this.roleKey] || ROLE_EQUIPMENT_PREFS["brute"];
        let weaponCategory = BASIC_EQUIPMENT.weapons.melee;
        if (prefs.weapon === 'bows') {
            weaponCategory = BASIC_EQUIPMENT.weapons.ranged;
        }

        const weaponList = weaponCategory[prefs.weapon] || weaponCategory.simple;
        const chosenWeaponName = weaponList[Math.floor(Math.random() * weaponList.length)];

        // Armor
        const armorList = BASIC_EQUIPMENT.armor[prefs.armor] || BASIC_EQUIPMENT.armor.unarmored;
        const chosenArmorName = armorList[Math.floor(Math.random() * armorList.length)];

        // Fetch the core items from the PF2e Compendium dynamically
        try {
            const weaponItem = await this._findItemInCompendium("pf2e.equipment-srd", chosenWeaponName);
            if (weaponItem) {
                const weaponData = weaponItem.toObject();
                // Override striking/potency runes based on level roughly
                const potency = Math.floor(this.level / 4);
                const striking = Math.floor((this.level - 1) / 3);

                weaponData.system.potencyRune = { value: Math.max(0, Math.min(3, potency)) };
                weaponData.system.strikingRune = { value: Math.max(0, Math.min(3, striking)) };
                items.push(weaponData);
            } else {
                console.warn(`PF2e NPC Gen | Weapon '${chosenWeaponName}' not found in equipment-srd.`);
            }

            const armorItem = await this._findItemInCompendium("pf2e.equipment-srd", chosenArmorName);
            if (armorItem) {
                const armorData = armorItem.toObject();
                armorData.system.equipped.inSlot = true; // Auto-equip
                items.push(armorData);
            } else {
                console.warn(`PF2e NPC Gen | Armor '${chosenArmorName}' not found in equipment-srd.`);
            }
        } catch (e) {
            console.error("PF2e NPC Gen | Error fetching core equipment:", e);
        }

        // Add extra gear based on wealth/level (Approximation of GMG Encounter Treasure)
        // Level 1-4: 1 minor item. Level 5-10: 2 items. Level 11+: 3 items.
        let extraItemCount = 0;
        if (this.level >= 1) extraItemCount = 1;
        if (this.level >= 5) extraItemCount = 2;
        if (this.level >= 11) extraItemCount = 3;

        if (extraItemCount > 0) {
            const pack = game.packs.get("pf2e.equipment-srd");
            if (pack) {
                const index = await pack.getIndex({ fields: ["name", "type", "system.level.value", "system.traits.value"] });

                // Filter for valid treasure/consumables close to the NPC's level
                const targetLevel = Math.max(1, this.level - 1);
                const validLoot = index.filter(entry => {
                    const isConsumable = entry.type === "consumable";
                    const isEquipment = entry.type === "equipment";
                    const isBackpack = entry.type === "backpack";

                    if (!(isConsumable || isEquipment || isBackpack)) return false;

                    const itemLevel = entry.system?.level?.value || 0;
                    // Grab items around the NPC's level or slightly below
                    return itemLevel > 0 && itemLevel <= targetLevel + 1 && itemLevel >= targetLevel - 3;
                });

                if (validLoot.length > 0) {
                    for (let i = 0; i < extraItemCount; i++) {
                        const randomLoot = validLoot[Math.floor(Math.random() * validLoot.length)];
                        try {
                            const lootDoc = await pack.getDocument(randomLoot._id);
                            if (lootDoc) {
                                items.push(lootDoc.toObject());
                            }
                        } catch (e) {
                            console.error(`PF2e NPC Gen | Error fetching extra loot ${randomLoot.name}:`, e);
                        }
                    }
                }
            }
        }

        return items;
    }

    async _generateFeatures() {
        const items = [];

        // If AI explicitly requested features, use ONLY those features
        if (this.customFeatures.length > 0) {
            for (const featureName of this.customFeatures) {
                try {
                    const featureEntity = await this._findItemInCompendium("pf2e.bestiary-ability-glossary-srd", featureName);
                    if (featureEntity) {
                        items.push(featureEntity.toObject());
                    } else {
                        console.warn(`PF2e NPC Gen | AI requested Feature '${featureName}' not found.`);
                    }
                } catch (e) {
                    console.error(`PF2e NPC Gen | Error fetching AI feature: ${featureName}`, e);
                }
            }
            return items;
        }

        // Fallback to randomized features based on role
        const potentialFeatures = ROLE_FEATURES[this.roleKey] || [];

        for (const feature of potentialFeatures) {
            // Roll against the feature's chance to see if it's added
            if (Math.random() <= feature.chance) {
                try {
                    const featureEntity = await this._findItemInCompendium("pf2e.bestiary-ability-glossary-srd", feature.name);
                    if (featureEntity) {
                        items.push(featureEntity.toObject());
                    } else {
                        console.warn(`PF2e NPC Gen | Feature '${feature.name}' not found.`);
                    }
                } catch (e) {
                    console.error(`PF2e NPC Gen | Error fetching feature: ${feature.name}`, e);
                }
            }
        }

        return items;
    }

    async _generateSpells(spellcastingEntryId) {
        const items = [];
        const pack = game.packs.get("pf2e.spells-srd");
        if (!pack) {
            console.warn("PF2e NPC Gen | spells-srd compendium not found.");
            return items;
        }

        // If AI explicitly requested spells, fetch them directly
        if (this.customSpells.length > 0) {
            for (const spellName of this.customSpells) {
                try {
                    const spellDoc = await this._findItemInCompendium("pf2e.spells-srd", spellName);
                    if (spellDoc) {
                        const spellData = spellDoc.toObject();
                        if (!spellData.system.location) {
                            spellData.system.location = {};
                        }
                        spellData.system.location.value = spellcastingEntryId;
                        items.push(spellData);
                    } else {
                        console.warn(`PF2e NPC Gen | AI requested Spell '${spellName}' not found.`);
                    }
                } catch (e) {
                    console.error(`PF2e NPC Gen | Error fetching AI spell ${spellName}:`, e);
                }
            }
            return items;
        }

        // Fallback: Randomly generate Spells from Compendium Index
        const index = await pack.getIndex({ fields: ["name", "type", "system.level.value", "system.traits.value"] });

        // Calculate max spell rank (half level rounded up)
        const maxRank = Math.max(1, Math.ceil(this.level / 2));

        // Select roughly 2 cantrips and 1-2 spells per available rank
        const ranksToPopulate = [0]; // 0 is Cantrip
        for (let r = 1; r <= maxRank; r++) {
            ranksToPopulate.push(r);
        }

        for (const targetRank of ranksToPopulate) {
            // Filter index for arcane spells of the target rank
            const matchingSpells = index.filter(entry => {
                const isCantrip = entry.system?.traits?.value?.includes("cantrip");
                if (targetRank === 0 && !isCantrip) return false;
                if (targetRank > 0 && isCantrip) return false;
                if (targetRank > 0 && entry.system?.level?.value !== targetRank) return false;

                // Filter based on the chosen tradition
                if (!entry.system?.traits?.value?.includes(this.spellTradition)) return false;

                return true;
            });

            if (matchingSpells.length === 0) continue;

            const numSpellsToPick = targetRank === 0 ? 2 : Math.floor(Math.random() * 2) + 1; // 2 cantrips, 1-2 others

            for (let i = 0; i < numSpellsToPick; i++) {
                const randomMatch = matchingSpells[Math.floor(Math.random() * matchingSpells.length)];
                try {
                    const spellDoc = await pack.getDocument(randomMatch._id);
                    if (spellDoc) {
                        const spellData = spellDoc.toObject();
                        // Important: setting system.location.value to the spellcasting entry ID links it
                        if (!spellData.system.location) {
                            spellData.system.location = {};
                        }
                        spellData.system.location.value = spellcastingEntryId;
                        items.push(spellData);
                    }
                } catch (e) {
                    console.error(`PF2e NPC Gen | Error fetching spell ${randomMatch.name}:`, e);
                }
            }
        }

        return items;
    }
}
