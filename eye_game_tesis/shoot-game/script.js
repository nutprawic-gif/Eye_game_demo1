const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const comboDisplay = document.getElementById('combo');
const timeDisplay = document.getElementById('time');
const overlay = document.getElementById('overlay');
const statusMsg = document.getElementById('status-msg');
const finalScoreMsg = document.getElementById('final-score');

let score = 0;
let combo = 1;
let timeLeft = 600;
let isGameOver = false;
let targets = [];
let particles = [];
let lastTime = Date.now();

class Target {
    constructor(type) {
        this.type = type; 
        this.radius = Math.random() * (35 - 20) + 20;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = Math.random() * (canvas.height - this.radius * 2) + this.radius;
        this.vx = (Math.random() - 0.5) * (score / 200 + 3);
        this.vy = (Math.random() - 0.5) * (score / 200 + 3);
        this.color = type === 'good' ? '#33ff33' : '#ff3333';
        this.life = Math.random() * 2 + 3; 
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= dt;

        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) this.vx *= -1;
        if (this.y - this.radius < 60 || this.y + this.radius > canvas.height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.min(1, this.life * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.alpha = 1;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.alpha -= 0.02;
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 4, 4);
        ctx.globalAlpha = 1;
    }
}

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    maintainTargets();
}

function spawnTarget(type) {
    const tType = type || (Math.random() > 0.5 ? 'good' : 'bad');
    targets.push(new Target(tType));
}

function maintainTargets() {
    const goodCount = targets.filter(t => t.type === 'good').length;
    const badCount = targets.filter(t => t.type === 'bad').length;

    if (goodCount < 3) spawnTarget('good');
    if (badCount < 3) spawnTarget('bad');
}

function handleInput(ex, ey) {
    if (isGameOver) return;
    let hit = false;
    
    for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        const dist = Math.hypot(ex - t.x, ey - t.y);
        
        if (dist < t.radius) {
            hit = true;
            createParticles(t.x, t.y, t.color);
            if (t.type === 'good') {
                score += 10 * combo;
                combo++;
            } else {
                score = Math.max(0, score - 50);
                combo = 1;
            }
            targets.splice(i, 1);
            maintainTargets(); 
            break;
        }
    }
    
    if (!hit) combo = 1;
    updateUI();
}

function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) particles.push(new Particle(x, y, color));
}

function updateUI() {
    scoreDisplay.innerText = score;
    comboDisplay.innerText = combo;
}

window.addEventListener('mousedown', e => handleInput(e.clientX, e.clientY));
window.addEventListener('touchstart', e => {
    e.preventDefault();
    handleInput(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

function update() {
    if (isGameOver) return;
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    timeLeft -= dt;
    let mins = Math.floor(timeLeft / 60);
    let secs = Math.floor(timeLeft % 60);
    timeDisplay.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;

    if (timeLeft <= 0) {
        isGameOver = true;
        statusMsg.innerText = "TIME UP!";
        finalScoreMsg.innerText = "Final Score: " + score;
        overlay.style.display = 'flex';
    }

    for (let i = targets.length - 1; i >= 0; i--) {
        targets[i].update(dt);
        if (targets[i].life <= 0) {
            targets.splice(i, 1);
        }
    }
    
    maintainTargets();

    particles.forEach((p, index) => {
        p.update();
        if (p.alpha <= 0) particles.splice(index, 1);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => p.draw());
    targets.forEach(t => t.draw());
}

function loop() {
    update();
    draw();
    if (!isGameOver) requestAnimationFrame(loop);
}

init();
window.addEventListener('resize', init);
requestAnimationFrame(loop);