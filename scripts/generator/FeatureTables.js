// Common NPC abilities to pull from the PF2e GMG or Bestiaries.
// Note: As with equipment, these UUIDs are approximations for a structured generator.

export const ROLE_FEATURES = {
    brute: [
        { name: "Knockdown", chance: 0.6 },
        { name: "Pushing Attack", chance: 0.4 },
        { name: "Ferocity", chance: 0.3 }
    ],
    skirmisher: [
        { name: "Sneak Attack", chance: 0.8 },
        { name: "Nimble Dodge", chance: 0.5 },
        { name: "Mobility", chance: 0.4 }
    ],
    sniper: [
        { name: "Sneak Attack", chance: 0.6 },
        { name: "Point-Blank Shot", chance: 0.7 }
    ],
    spellcaster: [
        { name: "Steady Spellcasting", chance: 0.5 }
    ],
    soldier: [
        { name: "Attack of Opportunity", chance: 0.7 },
        { name: "Shield Block", chance: 0.6 }
    ]
};
