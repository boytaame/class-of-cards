import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc, getDocs, deleteDoc, setDoc } from "firebase/firestore";

// --- PASTE YOUR FIREBASE CONFIG HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyA6qwu0IUqdu7ooyOG2-6opYXOTUrHw2Go",
  authDomain: "class-of-cards.firebaseapp.com",
  projectId: "class-of-cards",
  storageBucket: "class-of-cards.firebasestorage.app",
  messagingSenderId: "440965183666",
  appId: "1:440965183666:web:a02f2029ed6fcd9b10f1ab",
  measurementId: "G-NJ39QR9B94"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===================================================================================
// --- THE COMPLETE, PARSED CHARACTER DATA ---
// This is the result of translating your charList.txt into the universal object model.
// ===================================================================================
const characters = [
    {
        "name": "Alveria", "attack": 9, "health": 76, "speed": 17, "role": "Support", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Gentle Grab", "description": "➡️ 20% damage to 1 target.", "cooldown": 0,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 0.2, "basedOn": "attack" }]
            },
            {
                "skillName": "Magical Barrier", "description": "➡️ 5 + 30% current HP Shield to 3 lowest-HP allies.", "cooldown": 3,
                "effects": [{ "type": "shield", "target": { "type": ["ally"], "scope": "lowestHealth", "count": 3 }, "value": 5, "percentage": 0.3, "basedOn": "casterCurrentHealth" }]
            },
            {
                "skillName": "Heartwarming Tune", "description": "➡️ Gives ✨ Encouraged to all allies.\n🎵 Triggers ♪ Music.", "cooldown": 4,
                "effects": [
                    { "type": "applyBuff", "target": { "type": ["ally"], "scope": "all" }, "buffName": "Encouraged" },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Music", "duration": 1 }
                ]
            }
        ],
        "passives": [ { "name": "Fake Mask", "description": "If Keiron is present, switches to Fake Mask mode with alternate skills." , "uniqueLogic": "modeSwitchAlveria"}, { "name": "Awakened", "description": "If Keiron dies, Alveria's skills are empowered." } ]
    },
    {
        "name": "Andrew", "attack": 38, "health": 166, "speed": 28, "role": "META Fighter", "rarity": "★★★★★",
        "skills": [
            {
                "skillName": "Boxing Punch", "description": "➡️ 60% damage to the closest.", "cooldown": 0,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "closest", "canChoose": false }, "multiplier": 0.6, "basedOn": "attack" }]
            },
            {
                "skillName": "Barbell Throw", "description": "➡️ 40% to 2 enemies in a line.\n💪 Gains 🏋️‍♂️ Gym (2 turns).", "cooldown": 3,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "area", "pattern": "line", "count": 2, "canChoose": true }, "multiplier": 0.4, "basedOn": "attack" },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Gym", "duration": 2 }
                ]
            },
            {
                "skillName": "Cookie Break", "description": "➡️ Heals 20% HP. Removes 1 debuff.", "cooldown": 3,
                "effects": [
                    { "type": "heal", "target": { "type": ["self"] }, "percentage": 0.2, "basedOn": "maxHealth" },
                    { "type": "cleanse", "target": { "type": ["self"] }, "count": 1 }
                ]
            },
            {
                "skillName": "Brutal Hook", "description": "➡️ 120% to the selected enemy.", "cooldown": 4,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 1.2, "basedOn": "attack" }]
            }
        ],
        "passives": [ { "name": "Last Man Standing", "description": "Complex passive logic for stacking attack, damage reduction, and immunities." } ]
    },
    {
        "name": "Calvin", "attack": 18, "health": 160, "speed": 12, "role": "Tank", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Random Fact", "description": "➡️ 5 + 15% Max HP Shield. 20% damage to nearest enemy.", "cooldown": 0,
                "effects": [
                    { "type": "shield", "target": { "type": ["self"] }, "value": 5, "percentage": 0.15, "basedOn": "maxHealth" },
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "closest", "canChoose": false }, "multiplier": 0.2, "basedOn": "attack" }
                ]
            },
            {
                "skillName": "Confident Taunt", "description": "➡️ Taunts enemies. All allies get ✨ Encouraged (Weakened).", "cooldown": 3,
                "effects": [
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Taunt", "duration": 1 },
                    { "type": "applyBuff", "target": { "type": ["ally"], "scope": "all" }, "buffName": "Encouraged (Weakened)", "duration": 1 }
                ]
            },
            {
                "skillName": "Dad Joke", "description": "➡️ 40% AoE damage (2 hit combo 20% each). 75% chance to inflict 🤣 Laughing (acts last next turn).", "cooldown": 4,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "all" }, "multiplier": 0.2, "basedOn": "attack", "hitCount": 2 },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "all" }, "debuffName": "Laughing", "duration": 1, "chance": 0.75 }
                ]
            }
        ],
        "passives": [ { "name": "Science Olympiad", "description": "Complex passive logic for turn-based effects." } ]
    },
    {
        "name": "Cathy", "attack": 8, "health": 50, "speed": 12, "role": "Support", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Healing Dance", "description": "➡️ 15% damage. If target <50% HP: Heals Cathy 5 HP, gives herself Overheal.", "cooldown": 0,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 0.15, "basedOn": "attack" },
                    { "type": "heal", "target": { "type": ["self"] }, "value": 5, "condition": "targetHealthBelow50" },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Overheal", "condition": "targetHealthBelow50" }
                ]
            },
            {
                "skillName": "Graceful Spin", "description": "➡️ Heals 1 ally (40% of her Max HP). Excess = Overheal (up to 150%).", "cooldown": 0,
                "effects": [ { "type": "heal", "target": { "type": ["ally"], "scope": "single", "canChoose": true }, "percentage": 0.4, "basedOn": "casterMaxHealth", "uniqueLogic": "overheal" }]
            },
            {
                "skillName": "Radiant Dance", "description": "➡️ Heals all allies (25% Max HP), grants Overheal.\n🛡️ Grants 10 Shield to 2 lowest-HP allies.", "cooldown": 3,
                "effects": [
                    { "type": "heal", "target": { "type": ["ally"], "scope": "all" }, "percentage": 0.25, "basedOn": "casterMaxHealth", "uniqueLogic": "overheal" },
                    { "type": "shield", "target": { "type": ["ally"], "scope": "lowestHealth", "count": 2 }, "value": 10 }
                ]
            }
        ],
        "passives": [ { "name": "Overhealing Mastery", "description": "Complex passive logic for overhealing." } ]
    },
    {
        "name": "Devina", "attack": 9, "health": 61, "speed": 13, "role": "Controller", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Unholy Cackle", "description": "➡️ 15% damage to 2 enemies. Inflicts 😰 Nervous.", "cooldown": 0,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "random", "count": 2 }, "multiplier": 0.15, "basedOn": "attack" },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "random", "count": 2 }, "debuffName": "Nervous" }
                ]
            },
            {
                "skillName": "Piercing Yell", "description": "➡️ Stuns 1 random enemy, 🔇Silences another.", "cooldown": 4,
                "effects": [
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "random", "count": 1 }, "debuffName": "Stun", "duration": 1 },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "random", "count": 1, "excludeLastTargets": true }, "debuffName": "Silence", "duration": 1 }
                ]
            },
            {
                "skillName": "Illogical Arguments", "description": "➡️ Inflicts 😰 Mentally Shaken (2 turns).", "cooldown": 5,
                "effects": [{ "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "debuffName": "Mentally Shaken", "duration": 2 }]
            }
        ],
        "passives": [ { "name": "Debuff Master", "description": "Complex passive logic for debuff enhancement." } ]
    },
    {
        "name": "Celyn", "attack": 4, "health": 43, "speed": 4, "role": "META Controller", "rarity": "★★★★★",
        "skills": [
            {
                "skillName": "Mascot Costume", "description": "➡️ Applies Weak effect & Slow effect for 2 turns (only targets front row units if there is).", "cooldown": 0,
                "effects": [
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "frontRow", "canChoose": true, "count": 1 }, "debuffName": "Weak", "duration": 2 },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "frontRow", "canChoose": true, "count": 1 }, "debuffName": "Slow", "duration": 2 }
                ]
            },
            {
                "skillName": "Floor Redesign", "description": "➡️ +1 turn cooldown for all enemies.\n🟢 All allies gain +10% Attack and Speed (1 turn).", "cooldown": 4,
                "effects": [
                    { "type": "increaseCooldown", "target": { "type": ["enemy"], "scope": "all" }, "value": 1 },
                    { "type": "applyBuff", "target": { "type": ["ally"], "scope": "all" }, "buffName": "Attack Up", "multiplier": 0.1, "duration": 1 },
                    { "type": "applyBuff", "target": { "type": ["ally"], "scope": "all" }, "buffName": "Speed Up", "multiplier": 0.1, "duration": 1 }
                ]
            },
            {
                "skillName": "Overwhelming Leadership", "description": "➡️ Inflicts the whole enemy team 🌀 Entranced (1 turn).", "cooldown": 4,
                "effects": [{ "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "all" }, "debuffName": "Entranced", "duration": 1 }],
                "uniqueLogic": "entranced"
            }
        ],
        "passives": [ { "name": "Broken Confidence", "description": "First damage taken: Stunned for 1 turn." } ]
    },
    {
        "name": "Felix W-", "attack": 33, "health": 135, "speed": 39, "role": "META Assassin", "rarity": "★★★★★",
        "skills": [
            {
                "skillName": "Precise Punch", "description": "➡️ 60% damage to the closest. +10% vs. Support/Controller.", "cooldown": 0,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "closest" }, "multiplier": 0.6, "bonusMultiplier": 0.1, "bonusCondition": "targetIsSupportOrController", "basedOn": "attack" }]
            },
            {
                "skillName": "Eratic Drums", "description": "➡️ All allies gain +5% Speed permanently.\n🎵 Triggers ♪ Music.", "cooldown": 3,
                "effects": [
                    { "type": "applyBuff", "target": { "type": ["ally"], "scope": "all" }, "buffName": "Speed Up", "multiplier": 0.05, "isPermanent": true },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Music", "duration": 1 }
                ]
            },
            {
                "skillName": "Ball Skills", "description": "If Felix is above 50% HP: 50% damage + −30% Buff Receive Rate. (Can only target the front row)\nIf Below 50% HP: 40% damage to the farthest enemy(back row), 30% chance to 🔇Silence.", "cooldown": 3,
                "uniqueLogic": "conditionalEffect",
                "conditions": [
                    {
                        "if": "selfHealthAbove50",
                        "effects": [
                            { "type": "damage", "target": { "type": ["enemy"], "scope": "frontRow", "canChoose": true, "count": 1 }, "multiplier": 0.5, "basedOn": "attack" },
                            { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "frontRow", "canChoose": true, "count": 1 }, "debuffName": "Buff Block", "multiplier": 0.3, "duration": 1 },
                            { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Baller", "duration": 2 }
                        ]
                    },
                    {
                        "if": "selfHealthBelowOrEqual50",
                        "effects": [
                            { "type": "damage", "target": { "type": ["enemy"], "scope": "farthest" }, "multiplier": 0.4, "basedOn": "attack" },
                            { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "farthest" }, "debuffName": "Silence", "chance": 0.3, "duration": 1 }
                        ]
                    }
                ]
            },
            {
                "skillName": "Fortuner Drive", "description": "➡️ 120% damage to enemies in square.\n💥 Instantly kills enemies below 10% HP.\n🔓 Unlock: Must kill 1 enemy first.", "cooldown": 8, "unlockCondition": "onKill",
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "area", "pattern": "square", "canChoose": true }, "multiplier": 1.2, "basedOn": "attack" },
                    { "type": "execute", "target": { "type": ["enemy"], "scope": "area", "pattern": "square", "canChoose": true }, "condition": "targetHealthBelow10" }
                ]
            }
        ],
        "passives": [ { "name": "Second Chance", "description": "If fatal hit received: survives at 1 HP, clears debuffs." } ]
    },
    {
        "name": "Frea", "attack": 19, "health": 94, "speed": 23, "role": "Fighter", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Slap", "description": "➡️ 50% damage to the closest enemy.", "cooldown": 0,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "closest" }, "multiplier": 0.5, "basedOn": "attack" }]
            },
            {
                "skillName": "Unnerving Glare", "description": "➡️ Applies Weak effect. 60% chance to 🔇Silence (1 turn).", "cooldown": 3,
                "effects": [
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "debuffName": "Weak" },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "debuffName": "Silence", "duration": 1, "chance": 0.6 }
                ]
            },
            {
                "skillName": "Endless Pinch", "description": "➡️ 70% damage. Can be reused, but success rate halves each time.\n💀 If kill: reuse chance stays.", "cooldown": 4,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 0.7, "basedOn": "attack" }],
                "uniqueLogic": "halvingSuccessRate"
            }
        ],
        "passives": [ { "name": "Confusing Mandarin", "description": "Complex passive logic for Disorient and immunities." } ]
    },
    {
        "name": "Grace V", "attack": 12, "health": 81, "speed": 9, "role": "Support", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Radiant Shield", "description": "➡️ Shields lowest-HP ally (50% of her Max HP) + herself (100% of her Attack).", "cooldown": 0,
                "effects": [
                    { "type": "shield", "target": { "type": ["ally"], "scope": "lowestHealth", "count": 1 }, "percentage": 0.5, "basedOn": "casterMaxHealth" },
                    { "type": "shield", "target": { "type": ["self"] }, "percentage": 1.0, "basedOn": "attack" }
                ]
            },
            {
                "skillName": "Divine Rant", "description": "➡️ Grants 30 Shield to all allies in the same row.", "cooldown": 4,
                "effects": [{ "type": "shield", "target": { "type": ["ally"], "scope": "area", "pattern": "row" }, "value": 30 }]
            },
            {
                "skillName": "Divine Light", "description": "➡️ Grants 40 Shield to all allies and removes 1 debuff each.\n🌟 Grants 🌟 Divine (1 turn).", "cooldown": 5,
                "effects": [
                    { "type": "shield", "target": { "type": ["ally"], "scope": "all" }, "value": 40 },
                    { "type": "cleanse", "target": { "type": ["ally"], "scope": "all" }, "count": 1 },
                    { "type": "applyBuff", "target": { "type": ["ally"], "scope": "all" }, "buffName": "Divine", "duration": 1 }
                ]
            }
        ],
        "passives": [ { "name": "Grace’s Blessing", "description": "Shields stack. If Grace dies, her shields vanish." } ]
    },
    {
        "name": "Jessica", "attack": 8, "health": 53, "speed": 7, "role": "Support", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Hot Meal", "description": "➡️ Heals 2 lowest-HP allies for 50% of her HP. Also self-heals 20%.", "cooldown": 0,
                "effects": [
                    { "type": "heal", "target": { "type": ["ally"], "scope": "lowestHealth", "count": 2 }, "percentage": 0.5, "basedOn": "casterMaxHealth" },
                    { "type": "heal", "target": { "type": ["self"] }, "percentage": 0.2, "basedOn": "casterMaxHealth" }
                ]
            },
            {
                "skillName": "Emotional Tears", "description": "➡️ Removes up to 2 debuffs from one ally.\n✨ If no debuffs: heals by 100% of her Attack instead.", "cooldown": 3,
                "uniqueLogic": "conditionalCleanseOrHeal",
                "effects": [
                    { "type": "cleanse", "target": { "type": ["ally"], "scope": "single", "canChoose": true }, "count": 2 },
                    { "type": "heal", "target": { "type": ["ally"], "scope": "single", "canChoose": true }, "percentage": 1.0, "basedOn": "attack" }
                ]
            },
            {
                "skillName": "Cheering Squad", "description": "➡️ Heals all allies 10% Max HP and grants ✨ Encouraged.", "cooldown": 4,
                "effects": [
                    { "type": "heal", "target": { "type": ["ally"], "scope": "all" }, "percentage": 0.1, "basedOn": "targetMaxHealth" },
                    { "type": "applyBuff", "target": { "type": ["ally"], "scope": "all" }, "buffName": "Encouraged" }
                ]
            }
        ],
        "passives": [ { "name": "Healing Touch", "description": "+10% Healing Bonus per heal (up to +50%)." } ]
    },
    {
        "name": "Joash", "attack": 17, "health": 92, "speed": 31, "role": "Controller", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Cartwheel Chaos", "description": "➡️ Hits 3 random enemies. Each hit = 20% damage + 😵 Disoriented (1 turn).", "cooldown": 0,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "random", "count": 3 }, "multiplier": 0.2, "basedOn": "attack" },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "random", "count": 3 }, "debuffName": "Disoriented", "duration": 1 }
                ]
            },
            {
                "skillName": "Piano Smash", "description": "➡️ Stuns 1 random enemy (1 turn).\n🎵 Triggers ♪ Music.", "cooldown": 3,
                "effects": [
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "random", "count": 1 }, "debuffName": "Stun", "duration": 1 },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Music", "duration": 1 }
                ]
            },
            {
                "skillName": "Handstand", "description": "➡️ Invulnerable to single-target skills (1 turn).\n💢 50% chance to 🔇Silence attackers that hit him next turn.", "cooldown": 4,
                "effects": [{ "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Invulnerable (Single-Target)", "duration": 1 }],
                "uniqueLogic": "handstand"
            }
        ],
        "passives": [ { "name": "Chaotic Presence", "description": "Complex passive logic for miss chance and hidden status." } ]
    },
    {
        "name": "Clement", "attack": 29, "health": 150, "speed": 37, "role": "Fighter/Assassin", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Triple Jump", "description": "➡️ Hits 3 random enemies for 30% each. 15% chance to Stun each enemy (1 turn).", "cooldown": 0,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "random", "count": 3 }, "multiplier": 0.3, "basedOn": "attack" },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "random", "count": 3 }, "debuffName": "Stun", "duration": 1, "chance": 0.15 }
                ]
            },
            {
                "skillName": "Heavy Barbell", "description": "➡️ 60% damage to a random line of enemies (up to 2 enemies).\n💪 Gains 🏋️ Gym (2 turns).", "cooldown": 3,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "area", "pattern": "line", "canChoose": false }, "multiplier": 0.6, "basedOn": "attack" },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Gym", "duration": 2 }
                ]
            },
            {
                "skillName": "Ankle Breaker", "description": "➡️ 80% damage to the nearest enemy.\n🦶 Applies Ankle Break.", "cooldown": 4,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "closest" }, "multiplier": 0.8, "basedOn": "attack" },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "closest" }, "debuffName": "Ankle Break", "duration": 2 },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Baller", "duration": 2 }
                ]
            }
        ],
        "passives": [ { "name": "Ankle Injury", "description": "Complex passive logic for tracking skill uses and self-debuff." } ]
    },
    {
        "name": "Keiron", "attack": 38, "health": 179, "speed": 27, "role": "Fighter", "rarity": "★★★★★",
        "skills": [
            {
                "skillName": "Crushing Kick", "description": "➡️ 65% Attack damage to a single enemy. Applies Slow effect (1 turn).", "cooldown": 3,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 0.65, "basedOn": "attack" },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "debuffName": "Slow", "duration": 1 }
                ]
            },
            {
                "skillName": "Counter State", "description": "➡️ Enters counter state for 2 turns. Can’t act, but tackles attackers for 40% Attack damage.", "cooldown": 4,
                "effects": [{ "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Counter", "duration": 2, "multiplier": 0.4 }],
                "uniqueLogic": "counterStance"
            },
            {
                "skillName": "Devastating Combo", "description": "➡️ 4-hit combo, 150% total damage. If target is under 5% HP after, they're instantly executed. Ignores shields.", "cooldown": 5,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 1.5, "basedOn": "attack", "hitCount": 4, "ignoresShield": true },
                    { "type": "execute", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "condition": "targetHealthBelow5" }
                ]
            }
        ],
        "passives": [ { "name": "Suicidal Tendencies / August Fifth", "description": "Complex passive logic for Sanity resource." } ]
    },
    {
        "name": "Kevin", "attack": 18, "health": 82, "speed": 15, "role": "META Support", "rarity": "★★★★★",
        "skills": [
            {
                "skillName": "Drag and Drop", "description": "➡️ Moves 1 enemy to a new spot(switch), applies Slow effect (2 turns).\n🎯 Marks them as Coded (+20% damage taken) for 2 turns", "cooldown": 0,
                "effects": [
                    { "type": "reposition", "target": { "type": ["enemy"], "scope": "single", "canChoose": true } },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "debuffName": "Slow", "duration": 2 },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "debuffName": "Coded", "duration": 2, "multiplier": 0.2 }
                ]
            },
            {
                "skillName": "Cheat Code Boost", "description": "➡️ Buffs 3 random allies:\n+40% Attack & all skills −1 cooldown for next turn", "cooldown": 3,
                "effects": [
                    { "type": "applyBuff", "target": { "type": ["ally"], "scope": "random", "count": 3 }, "buffName": "Attack Up", "multiplier": 0.4, "duration": 1 },
                    { "type": "reduceCooldown", "target": { "type": ["ally"], "scope": "random", "count": 3 }, "value": 1 }
                ]
            },
            {
                "skillName": "Glitch Slam", "description": "➡️ Scrambles all enemy positions\nCoded enemies: Stunned (1 turn)\nAll enemies: take 30% more damage (1 turn)\n+10% confusion damage", "cooldown": 6,
                "effects": [
                    { "type": "reposition", "target": { "type": ["enemy"], "scope": "all" }, "pattern": "random" },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "all" }, "debuffName": "Stun", "duration": 1, "condition": "targetHasCoded" },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "all" }, "debuffName": "Vulnerable", "duration": 1, "multiplier": 0.3 },
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "all" }, "multiplier": 0.1, "basedOn": "attack", "isTrueDamage": true }
                ]
            }
        ],
        "passives": [ { "name": "Ctrl+C, Ctrl+V", "description": "Complex passive logic for cloning a dead ally." } ]
    },
    {
        "name": "Laudya", "attack": 15, "health": 86, "speed": 20, "role": "Support/Controller", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Combat Recall", "description": "➡️ Applies Weak effect & Slow effect (2 turns) to 1 enemy.\n🎯 40% chance to 🔇Silence (1 turn)", "cooldown": 0,
                "effects": [
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "debuffName": "Weak", "duration": 2 },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "debuffName": "Slow", "duration": 2 },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "debuffName": "Silence", "duration": 1, "chance": 0.4 }
                ]
            },
            {
                "skillName": "Memorized", "description": "➡️ Marks 2 enemies (2 turns)\n25% crit chance vs them\nIf they use their respective last skill (2/3/4): damage −50%", "cooldown": 3,
                "effects": [{ "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "single", "canChoose": true, "count": 2 }, "debuffName": "Memorized", "duration": 2 }],
                "uniqueLogic": "memorized"
            }
        ],
        "passives": [ { "name": "I Remember Your Name", "description": "Complex passive logic for stacking and copying effects." } ]
    },
    {
        "name": "Leonardo Cornelius", "attack": 22, "health": 177, "speed": 13, "role": "Tank/Support", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Sharp Note", "description": "➡️ 30% damage, −10% target HP\n🎵 Triggers ♪ Music", "cooldown": 0,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 0.3, "basedOn": "attack" },
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "percentage": 0.1, "basedOn": "targetMaxHealth", "isTrueDamage": true },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Music", "duration": 1 }
                ]
            },
            {
                "skillName": "Resonant Shield", "description": "➡️ Shield (25) to self + lowest-HP ally (2 turns)\n🎵 Triggers ♪ Music", "cooldown": 3,
                "effects": [
                    { "type": "shield", "target": { "type": ["self", "ally"], "scope": "lowestHealth", "count": 2 }, "value": 25, "duration": 2 },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Music", "duration": 1 }
                ]
            }
        ],
        "passives": [ { "name": "Battle Prelude", "description": "Complex passive logic for start-of-battle effects." } ]
    },
    {
        "name": "Margaretha", "attack": 11, "health": 77, "speed": 14, "role": "Support", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Energy Pulse", "description": "➡️ 20% damage\n💢 Removes Shield from Supports/Controllers hit", "cooldown": 0,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 0.2, "basedOn": "attack" },
                    { "type": "dispel", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "dispelType": "shield", "condition": "targetIsSupportOrController" }
                ]
            },
            {
                "skillName": "Row Heal", "description": "➡️ Heals self and 2 row-mates (20% of her max health)", "cooldown": 3,
                "effects": [{ "type": "heal", "target": { "type": ["self", "ally"], "scope": "area", "pattern": "row" }, "percentage": 0.2, "basedOn": "casterMaxHealth" }]
            },
            {
                "skillName": "Vanish", "description": "➡️ Grants invisibility and invulnerability to self + 1 ally of her choice, cleanses both from any debuffs", "cooldown": 4,
                "effects": [
                    { "type": "applyBuff", "target": { "type": ["self", "ally"], "scope": "single", "count": 2, "canChoose": true }, "buffName": "Invisible" },
                    { "type": "applyBuff", "target": { "type": ["self", "ally"], "scope": "single", "count": 2, "canChoose": true }, "buffName": "Invulnerable" },
                    { "type": "cleanse", "target": { "type": ["self", "ally"], "scope": "single", "count": 2, "canChoose": true }, "count": "all" }
                ]
            }
        ],
        "passives": [ { "name": "Fading Defense", "description": "Auto-activates Vanish at low health." } ]
    },
    {
        "name": "Meiliana", "attack": 14, "health": 88, "speed": 36, "role": "Assassin", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Dash Strike", "description": "➡️ Charges through line, 70% damage per enemy.", "cooldown": 0,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "area", "pattern": "line", "canChoose": true }, "multiplier": 0.7, "basedOn": "attack" }]
            },
            {
                "skillName": "Spinning Sweep", "description": "➡️ AoE strike (99% damage) (3 hit combo 33% each)", "cooldown": 4,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "all" }, "multiplier": 0.33, "basedOn": "attack", "hitCount": 3 }]
            }
        ],
        "passives": [ { "name": "Chloe Ting Fan", "description": "Start of battle buffs for 3 turns." } ]
    },
    {
        "name": "Nelsen", "attack": 25, "health": 94, "speed": 33, "role": "Assassin", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Toxic Spit", "description": "➡️ 70% single-target damage", "cooldown": 0,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 0.7, "basedOn": "attack" }]
            },
            {
                "skillName": "Gas Cloud", "description": "➡️ Square AoE: 40% damage per turn (2 turns)\n💀 Inflicts Poison", "cooldown": 3,
                "effects": [
                    { "type": "damageOverTime", "target": { "type": ["enemy"], "scope": "area", "pattern": "square", "canChoose": true }, "multiplier": 0.4, "basedOn": "attack", "duration": 2 },
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "area", "pattern": "square", "canChoose": true }, "debuffName": "Poison", "duration": 2 }
                ]
            }
        ],
        "passives": [ { "name": "Work-Life Split", "description": "Complex passive logic for stacking damage based on kills and rounds." } ]
    },
    {
        "name": "Neville", "attack": 34, "health": 165, "speed": 30, "role": "Fighter", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "One-Inch Punch", "description": "➡️ 40% damage to 1 enemy.", "cooldown": 0,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 0.4, "basedOn": "attack" }]
            },
            {
                "skillName": "Slam Throw", "description": "➡️ 60% damage to front row target if there is, 25% AoE around them", "cooldown": 4,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "frontRow", "count": 1, "canChoose": true }, "multiplier": 0.6, "basedOn": "attack" },
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "splash" }, "multiplier": 0.25, "basedOn": "attack" }
                ]
            }
        ],
        "passives": [ { "name": "Red Hoodie Mode", "description": "Complex passive logic for transforming after taking hits." } ]
    },
    {
        "name": "Alanna", "attack": 20, "health": 197, "speed": 2, "role": "META Tank", "rarity": "★★★★★",
        "skills": [
            {
                "skillName": "Loud Taunt", "description": "➡️ Taunts back row, redirects attacks to self for 1 turn. Gains 15% damage reduction.", "cooldown": 2,
                "effects": [
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Taunt", "duration": 1, "targetScope": "backRow" },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Damage Reduction", "duration": 1, "multiplier": 0.15 }
                ]
            },
            {
                "skillName": "Charging Slam", "description": "➡️ Deals 60% of target's current Health as damage(only 20% to bosses).", "cooldown": 3,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "percentage": 0.6, "basedOn": "targetCurrentHealth" },
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "percentage": 0.2, "basedOn": "targetCurrentHealth", "condition": "targetIsBoss" }
                ]
            }
        ],
        "passives": [ { "name": "Indomitable Wall", "description": "Complex passive logic for healing on hit and cooldown reduction." } ]
    },
    {
        "name": "Sanjaya", "attack": 28, "health": 186, "speed": 16, "role": "Tank", "rarity": "★★★★★",
        "skills": [
            {
                "skillName": "Sweaty Hands", "description": "➡️ 40% damage to 1 enemy.", "cooldown": 0,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 0.4, "basedOn": "attack" }]
            },
            {
                "skillName": "Mask On", "description": "➡️ Gains 20% damage reduction shield (2 turns)", "cooldown": 3,
                "effects": [{ "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Damage Reduction", "multiplier": 0.2, "duration": 2 }]
            },
            {
                "skillName": "Gaming Escape", "description": "➡️ Immune to all damage & effects for 1 turn\n🕹️ Usable 3× per battle", "cooldown": 5, "uses": 3,
                "effects": [{ "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Immune", "duration": 1 }]
            },
            {
                "skillName": "Hoodie Mode", "description": "➡️ Shield (30), +10% Health regen (3 turns)", "cooldown": 4,
                "effects": [
                    { "type": "shield", "target": { "type": ["self"] }, "value": 30 },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Heal Over Time", "percentage": 0.1, "basedOn": "maxHealth", "duration": 3 }
                ]
            }
        ],
        "passives": [ { "name": "Fortress Mode", "description": "Complex passive logic when multiple buffs are active." } ]
    },
    {
        "name": "Winston", "attack": 31, "health": 152, "speed": 23, "role": "Fighter", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Simple Punch", "description": "➡️ 40% damage to a single enemy.", "cooldown": 0,
                "effects": [{ "type": "damage", "target": { "type": ["enemy"], "scope": "single", "canChoose": true }, "multiplier": 0.4, "basedOn": "attack" }]
            },
            {
                "skillName": "Biology Serum", "description": "➡️ Restores 5 Health, +30% Attack for 2 turns.\n✨ Buff doubles if HP <30%", "cooldown": 4,
                "effects": [
                    { "type": "heal", "target": { "type": ["self"] }, "value": 5 },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Attack Up", "multiplier": 0.3, "duration": 2 },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Attack Up", "multiplier": 0.6, "duration": 2, "condition": "selfHealthBelow30" }
                ]
            },
            {
                "skillName": "Gamble Roll", "description": "➡️ 5% chance: 150% damage + 15% of their Current Health\n➡️ 25% chance: 100% damage\n➡️ 75% chance: 50% damage", "cooldown": 5,
                "uniqueLogic": "gambleRoll"
            }
        ],
        "passives": [ { "name": "Caffeinated Buffs", "description": "Complex passive logic for stacking buffs and improving gamble chances." } ]
    },
    {
        "name": "Velyn", "attack": 6, "health": 34, "speed": 26, "role": "Support", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Soundwave Trio", "description": "➡️ 3 waves of AoE sound, each dealing 50% Attack to all enemies.\n🎵 Triggers ♪ Music (1 turn)", "cooldown": 0,
                "effects": [
                    { "type": "damage", "target": { "type": ["enemy"], "scope": "all" }, "multiplier": 0.5, "basedOn": "attack", "hitCount": 3 },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Music", "duration": 1 }
                ]
            },
            {
                "skillName": "Sonic Tempo", "description": "➡️ Increases Speed of 3 chosen allies by 50% of their base Speed + 40% of Velyn’s Speed (2 turns)\n🎵 Triggers ♪ Music (1 turn)", "cooldown": 3,
                "effects": [
                    { "type": "applyBuff", "target": { "type": ["ally"], "scope": "single", "canChoose": true, "count": 3 }, "buffName": "Speed Up", "percentage": 0.5, "basedOn": "targetBaseSpeed", "duration": 2 },
                    { "type": "applyBuff", "target": { "type": ["ally"], "scope": "single", "canChoose": true, "count": 3 }, "buffName": "Speed Up", "percentage": 0.4, "basedOn": "casterSpeed", "duration": 2 },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Music", "duration": 1 }
                ]
            }
        ],
        "passives": [ { "name": "Graceful Dodge", "description": "40% chance to dodge any enemy attack." } ]
    },
    {
        "name": "Hananya", "attack": 16, "health": 130, "speed": 12, "role": "Controller", "rarity": "★★★★",
        "skills": [
            {
                "skillName": "Dramatic Song", "description": "➡️ Applies Slow effect to the 3 closest enemies until next turn and removes 1 random buff from each target hit.\n🎵 Triggers ♪ Music (1 turn)", "cooldown": 0,
                "effects": [
                    { "type": "applyDebuff", "target": { "type": ["enemy"], "scope": "closest", "count": 3 }, "debuffName": "Slow", "duration": 1 },
                    { "type": "dispel", "target": { "type": ["enemy"], "scope": "closest", "count": 3 }, "dispelType": "buff", "count": 1 },
                    { "type": "applyBuff", "target": { "type": ["self"] }, "buffName": "Music", "duration": 1 }
                ]
            },
            {
                "skillName": "Gendered Performance", "description": "➡️ 50% chance to stun all male enemies (1 turn), but also stuns one male ally randomly (1 turn)", "cooldown": 4,
                "uniqueLogic": "genderedStun"
            }
        ],
        "passives": [ { "name": "Male Ally Support", "description": "Complex passive logic for health buffs and the Jomok counter effect." } ]
    }
];


