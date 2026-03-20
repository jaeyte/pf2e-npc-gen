import { STAT_TABLES, ROLE_TEMPLATES, ROLE_CLASS_MAP, ROLE_BACKGROUND_MAP, ANCESTRY_HERITAGE_MAP } from "./DataTables.js";
import { BASIC_EQUIPMENT, ROLE_EQUIPMENT_PREFS } from "./EquipmentTables.js";
import { ROLE_FEATS, FEAT_SLOT_LEVELS, WIZARD_SPELL_SLOTS } from "./FeatureTables.js";
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

    _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
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

        // Add spellcasting entry + spells for spellcaster role (fill ALL slots)
        if (this.roleTemplate.spellDC) {
            const spellcastingEntry = this._generateSpellcastingEntry();
            spellcastingEntry._id = foundry.utils.randomID();
            actorData.items.push(spellcastingEntry);
            const spellItems = await this._generateSpells(spellcastingEntry._id);
            actorData.items.push(...spellItems);
        }

        // Add equipment (weapons, armor, shields, gear) — always for a ready character
        if (this.generateEquipment) {
            const equipmentItems = await this._generateEquipment();
            actorData.items.push(...equipmentItems);
        }

        // Fill ALL feat slots (class, ancestry, general, skill)
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
     */
    async _generateCompendiumFoundation() {
        const items = [];

        const ancestryItem = await this._findItemInCompendium("pf2e.ancestries", this.ancestry.name);
        if (ancestryItem) items.push(ancestryItem.toObject());

        const heritageName = ANCESTRY_HERITAGE_MAP[this.ancestryKey];
        if (heritageName) {
            const heritageItem = await this._findItemInCompendium("pf2e.heritages", heritageName);
            if (heritageItem) items.push(heritageItem.toObject());
        }

        const backgroundName = ROLE_BACKGROUND_MAP[this.roleKey];
        if (backgroundName) {
            const bgItem = await this._findItemInCompendium("pf2e.backgrounds", backgroundName);
            if (bgItem) items.push(bgItem.toObject());
        }

        const className = ROLE_CLASS_MAP[this.roleKey];
        if (className) {
            const classItem = await this._findItemInCompendium("pf2e.classes", className);
            if (classItem) items.push(classItem.toObject());
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
            // Weapon — equipped and held
            const weaponItem = await this._findItemInCompendium("pf2e.equipment-srd", chosenWeaponName);
            if (weaponItem) {
                const weaponData = weaponItem.toObject();
                const potency = Math.floor(this.level / 4);
                const striking = Math.floor((this.level - 1) / 3);
                if (potency > 0) weaponData.system.potencyRune = { value: Math.min(3, potency) };
                if (striking > 0) weaponData.system.strikingRune = { value: Math.min(3, striking) };
                const isTwo = weaponData.system?.traits?.value?.includes("two-hand") ||
                              ["Greatsword", "Greataxe", "Maul", "Longbow"].includes(chosenWeaponName);
                weaponData.system.equipped = {
                    carryType: "held",
                    handsHeld: isTwo ? 2 : 1,
                    invested: null
                };
                items.push(weaponData);
            }

            // Armor — equipped and invested
            const armorItem = await this._findItemInCompendium("pf2e.equipment-srd", chosenArmorName);
            if (armorItem) {
                const armorData = armorItem.toObject();
                const resilient = Math.floor((this.level + 1) / 5);
                if (resilient > 0) armorData.system.resilientRune = { value: Math.min(3, resilient) };
                armorData.system.equipped = {
                    carryType: "worn",
                    inSlot: true,
                    invested: true
                };
                items.push(armorData);
            }

            // Shield
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

            // Adventuring gear
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

            // Healing potion appropriate for level
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
     * Deterministically fill ALL feat slots based on character level.
     * Calculates the exact number of class/ancestry/general/skill feats
     * the character should have and picks that many from the tables.
     */
    async _generateFeats() {
        const items = [];
        const roleFeatData = ROLE_FEATS[this.roleKey];
        if (!roleFeatData) return items;
        const charLevel = Math.max(1, this.level);

        /**
         * For a given category, determine how many feat slots are available,
         * filter the feat pool to level-appropriate options, shuffle, and
         * pick exactly the right number (no more, no less).
         */
        const fillSlots = async (featPool, category, slotLevels) => {
            const slotsNeeded = slotLevels.filter(l => l <= charLevel).length;
            if (slotsNeeded === 0 || !featPool || featPool.length === 0) return;

            // Filter to feats the character qualifies for
            const eligible = featPool.filter(f => f.maxLevel <= charLevel);
            // Shuffle so each generation is different
            const shuffled = this._shuffle(eligible);
            const picked = shuffled.slice(0, slotsNeeded);

            for (const feat of picked) {
                const doc = await this._findItemInCompendium("pf2e.feats-srd", feat.name);
                if (doc) {
                    const data = doc.toObject();
                    if (data.system) data.system.category = category;
                    items.push(data);
                }
            }
        };

        // Class feats — fill every class feat slot
        await fillSlots(roleFeatData.class, "class", FEAT_SLOT_LEVELS.class);

        // Ancestry feats — fill every ancestry feat slot
        const ancestryFeats = roleFeatData.ancestry?.[this.ancestryKey] || [];
        await fillSlots(ancestryFeats, "ancestry", FEAT_SLOT_LEVELS.ancestry);

        // General feats — fill every general feat slot
        await fillSlots(roleFeatData.general, "general", FEAT_SLOT_LEVELS.general);

        // Skill feats — fill every skill feat slot
        await fillSlots(roleFeatData.skill, "skill", FEAT_SLOT_LEVELS.skill);

        return items;
    }

    /**
     * Fill ALL spell slots based on Wizard spell progression.
     * Uses the WIZARD_SPELL_SLOTS table to know exactly how many
     * cantrips and spells of each rank to pick. No empty slots.
     */
    async _generateSpells(spellcastingEntryId) {
        const items = [];
        const pack = game.packs.get("pf2e.spells-srd");
        if (!pack) return items;

        const charLevel = Math.max(1, Math.min(20, this.level));
        const slotTable = WIZARD_SPELL_SLOTS[charLevel];
        if (!slotTable) return items;

        const index = await pack.getIndex({ fields: ["name", "system.level.value", "system.traits.value"] });

        // Build a cache of arcane spells by rank
        const spellsByRank = {};
        for (const entry of index) {
            const traits = entry.system?.traits?.value || [];
            if (!traits.includes("arcane")) continue;
            const isCantrip = traits.includes("cantrip");
            const rank = isCantrip ? 0 : (entry.system?.level?.value ?? 0);
            if (!spellsByRank[rank]) spellsByRank[rank] = [];
            spellsByRank[rank].push(entry);
        }

        // Fill cantrips
        const cantripCount = slotTable.cantrips || 5;
        const cantripPool = this._shuffle(spellsByRank[0] || []);
        const pickedCantrips = cantripPool.slice(0, cantripCount);
        for (const match of pickedCantrips) {
            const data = await this._getSpellData(pack, match._id, spellcastingEntryId);
            if (data) items.push(data);
        }

        // Fill each spell rank
        for (let rank = 1; rank <= 10; rank++) {
            const slotCount = slotTable[rank];
            if (!slotCount || slotCount <= 0) continue;
            const pool = this._shuffle(spellsByRank[rank] || []);
            const picked = pool.slice(0, slotCount);
            for (const match of picked) {
                const data = await this._getSpellData(pack, match._id, spellcastingEntryId);
                if (data) items.push(data);
            }
        }

        return items;
    }

    async _getSpellData(pack, docId, spellcastingEntryId) {
        try {
            const doc = await pack.getDocument(docId);
            if (!doc) return null;
            const data = doc.toObject();
            if (!data.system.location) data.system.location = {};
            data.system.location.value = spellcastingEntryId;
            return data;
        } catch (e) {
            console.error("PF2e NPC Gen | Spell load error:", e);
            return null;
        }
    }
}
