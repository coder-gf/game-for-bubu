/* ---------- Audio helpers ---------- */
const startMusic = document.getElementById('start-music');
const epilogueMusic = document.getElementById('epilogue-music');

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

/* Scenes and lines (e1–e5) */
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
  }
];

/* Typing engine */
const TYPE_MS = 45;
let sceneIndex = 0;
let lineIndex  = 0;
let typingTimer = null;
let typingFullLine = '';
let typingShown = '';
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
  subtitle.textContent = typingFullLine;
}

/* Load a scene image with fade */
function showScene(idx){
  const s = scenes[idx];
  sceneImage.classList.remove('show');
  sceneImage.src = s.img;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sceneImage.classList.add('show');
  }));
}

/* ---------- Advance click handler ---------- */
function onEpilogueClick(){
  const s = scenes[sceneIndex];

  if (isTyping){
    endTyping();
    return;
  }

  lineIndex++;
  if (lineIndex < s.lines.length){
    startTyping(s.lines[lineIndex]);
    return;
  }

  // finished lines -> next scene
  sceneIndex++;
  if (sceneIndex < scenes.length){
    lineIndex = 0;
    showScene(sceneIndex);
    setTimeout(() => startTyping(scenes[sceneIndex].lines[0]), 220);
  } else {
    // after e5 -> jump to E6
    document.removeEventListener('pointerdown', onEpilogueClick);
    playSceneE6();
  }
}

/* ---------- Scene E6 custom logic ---------- */
let e6Step = 0;

function playSceneE6(){
  // Show e6 background
  sceneImage.classList.remove('show');
  sceneImage.src = 'e6.jpg';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sceneImage.classList.add('show');
  }));

  // Hide subtitle, reset chat
  subtitle.textContent = '';
  document.getElementById("msg1").textContent = '';
  document.getElementById("msg2").textContent = '';
  e6Step = 0;

  // Attach click handler to epilogue stage
  epilogueStage.onclick = function(){
    if (e6Step === 0){
      typeWriterE6("hey so I was thinking", "msg1", 50);
      e6Step++;
    } else if (e6Step === 1){
      typeWriterE6("It would be really fun if we could meet up tomorrow.", "msg2", 50);
      e6Step++;
    } else if (e6Step === 2){
      console.log("End of E6.");
      // TODO: proceed to E7 if needed
    }
  };
}

function typeWriterE6(text, elementId, speed){
  let i = 0;
  const el = document.getElementById(elementId);
  el.textContent = "";
  const interval = setInterval(() => {
    el.textContent += text.charAt(i);
    i++;
    if (i >= text.length){
      clearInterval(interval);
    }
  }, speed);
}

/* ---------- Boot ---------- */
window.addEventListener('load', () => {
  tryPlay(startMusic);
  startPetals();
});

/* Start button -> enter epilogue */
startBtn.addEventListener('click', beginEpilogue);

function beginEpilogue(){
  startMusic.pause();
  epilogueMusic.currentTime = 0;
  tryPlay(epilogueMusic);

  startScreen.classList.remove('visible');
  epilogueStage.classList.add('visible');

  stopPetals();

  sceneIndex = 0; lineIndex = 0;
  showScene(sceneIndex);
  setTimeout(() => startTyping(scenes[0].lines[0]), 220);

  document.addEventListener('pointerdown', onEpilogueClick);
}
