// Basic equipment UUIDs (assuming the standard PF2e compendiums)
// Note: In a real environment, you'd want to query compendiums or use reliable UUIDs.
// These are rough approximations for the purpose of the generator framework.

export const BASIC_EQUIPMENT = {
    weapons: {
        melee: {
            finesse: [
                "Rapier",
                "Shortsword",
            ],
            heavy: [
                "Greatsword",
                "Greataxe"
            ],
            simple: [
                "Mace",
                "Spear"
            ]
        },
        ranged: {
            bows: [
                "Shortbow",
                "Longbow"
            ]
        }
    },
    armor: {
        light: [
            "Leather Armor"
        ],
        medium: [
            "Chain Shirt",
            "Hide Armor"
        ],
        heavy: [
            "Full Plate"
        ],
        unarmored: [
            "Explorer's Clothing"
        ]
    }
};

export const ROLE_EQUIPMENT_PREFS = {
    brute: { weapon: 'heavy', armor: 'heavy' },
    skirmisher: { weapon: 'finesse', armor: 'light' },
    sniper: { weapon: 'bows', armor: 'light' },
    spellcaster: { weapon: 'simple', armor: 'unarmored' },
    soldier: { weapon: 'simple', armor: 'medium' }  
};
