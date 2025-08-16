```json
{

  name: "Sanjaya",
  "attack": 28,
  "health": 186,
  "speed": 16,
  "role": "Tank",
  "rarity": "5★",
  
  "skills": [

    {

      name: "Minimal Jab",
      "description": "Sanjaya throws a minimal effort jab, dealing 40% damage to a single enemy",
      "cooldown": null

    },

    {

      name: "Face Mask",
      "description": "Gains a 20% damage reduction shield for 2 turns",
      "cooldown": 3

    },

    {

      name: "Mobile Legends",
      "description": "Immune to all damage and effects for 1 turn. Can only be used 3 times per battle.",
      "cooldown": 5,
      "uses": 3

    },

    {

      name: "Black Hoodie",

      "description": "Gains a shield that blocks 30 damage and +10% Health regeneration for 3 turns.",

      "cooldown": 4

    }

  ],

  "synergies": [
  {
    "with": "kevin", // Reference to another character's ID or name
    name: "Code Fortress",
    "description": "Unlocks Hoodie Protocol if Kevin is on the same team.",
    
    "effects": [

      "Gain a 30-damage shield",
      "+10% Health regeneration per turn",
      "+20% damage reduction",
      "1 turn of full immunity to all Crowd Control effects"

    ],

    "cooldown": 5,
    "replacesSkills": [2, 4] // Optionally, index of skills to replace
  }
]
```
