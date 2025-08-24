/* ---------- Audio helpers ---------- */
const startMusic = document.getElementById('start-music');
const epilogueMusic = document.getElementById('epilogue-music');
const dateMusic = document.getElementById('date-music');
const candyMusic = document.getElementById('candy-music');

/* Best effort: try to autoplay; if the browser blocks it, begin on first user gesture */
function tryPlay(audio){
  if (!audio) return;
  const p = audio.play();
  if (p && typeof p.catch === 'function') {
    p.catch(()=> {
      const resume = () => { audio.play().catch(()=>{}); cleanup(); };
      const cleanup = () => {
        document.removeEventListener('pointerdown', resume);
        document.removeEventListener('keydown', resume);
      };
      document.addEventListener('pointerdown', resume, { once: true });
      document.addEventListener('keydown', resume, { once: true });
    });
  }
}

/* ---------- Start screen logic ---------- */
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-button');
const petalsLayer = document.getElementById('petals-layer');

function spawnPetal(){
  const el = document.createElement('img');
  el.src = 'petal.png';
  el.className = 'petal';
  // random horizontal start and animation duration
  el.style.left = `${Math.random()*100}%`;
  const fallDur = 8 + Math.random()*6; // 8–14s
  const swayDur = 3 + Math.random()*3; // 3–6s
  const spinDur = 4 + Math.random()*4; // 4–8s
  el.style.animationDuration = `${fallDur}s, ${swayDur}s, ${spinDur}s`;
  el.addEventListener('animationend', ()=> el.remove());
  petalsLayer.appendChild(el);
}

/* Keep petals flowing while start screen is visible */
let petalsTimer = null;
function startPetals(){
  for (let i = 0; i < 14; i++) setTimeout(spawnPetal, i*350);
  petalsTimer = setInterval(spawnPetal, 600);
}
function stopPetals(){
  clearInterval(petalsTimer);
  petalsTimer = null;
  petalsLayer.innerHTML = '';
}

/* ---------- Epilogue (scenes + typing) ---------- */
const epilogueStage = document.getElementById('epilogue');
const sceneImage = document.getElementById('scene-image');
const subtitle = document.getElementById('subtitle');

/* Scenes and lines (exactly as provided) */
const scenes = [
  {
    img: 'e1.jpg',
    lines: [
      "Damn. I haven't checked my phone all day. It was a long day at the library.",
      "Hmm.. Syringe? This app has been so dry lately.",
      "I should just delete it at this point. I don't think I want to hear another corny voice note.",
      "*swipe* *swipe* *swipe*"
    ]
  },
  {
    img: 'e2.jpg',
    lines: [
      "Oooooh look at this. Seems interesting.",
      "She likes metal huh? Looks like my talents are gonna come in handy again.",
      "I don't expect anything though. I'm tired of even sending comments, but let me do this last one for today.",
      "“I play metal.\" Sent."
    ]
  },
  {
    img: 'e3.jpg',
    lines: [
      "Oh my god. I think I studied too much today.",
      "It does get stressful sometimes.",
      "Mmmmm… I feel kinda sleepy now...",
      "zzzzz"
    ]
  },
  {
    img: 'e4.jpg',
    lines: [
      "*phone beeps* \"You matched with Kriti.\"",
      "Mmmmm.. Oh god, did I fall asleep?",
      "What time is it…? Let me just get into bed."
    ]
  },
  {
    img: 'e5.jpg',
    lines: [
      "Okay let's see. Looks like I matched with this girl.",
      "Ummm… let me drop her a text.",
      "*a few hours into the conversation*",
      "She seems cool... wouldn't hurt to meet up I guess."
    ]
  },
  {
    img: 'e6.jpg',
    lines: []
  },
  {
    img: 'e7.jpg',
    lines: []
  },
  {
    img: 'e8.jpg',
    lines: []
  },
  {
    img: 'e9.jpg',
    lines: []
  },
  {
    img: 'e10.jpg',
    lines: [
      "It's almost morning again, I guess we talked all night.",
      "I'm still not sleepy though...",
    ]
  }
];

