const holes = document.querySelectorAll('.hole');
const hitsDisplay = document.getElementById('hits');
const livesDisplay = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const statusMsg = document.getElementById('status-msg');

let hits = 0;
let mistakes = 0;
let isGameOver = false;
let spawnChance = 0.05;
let gameInterval;
let baseLightness = 50;
let contrastGap = 30;

function init() {
    gameInterval = setInterval(checkAllHoles, 3000);
}

function checkAllHoles() {
    if (isGameOver) return;
    holes.forEach(hole => {
        if (!hole.querySelector('.mole') && Math.random() < spawnChance) {
            createMoleInHole(hole);
        }
    });
    spawnChance = Math.min(0.6, 0.3 + (hits * 0.01));
}

function createMoleInHole(targetHole) {
    const mole = document.createElement('div');
    mole.classList.add('mole');

    const greenColor = `hsl(120, 70%, ${baseLightness}%)`;
    
    mole.style.backgroundColor = greenColor ;
    mole.dataset.type = 'green';
    
    targetHole.appendChild(mole);
    
    setTimeout(() => mole.classList.add('active'), 1500);

    const lifeTime = 3000 + Math.random() * 2000;
    setTimeout(() => {
        if (mole && mole.parentNode) {
            mole.classList.remove('active');
            setTimeout(() => mole.remove(), 100);
        }
    }, lifeTime);
}

holes.forEach(hole => {
    hole.addEventListener('mousedown', handleWhack);
    hole.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleWhack.call(hole);
    });
});

function handleWhack() {
    if (isGameOver) return;

    const mole = this.querySelector('.mole.active');

    // ถ้ากดพลาด ไม่มีตุ่น
    if (!mole) {
        mistakes++;
        updateLives();

        if (mistakes >= 3) {
            endGame("GAME OVER");
        }

        return;
    }

    // ถ้ากดโดนตุ่นสีเขียว
    hits++;
    hitsDisplay.innerText = hits;

    contrastGap = Math.max(2, contrastGap - 1.5);

    mole.remove();

    if (hits >= 20) {
        endGame("YOU WIN!");
    }
}

function updateLives() {
    livesDisplay.innerText = "0".repeat(3 - mistakes);
}

function endGame(msg) {
    isGameOver = true;
    clearInterval(gameInterval);
    statusMsg.innerText = msg;
    overlay.style.display = 'flex';
    setTimeout(() => {
        window.location.href = "../index.html";
    }, 3000);
}

init();