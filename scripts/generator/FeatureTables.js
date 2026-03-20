// PC feats organized by role, pulled from pf2e.feats-srd compendium.
// Each entry has a name (must match compendium exactly), a chance of selection,
// and a category for sheet organization.

export const ROLE_FEATS = {
    brute: {
        class: [
            { name: "Raging Intimidation", chance: 0.7 },
            { name: "Sudden Charge", chance: 0.6 },
            { name: "No Escape", chance: 0.5 },
            { name: "Cleave", chance: 0.4 },
            { name: "Swipe", chance: 0.3 }
        ],
        ancestry: {
            human: [{ name: "Natural Ambition", chance: 0.5 }],
            elf: [{ name: "Nimble Elf", chance: 0.5 }],
            dwarf: [{ name: "Dwarven Weapon Familiarity", chance: 0.6 }],
            orc: [{ name: "Orc Ferocity", chance: 0.7 }],
            goblin: [{ name: "Goblin Scuttle", chance: 0.5 }]
        },
        general: [
            { name: "Toughness", chance: 0.7 },
            { name: "Incredible Initiative", chance: 0.5 },
            { name: "Diehard", chance: 0.4 }
        ],
        skill: [
            { name: "Intimidating Glare", chance: 0.6 },
            { name: "Titan Wrestler", chance: 0.4 },
            { name: "Hefty Hauler", chance: 0.3 }
        ]
    },
    skirmisher: {
        class: [
            { name: "Nimble Dodge", chance: 0.7 },
            { name: "Sneak Attack", chance: 0.8 },
            { name: "Mobility", chance: 0.6 },
            { name: "Quick Draw", chance: 0.5 },
            { name: "Twist the Knife", chance: 0.4 }
        ],
        ancestry: {
            human: [{ name: "Natural Ambition", chance: 0.5 }],
            elf: [{ name: "Nimble Elf", chance: 0.6 }],
            dwarf: [{ name: "Unburdened Iron", chance: 0.5 }],
            orc: [{ name: "Orc Ferocity", chance: 0.5 }],
            goblin: [{ name: "Goblin Scuttle", chance: 0.7 }]
        },
        general: [
            { name: "Fleet", chance: 0.6 },
            { name: "Incredible Initiative", chance: 0.6 },
            { name: "Toughness", chance: 0.3 }
        ],
        skill: [
            { name: "Subtle Theft", chance: 0.6 },
            { name: "Quick Squeeze", chance: 0.4 },
            { name: "Experienced Smuggler", chance: 0.3 }
        ]
    },
    sniper: {
        class: [
            { name: "Hunted Shot", chance: 0.7 },
            { name: "Hunter's Aim", chance: 0.6 },
            { name: "Far Shot", chance: 0.5 },
            { name: "Quick Draw", chance: 0.4 },
            { name: "Running Reload", chance: 0.3 }
        ],
        ancestry: {
            human: [{ name: "Natural Ambition", chance: 0.5 }],
            elf: [{ name: "Elven Weapon Familiarity", chance: 0.6 }],
            dwarf: [{ name: "Dwarven Weapon Familiarity", chance: 0.5 }],
            orc: [{ name: "Orc Weapon Familiarity", chance: 0.5 }],
            goblin: [{ name: "Goblin Weapon Familiarity", chance: 0.6 }]
        },
        general: [
            { name: "Incredible Initiative", chance: 0.6 },
            { name: "Fleet", chance: 0.5 },
            { name: "Toughness", chance: 0.3 }
        ],
        skill: [
            { name: "Experienced Tracker", chance: 0.5 },
            { name: "Terrain Stalker", chance: 0.4 },
            { name: "Survey Wildlife", chance: 0.3 }
        ]
    },
    spellcaster: {
        class: [
            { name: "Reach Spell", chance: 0.7 },
            { name: "Widen Spell", chance: 0.5 },
            { name: "Conceal Spell", chance: 0.4 },
            { name: "Silent Spell", chance: 0.3 }
        ],
        ancestry: {
            human: [{ name: "Natural Ambition", chance: 0.5 }],
            elf: [{ name: "Elven Lore", chance: 0.6 }],
            dwarf: [{ name: "Forge-Day's Rest", chance: 0.4 }],
            orc: [{ name: "Orc Sight", chance: 0.5 }],
            goblin: [{ name: "Burn It!", chance: 0.6 }]
        },
        general: [
            { name: "Toughness", chance: 0.5 },
            { name: "Fleet", chance: 0.4 },
            { name: "Incredible Initiative", chance: 0.4 }
        ],
        skill: [
            { name: "Arcane Sense", chance: 0.6 },
            { name: "Quick Identification", chance: 0.5 },
            { name: "Recognize Spell", chance: 0.5 }
        ]
    },
    soldier: {
        class: [
            { name: "Power Attack", chance: 0.7 },
            { name: "Reactive Shield", chance: 0.6 },
            { name: "Sudden Charge", chance: 0.5 },
            { name: "Attack of Opportunity", chance: 0.6 },
            { name: "Intimidating Strike", chance: 0.4 }
        ],
        ancestry: {
            human: [{ name: "Natural Ambition", chance: 0.5 }],
            elf: [{ name: "Elven Weapon Familiarity", chance: 0.5 }],
            dwarf: [{ name: "Dwarven Weapon Familiarity", chance: 0.7 }],
            orc: [{ name: "Orc Weapon Familiarity", chance: 0.6 }],
            goblin: [{ name: "Goblin Weapon Familiarity", chance: 0.5 }]
        },
        general: [
            { name: "Toughness", chance: 0.7 },
            { name: "Shield Block", chance: 0.8 },
            { name: "Incredible Initiative", chance: 0.4 }
        ],
        skill: [
            { name: "Intimidating Glare", chance: 0.5 },
            { name: "Assurance", chance: 0.4 },
            { name: "Armor Assist", chance: 0.3 }
        ]
    }
};