/* Typing engine */
const TYPE_MS = 45;  // speed per character (feel free to tweak)
let sceneIndex = 0;
let lineIndex  = 0;
let typingTimer = null;
let typingFullLine = ''; // target text
let typingShown = '';    // currently rendered part
let isTyping = false;

function typeNextChar(){
  if (!isTyping) return;
  const next = typingFullLine.slice(0, typingShown.length + 1);
  typingShown = next;
  subtitle.textContent = typingShown;
  if (typingShown.length >= typingFullLine.length){
    endTyping();
  }
}
function startTyping(line){
  clearInterval(typingTimer);
  typingFullLine = line;
  typingShown = '';
  subtitle.textContent = '';
  isTyping = true;
  typingTimer = setInterval(typeNextChar, TYPE_MS);
}
function endTyping(){
  clearInterval(typingTimer);
  isTyping = false;
  subtitle.textContent = typingFullLine; // ensure full line shown
}

/* Load a scene image with fade */
function showScene(idx){
  const s = scenes[idx];
  sceneImage.classList.remove('show');  // start transparent
  sceneImage.src = s.img;
  
  // Clear subtitle when changing scenes
  subtitle.textContent = '';
  
  // small delay so the 'show' class transition applies after src swap
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sceneImage.classList.add('show');
  }));
}

/* Advance click handler while in epilogue */
function onEpilogueClick(){
  const s = scenes[sceneIndex];

  if (isTyping){
    // If mid-typing, complete the current line instantly
    endTyping();
    return;
  }

  // If line finished, move to next
  lineIndex++;
  if (lineIndex < s.lines.length){
    startTyping(s.lines[lineIndex]);
    return;
  }

  // Finished all lines in this scene -> next scene
  sceneIndex++;
  if (sceneIndex < scenes.length){
    // Fade to next image
    lineIndex = 0;
    showScene(sceneIndex);
    
    // Only start typing if there are lines in the scene
    setTimeout(() => {
      if (scenes[sceneIndex].lines.length > 0) {
        startTyping(scenes[sceneIndex].lines[0]);
      }
    }, 220);
  } else {
    // Game completed - transition to first date
    document.removeEventListener('pointerdown', onEpilogueClick);
    beginFirstDate();
  }
}

/* Start epilogue flow */
function beginEpilogue(){
  // Stop start music, start epilogue music
  startMusic.pause();
  epilogueMusic.currentTime = 0;
  tryPlay(epilogueMusic);

  // Hide start screen, show epilogue stage
  startScreen.classList.remove('visible');
  epilogueStage.classList.add('visible');

  // Remove petals
  stopPetals();

  // Prepare scene 0
  sceneIndex = 0; lineIndex = 0;
  showScene(sceneIndex);
  
  // Only start typing if there are lines
  setTimeout(() => {
    if (scenes[0].lines.length > 0) {
      startTyping(scenes[0].lines[0]);
    }
  }, 220);

  // Click anywhere to advance
  document.addEventListener('pointerdown', onEpilogueClick);
}

/* ---------- First Date Logic ---------- */
const firstDateStage = document.getElementById('first-date');
const dateDialogue = document.getElementById('date-dialogue');
const nextButton = document.getElementById('next-button');
const spriteContainer = document.getElementById('sprite-container');
const dialogueBox = document.getElementById('dialogue-box');
const textContainer = document.getElementById('text-container');