// ===================================================================================
// --- DATABASE SEEDING SCRIPT ---
// This script will add/overwrite all character data in your Firestore.
// ===================================================================================

/**
 * Sanitizes a string to be used as a Firestore document ID.
 * Firestore does not allow certain characters in document IDs.
 * @param {string} str The string to sanitize.
 * @returns {string} The sanitized string.
 */
function sanitizeId(str) {
  if (!str) return '';
  return str.replace(/[\/\\.#$\[\]]/g, '-');
}

/**
 * Deletes all documents in a specified subcollection.
 * @param {DocumentReference} docRef The reference to the parent document.
 * @param {string} subcollectionName The name of the subcollection to clear.
 */
async function clearSubcollection(docRef, subcollectionName) {
    const subcollectionRef = collection(docRef, subcollectionName);
    const snapshot = await getDocs(subcollectionRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cleared '${subcollectionName}' subcollection for ${docRef.id}.`);
}


/**
 * Main function to seed all character data into Firestore.
 * It will overwrite existing character data and clear/re-populate subcollections.
 */
async function addCharactersToFirestore() {
  console.log("Starting Firestore seeding process...");

  for (const char of characters) {
    // Sanitize the character name for use as a document ID
    const charId = sanitizeId(char.name);
    if (!charId) {
        console.error("Character has no name, skipping:", char);
        continue;
    }
    
    // The main document reference for the character
    const charDocRef = doc(db, "class-cards", charId);
    
    // Separate the character's base data from its subcollections
    const { skills, passives, ...charData } = char;

    try {
        // --- Set the main character data (Attack, Health, etc.) ---
        await setDoc(charDocRef, charData);
        console.log(`Successfully set data for character: ${char.name}`);

        // --- Clear and Seed the 'skills' subcollection ---
        if (skills && skills.length > 0) {
            await clearSubcollection(charDocRef, 'skills');
            const skillsBatch = writeBatch(db);
            for (const skill of skills) {
                const skillId = sanitizeId(skill.skillName);
                if (skillId) {
                    const skillDocRef = doc(charDocRef, "skills", skillId);
                    skillsBatch.set(skillDocRef, skill);
                }
            }
            await skillsBatch.commit();
            console.log(`Added ${skills.length} skills to ${char.name}.`);
        }

        // --- Clear and Seed the 'passives' subcollection ---
        if (passives && passives.length > 0) {
            await clearSubcollection(charDocRef, 'passives');
            const passivesBatch = writeBatch(db);
            for (const passive of passives) {
                const passiveId = sanitizeId(passive.name);
                 if (passiveId) {
                    const passiveDocRef = doc(charDocRef, "passives", passiveId);
                    passivesBatch.set(passiveDocRef, passive);
                }
            }
            await passivesBatch.commit();
            console.log(`Added ${passives.length} passives to ${char.name}.`);
        }

    } catch (error) {
        console.error(`Failed to seed character ${char.name}:`, error);
    }
  }

  console.log("\nFirestore seeding process complete!");
}

// Call the main function to start the seeding process.
addCharactersToFirestore();