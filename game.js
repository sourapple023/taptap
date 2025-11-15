// Tap Dash Deluxe - Upgraded Version
// Levels • Combos • Particles • Multiple Target Types • Leaderboard • Sounds

const circle = document.getElementById("circle");
const timerBar = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const comboEl = document.getElementById("combo");
const highscoreEl = document.getElementById("highscore");

const menuOverlay = document.getElementById("menu-overlay");
const gameoverOverlay = document.getElementById("gameover-overlay");
const leaderboardOverlay = document.getElementById("leaderboard-overlay");

const playButton = document.getElementById("play-button");
const retryButton = document.getElementById("retry-button");
const backToMenuButton = document.getElementById("back-to-menu-button");
const showLeaderboardButton = document.getElementById("show-leaderboard-button");
const gameoverLeaderboardButton = document.getElementById("gameover-leaderboard-button");
const leaderboardBackButton = document.getElementById("leaderboard-back-button");

const finalScoreText = document.getElementById("final-score-text");
const finalLevelText = document.getElementById("final-level-text");
const newHighscoreArea = document.getElementById("new-highscore-area");
const playerNameInput = document.getElementById("player-name-input");
const saveScoreButton = document.getElementById("save-score-button");
const leaderboardList = document.getElementById("leaderboard-list");

let score = 0;
let level = 1;
let combo = 1;
let lastHitTime = 0;

let timerInterval = null;
let timeLeft = 0;          // ms
let baseTimePerTarget = 1300; // decreases with level
let circleSize = 80;       // px, also decreases with level

let gameActive = false;
let currentType = "normal"; // "normal" | "bonus" | "freeze" | "bomb"

// Leaderboard in localStorage
const LB_KEY = "tapdash_leaderboard";
const HS_KEY = "tapdash_highscore";

function getLeaderboard() {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function saveLeaderboard(entries) {
    localStorage.setItem(LB_KEY, JSON.stringify(entries));
}

function updateHighscoreDisplay() {
    const stored = localStorage.getItem(HS_KEY) || 0;
    highscoreEl.textContent = "High Score: " + stored;
}

function addToLeaderboard(name, score) {
    const list = getLeaderboard();
    list.push({ name, score });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 5);
    saveLeaderboard(trimmed);
    localStorage.setItem(HS_KEY, trimmed[0]?.score || score);
}

