export class LootGenerator {
    constructor(level, type) {
        this.level = Math.max(1, Math.min(25, level));
        this.type = type;
    }

    async generateLoot() {
        const actorName = `Generated Loot (Level ${this.level} ${this.type.capitalize()})`;
        
        // Create a Loot Actor
        const lootActor = await Actor.create({
            name: actorName,
            type: "loot",
            system: {
                lootSheetType: "Loot"
            }
        });

        const items = [];

        if (this.type === "hoard" || this.type === "permanent") {
            const permanentItems = await this._getPermanentItems();
            items.push(...permanentItems);
        }

        if (this.type === "hoard" || this.type === "consumables") {
            const consumables = await this._getConsumableItems();
            items.push(...consumables);
        }

        if (this.type === "hoard") {
            const currency = this._generateCurrency();
            items.push(...currency);
        }

        // Add items to actor
        await lootActor.createEmbeddedDocuments("Item", items);
        
        // Render the sheet
        setTimeout(() => {
            try {
                lootActor.sheet.render(true, { force: true });
            } catch (err) {
                console.error("PF2e NPC Gen | Loot sheet render error:", err);
            }
        }, 250);
        return lootActor;
    }

    async _getPermanentItems() {
        const items = [];
        const pack = game.packs.get("pf2e.equipment-srd");
        if (!pack) return items;

        const index = await pack.getIndex({fields: ["name", "type", "system.level.value", "system.traits.value", "system.price.value"]});
        
        // Filter for permanent items around the target level
        const levelRange = [this.level - 1, this.level, this.level + 1];
        const possibleItems = index.filter(e => 
            e.type !== "consumable" && 
            e.type !== "treasures" &&
            levelRange.includes(e.system?.level?.value)
        );

        if (possibleItems.length === 0) return items;

        const count = this.type === "hoard" ? 2 : 5;
        for (let i = 0; i < count; i++) {
            const match = possibleItems[Math.floor(Math.random() * possibleItems.length)];
            const doc = await pack.getDocument(match._id);
            if (doc) items.push(doc.toObject());
        }

        return items;
    }

    async _getConsumableItems() {
        const items = [];
        // Potions and Elixirs often in equipment-srd, but also check others if needed
        const pack = game.packs.get("pf2e.equipment-srd");
        if (!pack) return items;

        const index = await pack.getIndex({fields: ["name", "type", "system.level.value", "system.traits.value"]});
        
        const possibleConsumables = index.filter(e => 
            e.type === "consumable" && 
            e.system?.level?.value <= this.level &&
            e.system?.level?.value >= this.level - 2
        );

        if (possibleConsumables.length === 0) return items;

        const count = this.type === "hoard" ? 3 : 8;
        for (let i = 0; i < count; i++) {
            const match = possibleConsumables[Math.floor(Math.random() * possibleConsumables.length)];
            const doc = await pack.getDocument(match._id);
            if (doc) items.push(doc.toObject());
        }

        // Add a few scrolls
        const scrolls = await this._generateScrolls();
        items.push(...scrolls);

        return items;
    }

    async _generateScrolls() {
        const scrolls = [];
        const spellPack = game.packs.get("pf2e.spells-srd");
        if (!spellPack) return scrolls;

        const spellRank = Math.max(1, Math.ceil(this.level / 2));
        const index = await spellPack.getIndex({fields: ["name", "system.level.value", "system.traits.value"]});
        
        const possibleSpells = index.filter(e => 
            e.system?.level?.value === spellRank &&
            !e.system?.traits?.value?.includes("cantrip")
        );

        if (possibleSpells.length === 0) return scrolls;

        const count = this.type === "hoard" ? 1 : 3;
        for (let i = 0; i < count; i++) {
            const match = possibleSpells[Math.floor(Math.random() * possibleSpells.length)];
            // In PF2e, you generate a scroll by using the "Scroll of..." item and setting the spell.
            // For simplicity here, we'll try to find a pre-made scroll if possible, 
            // but usually you'd customize a base scroll.
            // We'll just fetch a random spell and "pretend" for now or use the Scroll item if found.
            // Actually, we'll just add the spell itself for now as a "placeholder" or look for "Scroll of"
            const scrollPack = game.packs.get("pf2e.equipment-srd");
            const scrollIndex = await scrollPack.getIndex();
            const scrollBase = scrollIndex.find(e => e.name.includes(`Scroll of`) && e.name.includes(`${spellRank}`));
            
            if (scrollBase) {
                const doc = await scrollPack.getDocument(scrollBase._id);
                if (doc) scrolls.push(doc.toObject());
            }
        }
        return scrolls;
    }

    _generateCurrency() {
        // Very rough approximation of currency based on level
        const gpValue = (this.level * this.level * 10) + (this.level * 5);
        return [
            {
                name: "Gold Pieces",
                type: "treasure",
                system: {
                    quantity: gpValue,
                    value: { value: 1 },
                    denomination: "gp"
                }
            }
        ];
    }
}
