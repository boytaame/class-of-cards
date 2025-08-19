// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, addDoc, query } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import char1Image from '/charImg/char1.jpeg';
import skillImage from '/skill.png';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6qwu0IUqdu7ooyOG2-6opYXOTUrHw2Go",
  authDomain: "class-of-cards.firebaseapp.com",
  projectId: "class-of-cards",
  storageBucket: "class-of-cards.firebasestorage.app",
  messagingSenderId: "440965183666",
  appId: "1:440965183666:web:a02f2029ed6fcd9b10f1ab",
  measurementId: "G-NJ39QR9B94"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const auth = getAuth();
auth.languageCode = 'en';

let allCharacters = [];
let selectedCharacters = [];
let firstSelectedSlot = null;
let enemyCharacters = []; 
const MAX_SELECTED_CHARS = 6;
let battleStarted = false;
let turns = 0;
let notificationHistory = []; // <-- ADD THIS NEW ARRAY
let currentSkill;
let playerTeam = [];
let enemyTeam = [];
let activeCharacter = null;
let battleQueue = [];
let currentTurnIndex = 0;


const gameContainer = document.getElementById('gameBoard');







const charSlot = document.querySelectorAll('.character-slot');


const charSwap = function () {
  if (battleStarted) return;

  if (!this.closest('.playerSide')) {
    console.log("Cannot re-order enemy characters.");
    return;
  }

  if (!firstSelectedSlot) {
    firstSelectedSlot = this;
    firstSelectedSlot.querySelector(".charCard").classList.add('selected-for-swap');
  } else {
    const secondSelectedSlot = this;
    firstSelectedSlot.querySelector('.charCard').classList.remove('selected-for-swap');
    if (firstSelectedSlot === secondSelectedSlot) {
      firstSelectedSlot = null;
      return;
    }

    const firstCharId = firstSelectedSlot.dataset.charId;
    firstSelectedSlot.dataset.charId = secondSelectedSlot.dataset.charId;
    secondSelectedSlot.dataset.charId = firstCharId;

    const firstCard = firstSelectedSlot.querySelector('.charCard');
    const secondCard = secondSelectedSlot.querySelector('.charCard');

    if (firstCard && secondCard) {
        firstSelectedSlot.appendChild(secondCard);
        secondSelectedSlot.appendChild(firstCard);
    }

    firstSelectedSlot = null;
  }
  // This function will now work correctly even after swapping
  const charId = this.dataset.charId;
}

function selectEnemyCharacters() {
  const availableCharacters = allCharacters.filter(char => !selectedCharacters.some(playerChar => playerChar.id === char.id));
  const shuffled = availableCharacters.sort(() => 0.5 - Math.random());
  enemyCharacters = shuffled.slice(0, MAX_SELECTED_CHARS);
}


charSlot.forEach(slot => {
  slot.addEventListener('click', charSwap);
});