// Original first date scenes with dialogues and sprites (preserved for reset)
const originalFirstDateScenes = [
  // Initial dialogues
  {
    background: 'bg1.jpg',
    sprites: [],
    dialogues: [
      { speaker: 'kk', text: "Wow, it's so beautiful out here today. We chose a good day for our first date." },
      { speaker: 'kk', text: "I got a text from her saying she has reached as well." },
      { speaker: 'kk', text: "Hmm.. She must be somewhere nearby I guess. I'll send her my location." }
    ]
  },
  // New scene with character sprite and dialogues
  {
    background: 'bg1.jpg',
    sprites: [
      {
        image: 'p1.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kk', text: "Oh, there she is." },
      { speaker: 'kk', text: "Damn… She's kinda cute. She hasn't noticed me standing here yet." }
    ]
  },
  // Second part of the new scene
  {
    background: 'bg1.jpg',
    sprites: [
      {
        image: 'p2.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kk', text: "I waved my arm for her, and she noticed me." },
      { speaker: 'kk', text: "She's walking towards me hurriedly." }
    ]
  },
  // New scene with p3.png sprite and character dialogues
  {
    background: 'bg1.jpg',
    sprites: [
      {
        image: 'p3.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kk', text: "(she looks nervous)." },
      { speaker: 'kc', text: "Hiii.. You're Kinshuk right?" },
      { speaker: 'kk', text: "Yup, that's me. So how are you doing today Kriti? This place wasn't too far for you, right?" },
      { speaker: 'kc', text: "Nooooo not at all. And it's really pretty out here." }
    ]
  },
  // New scene with choice logic
  {
    background: 'bg1.jpg',
    sprites: [
      {
        image: 'p4.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "so what's the plan? Where do we go first?" }
    ],
    choices: [
      { 
        text: "I'm not sure, do you have anything in mind?", 
        result: {
          sprite: 'p6.png',
          dialogues: [
            { speaker: 'kc', text: "oh, I don't know. I thought you'd have something planned out. Anyways, I saw a cute little candy shop nearby. How about going there first?" },
            { speaker: 'kk', text: "(damn.... I should've planned something beforehand. She looks unimpressed.)" },
            { speaker: 'kk', text: "yeah sure, lead the way." }
          ]
        }
      },
      { 
        text: "There's a really cute candy store nearby, I thought you might be interested.", 
        result: {
          sprite: 'p5.png',
          dialogues: [
            { speaker: 'kc', text: "Oh really?? I love candy! How did you know?" },
            { speaker: 'kk', text: "I just paid close attention during our conversation last night, hehe." },
            { speaker: 'kc', text: "you know just what I like.💕" }
          ]
        }
      }
    ]
  },
  // Candy shop entrance
  {
    background: 'bg2.jpg',
    sprites: [],
    dialogues: [
      { speaker: 'kk', text: "The candy shop is really cute and cozy. It's got the type of candies you don't see everywhere." }
    ]
  },
  // p8.png appears
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p8.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Look! They have all the rare candies!" },
      { speaker: 'kk', text: "(she looks a little crazy...)" },
      { speaker: 'kk', text: "Did you know that candy dates back to ancient Egypt? They used honey, fruits & nuts to make candy." }
    ]
  },
  // p7.png appears
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p7.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Wow… You seem to know a lot about candy. I'd love to listen to your podcast if you had one." },
      { speaker: 'kk', text: "Ohhh this is nothing. I will tell you so many more interesting things." }
    ]
  },
  // p5.png appears
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p5.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "You're really fun to be around." },
      { speaker: 'kk', text: "(Great...I've managed to amuse her without much effort.)" },
      { speaker: 'kk', text: "(she's rummaging around the shelves while I follow her.)" }
    ]
  },
  // p3.png appears
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p3.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Y'know… l have something important to ask you." },
      { speaker: 'kc', text: "Actually… A bunch of questions." }
    ]
  },
  // Instruction text (yellow)
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p3.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'instruction', text: "Instruction: The more answers you get correct, the more your bonding will increase." }
    ]
  },
  // p4.png appears - Question 1
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p4.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Which of these do you like better, Pepsi or coke?" }
    ],
    choices: [
      { 
        text: "Pepsi", 
        result: {
          sprite: null,
          dialogues: [
            { speaker: 'kc', text: "Hmmm...okay. This one was easy. I'm not impressed yet." },
            { speaker: 'kk', text: "(This was the important question?)" }
          ]
        }
      },
      { 
        text: "Coke", 
        result: {
          sprite: null,
          dialogues: [
            { speaker: 'kc', text: "An okay choice. I don't hate coke either." },
            { speaker: 'kk', text: "(This was the important question?)" }
          ]
        }
      }
    ]
  },
  // Question 2
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p4.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "So, Kit Kat or snickers?" }
    ],
    choices: [
      { 
        text: "Kit Kat", 
        result: {
          sprite: 'p5.png',
          dialogues: [
            { speaker: 'kc', text: "You're just like me, I think we'll get along well!" }
          ]
        }
      },
      { 
        text: "Snickers", 
        result: {
          sprite: 'p6.png',
          dialogues: [
            { speaker: 'kc', text: "Damn, really? I think we have different tastes then…" }
          ]
        }
      }
    ]
  },
  // Question 3
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p4.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Next question, do you prefer chocolate milkshake or strawberry milkshake?" }
    ],
    choices: [
      { 
        text: "Chocolate", 
        result: {
          sprite: 'p4.png',
          dialogues: [
            { speaker: 'kc', text: "Really? Ugh..." },
            { speaker: 'kk', text: "(oops… Why does she look so serious?)" }
          ]
        }
      },
      { 
        text: "Strawberry", 
        result: {
          sprite: 'p7.png',
          dialogues: [
            { speaker: 'kc', text: "Wow, you've really sparked my interest." }
          ]
        }
      }
    ]
  },
  // Question 4 setup
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p3.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Let's see…" },
      { speaker: 'kk', text: "(She looks around as if she's searching for more questions in the shop's shelves.)" }
    ]
  },
  // p4.png appears - Question 4
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p4.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Okay so, Are you a sweet or savoury type of guy?" }
    ],
    choices: [
      { 
        text: "Sweet", 
        result: {
          sprite: 'p6.png',
          dialogues: [
            { speaker: 'kc', text: "Hmm… Not quite the answer I was expecting. But I'll let this one slide." }
          ]
        }
      },
      { 
        text: "Savoury", 
        result: {
          sprite: 'p7.png',
          dialogues: [
            { speaker: 'kc', text: "Oh my god, the similarities between us are growing…" }
          ]
        }
      },
      { 
        text: "I'll be sweet to you all day, but I might get spicy at times…", 
        result: {
          sprite: 'p8.png',
          dialogues: [
            { speaker: 'kc', text: "Heyy! Don't make me blush so much in broad daylight!" }
          ]
        }
      }
    ]
  },
  // Question 5 setup
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p3.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Okay! Final question for you. What's the best Kurkure flavour?" }
    ]
  },
  // p4.png appears - Question 5
  {
    background: 'bg2.jpg',
    sprites: [
      {
        image: 'p4.png',
        position: 'center'
      }
    ],
    dialogues: [],
    choices: [
      { 
        text: "Green", 
        result: {
          sprite: 'p5.png',
          dialogues: [
            { speaker: 'kc', text: "OMG! That's my favourite too! You really have amazing taste buds!" },
            { speaker: 'kk', text: "(Okay...l lied but it worked, haha.)" }
          ]
        }
      },
      { 
        text: "Orange", 
        result: {
          sprite: 'p6.png',
          dialogues: [
            { speaker: 'kc', text: "Really? Okay.." },
            { speaker: 'kk', text: "(She's speechless.)" }
          ]
        }
      },
      { 
        text: "Hey, there's a pretty little park just outside, let's buy all your snacks and eat them there.", 
        result: {
          sprite: 'p7.png',
          dialogues: [
            { speaker: 'kc', text: "That sounds amazing, let's go!!" },
            { speaker: 'kk', text: "(Phew… I've distracted her successfully.)" }
          ]
        }
      }
    ]
  },
  // NEW SCENES ADDED HERE - Park scene
  {
    background: 'bg3.jpg',
    sprites: [],
    dialogues: [
      { speaker: 'kk', text: "We ended up coming to the nearby park." }
    ],
    onEnter: function() {
      // Change music back to zelda.mp3
      candyMusic.pause();
      dateMusic.currentTime = 0;
      tryPlay(dateMusic);
    }
  },
  {
    background: 'bg3.jpg',
    sprites: [
      {
        image: 'p5.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kk', text: "She seems to be enjoying the scenery." },
      { speaker: 'kc', text: "Kinshuk, you're really good at picking out date spots, I'm impressed." },
      { speaker: 'kk', text: "Awwwww, I'm glad you enjoyed. I'll pick an even better spot next time." }
    ]
  },
  {
    background: 'bg3.jpg',
    sprites: [
      {
        image: 'p8.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Next time..? Are you saying you want to keep going on more dates?" },
      { speaker: 'kk', text: "Of course, I think we'll connect pretty well." },
      { speaker: 'kc', text: "You can already tell?" },
      { speaker: 'kk', text: "I'm kind of an expert, haha." }
    ]
  },
  {
    background: 'bg3.jpg',
    sprites: [
      {
        image: 'p5.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "The cool breeze here is so peaceful. I could walk here for hours, if it wasn't for my shoe bite." }
    ],
    choices: [
      { 
        text: "Why would you walk for hours anyway?", 
        result: {
          sprite: 'p4.png',
          dialogues: [
            { speaker: 'kc', text: "I'll do what I want." }
          ]
        }
      },
      { 
        text: "I would carry you around whenever you're tired.", 
        result: {
          sprite: 'p7.png',
          dialogues: [
            { speaker: 'kc', text: "You're ultra boyfriend material, do you know that?" },
            { speaker: 'kk', text: "Awwwww, really?" },
            { speaker: 'kc', text: "Definitely!" }
          ]
        }
      }
    ]
  },
  {
    background: 'bg3.jpg',
    sprites: [
      {
        image: 'p3.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Anyways, it looks like it's about to rain soon… we should head back." },
      { speaker: 'kk', text: "(She looks cute when she's lost in thought.)" }
    ],
    choices: [
      { 
        text: "Walk her back to the station", 
        result: {
          sprite: 'p5.png',
          dialogues: [
            { speaker: 'kc', text: "I had a lot of fun today. I can't wait to see you again. I'll plan the date next time." }
          ]
        }
      },
      { 
        text: "Hold her hand as you walk her back", 
        result: {
          sprite: 'p9.png',
          dialogues: [
            { speaker: 'kk', text: "(She started blushing visibly when I held her hand.)" },
            { speaker: 'kc', text: "You know.. You're really interesting, and I can't wait to see you again." },
            { speaker: 'kc', text: "I'll plan the date next time, okay?" }
          ]
        }
      }
    ]
  },
  {
    background: 'bg3.jpg',
    sprites: [
            {
        image: 'p9.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kk', text: "Hehe, alright. Surprise me with your mystery date spot." }
    ]
  },
  {
    background: 'bg3.jpg',
    sprites: [
      {
        image: 'p5.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "Will do! I have just the perfect idea." }
    ]
  },
  {
    background: 'bg3.jpg',
    sprites: [
      {
        image: 'p9.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "By the way.. I have something for you." },
      { speaker: 'kk', text: "Hmm? What is it?" },
      { speaker: 'kc', text: "Back at the shop, I picked out some candies for you as well. Here, take these." },
      { speaker: 'kk', text: "(She hands me a cutely packed bag of candies.)" },
      { speaker: 'kk', text: "Oh wow, thank you so much for these Kriti, these look yummy." }
    ]
  },
  {
    background: 'bg3.jpg',
    sprites: [
      {
        image: 'p7.png',
        position: 'center'
      }
    ],
    dialogues: [
      { speaker: 'kc', text: "YES! They really are." }
    ]
  },
  {
    background: 'bg4.jpg',
    sprites: [],
    dialogues: [
      { speaker: 'kk', text: "(I walked her all the way to the station, and then she left with a hug.)" },
      { speaker: 'kk', text: "(There's a warm and fuzzy feeling inside my stomach. I have a good feeling about this.)" }
    ],
    onEnter: function() {
      // Fade out sprite
      spriteContainer.innerHTML = '';
    }
  },
  {
    background: 'bg4.jpg',
    sprites: [],
    dialogues: [],
    onEnter: function() {
      // Hide dialogue box and show congratulations message
      document.getElementById('dialogue-container').style.display = 'none';
      const congrats = document.createElement('div');
      congrats.id = 'congratulations';
      congrats.textContent = "Congratulations! You have received a bag of candies! 🍬";
      firstDateStage.appendChild(congrats);
    }
  }
];

// Working copy of first date scenes
let currentFirstDateScenes = JSON.parse(JSON.stringify(originalFirstDateScenes));

let currentDateSceneIndex = 0;
let currentDialogueIndex = 0;
let isDateTyping = false;
let dateTypingTimer = null;
let currentChoices = null;

function showSprite(spriteInfo) {
  spriteContainer.innerHTML = ''; // Clear previous sprites
  
  if (spriteInfo.image) {
    const sprite = document.createElement('img');
    sprite.src = spriteInfo.image;
    sprite.className = 'character-sprite';
    
    // Position the sprite
    if (spriteInfo.position === 'center') {
      sprite.classList.add('sprite-center');
    }
    
    spriteContainer.appendChild(sprite);
  }
}

function updateDialogueBox(speaker) {
  if (speaker === 'kk') {
    dialogueBox.style.backgroundImage = "url('d1.png')";
    dateDialogue.style.color = "white";
  } else if (speaker === 'kc') {
    dialogueBox.style.backgroundImage = "url('d2.png')";
    dateDialogue.style.color = "white";
  } else if (speaker === 'instruction') {
    // Keep the current dialogue box but change text color to yellow
    dateDialogue.style.color = "yellow";
  }
}

function showChoices(choices) {
  // Hide the next button
  nextButton.style.display = 'none';
  
  // Clear the dialogue area
  dateDialogue.innerHTML = '';
  
  // Create choice buttons
  choices.forEach((choice, index) => {
    const choiceButton = document.createElement('div');
    choiceButton.className = 'choice-button';
    choiceButton.textContent = choice.text;
    choiceButton.addEventListener('click', () => {
      handleChoice(choice);
    });
    dateDialogue.appendChild(choiceButton);
  });
}

function handleChoice(choice) {
  // Remove choice buttons
  const choiceButtons = document.querySelectorAll('.choice-button');
  choiceButtons.forEach(button => button.remove());
  
  // Show the next button again
  nextButton.style.display = 'block';
  
  // Update sprite if specified
  if (choice.result.sprite) {
    showSprite({ image: choice.result.sprite, position: 'center' });
  }
  
  // Replace the current scene's dialogues with the result dialogues
  currentFirstDateScenes[currentDateSceneIndex].dialogues = choice.result.dialogues;
  
  // Mark that choices have been made in this scene
  currentFirstDateScenes[currentDateSceneIndex].choicesMade = true;
  
  // Reset dialogue index so the new dialogues start from the beginning
  currentDialogueIndex = 0;
  typeDateDialogue();
}

function loadDateScene(sceneIndex) {
  const scene = currentFirstDateScenes[sceneIndex];
  
  // Call onEnter function if it exists
  if (scene.onEnter && typeof scene.onEnter === 'function') {
    scene.onEnter();
  }
  
  // Update background if needed
  const bg = firstDateStage.querySelector('.bg');
  if (bg.src !== scene.background) {
    bg.src = scene.background;
  }
  
  // Change music if we're entering the candy shop (scene index 5)
  if (sceneIndex === 5) {
    dateMusic.pause();
    candyMusic.currentTime = 0;
    tryPlay(candyMusic);
  }
  
  // Show sprites
  if (scene.sprites && scene.sprites.length > 0) {
    showSprite(scene.sprites[0]);
  } else {
    spriteContainer.innerHTML = ''; // Clear sprites if none in this scene
  }
  
  // Reset dialogue index and start typing
  currentDialogueIndex = 0;
  typeDateDialogue();
}

function typeDateDialogue() {
  const scene = currentFirstDateScenes[currentDateSceneIndex];
  
  if (currentDialogueIndex >= scene.dialogues.length) {
    // Check if this scene has choices and they haven't been made yet
    if (scene.choices && !scene.choicesMade && currentDialogueIndex === scene.dialogues.length) {
      showChoices(scene.choices);
      return;
    }
    
    // All dialogues in this scene completed
    nextButton.disabled = false;
    return;
  }

  const dialogue = scene.dialogues[currentDialogueIndex];
  let charIndex = 0;
  dateDialogue.innerHTML = '';
  isDateTyping = true;
  
  nextButton.disabled = true;

  // Update dialogue box based on speaker
  updateDialogueBox(dialogue.speaker);

  function typeNext() {
    if (charIndex < dialogue.text.length) {
      dateDialogue.innerHTML = dialogue.text.substring(0, charIndex + 1) + '<span class="typing-cursor"></span>';
      charIndex++;
      dateTypingTimer = setTimeout(typeNext, TYPE_MS);
    } else {
      isDateTyping = false;
      dateDialogue.innerHTML = dialogue.text;
      
      // If this is the last dialogue and there are choices that haven't been made, show them
      if (currentDialogueIndex === scene.dialogues.length - 1 && scene.choices && !scene.choicesMade) {
        nextButton.disabled = true;
        setTimeout(() => {
          showChoices(scene.choices);
        }, 500);
      } else {
        nextButton.disabled = false;
      }
    }
  }

  typeNext();
}

function onNextButtonClick() {
  const scene = currentFirstDateScenes[currentDateSceneIndex];
  
  if (isDateTyping) {
    // If currently typing, complete immediately
    clearTimeout(dateTypingTimer);
    dateDialogue.innerHTML = scene.dialogues[currentDialogueIndex].text;
    isDateTyping = false;
    
    // If this is the last dialogue and there are choices that haven't been made, show them
    if (currentDialogueIndex === scene.dialogues.length - 1 && scene.choices && !scene.choicesMade) {
      nextButton.disabled = true;
      setTimeout(() => {
        showChoices(scene.choices);
      }, 100);
    } else {
      nextButton.disabled = false;
    }
    return;
  }

  currentDialogueIndex++;
  if (currentDialogueIndex < scene.dialogues.length) {
    typeDateDialogue();
  } else {
    // All dialogues in this scene completed, move to next scene
    currentDateSceneIndex++;
    
    if (currentDateSceneIndex < currentFirstDateScenes.length) {
      loadDateScene(currentDateSceneIndex);
    } else {
      // All first date scenes completed
      alert("All scenes completed!");
    }
  }
}

function beginFirstDate() {
  // Stop epilogue music, start date music
  epilogueMusic.pause();
  dateMusic.currentTime = 0;
  
  // Reset the scenes to their original state
  currentFirstDateScenes = JSON.parse(JSON.stringify(originalFirstDateScenes));
  
  // Hide epilogue, show first date stage
  epilogueStage.classList.remove('visible');
  firstDateStage.classList.add('visible');
  
  // Try to play the date music after a short delay to ensure the scene is visible
  setTimeout(() => {
    tryPlay(dateMusic);
  }, 100);

  // Start the first scene
  currentDateSceneIndex = 0;
  loadDateScene(currentDateSceneIndex);

  // Add event listener to next button
  nextButton.addEventListener('click', onNextButtonClick);
}

/* ---------- Boot ---------- */
window.addEventListener('load', () => {
  // Try to start start-screen music
  tryPlay(startMusic);
  // Petals animation
  startPetals();
  
  // Preload all scene images for smoother transitions
  scenes.forEach(scene => {
    new Image().src = scene.img;
  });
  
  // Preload the date music and candy music
  dateMusic.load();
  candyMusic.load();
  
  // Preload character sprites and dialogue boxes
  const spritesToPreload = ['p1.png', 'p2.png', 'p3.png', 'p4.png', 'p5.png', 'p6.png', 'p7.png', 'p8.png', 'p9.png', 'p10.png', 'd1.png', 'd2.png'];
  spritesToPreload.forEach(sprite => {
    new Image().src = sprite;
  });
});

/* Start button -> enter epilogue */
startBtn.addEventListener('click', beginEpilogue);
