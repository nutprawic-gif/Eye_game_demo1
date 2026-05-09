const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const overlay = document.getElementById('overlay');
const statusMsg = document.getElementById('status-msg');

let score = 0;
let isGameOver = false;
let startTime = Date.now();
let gameDuration = 10 * 60;
let pellets = [];
let tileSize, centerX, centerY;

const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const ROWS = map.length;
const COLS = map[0].length;

const pacman = { x: 9, y: 11, dirX: 0, dirY: 0, nextDirX: 0, nextDirY: 0, speed: 0.05, radius: 0.4 };
const ghosts = [
    { x: 1, y: 1, dirX: 1, dirY: 0, speed: 0.03, radius: 0.4, color: '#ff3333' },
    { x: 17, y: 1, dirX: -1, dirY: 0, speed: 0.03 , radius: 0.4, color: '#ff3333' },
    { x: 9, y: 7, dirX: 0, dirY: 1, speed: 0.03, radius: 0.4, color: '#ff3333' }
];

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    tileSize = Math.floor(Math.min(canvas.width / COLS, canvas.height / ROWS) * 0.85);
    centerX = (canvas.width - COLS * tileSize) / 2;
    centerY = (canvas.height - ROWS * tileSize) / 2 + 30;
    pellets = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r][c] === 0) pellets.push({ x: c, y: r, collected: false });
        }
    }
}

let startX, startY;
const handleStart = (x, y) => { startX = x; startY = y; };
const handleEnd = (endX, endY) => {
    const dx = endX - startX, dy = endY - startY;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 10) { pacman.nextDirX = dx > 0 ? 1 : -1; pacman.nextDirY = 0; }
    } else {
        if (Math.abs(dy) > 10) { pacman.nextDirY = dy > 0 ? 1 : -1; pacman.nextDirX = 0; }
    }
};

window.addEventListener('mousedown', e => handleStart(e.clientX, e.clientY));
window.addEventListener('mouseup', e => handleEnd(e.clientX, e.clientY));
window.addEventListener('touchstart', e => handleStart(e.touches[0].clientX, e.touches[0].clientY));
window.addEventListener('touchend', e => handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY));

function isWall(x, y) {
    const gx = Math.round(x);
    const gy = Math.round(y);
    if (gx < 0 || gx >= COLS) return false;
    if (gy < 0 || gy >= ROWS) return true;
    return map[gy][gx] === 1;
}

function update() {
    if (isGameOver) return;

    if (Math.abs(pacman.x - Math.round(pacman.x)) < pacman.speed * 1.1 && 
        Math.abs(pacman.y - Math.round(pacman.y)) < pacman.speed * 1.1) {
        
        const targetX = Math.round(pacman.x);
        const targetY = Math.round(pacman.y);

        if ((pacman.nextDirX !== 0 || pacman.nextDirY !== 0) && !isWall(targetX + pacman.nextDirX, targetY + pacman.nextDirY)) {
            pacman.x = targetX;
            pacman.y = targetY;
            pacman.dirX = pacman.nextDirX;
            pacman.dirY = pacman.nextDirY;
            pacman.nextDirX = pacman.nextDirY = 0;
        } else if (isWall(targetX + pacman.dirX, targetY + pacman.dirY)) {
            pacman.x = targetX;
            pacman.y = targetY;
            pacman.dirX = 0;
            pacman.dirY = 0;
        }
    }

    pacman.x += pacman.dirX * pacman.speed;
    pacman.y += pacman.dirY * pacman.speed;

    if (pacman.x < -0.2) pacman.x = COLS - 0.8;
    if (pacman.x > COLS - 0.8) pacman.x = -0.2;

    pellets.forEach(p => {
        if (!p.collected && Math.hypot(pacman.x - p.x, pacman.y - p.y) < 0.4) {
            p.collected = true; score += 10; scoreDisplay.innerText = score;
        }
    });

    ghosts.forEach(g => {
    const gx = Math.round(g.x);
    const gy = Math.round(g.y);

    if (Math.abs(g.x - gx) < g.speed && Math.abs(g.y - gy) < g.speed) {
        if (gx !== g.lastTileX || gy !== g.lastTileY) {
            g.x = gx;
            g.y = gy;
            g.lastTileX = gx;
            g.lastTileY = gy;

            const dirs = [
                {x: 1, y: 0}, {x: -1, y: 0}, 
                {x: 0, y: 1}, {x: 0, y: -1}
            ].filter(d => !isWall(g.x + d.x, g.y + d.y));

            const forward = dirs.filter(d => !(d.x === -g.dirX && d.y === -g.dirY));
            const final = forward.length > 0 ? forward : dirs;

            if (final.length > 0) {
                const m = final[Math.floor(Math.random() * final.length)];
                g.dirX = m.x;
                g.dirY = m.y;
            }
        }
    }

    g.x += g.dirX * g.speed;
    g.y += g.dirY * g.speed;
    
    if (Math.hypot(pacman.x - g.x, pacman.y - g.y) < 0.6) endGame("GAME OVER");
});

    let rem = Math.max(0, gameDuration - (Date.now() - startTime) / 1000);
    timeDisplay.innerText = `${Math.floor(rem/60)}:${String(Math.floor(rem%60)).padStart(2,'0')}`;
    if (rem <= 0) endGame("TIME UP!");
    if (pellets.every(p => p.collected)) endGame("YOU WIN!");
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r][c] === 1) {
                ctx.fillStyle = '#1919A6';
                ctx.fillRect(c*tileSize, r*tileSize, tileSize, tileSize);
            }
        }
    }
    
    ctx.fillStyle = '#33ff33';
    pellets.forEach(p => {
        if (!p.collected) {
            ctx.beginPath();
            ctx.arc(p.x*tileSize+tileSize/2, p.y*tileSize+tileSize/2, tileSize*0.12, 0, 7);
            ctx.fill();
        }
    });
    
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(pacman.x*tileSize+tileSize/2, pacman.y*tileSize+tileSize/2, tileSize*pacman.radius, 0, 7);
    ctx.fill();
    
    ghosts.forEach(g => {
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(g.x*tileSize+tileSize/2, g.y*tileSize+tileSize/2, tileSize*g.radius, 0, 7);
        ctx.fill();
    });
    
    ctx.restore();
}

function endGame(msg) {
    if (isGameOver) return;
    isGameOver = true;
    statusMsg.innerText = msg;
    overlay.style.display = 'flex';
    setTimeout(() => { window.location.href = "../index.html"; }, 3000);
}

function loop() {
    update();
    draw();
    if (!isGameOver) requestAnimationFrame(loop);
}

init();
window.addEventListener('resize', init);
requestAnimationFrame(loop);