document.addEventListener('DOMContentLoaded', async () => {








  // !!! ANGEL ENGINE TERRITORY !!!



function angel_CalcSkillDamage(attacker, damageEffect) {

  if (!damageEffect) {
    return 0;
  }

  let baseValue = 0;
  if (damageEffect.basedOn === "attack") {
    baseValue = attacker.attack;
  } else if (damageEffect.basedOn === "maxHealth") {
    baseValue = attacker.health;
  }

  const finalDamage = baseValue * damageEffect.multiplier;
  
  return Math.ceil(finalDamage);
}








function angel_CalcDamage(incomingDamage, target) {
    let finalDamage = incomingDamage;

    // --- Step 1: Apply the character's base Defense stat ---
    // This directly implements the formula: Defense / (Defense + 200)
    // We check if defense exists and is greater than 0 to avoid errors.
    if (target.defense && target.defense > 0) {
        const defenseReduction = target.defense / (target.defense + 200);
        finalDamage *= (1 - defenseReduction);
    }

    // --- Step 2: Apply all other active damage reduction effects multiplicatively ---
    // This part is the key to making your game scalable.
    // We will check the target's 'activeEffects' array for any effect that reduces damage.
    if (target.activeEffects && target.activeEffects.length > 0) {
      for (const effect of target.activeEffects) {
        // Let's say a damage reduction buff has a type of 'damageReduction'
        if (effect.type === 'damageReduction') {
          // The effect's 'multiplier' would be 0.15 for a 15% reduction.
          // This line performs the multiplicative stacking.
          finalDamage *= (1 - effect.multiplier);
        }
    }
    }

    // --- Step 3: Return a whole number ---
    // We use Math.ceil() so that an attack dealing 76.24 damage becomes 77.
    // This prevents tiny health fractions and feels better in-game.
    return Math.ceil(finalDamage);
}


async function angelDispatcher(event) {
  if (!currentSkill) {
    selectedSkillDisplay.textContent = 'Select A Skill!';
    return;
  }

  const targetSlot = event.currentTarget; // The enemy slot that was clicked
  const attacker = activeCharacter; // The currently active player character
  const targetCharId = targetSlot.dataset.charId;
  const targetChar = enemyTeam.find(c => c.id === targetCharId);
  const skillToUse = currentSkill;
  
  currentSkill = null;
  updateSelectedSkillDisplay();
  
  await angelEngine(attacker, skillToUse, [targetChar]);
  
  endCurrentTurn(attacker);
}





async function angelEngine(caster, skillData, primaryTargets) {
  showNotification(`${caster.name} used ${skillData.skillName}`);

  for (const effect of skillData.effects) {
    const finalTargets = angel_findFinalTargets(caster, effect.target, primaryTargets)
    
    switch (effect.type) {
      case "damage" :
        for (const target of finalTargets) {
          const rawDamage = angel_CalcSkillDamage(caster, effect);
          const finalDamage = angel_CalcDamage(rawDamage, target);

          showNotification(`${target.name} takes ${finalDamage} damage from ${caster.name} using ${skillData.skillName}!`);
          target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

          const targetSlot = document.querySelector(`[data-char-id="${target.id}"]`);
          updateHealthDisplay(targetSlot, target);

          if (target.currentHealth <= 0) {
            // Handle death
            targetSlot.querySelector('.charCard').style.filter = 'grayscale(100%) brightness(50%)';
          }
        }
        break;

      case "heal" :
        showNotification(`healing skill used, ${effect.skillName}`)
        break;

      case "applyBuff":
        showNotification(`apply buff skill used, ${effect.skillName}, buffName: ${effect.buffName}`)
        break;
      
      case "applyDebuff":
        showNotification(`apply debuff skill used, ${effect.skillName}, buffName: ${effect.debuffName}`)
        break;

      case "reduceCooldown":
        showNotification(`reduce cooldown skill used, ${effect.skillName}`)
        break;
      
      case "reposition":
        showNotification(`reposition skill used, ${effect.skillName}`)
        break;
      }
  }
}


function angel_findFinalTargets(caster, targetData, primaryTargets) {
  return primaryTargets;
}






// !!! ANGEL ENGINE TERRITORY !!!








  const querySnapshot = await getDocs(collection(db, "class-cards"));
  allCharacters = [];

  // Fetch all characters in parallel
  await Promise.all(querySnapshot.docs.map(async (docSnap) => {
    const charData = docSnap.data();
    charData.id = docSnap.id;

    // Fetch skills and passives in parallel
    const [skillsSnap, passivesSnap] = await Promise.all([
      getDocs(collection(db, "class-cards", docSnap.id, "skills")),
      getDocs(collection(db, "class-cards", docSnap.id, "passives"))
    ]);
    charData.skills = skillsSnap.docs.map(s => s.data());
    charData.passives = passivesSnap.docs.map(p => p.data());

    allCharacters.push(charData);
  }));


  const overlay = document.querySelector('.overlay');
  const selectedCharsDiv = document.getElementById('selected-chars-list');
  const startGameButton = document.getElementById('start-game-button');
  const noCharsSelectedMsg = document.querySelector('.noCharsSelected')
  

  // TODO:
  // FIXME:
  function startGame() {
    if (selectedCharacters.length < MAX_SELECTED_CHARS) {
      alert(`You need to select ${MAX_SELECTED_CHARS} characters to start the game.`);
      return;
    }

    selectEnemyCharacters();

    // Proceed to the next step in your game logic
    console.log("Starting placement phase with characters:", selectedCharacters);
    console.log("Enemy characters:", enemyCharacters);

    const playerSlots = document.querySelectorAll('.playerSide .character-slot');
    playerSlots.forEach((slot, i) => {
      if (selectedCharacters[i]) {
        const card = slot.querySelector('.charCard');
        const nameSpan = card.querySelector('.playerSpan');
        const healthPoints = card.querySelector('.healthPoints');
        nameSpan.textContent = selectedCharacters[i].name;
        healthPoints.textContent = `${selectedCharacters[i].health}`;
        // healthPoints.textContent = `${selectedCharacters[i].currentHealth}/${selectedCharacters[i].health}`;
        card.style.background = `url(${char1Image}) center center / cover no-repeat`;
        slot.dataset.charId = selectedCharacters[i].id; // instead of name
      }
    });
    
    const enemySlots = document.querySelectorAll('.enemySide .character-slot');
    enemySlots.forEach((slot, i) => {
      if (enemyCharacters[i]) {
        const card = slot.querySelector('.charCard');
        const nameSpan = card.querySelector('.enemySpan');
        const healthPoints = card.querySelector('.healthPoints');
        nameSpan.textContent = enemyCharacters[i].name;
        healthPoints.textContent = `${enemyCharacters[i].health}`;
        card.style.background = `url('./charImg/char1.jpeg') center center / cover no-repeat`;
        // Add the data-char-id attribute to the slot
        slot.dataset.charId = enemyCharacters[i].id; // instead of name
      }
    });
    updateHealthDisplay();
    document.getElementById('characterSelection').classList.add('hidden');
    document.getElementById('characterSelection').classList.remove('active');
    document.getElementById('main-game').classList.add('active');
    document.getElementById('main-game').classList.remove('hidden');
  }
  

  startGameButton.addEventListener('click', startGame)

  function updateSelectedChars() {
    selectedCharsDiv.innerHTML = '';
    if (selectedCharacters.length === 0) {
      noCharsSelectedMsg.classList.add('active');
      noCharsSelectedMsg.classList.remove('hidden');
    } else {
      noCharsSelectedMsg.classList.remove('active');
      noCharsSelectedMsg.classList.add('hidden');
    }
    startGameButton.classList.toggle('hidden', selectedCharacters.length === 0);
    selectedCharacters.forEach(char => {
      const charElement = document.createElement('div');
      charElement.className = 'character-slot-selection';
      charElement.innerHTML = `
      <div class="charCard-selected charCardRoundedBorders" data-char-id="${char.id}">
        <span class="charName-selection selectionSpan">${char.name}</span>
        <img src="/charImg/char1.jpeg" class="charImg-selection">
      </div>
      `;
      
      selectedCharsDiv.appendChild(charElement);
    });

    const selectedCards = selectedCharsDiv.querySelectorAll('.charCard-selected');
    selectedCards.forEach(card => {
      card.addEventListener('click', (event) => {
        event.stopPropagation();
        const charIdToRemove = event.currentTarget.getAttribute('data-char-id');
        console.log(charIdToRemove);
        selectedCharacters = selectedCharacters.filter(char => char.id !== charIdToRemove);
        updateSelectedChars();
      })
    })
  }


  let selectInfoModalOpened = false;
  function openModal(x) {
    const charInfoModal = document.getElementById('character-info-selection');
    if (!selectInfoModalOpened) {
      selectInfoModalOpened = true;
      charInfoModal.classList.remove('hidden')
      charInfoModal.classList.add('active')
      overlay.classList.add('active');
      overlay.classList.remove('hidden');
    } else {
      selectInfoModalOpened = false;
      charInfoModal.classList.remove('active')
      charInfoModal.classList.add('hidden');
      overlay.classList.remove('active');
      overlay.classList.add('hidden');
    }

    charInfoModal.innerHTML = `
    <div>
      <h1>${x.name}</h1>
      <p>Attack: ${x.attack}</p>
      <p>Health: ${x.health}</p>
      <p>Speed: ${x.speed}</p>
      <p>Role: ${x.role}</p>
      <p>Skills:</p>
      <ol>
        ${x.skills.map(skill => `<li><strong>${skill.skillName}</strong><br><i>${skill.description}</i></li>`).join('')}
      </ol>
      <p>==================================</p>
      <ul>Passives: ${x.passives.map(passive => `<li>${passive.name}<br><i>${passive.description}</i></li>`).join('')}</ul>
      <button id="close-info">Close</button>
    </div>
    `;
    const closeButton = document.getElementById('close-info');
    closeButton.addEventListener('click', () => {
      charInfoModal.classList.remove('active');
      charInfoModal.classList.add('hidden');
      selectInfoModalOpened = false;
      overlay.classList.remove('active');
      overlay.classList.add('hidden');
    });
  }



  function selectCharacter(x) {
    if (selectedCharacters.length >= MAX_SELECTED_CHARS) {
      alert("You can only select up to " + MAX_SELECTED_CHARS + " characters.");
      return;
    }

    if (selectedCharacters.some(char => char.id === x.id)) {
      alert(`You have already selected ${x.name}.`);
      return;
    }
    selectedCharacters.push(x);

    updateSelectedChars();

  }


  const characterCardsDiv = document.getElementById('character-cards');
  allCharacters.forEach(character => {
    const card = document.createElement('div');
    
    card.className = 'character-slot-selection';
    card.innerHTML = `
      <div class="charCard-selection charCard charCardRoundedBorders">
        <span class="charName-selection selectionSpan">${character.name}</span>
        <img src="./charImg/char1.jpeg" class="charImg-selection">
        <button class="charSelect-selection">𝓲</button>
      </div>
    `;
    const infoButton = card.querySelector('.charSelect-selection');
    infoButton.addEventListener('click', (event) => {
      event.stopPropagation();
      openModal(character);
    })

    card.addEventListener('click', () => {
      selectCharacter(character);
    })

    characterCardsDiv.appendChild(card);
  })


  // let isPlayerMacroTurn = true;
  // let isPlayerMacroTurn = true; // WE NO LONGER NEED THIS!

  const selectedSkillDisplay = document.querySelector('.selectedSkillDisplay');
  
    
  
  function decideNextChar(team) {
    const availableChars = team.filter(c => !c.hasTakenTurnThisRound);
    if (availableChars.length === 0) return null; // Modify this to keep rotating
    
    availableChars.sort((a, b) => b.speed - a.speed)
    turns++;
    return availableChars[0]
  }
  

  const currentRoundDisplay = document.querySelector('.current-round');
  let currentRound = 0;
  currentRoundDisplay.textContent = `${currentRound}`;

  function startNewRound() {
    console.log("new round starting");
    currentRound++;
    currentRoundDisplay.textContent = `${currentRound}`;

    const livingPlayers = playerTeam.filter(c => c.currentHealth > 0);
    const livingEnemies = enemyTeam.filter(c => c.currentHealth > 0);

    battleQueue = [...livingPlayers, ...livingEnemies].sort((a, b) => b.speed - a.speed);

    currentTurnIndex = 0;

    // playerTeam.forEach(c => c.hasTakenTurnThisRound = false)
    // enemyTeam.forEach(c => c.hasTakenTurnThisRound = false)
    
    processNextTurn();
  }

  const turnsDiv = document.querySelector('.turnsDiv');
  const turnsDisplay = document.querySelector('.turns');
  const prevTurnDisplay2 = document.querySelector('.prevturns2');
  const prevTurnDisplay1 = document.querySelector('.prevturns1');
  const prevTurnDisplay = document.querySelector('.prevturns');
  const upcomingTurnsDisplay = document.querySelector('.upcomingturns');
  const upcomingTurnsDisplay1 = document.querySelector('.upcomingturns1');
  const upcomingTurnsDisplay2 = document.querySelector('.upcomingturns2');
  const skillCard = document.querySelector('.skillCards');


  function updateSelectedSkillDisplay() { 
    if (currentSkill === null) {
      selectedSkillDisplay.textContent = `No Skill Selected.`;
    } else {
      selectedSkillDisplay.textContent = `Selected Skill: ${currentSkill.skillName}`;
    }
  }

  function skillCardClick(event) {
    currentSkill = event;
    updateSelectedSkillDisplay();
  }




  const skillCardDiv = document.querySelector('.skillCards');

  function updateSkillCards() {
    activeCharacter.skills.forEach(skill => {
      const skillCard = document.createElement('div');
      skillCard.className = 'skillCard';
      skillCard.innerHTML = `
        <img src="${skillImage}" class="skillImg">
        <span class="skillName">${skill.skillName}</span>
      `
      skillCard.addEventListener('click', () => {
        skillCardClick(skill)
      })

      skillCardDiv.appendChild(skillCard);
    })
  }

  function updateTurnTracker(currentIndex, queue) {
    // An array of all our turn display elements in order
    const turnElements = [
        document.querySelector('.prevturns2'),
        document.querySelector('.prevturns1'),
        document.querySelector('.prevturns'),
        document.querySelector('.turns'),
        document.querySelector('.upcomingturns'),
        document.querySelector('.upcomingturns1'),
        document.querySelector('.upcomingturns2')
    ];

    const totalCharacters = queue.length;
    const centerIndex = 3; // The 4th slot in our display array (index 3)

    // Loop through all 7 display slots
    turnElements.forEach((element, i) => {
        // Calculate the turn index this slot should represent
        // 'i - centerIndex' gives us the offset from the center (-3, -2, -1, 0, 1, 2, 3)
        const turnIndexToShow = currentIndex + (i - centerIndex);

        // Check if this calculated index is a valid turn in the battle queue
        if (turnIndexToShow >= 0 && turnIndexToShow < totalCharacters) {
            // It's a valid turn, so display the character's name
            const character = queue[turnIndexToShow];
            element.textContent = character.name; // You can also use initials if names are too long
            element.style.opacity = '1'; // Make sure it's visible
            
            if (i !== centerIndex) {
              element.style.fontWeight = 'normal';
            }

            const isPlayer = playerTeam.some(playerChar => playerChar.id === character.id);
            if (isPlayer) {
                // If they are on the player's team, add the highlight class.
                element.classList.add('player-turn');
            } else {
                // Otherwise, make sure the highlight class is removed (for enemy turns).
                element.classList.remove('player-turn');
            }
        } else {
            // This slot is before the first turn or after the last turn, so it should be empty
            element.textContent = '--';
            element.style.opacity = '0.5'; // Make empty slots faded
        }
    });
}

  function processNextTurn() { 
    
    if (currentTurnIndex >= battleQueue.length) {
      startNewRound();
      return; 
    }
    
    activeCharacter = battleQueue[currentTurnIndex];
    
    updateTurnTracker(currentTurnIndex, battleQueue);
    const isPlayerTurn = playerTeam.some(c => c.id === activeCharacter.id);

    const skillCardName = document.querySelector('.skillName');
    
    if (activeCharacter) {
      console.log(`It's ${activeCharacter.name}'s turn from team ${isPlayerTurn ? '.playerSide' : '.enemySide'}`);
      document.querySelectorAll('.charCard').forEach(card => card.classList.remove('active-turn'));
      const sideSelector = isPlayerTurn ? '.playerSide' : '.enemySide';
      const activeSlot = document.querySelector(`${sideSelector} [data-char-id="${activeCharacter.id}"]`);
      if (activeSlot) {
        activeSlot.querySelector('.charCard').classList.add('active-turn');
      }
      skillCardDiv.innerHTML = ''; // Clear previous skill cards
      updateSkillCards(isPlayerTurn ? activeCharacter : null); // Your component function

      if (isPlayerTurn) {
        // This part is correct
        document.querySelectorAll('.enemySide .character-slot').forEach(slot => {
          // Only add listener if the character in the slot is alive
          const targetCharId = slot.dataset.charId;
          const targetChar = enemyTeam.find(c => c.id === targetCharId);
          if (targetChar && targetChar.currentHealth > 0) {
            slot.addEventListener('click', angelDispatcher);
            slot.style.cursor = 'crosshair';
          }
          gameContainer.style.setProperty('--gradient-direction', 'to left');
        });
      } else {
        skillCardDiv.innerHTML = '';
        console.log("AI is thinking...");
        gameContainer.style.setProperty('--gradient-direction', 'to right');
        setTimeout(() => {
          // --- AI LOGIC GOES HERE ---
          // 1. AI picks a random living player to target.
          const livingPlayers = playerTeam.filter(p => p.currentHealth > 0);
          if (livingPlayers.length > 0) {
            const targetChar = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
            const targetSlot = document.querySelector(`.playerSide [data-char-id="${targetChar.id}"]`);

            const damageDealt = activeCharacter.attack; // Simplified for now
            
            showNotification(`${activeCharacter.name} attacked ${targetChar.name} for ${damageDealt} damage!`);
            
            // 2. Update the target's health data.
            targetChar.currentHealth = Math.max(0, targetChar.currentHealth - damageDealt);

            // 3. CALL THE UPDATE FUNCTION for the AI's target.
            updateHealthDisplay(targetSlot, targetChar);

            // 4. Handle death.
            if (targetChar.currentHealth <= 0) {
              console.log(`${targetChar.name} has been defeated!`);
              targetSlot.querySelector('.charCard').style.filter = 'grayscale(100%) brightness(50%)';
            }
          }
          
          console.log(`${activeCharacter.name} (AI) performed an action.`);
          endCurrentTurn(activeCharacter);
        }, 1500);
      } 
    } else {
      processNextTurn();
    }
  }


  function endCurrentTurn(charWhoActed) {
	// Mark character to keep track of their actions
    charWhoActed.hasTakenTurnThisRound = true;

    document.querySelectorAll('.enemySide .character-slot').forEach(slot => {
      slot.removeEventListener('click', angelDispatcher);
      slot.style.cursor = 'default';
    });

    currentTurnIndex++;
    processNextTurn();
  }

  
  
  const historyButton = document.querySelector('.notifHistoryButton');
  const historyDiv = document.querySelector('.notifHistoryModal');
  const charInfoModal = document.getElementById('character-info-selection');
  

  historyButton.addEventListener('click', () => {
    historyDiv.classList.toggle('hidden');
    overlay.classList.toggle('hidden');
  })


  overlay.addEventListener('click', () => {
    overlay.classList.toggle('hidden');
    historyDiv.classList.add('hidden');
    charInfoModal.classList.add('hidden');
  })
  


  const readyButton = document.querySelector('.ready-button');
  readyButton.addEventListener('click', () => {
    battleStarted = true;
    readyButton.disabled = true;
    readyButton.classList.add('hidden');

    charSlot.forEach(slot => {
      slot.removeEventListener('click', charSwap);
      slot.querySelector('.charCard').classList.remove('selected-for-swap');
      slot.querySelector('.charCard').style.cursor = 'default';
    })

    playerTeam = [];
    document.querySelectorAll('.playerSide .character-slot').forEach(slot => {
      const charData = allCharacters.find(c => c.id === slot.dataset.charId);
      if (charData) {
        const liveCharacter = JSON.parse(JSON.stringify(charData));
        liveCharacter.currentHealth = liveCharacter.health;
        liveCharacter.hasTakenTurnThisRound = false;
        playerTeam.push(liveCharacter);
      }
    });
    
    enemyTeam = [];
    enemyCharacters.forEach(charData => {
      const liveCharacter = JSON.parse(JSON.stringify(charData));
      liveCharacter.currentHealth = liveCharacter.health;
      liveCharacter.hasTakenTurnThisRound = false;
      enemyTeam.push(liveCharacter);
    });

    console.log("Player Team:", playerTeam.map(c => ({ name: c.name, speed: c.speed })));
    console.log("Enemy Team:", enemyTeam.map(c => ({ name: c.name, speed: c.speed })));
  
    processNextTurn();
  })


  
  function showNotification(message) {
    const notifBox = document.getElementById('notificationsBox');
    notificationHistory.push(message);
    updateNotificationHistory();

    const notificationItem = document.createElement('div');
    notificationItem.classList.add('notification-item');
    notificationItem.textContent = message;
    notifBox.appendChild(notificationItem);
    
    requestAnimationFrame(() => {
      notificationItem.classList.add('is-visible');
    });
    
    setTimeout(() => {
      notificationItem.classList.remove('is-visible');
    }, 2500);

    setTimeout(() => {
      notificationItem.remove();
    }, 3000);
  }

  function updateHealthDisplay(characterSlot, characterData) {
    if (!characterSlot || !characterData) return;

    const healthPercentage = (characterData.currentHealth / characterData.health) * 100;

    // This is how much of the card should be GRAY.
    // At 100% health, depletion is 0%.
    // At 0% health, depletion is 100%.
    const depletionPercentage = 100 - healthPercentage;
    
    const charCard = characterSlot.querySelector('.charCard');
    if (charCard) {
        // We set the '--depletion-height' variable, which controls the height of the gray overlay.
        charCard.style.setProperty('--depletion-height', `${depletionPercentage}%`);
    }

    // You can add the health text update here too if you want.
    const healthTextElement = characterSlot.querySelector('.healthPoints');
    if (healthTextElement) {
        // We use Math.ceil() to make sure health doesn't show as a decimal (e.g., 80.5)
        // And it rounds up, which feels better for the player.
        healthTextElement.textContent = `${Math.ceil(characterData.currentHealth)} / ${characterData.health}`;
    }
  }

  function updateNotificationHistory() {
    const historyContainer = document.querySelector('.notifHistory');
    historyContainer.innerHTML = '';

    if (notificationHistory.length === 0) {
      historyContainer.innerHTML = '<p>No Notifications Yet</p>';
      return;
  }

    notificationHistory.slice().forEach(message => {
      const p = document.createElement('p');
      p.textContent = message;
      historyContainer.appendChild(p);
    });
  }
  
});







