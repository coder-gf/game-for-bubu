/* ---------- Audio helpers ---------- */
const startMusic = document.getElementById('start-music');
const epilogueMusic = document.getElementById('epilogue-music');
const dateMusic = document.getElementById('date-music');

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

// First date dialogues
const dateDialogues = [
  "Wow, it's so beautiful out here today. We chose a good day for our first date.",
  "I got a text from her saying she has reached as well.",
  "Hmm.. She must be somewhere nearby I guess. I'll send her my location."
];

let currentDialogueIndex = 0;
let isDateTyping = false;
let dateTypingTimer = null;

function typeDateDialogue() {
  if (currentDialogueIndex >= dateDialogues.length) {
    // All dialogues completed
    return;
  }

  const dialogue = dateDialogues[currentDialogueIndex];
  let charIndex = 0;
  dateDialogue.innerHTML = '';
  isDateTyping = true;
  
  nextButton.disabled = true;

  function typeNext() {
    if (charIndex < dialogue.length) {
      dateDialogue.innerHTML = dialogue.substring(0, charIndex + 1) + '<span class="typing-cursor"></span>';
      charIndex++;
      dateTypingTimer = setTimeout(typeNext, TYPE_MS);
    } else {
      isDateTyping = false;
      nextButton.disabled = false;
      dateDialogue.innerHTML = dialogue;
    }
  }

  typeNext();
}

function onNextButtonClick() {
  if (isDateTyping) {
    // If currently typing, complete immediately
    clearTimeout(dateTypingTimer);
    dateDialogue.innerHTML = dateDialogues[currentDialogueIndex];
    isDateTyping = false;
    nextButton.disabled = false;
    return;
  }

  currentDialogueIndex++;
  if (currentDialogueIndex < dateDialogues.length) {
    typeDateDialogue();
  } else {
    // All dialogues completed, proceed to next scene
    // You would add the logic to move to the next date scene here
    alert("First date scene completed! Would proceed to next scene...");
  }
}

function beginFirstDate() {
  // Stop epilogue music, start date music
  epilogueMusic.pause();
  dateMusic.currentTime = 0;
  tryPlay(dateMusic);

  // Hide epilogue, show first date stage
  epilogueStage.classList.remove('visible');
  firstDateStage.classList.add('visible');

  // Start the first dialogue
  currentDialogueIndex = 0;
  typeDateDialogue();

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
});

/* Start button -> enter epilogue */
startBtn.addEventListener('click', beginEpilogue);
