export const THEMES = {
    none: {
        name: "None",
        description: "A standard individual."
    },
    elite: {
        name: "Elite",
        description: "A superior version of their kind.",
        statTweaks: { ac: 2, attack: 2, damage: 2, saves: 2, hp: 10 },
        prefix: "Elite"
    },
    infernal: {
        name: "Infernal",
        description: "Touched by the fires of Hell.",
        traits: ["fiend"],
        resistances: [{ type: "fire", value: "Level" }],
        damageType: "fire",
        prefix: "Hellbound"
    },
    frost: {
        name: "Frost-touched",
        description: "Born from the frozen wastes.",
        traits: ["cold"],
        resistances: [{ type: "cold", value: "Level" }],
        damageType: "cold",
        prefix: "Frostbitten"
    },
    undead: {
        name: "Undead",
        description: "Returned from the grave.",
        traits: ["undead", "unholy"],
        senses: "Darkvision",
        resistances: [{ type: "void", value: "Level" }],
        weaknesses: [{ type: "vitality", value: "Level" }],
        statTweaks: { hp: -5 },
        prefix: "Risen"
    },
    shadow: {
        name: "Shadow-infused",
        description: "One with the dark.",
        traits: ["shadow"],
        senses: "Greater Darkvision",
        resistances: [{ type: "precision", value: 5 }],
        prefix: "Shade"
    }
};