// MAIN GAME END





// FORMERLY IN charSwap();
// if (charId) {
//   // Find character data from the initial `allCharacters` array for full details
//   const character = allCharacters.find(c => c.name === charId);
//   if (character) {
//     console.log(character.name + " selected.");
    
//     if (character.skills && character.skills.length > 0) {
//       console.log("Character Skills: " + character.skills.map(s => s.name).join(', '));
//     } else {
//       console.log("Character has no skills.");
//     }

//   } else {
//     console.log("Character data not found in the allCharacters array.");
//   }
// }






// signInWithPopup(auth, provider)
//   .then((result) => {
//     // This gives you a Google Access Token. You can use it to access the Google API.
//     const credential = GoogleAuthProvider.credentialFromResult(result);
//     const token = credential.accessToken;
//     // The signed-in user info.
//     const user = result.user;
//     // IdP data available using getAdditionalUserInfo(result)
//     // ...
//   }).catch((error) => {
//     // Handle Errors here.
//     const errorCode = error.code;
//     const errorMessage = error.message;
//     // The email of the user's account used.
//     const email = error.customData.email;
//     // The AuthCredential type that was used.
//     const credential = GoogleAuthProvider.credentialFromError(error);
//     // ...
//   });








  // if (loginButton) {
  //   loginButton.addEventListener('click', () => {
  //     signInWithPopup(auth, provider)
  //       .then((result) => {
  //         // Handle successful login here
  //         // For example, hide login page and show main game page
  //         document.getElementById('login-page').classList.add('hidden');
  //         document.getElementById('main-game').classList.remove('hidden');
  //       })
  //       .catch((error) => {
  //         // Handle login errors here
  //         console.error(error);
  //       });
  //   });
