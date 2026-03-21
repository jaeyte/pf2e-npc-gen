// PC feats organized by role, pulled from pf2e.feats-srd compendium.
// Each feat has a name (must match compendium exactly) and a maxLevel
// (the feat's PF2e level prerequisite). The generator picks feats
// whose maxLevel <= character level to fill every slot.

// PF2e feat slot progression
export const FEAT_SLOT_LEVELS = {
    ancestry: [1, 5, 9, 13, 17],
    class:    [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    general:  [3, 7, 11, 15, 19],
    skill:    [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
};

// Wizard spell slot progression: [cantrips, rank1, rank2, ...]
// Index = character level (1-20). Each value = number of slots at that rank.
export const WIZARD_SPELL_SLOTS = {
    1:  { cantrips: 5, 1: 2 },
    2:  { cantrips: 5, 1: 3 },
    3:  { cantrips: 5, 1: 3, 2: 2 },
    4:  { cantrips: 5, 1: 3, 2: 3 },
    5:  { cantrips: 5, 1: 3, 2: 3, 3: 2 },
    6:  { cantrips: 5, 1: 3, 2: 3, 3: 3 },
    7:  { cantrips: 6, 1: 3, 2: 3, 3: 3, 4: 2 },
    8:  { cantrips: 6, 1: 3, 2: 3, 3: 3, 4: 3 },
    9:  { cantrips: 6, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2 },
    10: { cantrips: 6, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 },
    11: { cantrips: 6, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2 },
    12: { cantrips: 6, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 },
    13: { cantrips: 7, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 2 },
    14: { cantrips: 7, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3 },
    15: { cantrips: 7, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 2 },
    16: { cantrips: 7, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3 },
    17: { cantrips: 7, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 2 },
    18: { cantrips: 7, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 },
    19: { cantrips: 8, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 1 },
    20: { cantrips: 8, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 1 }
};

export const ROLE_FEATS = {
    brute: {
        // Barbarian class feats (level requirement in parentheses)
        class: [
            { name: "Raging Intimidation", maxLevel: 1 },
            { name: "Sudden Charge", maxLevel: 1 },
            { name: "Moment of Clarity", maxLevel: 1 },
            { name: "Raging Thrower", maxLevel: 1 },
            { name: "No Escape", maxLevel: 6 },
            { name: "Cleave", maxLevel: 6 },
            { name: "Swipe", maxLevel: 4 },
            { name: "Wounded Rage", maxLevel: 4 },
            { name: "Renewed Vigor", maxLevel: 8 },
            { name: "Terrifying Howl", maxLevel: 10 },
            { name: "Come and Get Me", maxLevel: 10 },
            { name: "Brutal Bully", maxLevel: 8 },
            { name: "Thrash", maxLevel: 8 },
            { name: "Dragon's Rage Breath", maxLevel: 6 },
            { name: "Sunder Spell", maxLevel: 12 },
            { name: "Awesome Blow", maxLevel: 14 },
            { name: "Vicious Evisceration", maxLevel: 18 },
            { name: "Contagious Rage", maxLevel: 20 }
        ],
        ancestry: {
            human: [
                { name: "Natural Ambition", maxLevel: 1 },
                { name: "Cooperative Nature", maxLevel: 1 },
                { name: "Adaptive Adept", maxLevel: 5 },
                { name: "Multitalented", maxLevel: 9 },
                { name: "Unconventional Weaponry", maxLevel: 1 }
            ],
            elf: [
                { name: "Nimble Elf", maxLevel: 1 },
                { name: "Ancestral Longevity", maxLevel: 1 },
                { name: "Elven Weapon Familiarity", maxLevel: 1 },
                { name: "Ageless Patience", maxLevel: 5 },
                { name: "Expert Longevity", maxLevel: 9 }
            ],
            dwarf: [
                { name: "Dwarven Weapon Familiarity", maxLevel: 1 },
                { name: "Rock Runner", maxLevel: 1 },
                { name: "Unburdened Iron", maxLevel: 1 },
                { name: "Dwarven Weapon Cunning", maxLevel: 5 },
                { name: "Mountain's Stoutness", maxLevel: 9 }
            ],
            orc: [
                { name: "Orc Ferocity", maxLevel: 1 },
                { name: "Orc Weapon Familiarity", maxLevel: 1 },
                { name: "Athletic Might", maxLevel: 1 },
                { name: "Orc Weapon Carnage", maxLevel: 5 },
                { name: "Incredible Ferocity", maxLevel: 9 }
            ],
            goblin: [
                { name: "Goblin Scuttle", maxLevel: 1 },
                { name: "Burn It!", maxLevel: 1 },
                { name: "Goblin Weapon Familiarity", maxLevel: 1 },
                { name: "Goblin Weapon Frenzy", maxLevel: 5 },
                { name: "Very Sneaky", maxLevel: 1 }
            ]
        },
        general: [
            { name: "Toughness", maxLevel: 1 },
            { name: "Incredible Initiative", maxLevel: 1 },
            { name: "Diehard", maxLevel: 1 },
            { name: "Shield Block", maxLevel: 1 },
            { name: "Fleet", maxLevel: 1 },
            { name: "Armor Proficiency", maxLevel: 1 },
            { name: "Canny Acumen", maxLevel: 1 },
            { name: "Ancestral Paragon", maxLevel: 3 },
            { name: "Untrained Improvisation", maxLevel: 3 }
        ],
        skill: [
            { name: "Intimidating Glare", maxLevel: 1 },
            { name: "Titan Wrestler", maxLevel: 1 },
            { name: "Hefty Hauler", maxLevel: 1 },
            { name: "Assurance", maxLevel: 1 },
            { name: "Quick Jump", maxLevel: 1 },
            { name: "Powerful Leap", maxLevel: 2 },
            { name: "Intimidating Prowess", maxLevel: 2 },
            { name: "Terrified Retreat", maxLevel: 7 },
            { name: "Battle Cry", maxLevel: 7 },
            { name: "Cloud Jump", maxLevel: 15 },
            { name: "Scare to Death", maxLevel: 15 }
        ]
    },
    skirmisher: {
        // Rogue class feats
        class: [
            { name: "Nimble Dodge", maxLevel: 1 },
            { name: "Twin Feint", maxLevel: 1 },
            { name: "You're Next", maxLevel: 1 },
            { name: "Trap Finder", maxLevel: 1 },
            { name: "Mobility", maxLevel: 2 },
            { name: "Quick Draw", maxLevel: 2 },
            { name: "Unbalancing Blow", maxLevel: 2 },
            { name: "Dread Striker", maxLevel: 4 },
            { name: "Twist the Knife", maxLevel: 4 },
            { name: "Poison Weapon", maxLevel: 4 },
            { name: "Gang Up", maxLevel: 6 },
            { name: "Skirmish Strike", maxLevel: 6 },
            { name: "Twist the Knife", maxLevel: 6 },
            { name: "Opportune Backstab", maxLevel: 8 },
            { name: "Sidestep", maxLevel: 8 },
            { name: "Precise Debilitations", maxLevel: 10 },
            { name: "Sneak Savant", maxLevel: 10 },
            { name: "Fantastic Leap", maxLevel: 12 },
            { name: "Spring from the Shadows", maxLevel: 12 },
            { name: "Instant Opening", maxLevel: 14 },
            { name: "Hidden Paragon", maxLevel: 20 }
        ],
        ancestry: {
            human: [
                { name: "Natural Ambition", maxLevel: 1 },
                { name: "Cooperative Nature", maxLevel: 1 },
                { name: "Adaptive Adept", maxLevel: 5 },
                { name: "Multitalented", maxLevel: 9 },
                { name: "Unconventional Weaponry", maxLevel: 1 }
            ],
            elf: [
                { name: "Nimble Elf", maxLevel: 1 },
                { name: "Elven Weapon Familiarity", maxLevel: 1 },
                { name: "Ancestral Longevity", maxLevel: 1 },
                { name: "Ageless Patience", maxLevel: 5 },
                { name: "Expert Longevity", maxLevel: 9 }
            ],
            dwarf: [
                { name: "Unburdened Iron", maxLevel: 1 },
                { name: "Rock Runner", maxLevel: 1 },
                { name: "Dwarven Weapon Familiarity", maxLevel: 1 },
                { name: "Dwarven Weapon Cunning", maxLevel: 5 },
                { name: "Mountain's Stoutness", maxLevel: 9 }
            ],
            orc: [
                { name: "Orc Ferocity", maxLevel: 1 },
                { name: "Orc Weapon Familiarity", maxLevel: 1 },
                { name: "Athletic Might", maxLevel: 1 },
                { name: "Orc Weapon Carnage", maxLevel: 5 },
                { name: "Incredible Ferocity", maxLevel: 9 }
            ],
            goblin: [
                { name: "Goblin Scuttle", maxLevel: 1 },
                { name: "Very Sneaky", maxLevel: 1 },
                { name: "Goblin Weapon Familiarity", maxLevel: 1 },
                { name: "Goblin Weapon Frenzy", maxLevel: 5 },
                { name: "Burn It!", maxLevel: 1 }
            ]
        },
        general: [
            { name: "Fleet", maxLevel: 1 },
            { name: "Incredible Initiative", maxLevel: 1 },
            { name: "Toughness", maxLevel: 1 },
            { name: "Diehard", maxLevel: 1 },
            { name: "Shield Block", maxLevel: 1 },
            { name: "Canny Acumen", maxLevel: 1 },
            { name: "Ancestral Paragon", maxLevel: 3 },
            { name: "Untrained Improvisation", maxLevel: 3 },
            { name: "Armor Proficiency", maxLevel: 1 }
        ],
        skill: [
            { name: "Subtle Theft", maxLevel: 1 },
            { name: "Quick Squeeze", maxLevel: 1 },
            { name: "Experienced Smuggler", maxLevel: 1 },
            { name: "Pickpocket", maxLevel: 1 },
            { name: "Steady Balance", maxLevel: 1 },
            { name: "Cat Fall", maxLevel: 1 },
            { name: "Nimble Crawl", maxLevel: 2 },
            { name: "Quick Disguise", maxLevel: 2 },
            { name: "Quiet Allies", maxLevel: 2 },
            { name: "Legendary Sneak", maxLevel: 15 },
            { name: "Swift Sneak", maxLevel: 7 }
        ]
    },
    sniper: {
        // Ranger class feats
        class: [
            { name: "Hunted Shot", maxLevel: 1 },
            { name: "Crossbow Ace", maxLevel: 1 },
            { name: "Monster Hunter", maxLevel: 1 },
            { name: "Twin Takedown", maxLevel: 1 },
            { name: "Quick Draw", maxLevel: 2 },
            { name: "Far Shot", maxLevel: 2 },
            { name: "Companion's Cry", maxLevel: 4 },
            { name: "Scout's Warning", maxLevel: 4 },
            { name: "Running Reload", maxLevel: 4 },
            { name: "Distracting Shot", maxLevel: 6 },
            { name: "Skirmish Strike", maxLevel: 6 },
            { name: "Warden's Boon", maxLevel: 6 },
            { name: "Deadly Aim", maxLevel: 8 },
            { name: "Hazard Finder", maxLevel: 8 },
            { name: "Penetrating Shot", maxLevel: 10 },
            { name: "Stealthy Companion", maxLevel: 12 },
            { name: "Targeting Shot", maxLevel: 14 },
            { name: "Impossible Volley", maxLevel: 18 },
            { name: "Shadow Hunter", maxLevel: 16 },
            { name: "Ultimate Skirmisher", maxLevel: 20 }
        ],
        ancestry: {
            human: [
                { name: "Natural Ambition", maxLevel: 1 },
                { name: "Cooperative Nature", maxLevel: 1 },
                { name: "Adaptive Adept", maxLevel: 5 },
                { name: "Multitalented", maxLevel: 9 },
                { name: "Unconventional Weaponry", maxLevel: 1 }
            ],
            elf: [
                { name: "Elven Weapon Familiarity", maxLevel: 1 },
                { name: "Nimble Elf", maxLevel: 1 },
                { name: "Ancestral Longevity", maxLevel: 1 },
                { name: "Ageless Patience", maxLevel: 5 },
                { name: "Expert Longevity", maxLevel: 9 }
            ],
            dwarf: [
                { name: "Dwarven Weapon Familiarity", maxLevel: 1 },
                { name: "Rock Runner", maxLevel: 1 },
                { name: "Unburdened Iron", maxLevel: 1 },
                { name: "Dwarven Weapon Cunning", maxLevel: 5 },
                { name: "Mountain's Stoutness", maxLevel: 9 }
            ],
            orc: [
                { name: "Orc Weapon Familiarity", maxLevel: 1 },
                { name: "Orc Ferocity", maxLevel: 1 },
                { name: "Athletic Might", maxLevel: 1 },
                { name: "Orc Weapon Carnage", maxLevel: 5 },
                { name: "Incredible Ferocity", maxLevel: 9 }
            ],
            goblin: [
                { name: "Goblin Weapon Familiarity", maxLevel: 1 },
                { name: "Very Sneaky", maxLevel: 1 },
                { name: "Goblin Scuttle", maxLevel: 1 },
                { name: "Goblin Weapon Frenzy", maxLevel: 5 },
                { name: "Burn It!", maxLevel: 1 }
            ]
        },
        general: [
            { name: "Incredible Initiative", maxLevel: 1 },
            { name: "Fleet", maxLevel: 1 },
            { name: "Toughness", maxLevel: 1 },
            { name: "Diehard", maxLevel: 1 },
            { name: "Shield Block", maxLevel: 1 },
            { name: "Canny Acumen", maxLevel: 1 },
            { name: "Ancestral Paragon", maxLevel: 3 },
            { name: "Untrained Improvisation", maxLevel: 3 },
            { name: "Armor Proficiency", maxLevel: 1 }
        ],
        skill: [
            { name: "Experienced Tracker", maxLevel: 1 },
            { name: "Terrain Stalker", maxLevel: 1 },
            { name: "Survey Wildlife", maxLevel: 1 },
            { name: "Assurance", maxLevel: 1 },
            { name: "Forager", maxLevel: 1 },
            { name: "Quick Squeeze", maxLevel: 1 },
            { name: "Terrain Expertise", maxLevel: 1 },
            { name: "Quiet Allies", maxLevel: 2 },
            { name: "Swift Sneak", maxLevel: 7 },
            { name: "Legendary Sneak", maxLevel: 15 },
            { name: "Cat Fall", maxLevel: 1 }
        ]
    },
    spellcaster: {
        // Wizard class feats
        class: [
            { name: "Reach Spell", maxLevel: 1 },
            { name: "Widen Spell", maxLevel: 1 },
            { name: "Counterspell", maxLevel: 1 },
            { name: "Eschew Materials", maxLevel: 1 },
            { name: "Conceal Spell", maxLevel: 2 },
            { name: "Bespell Weapon", maxLevel: 4 },
            { name: "Spell Penetration", maxLevel: 6 },
            { name: "Steady Spellcasting", maxLevel: 6 },
            { name: "Advanced School Spell", maxLevel: 8 },
            { name: "Bond Conservation", maxLevel: 8 },
            { name: "Overwhelming Energy", maxLevel: 10 },
            { name: "Quickened Casting", maxLevel: 10 },
            { name: "Clever Counterspell", maxLevel: 12 },
            { name: "Effortless Concentration", maxLevel: 16 },
            { name: "Spell Combination", maxLevel: 20 },
            { name: "Superior Bond", maxLevel: 14 },
            { name: "Reflect Spell", maxLevel: 14 },
            { name: "Spell Tinker", maxLevel: 16 }
        ],
        ancestry: {
            human: [
                { name: "Natural Ambition", maxLevel: 1 },
                { name: "Cooperative Nature", maxLevel: 1 },
                { name: "Adaptive Adept", maxLevel: 5 },
                { name: "Multitalented", maxLevel: 9 },
                { name: "Unconventional Weaponry", maxLevel: 1 }
            ],
            elf: [
                { name: "Elven Lore", maxLevel: 1 },
                { name: "Nimble Elf", maxLevel: 1 },
                { name: "Ancestral Longevity", maxLevel: 1 },
                { name: "Ageless Patience", maxLevel: 5 },
                { name: "Expert Longevity", maxLevel: 9 }
            ],
            dwarf: [
                { name: "Rock Runner", maxLevel: 1 },
                { name: "Unburdened Iron", maxLevel: 1 },
                { name: "Dwarven Lore", maxLevel: 1 },
                { name: "Dwarven Weapon Cunning", maxLevel: 5 },
                { name: "Mountain's Stoutness", maxLevel: 9 }
            ],
            orc: [
                { name: "Orc Sight", maxLevel: 1 },
                { name: "Orc Ferocity", maxLevel: 1 },
                { name: "Athletic Might", maxLevel: 1 },
                { name: "Orc Weapon Carnage", maxLevel: 5 },
                { name: "Incredible Ferocity", maxLevel: 9 }
            ],
            goblin: [
                { name: "Burn It!", maxLevel: 1 },
                { name: "Goblin Lore", maxLevel: 1 },
                { name: "Very Sneaky", maxLevel: 1 },
                { name: "Goblin Weapon Frenzy", maxLevel: 5 },
                { name: "Goblin Scuttle", maxLevel: 1 }
            ]
        },
        general: [
            { name: "Toughness", maxLevel: 1 },
            { name: "Fleet", maxLevel: 1 },
            { name: "Incredible Initiative", maxLevel: 1 },
            { name: "Diehard", maxLevel: 1 },
            { name: "Shield Block", maxLevel: 1 },
            { name: "Canny Acumen", maxLevel: 1 },
            { name: "Ancestral Paragon", maxLevel: 3 },
            { name: "Untrained Improvisation", maxLevel: 3 },
            { name: "Armor Proficiency", maxLevel: 1 }
        ],
        skill: [
            { name: "Arcane Sense", maxLevel: 1 },
            { name: "Quick Identification", maxLevel: 1 },
            { name: "Recognize Spell", maxLevel: 1 },
            { name: "Assurance", maxLevel: 1 },
            { name: "Multilingual", maxLevel: 1 },
            { name: "Dubious Knowledge", maxLevel: 1 },
            { name: "Automatic Knowledge", maxLevel: 2 },
            { name: "Quick Recognition", maxLevel: 7 },
            { name: "Magical Shorthand", maxLevel: 2 },
            { name: "Unified Theory", maxLevel: 15 },
            { name: "Craft Anything", maxLevel: 15 }
        ]
    },
    soldier: {
        // Fighter class feats
        class: [
            { name: "Power Attack", maxLevel: 1 },
            { name: "Reactive Shield", maxLevel: 1 },
            { name: "Sudden Charge", maxLevel: 1 },
            { name: "Double Slice", maxLevel: 1 },
            { name: "Intimidating Strike", maxLevel: 2 },
            { name: "Lunge", maxLevel: 2 },
            { name: "Brutish Shove", maxLevel: 2 },
            { name: "Dual-Handed Assault", maxLevel: 2 },
            { name: "Knockdown", maxLevel: 4 },
            { name: "Swipe", maxLevel: 4 },
            { name: "Shatter Defenses", maxLevel: 6 },
            { name: "Attack of Opportunity", maxLevel: 6 },
            { name: "Blind-Fight", maxLevel: 8 },
            { name: "Felling Strike", maxLevel: 8 },
            { name: "Certain Strike", maxLevel: 10 },
            { name: "Combat Reflexes", maxLevel: 10 },
            { name: "Whirlwind Strike", maxLevel: 14 },
            { name: "Overwhelming Blow", maxLevel: 16 },
            { name: "Savage Critical", maxLevel: 18 },
            { name: "Boundless Reprisals", maxLevel: 20 }
        ],
        ancestry: {
            human: [
                { name: "Natural Ambition", maxLevel: 1 },
                { name: "Cooperative Nature", maxLevel: 1 },
                { name: "Adaptive Adept", maxLevel: 5 },
                { name: "Multitalented", maxLevel: 9 },
                { name: "Unconventional Weaponry", maxLevel: 1 }
            ],
            elf: [
                { name: "Elven Weapon Familiarity", maxLevel: 1 },
                { name: "Nimble Elf", maxLevel: 1 },
                { name: "Ancestral Longevity", maxLevel: 1 },
                { name: "Ageless Patience", maxLevel: 5 },
                { name: "Expert Longevity", maxLevel: 9 }
            ],
            dwarf: [
                { name: "Dwarven Weapon Familiarity", maxLevel: 1 },
                { name: "Rock Runner", maxLevel: 1 },
                { name: "Unburdened Iron", maxLevel: 1 },
                { name: "Dwarven Weapon Cunning", maxLevel: 5 },
                { name: "Mountain's Stoutness", maxLevel: 9 }
            ],
            orc: [
                { name: "Orc Weapon Familiarity", maxLevel: 1 },
                { name: "Orc Ferocity", maxLevel: 1 },
                { name: "Athletic Might", maxLevel: 1 },
                { name: "Orc Weapon Carnage", maxLevel: 5 },
                { name: "Incredible Ferocity", maxLevel: 9 }
            ],
            goblin: [
                { name: "Goblin Weapon Familiarity", maxLevel: 1 },
                { name: "Goblin Scuttle", maxLevel: 1 },
                { name: "Very Sneaky", maxLevel: 1 },
                { name: "Goblin Weapon Frenzy", maxLevel: 5 },
                { name: "Burn It!", maxLevel: 1 }
            ]
        },
        general: [
            { name: "Toughness", maxLevel: 1 },
            { name: "Shield Block", maxLevel: 1 },
            { name: "Incredible Initiative", maxLevel: 1 },
            { name: "Diehard", maxLevel: 1 },
            { name: "Fleet", maxLevel: 1 },
            { name: "Canny Acumen", maxLevel: 1 },
            { name: "Armor Proficiency", maxLevel: 1 },
            { name: "Ancestral Paragon", maxLevel: 3 },
            { name: "Untrained Improvisation", maxLevel: 3 }
        ],
        skill: [
            { name: "Intimidating Glare", maxLevel: 1 },
            { name: "Assurance", maxLevel: 1 },
            { name: "Armor Assist", maxLevel: 1 },
            { name: "Hefty Hauler", maxLevel: 1 },
            { name: "Quick Repair", maxLevel: 1 },
            { name: "Titan Wrestler", maxLevel: 1 },
            { name: "Intimidating Prowess", maxLevel: 2 },
            { name: "Battle Cry", maxLevel: 7 },
            { name: "Terrified Retreat", maxLevel: 7 },
            { name: "Scare to Death", maxLevel: 15 },
            { name: "Powerful Leap", maxLevel: 2 }
        ]
    }
};
