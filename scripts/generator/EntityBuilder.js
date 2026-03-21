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
        // { name?, biography?, personality?, feats?, spells?, equipment? }
        this.overrides = overrides;
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
                    speed: { value: this.ancestry.speed, otherSpeeds: [] },
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

        // Add equipment (weapons, armor, shields, gear)
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

    /**
     * Generate equipment. If AI provided specific choices (overrides.equipment),
     * use those. Otherwise fall back to random role-based selection.
     */
    async _generateEquipment() {
        const prefs = ROLE_EQUIPMENT_PREFS[this.roleKey] || ROLE_EQUIPMENT_PREFS["brute"];
        const aiEquip = this.overrides.equipment;
        const items = [];

        // Determine weapon name — AI choice or random from role prefs
        let chosenWeaponName;
        if (aiEquip?.weapon) {
            chosenWeaponName = aiEquip.weapon;
        } else {
            let weaponCategory = BASIC_EQUIPMENT.weapons.melee;
            if (prefs.weapon === "bows") weaponCategory = BASIC_EQUIPMENT.weapons.ranged;
            const weaponList = weaponCategory[prefs.weapon] || weaponCategory.simple;
            chosenWeaponName = weaponList[Math.floor(Math.random() * weaponList.length)];
        }

        // Determine armor name — AI choice or random from role prefs
        let chosenArmorName;
        if (aiEquip?.armor) {
            chosenArmorName = aiEquip.armor;
        } else {
            const armorList = BASIC_EQUIPMENT.armor[prefs.armor] || BASIC_EQUIPMENT.armor.unarmored;
            chosenArmorName = armorList[Math.floor(Math.random() * armorList.length)];
        }

        // Determine shield — AI choice or role pref
        const wantsShield = aiEquip?.shield ? true : prefs.shield;
        const shieldName = aiEquip?.shield || BASIC_EQUIPMENT.shields[Math.floor(Math.random() * BASIC_EQUIPMENT.shields.length)];

        try {
            // Weapon — equipped and held
            const weaponItem = await this._findItemInCompendium("pf2e.equipment-srd", chosenWeaponName);
            if (weaponItem) {
                const weaponData = weaponItem.toObject();
                // Rune scaling per PF2e item levels:
                // Potency: +1 at L2, +2 at L10, +3 at L16
                // Striking: +1 at L4, +2 at L12, +3 at L19
                const potency = this.level >= 16 ? 3 : this.level >= 10 ? 2 : this.level >= 2 ? 1 : 0;
                const striking = this.level >= 19 ? 3 : this.level >= 12 ? 2 : this.level >= 4 ? 1 : 0;
                if (!weaponData.system.runes) weaponData.system.runes = { potency: 0, striking: 0, property: [] };
                weaponData.system.runes.potency = potency;
                weaponData.system.runes.striking = striking;
                const isTwo = weaponData.system?.usage?.value === "held-in-two-hands" ||
                              weaponData.system?.usage?.value === "held-in-one-plus-hands";
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
                // Armor rune scaling per PF2e item levels:
                // Potency: +1 at L5, +2 at L11, +3 at L18
                // Resilient: +1 at L8, +2 at L14, +3 at L20
                const armorPotency = this.level >= 18 ? 3 : this.level >= 11 ? 2 : this.level >= 5 ? 1 : 0;
                const resilient = this.level >= 20 ? 3 : this.level >= 14 ? 2 : this.level >= 8 ? 1 : 0;
                if (!armorData.system.runes) armorData.system.runes = { potency: 0, resilient: 0, property: [] };
                armorData.system.runes.potency = armorPotency;
                armorData.system.runes.resilient = resilient;
                armorData.system.equipped = {
                    carryType: "worn",
                    inSlot: true,
                    invested: true
                };
                items.push(armorData);
            }

            // Shield
            if (wantsShield) {
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

            // Healing potion appropriate for level (Minor L1, Lesser L3, Moderate L6, Greater L12, Major L18)
            const potionIndex = this.level >= 18 ? 4 : this.level >= 12 ? 3 : this.level >= 6 ? 2 : this.level >= 3 ? 1 : 0;
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
     * Fill ALL feat slots. If AI provided specific feat names (overrides.feats),
     * look those up in the compendium. For any AI names that fail to match,
     * or if no AI override exists, fall back to the random table-based approach.
     */
    async _generateFeats() {
        const items = [];
        const roleFeatData = ROLE_FEATS[this.roleKey];
        if (!roleFeatData) return items;
        const charLevel = Math.max(1, this.level);
        const aiFeats = this.overrides.feats;

        /**
         * Look up a list of feat names in the compendium.
         * Returns array of item data objects for matches found.
         */
        const lookupFeatNames = async (names, category) => {
            const found = [];
            for (const name of names) {
                const doc = await this._findItemInCompendium("pf2e.feats-srd", name);
                if (doc) {
                    const data = doc.toObject();
                    if (data.system) data.system.category = category;
                    found.push(data);
                }
            }
            return found;
        };

        /**
         * Random fallback: shuffle eligible feats from table and pick to fill remaining slots.
         */
        const fillRemainingSlots = async (featPool, category, slotsNeeded, alreadyFilled) => {
            const remaining = slotsNeeded - alreadyFilled;
            if (remaining <= 0 || !featPool || featPool.length === 0) return;

            const eligible = featPool.filter(f => f.maxLevel <= charLevel);
            const shuffled = this._shuffle(eligible);
            const picked = shuffled.slice(0, remaining);

            for (const feat of picked) {
                const doc = await this._findItemInCompendium("pf2e.feats-srd", feat.name);
                if (doc) {
                    const data = doc.toObject();
                    if (data.system) data.system.category = category;
                    items.push(data);
                }
            }
        };

        // Process each feat category
        const categories = [
            { key: "class",    pool: roleFeatData.class,                               slots: FEAT_SLOT_LEVELS.class },
            { key: "ancestry", pool: roleFeatData.ancestry?.[this.ancestryKey] || [],   slots: FEAT_SLOT_LEVELS.ancestry },
            { key: "general",  pool: roleFeatData.general,                             slots: FEAT_SLOT_LEVELS.general },
            { key: "skill",    pool: roleFeatData.skill,                               slots: FEAT_SLOT_LEVELS.skill }
        ];

        for (const { key, pool, slots } of categories) {
            const slotsNeeded = slots.filter(l => l <= charLevel).length;
            if (slotsNeeded === 0) continue;

            // If AI provided feats for this category, use them first
            if (aiFeats?.[key] && Array.isArray(aiFeats[key]) && aiFeats[key].length > 0) {
                const aiResults = await lookupFeatNames(aiFeats[key], key);
                items.push(...aiResults);
                // Fill any remaining slots with random picks
                await fillRemainingSlots(pool, key, slotsNeeded, aiResults.length);
            } else {
                // No AI override — fill entirely from tables
                await fillRemainingSlots(pool, key, slotsNeeded, 0);
            }
        }

        return items;
    }

    /**
     * Fill ALL spell slots. If AI provided specific spell names (overrides.spells),
     * look those up in the compendium first. For any remaining unfilled slots,
     * fall back to random arcane spell selection.
     */
    async _generateSpells(spellcastingEntryId) {
        const items = [];
        const pack = game.packs.get("pf2e.spells-srd");
        if (!pack) return items;

        const charLevel = Math.max(1, Math.min(20, this.level));
        const slotTable = WIZARD_SPELL_SLOTS[charLevel];
        if (!slotTable) return items;

        const index = await pack.getIndex({ fields: ["name", "system.level.value", "system.traits.value"] });
        const aiSpells = this.overrides.spells;

        // Build a cache of arcane spells by rank for random fallback
        const spellsByRank = {};
        for (const entry of index) {
            const traits = entry.system?.traits?.value || [];
            if (!traits.includes("arcane")) continue;
            const isCantrip = traits.includes("cantrip");
            const rank = isCantrip ? 0 : (entry.system?.level?.value ?? 0);
            if (!spellsByRank[rank]) spellsByRank[rank] = [];
            spellsByRank[rank].push(entry);
        }

        /**
         * Try to find a spell by name in the compendium.
         */
        const lookupSpellByName = async (name) => {
            const match = index.find(e => e.name.toLowerCase() === name.toLowerCase().trim());
            if (!match) return null;
            return await this._getSpellData(pack, match._id, spellcastingEntryId);
        };

        /**
         * For a given rank, try AI names first, then fill remaining with random picks.
         */
        const fillRank = async (rank, slotCount, aiNames) => {
            let filled = 0;

            // Try AI-provided spell names first
            if (aiNames && aiNames.length > 0) {
                for (const name of aiNames) {
                    if (filled >= slotCount) break;
                    const data = await lookupSpellByName(name);
                    if (data) {
                        items.push(data);
                        filled++;
                    }
                }
            }

            // Fill remaining slots with random arcane spells of this rank
            const remaining = slotCount - filled;
            if (remaining > 0) {
                const pool = this._shuffle(spellsByRank[rank] || []);
                const picked = pool.slice(0, remaining);
                for (const match of picked) {
                    const data = await this._getSpellData(pack, match._id, spellcastingEntryId);
                    if (data) items.push(data);
                }
            }
        };

        // Fill cantrips
        const cantripCount = slotTable.cantrips || 5;
        const aiCantrips = aiSpells?.cantrips || [];
        await fillRank(0, cantripCount, aiCantrips);

        // Fill each spell rank
        for (let rank = 1; rank <= 10; rank++) {
            const slotCount = slotTable[rank];
            if (!slotCount || slotCount <= 0) continue;
            const aiRankSpells = aiSpells?.[String(rank)] || [];
            await fillRank(rank, slotCount, aiRankSpells);
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
