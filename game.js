let score = 0;
let highScore = localStorage.getItem("tapdash_highscore") || 0;
document.getElementById("highscore").innerText = "High Score: " + highScore;

const circle = document.getElementById("circle");
const timer = document.getElementById("timer");

let timeLeft = 1000; 
let timerInterval;

function startGame() {
    score = 0;
    timeLeft = 1000;
    document.getElementById("score").innerText = "Score: " + score;

    moveCircle();
    circle.style.display = "block";

    timerInterval = setInterval(() => {
        timeLeft -= 10;
        timer.style.width = (timeLeft / 1000) * 100 + "%";

        if (timeLeft <= 0) endGame();
    }, 10);
}

function moveCircle() {
    const game = document.getElementById("game");

    const size = 80;
    const maxX = game.clientWidth - size;
    const maxY = game.clientHeight - size;

    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    circle.style.left = x + "px";
    circle.style.top = y + "px";
}

circle.addEventListener("click", hit);
circle.addEventListener("touchstart", hit);

function hit() {
    score++;
    document.getElementById("score").innerText = "Score: " + score;

    timeLeft = 1000;
    moveCircle();
}

function endGame() {
    clearInterval(timerInterval);
    circle.style.display = "none";

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("tapdash_highscore", highScore);
    }

    alert("Game Over! Your score: " + score);
    document.getElementById("highscore").innerText = "High Score: " + highScore;
    startGame();
}

startGame();