function renderLeaderboard() {
    const entries = getLeaderboard();
    leaderboardList.innerHTML = "";
    if (!entries.length) {
        leaderboardList.innerHTML = "<li>No scores yet. Be the first!</li>";
        return;
    }
    entries.forEach((entry, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx + 1}. ${entry.name} — ${entry.score}`;
        leaderboardList.appendChild(li);
    });
}

// Simple audio beeps using Web Audio API
function playBeep(freq = 600, duration = 80, volume = 0.2) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = volume;

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
            osc.stop();
            ctx.close();
        }, duration);
    } catch (e) {
        // no audio support, ignore
    }
}

// Utility: random between [min, max]
function randRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Particle burst at (x, y) with given base color
function spawnParticles(x, y, baseColor = "#ffffff") {
    const game = document.getElementById("game");
    const count = 10;
    for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.left = x + "px";
        p.style.top = y + "px";
        p.style.background = baseColor;
        const dx = randRange(-40, 40);
        const dy = randRange(-40, 40);
        p.style.setProperty("--dx", dx + "px");
        p.style.setProperty("--dy", dy + "px");
        game.appendChild(p);
        setTimeout(() => game.removeChild(p), 450);
    }
}

// Start a new game
function startGame() {
    gameActive = true;
    score = 0;
    level = 1;
    combo = 1;
    lastHitTime = 0;
    baseTimePerTarget = 1300;
    circleSize = 80;

    scoreEl.textContent = "Score: 0";
    levelEl.textContent = "Level: 1";
    comboEl.textContent = "Combo: x1";

    hideOverlay(menuOverlay);
    hideOverlay(gameoverOverlay);
    hideOverlay(leaderboardOverlay);

    circle.style.display = "block";
    spawnNewTarget();
    startTimerLoop();
}

// Timer logic
function startTimerLoop() {
    clearInterval(timerInterval);
    timeLeft = baseTimePerTarget;
    timerBar.style.width = "100%";

    timerInterval = setInterval(() => {
        if (!gameActive) return;
        timeLeft -= 16; // ~60fps

        const pct = Math.max(timeLeft / baseTimePerTarget, 0);
        timerBar.style.width = (pct * 100).toFixed(1) + "%";

        if (timeLeft <= 0) {
            endGame("Time's up!");
        }
    }, 16);
}

// Update difficulty based on score
function updateLevel() {
    const newLevel = 1 + Math.floor(score / 10);
    if (newLevel !== level) {
        level = newLevel;
        levelEl.textContent = "Level: " + level;

        // harder: shorter time, smaller circle
        baseTimePerTarget = Math.max(650, 1300 - (level - 1) * 100);
        circleSize = Math.max(40, 80 - (level - 1) * 4);

        playBeep(900, 100, 0.25); // level-up beep
    }
}

// Choose a target type based on random
function pickTargetType() {
    const r = Math.random();
    if (r < 0.65) return "normal";
    if (r < 0.80) return "bonus";
    if (r < 0.92) return "freeze";
    return "bomb"; // ~8%
}

// Spawn a new target
function spawnNewTarget() {
    const game = document.getElementById("game");
    const w = game.clientWidth;
    const h = game.clientHeight;

    const size = circleSize;
    const maxX = w - size;
    const maxY = h - size;

    const x = randRange(0, maxX);
    const y = randRange(50, maxY); // leave room for HUD

    currentType = pickTargetType();

    circle.className = "";
    circle.classList.add(currentType);
    circle.style.width = size + "px";
    circle.style.height = size + "px";
    circle.style.left = x + "px";
    circle.style.top = y + "px";

    // Reset shrink animation
    circle.style.transform = "scale(1)";
    requestAnimationFrame(() => {
        circle.style.transform = "scale(0.9)";
    });

    // Reset timer for this target
    timeLeft = baseTimePerTarget;
}

// Handle hit / tap
function handleHit(ev) {
    if (!gameActive) return;
    ev.preventDefault();

    const now = performance.now();
    let gained = 0;
    let color = "#ffffff";

    if (currentType === "bomb") {
        // Bomb: instant fail
        spawnParticles(ev.clientX || ev.touches?.[0]?.clientX,
                       ev.clientY || ev.touches?.[0]?.clientY,
                       "#ff5252");
        playBeep(200, 180, 0.3);
        endGame("You tapped a bomb!");
        return;
    }

    // Combo logic: chain hits within 800ms
    if (lastHitTime && now - lastHitTime < 800) {
        combo++;
    } else {
        combo = 1;
    }
    lastHitTime = now;

    // Base score by type
    if (currentType === "normal") {
        gained = 1;
        color = "#ff80ab";
        playBeep(700 + combo * 40, 90, 0.2);
    } else if (currentType === "bonus") {
        gained = 3;
        color = "#ffc107";
        playBeep(900 + combo * 50, 110, 0.25);
    } else if (currentType === "freeze") {
        gained = 1;
        color = "#80d8ff";
        playBeep(600, 120, 0.25);
        // Add time
        timeLeft = Math.min(timeLeft + 500, baseTimePerTarget + 400);
    }

    score += gained * combo;
    scoreEl.textContent = "Score: " + score;
    comboEl.textContent = "Combo: x" + combo;

    // Particle burst at tap position
    const px = ev.clientX || (ev.touches && ev.touches[0].clientX);
    const py = ev.clientY || (ev.touches && ev.touches[0].clientY);
    if (px != null && py != null) {
        spawnParticles(px, py, color);
    }

    updateLevel();
    spawnNewTarget();
}

// End the game
function endGame(reason) {
    gameActive = false;
    clearInterval(timerInterval);
    circle.style.display = "none";

    const storedHS = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
    const isNewHigh = score > storedHS;

    finalScoreText.textContent = `Score: ${score}`;
    finalLevelText.textContent = `Level reached: ${level}`;
    updateHighscoreDisplay();

    if (isNewHigh) {
        newHighscoreArea.classList.remove("hidden");
        playerNameInput.value = "";
        playerNameInput.focus();
    } else {
        newHighscoreArea.classList.add("hidden");
    }

    showOverlay(gameoverOverlay);
}

// Overlay helpers
function showOverlay(overlay) {
    overlay.classList.add("visible");
}
function hideOverlay(overlay) {
    overlay.classList.remove("visible");
}

// BUTTON & UI EVENTS
playButton.addEventListener("click", () => {
    playBeep(650, 80, 0.25);
    startGame();
});

retryButton.addEventListener("click", () => {
    playBeep(650, 80, 0.25);
    startGame();
});

backToMenuButton.addEventListener("click", () => {
    hideOverlay(gameoverOverlay);
    showOverlay(menuOverlay);
});

showLeaderboardButton.addEventListener("click", () => {
    renderLeaderboard();
    hideOverlay(menuOverlay);
    showOverlay(leaderboardOverlay);
});

gameoverLeaderboardButton.addEventListener("click", () => {
    renderLeaderboard();
    hideOverlay(gameoverOverlay);
    showOverlay(leaderboardOverlay);
});

leaderboardBackButton.addEventListener("click", () => {
    hideOverlay(leaderboardOverlay);
    showOverlay(menuOverlay);
});

saveScoreButton.addEventListener("click", () => {
    const name = (playerNameInput.value || "Player").trim();
    addToLeaderboard(name, score);
    updateHighscoreDisplay();
    newHighscoreArea.classList.add("hidden");
    renderLeaderboard();
});

// Circle events
circle.addEventListener("click", handleHit);
circle.addEventListener("touchstart", handleHit, { passive: false });

// Init
updateHighscoreDisplay();
showOverlay(menuOverlay);
