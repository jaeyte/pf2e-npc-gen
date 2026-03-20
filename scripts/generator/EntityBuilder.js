import { STAT_TABLES, ROLE_TEMPLATES } from "./DataTables.js";
import { BASIC_EQUIPMENT, ROLE_EQUIPMENT_PREFS } from "./EquipmentTables.js";
import { ROLE_FEATURES } from "./FeatureTables.js";
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
        const actorName = this.overrides.name
            ? this.overrides.name
            : `${prefix}${firstName} (${this.ancestry.name} ${this.roleKey.capitalize()})`;

        let bio;
        if (this.overrides.biography) {
            bio = this.overrides.biography;
            if (this.overrides.personality) bio += `<p><em>${this.overrides.personality}</em></p>`;
        } else {
            bio = this._generateBio(firstName);
        }

        let actorData = {
            name: actorName,
            type: "npc",
            system: {
                ...this._generateBaseStats(),
                details: {
                    level: { value: this.level },
                    alliance: "opposition",
                    source: { value: "pf2e-npc-gen" },
                    languages: { value: ["common"] },
                    publicNotes: bio
                }
            },
            items: []
        };

        // Apply Ancestry & Theme Traits
        actorData.system.traits = {
            value: [...new Set([...this.ancestry.traits, ...(this.theme.traits || [])])],
            rarity: "common",
            size: { value: "med" }
        };

        // Add standard strike
        if (this.roleTemplate.attack) {
            actorData.items.push(this._generateBaseStrike());
        }

        // Add spellcasting entry
        if (this.roleTemplate.spellDC) {
            const spellcastingEntry = this._generateSpellcastingEntry();
            spellcastingEntry._id = foundry.utils.randomID();
            actorData.items.push(spellcastingEntry);
            const spellItems = await this._generateSpells(spellcastingEntry._id);
            actorData.items.push(...spellItems);
        }

        if (this.generateEquipment) {
           const equipmentItems = await this._generateEquipment();
           actorData.items.push(...equipmentItems);
        }

        const featureItems = await this._generateFeatures();
        actorData.items.push(...featureItems);

        if (game.settings.get("pf2e-npc-gen", "logGeneration")) {
            console.log("PF2e NPC Gen | Actor data:", JSON.parse(JSON.stringify(actorData)));
        }

        const newActor = await Actor.create(actorData);
        console.log("PF2e NPC Gen | Created actor:", newActor?.id, newActor?.name);
        return newActor;
    }

    _generateBio(name) {
        const quirk = PERSONALITY_QUIRKS[Math.floor(Math.random() * PERSONALITY_QUIRKS.length)];
        return `<p><strong>${name}</strong> is a ${this.ancestry.name} ${this.roleKey}. ${this.theme.description}</p><p><em>Quirk: ${quirk}</em></p>`;
    }

    _generateBaseStats() {
        let hpVal = STAT_TABLES.hp[this.roleTemplate.hp][this.levelIndex];
        let acVal = STAT_TABLES.ac[this.roleTemplate.ac][this.levelIndex];
        
        let fortVal = STAT_TABLES.saves[this.roleTemplate.fortitude][this.levelIndex];
        let refVal  = STAT_TABLES.saves[this.roleTemplate.reflex][this.levelIndex];
        let willVal = STAT_TABLES.saves[this.roleTemplate.will][this.levelIndex];

        // Apply Ancestry Tweaks
        if (this.ancestry.statTweaks) {
            if (this.ancestry.statTweaks.hp) hpVal += this.ancestry.statTweaks.hp;
        }

        // Apply Theme Tweaks
        if (this.theme.statTweaks) {
            if (this.theme.statTweaks.hp) hpVal += this.theme.statTweaks.hp;
            if (this.theme.statTweaks.ac) acVal += this.theme.statTweaks.ac;
            if (this.theme.statTweaks.saves) {
                fortVal += this.theme.statTweaks.saves;
                refVal += this.theme.statTweaks.saves;
                willVal += this.theme.statTweaks.saves;
            }
        }

        const system = {
            abilities: {
                str: { mod: this.roleTemplate.abilityMods?.str ?? 0 },
                dex: { mod: this.roleTemplate.abilityMods?.dex ?? 0 },
                con: { mod: this.roleTemplate.abilityMods?.con ?? 0 },
                int: { mod: this.roleTemplate.abilityMods?.int ?? 0 },
                wis: { mod: this.roleTemplate.abilityMods?.wis ?? 0 },
                cha: { mod: this.roleTemplate.abilityMods?.cha ?? 0 }
            },
            attributes: {
                hp: { value: hpVal, max: hpVal },
                ac: { value: acVal },
                speed: { value: this.ancestry.speed },
                immunities: [],
                resistances: [],
                weaknesses: []
            },
            saves: {
                fortitude: { value: fortVal },
                reflex: { value: refVal },
                will: { value: willVal }
            }
        };

        // Resources
        system.resources = {};

        // Add Perception & Senses
        const perceptionMod = STAT_TABLES.saves[this.roleTemplate.will]?.[this.levelIndex] || 0;
        const senses = [];
        if (this.ancestry.senses) senses.push({ type: this.ancestry.senses.toLowerCase().replace(/\s+/g, "-") });
        if (this.theme.senses) senses.push({ type: this.theme.senses.toLowerCase().replace(/\s+/g, "-") });
        system.perception = { value: perceptionMod, senses: senses };

        // Resistances / Weaknesses
        if (this.theme.resistances) {
            system.attributes.resistances = this.theme.resistances.map(r => ({
                type: r.type,
                value: r.value === "Level" ? this.level : r.value
            }));
        }
        if (this.theme.weaknesses) {
            system.attributes.weaknesses = this.theme.weaknesses.map(w => ({
                type: w.type,
                value: w.value === "Level" ? this.level : w.value
            }));
        }

        return system;
    }

    _generateBaseStrike() {
        let attackBonus = STAT_TABLES.attack[this.roleTemplate.attack][this.levelIndex];
        const damageFormula = STAT_TABLES.damage[this.roleTemplate.damage][this.levelIndex];
        const damageType = this.theme.damageType || "bludgeoning";

        if (this.theme.statTweaks?.attack) attackBonus += this.theme.statTweaks.attack;

        return {
            name: this.theme.damageType ? `${this.theme.name} Strike` : "Default Strike",
            type: "melee",
            system: {
                damageRolls: {
                    damage1: { damage: damageFormula, damageType: damageType }
                },
                bonus: { value: attackBonus },
                traits: { value: [] },
                weaponType: { value: "simple" },
            }
        };
    }

    _generateSpellcastingEntry() {
          const dcVal = STAT_TABLES.spellDC[this.roleTemplate.spellDC][this.levelIndex];
          const attackVal = STAT_TABLES.attack.high[this.levelIndex];

          return {
             name: "Innate Spells",
             type: "spellcastingEntry",
             system: {
                 spelldc: { dc: dcVal, value: attackVal, mod: 0 },
                 tradition: { value: "arcane" },
                 prepared: { value: "innate" },
                 showSlotlessLevels: { value: false }
             }
          }
    }

    async _findItemInCompendium(compendiumKey, itemName) {
        const pack = game.packs.get(compendiumKey);
        if (!pack) return null;
        const index = await pack.getIndex({fields: ["name", "type"]});
        const match = index.find(entry => entry.name.toLowerCase() === itemName.toLowerCase());
        if (match) return await pack.getDocument(match._id);
        return null;
    }

    async _generateEquipment() {
        const prefs = ROLE_EQUIPMENT_PREFS[this.roleKey] || ROLE_EQUIPMENT_PREFS["brute"];
        const items = [];
        let weaponCategory = BASIC_EQUIPMENT.weapons.melee;
        if (prefs.weapon === 'bows') weaponCategory = BASIC_EQUIPMENT.weapons.ranged;

        const weaponList = weaponCategory[prefs.weapon] || weaponCategory.simple;
        const chosenWeaponName = weaponList[Math.floor(Math.random() * weaponList.length)];
        const armorList = BASIC_EQUIPMENT.armor[prefs.armor] || BASIC_EQUIPMENT.armor.unarmored;
        const chosenArmorName = armorList[Math.floor(Math.random() * armorList.length)];

        try {
            const weaponItem = await this._findItemInCompendium("pf2e.equipment-srd", chosenWeaponName);
            if (weaponItem) {
                const weaponData = weaponItem.toObject();
                const potency = Math.floor(this.level / 4);
                const striking = Math.floor((this.level - 1) / 3);
                weaponData.system.potencyRune = { value: Math.max(0, Math.min(3, potency)) };
                weaponData.system.strikingRune = { value: Math.max(0, Math.min(3, striking)) };
                items.push(weaponData);
            }
            const armorItem = await this._findItemInCompendium("pf2e.equipment-srd", chosenArmorName);
            if (armorItem) {
                 const armorData = armorItem.toObject();
                 armorData.system.equipped.inSlot = true;
                 items.push(armorData);
            }
        } catch (e) { console.error(e); }
        return items;
    }

    async _generateFeatures() {
        const items = [];
        const potentialFeatures = ROLE_FEATURES[this.roleKey] || [];
        for (const feature of potentialFeatures) {
            if (Math.random() <= feature.chance) {
                const entity = await this._findItemInCompendium("pf2e.bestiary-ability-glossary-srd", feature.name);
                if (entity) items.push(entity.toObject());
            }
        }
        const featPack = game.packs.get("pf2e.feats-srd");
        if (featPack) {
            const index = await featPack.getIndex({fields: ["name", "system.level.value", "system.traits.value"]});
            const roleTraits = this._getTraitsForRole(this.roleKey);
            const possibleFeats = index.filter(f => (f.system?.level?.value || 0) <= this.level && roleTraits.some(t => f.system?.traits?.value?.includes(t)));
            if (possibleFeats.length > 0) {
                const numFeats = Math.floor(Math.random() * 2) + 1;
                for (let i = 0; i < numFeats; i++) {
                    const match = possibleFeats[Math.floor(Math.random() * possibleFeats.length)];
                    const featDoc = await featPack.getDocument(match._id);
                    if (featDoc) {
                        const featData = featDoc.toObject();
                        if (!items.find(it => it.name === featData.name)) items.push(featData);
                    }
                }
            }
        }
        return items;
    }

    _getTraitsForRole(role) {
        switch(role) {
            case "brute": return ["fighter", "barbarian", "rage"];
            case "skirmisher": return ["rogue", "swashbuckler", "finesse"];
            case "spellcaster": return ["wizard", "sorcerer", "magical"];
            case "sniper": return ["ranger", "archetype", "ranged"];
            case "soldier": return ["fighter", "champion", "stance"];
            default: return ["general"];
        }
    }

    async _generateSpells(spellcastingEntryId) {
        const items = [];
        const pack = game.packs.get("pf2e.spells-srd");
        if (!pack) return items;
        const index = await pack.getIndex({fields: ["name", "system.level.value", "system.traits.value"]});
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
            const num = targetRank === 0 ? 2 : Math.floor(Math.random() * 2) + 1;
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
