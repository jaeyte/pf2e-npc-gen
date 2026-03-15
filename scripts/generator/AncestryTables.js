export const ANCESTRIES = {
    human: {
        name: "Human",
        traits: ["human", "humanoid"],
        speed: 25,
        names: ["Alden", "Beatrice", "Caleb", "Dorothy", "Elias", "Faith", "Gideon", "Hope"]
    },
    elf: {
        name: "Elf",
        traits: ["elf", "humanoid"],
        speed: 30,
        senses: "Low-Light Vision",
        names: ["Aelir", "Baelen", "Caerth", "Daelin", "Elowen", "Faeril", "Gaelic", "Hael"]
    },
    dwarf: {
        name: "Dwarf",
        traits: ["dwarf", "humanoid"],
        speed: 20,
        senses: "Darkvision",
        statTweaks: { hp: 2 },
        names: ["Brak", "Dain", "Eirik", "Fifi", "Grog", "Hilda", "Kili", "Thorin"]
    },
    orc: {
        name: "Orc",
        traits: ["orc", "humanoid"],
        speed: 25,
        senses: "Darkvision",
        statTweaks: { hp: 4 },
        names: ["Grok", "Mog", "Throk", "Urk", "Zog", "Bagur", "Durk", "Ogg"]
    },
    goblin: {
        name: "Goblin",
        traits: ["goblin", "humanoid"],
        speed: 25,
        senses: "Darkvision",
        names: ["Bitey", "Gnasher", "Knobby", "Puddle", "Squeak", "Zappy", "Fizz", "Gulp"]
    }
};

export const PERSONALITY_QUIRKS = [
    "Always smells faintly of lavender.",
    "Refuses to look people in the eye.",
    "Obsessed with collecting small stones.",
    "Has a very loud, booming laugh.",
    "Is constantly sharpening their primary weapon.",
    "Whistles a haunting tune when bored.",
    "Carries a lucky rabbit's foot that looks suspicious.",
    "Speaks in the third person.",
    "Extremely superstitious about the color blue.",
    "Always carries a half-eaten sandwich."
];
