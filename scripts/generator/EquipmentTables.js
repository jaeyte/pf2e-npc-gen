// Equipment names matching the PF2e equipment-srd compendium exactly.
// Organized by category and subcategory for role-based selection.

export const BASIC_EQUIPMENT = {
    weapons: {
        melee: {
            finesse: [
                "Rapier",
                "Shortsword",
                "Dagger"
            ],
            heavy: [
                "Greatsword",
                "Greataxe",
                "Maul"
            ],
            simple: [
                "Mace",
                "Spear",
                "Dagger"
            ]
        },
        ranged: {
            bows: [
                "Shortbow",
                "Longbow",
                "Composite Shortbow"
            ]
        }
    },
    armor: {
        light: [
            "Leather Armor",
            "Studded Leather Armor"
        ],
        medium: [
            "Chain Shirt",
            "Hide Armor",
            "Breastplate"
        ],
        heavy: [
            "Full Plate",
            "Half Plate"
        ],
        unarmored: [
            "Explorer's Clothing"
        ]
    },
    shields: [
        "Wooden Shield",
        "Steel Shield"
    ],
    adventuringGear: [
        "Backpack",
        "Bedroll",
        "Rope",
        "Torch",
        "Waterskin",
        "Rations"
    ],
    consumables: {
        healing: [
            "Healing Potion (Minor)",
            "Healing Potion (Lesser)",
            "Healing Potion (Moderate)",
            "Healing Potion (Greater)",
            "Healing Potion (Major)"
        ]
    }
};

export const ROLE_EQUIPMENT_PREFS = {
    brute:       { weapon: "heavy",   armor: "medium", shield: false, ammo: false },
    skirmisher:  { weapon: "finesse", armor: "light",  shield: false, ammo: false },
    sniper:      { weapon: "bows",    armor: "light",  shield: false, ammo: true },
    spellcaster: { weapon: "simple",  armor: "unarmored", shield: false, ammo: false },
    soldier:     { weapon: "simple",  armor: "heavy",  shield: true,  ammo: false }
};
