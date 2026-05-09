const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

let score = 0;
let isGameOver = false;
let startTime = Date.now();
let gameDuration = 20 * 60; 

const player = { width: 90, height: 15, x: 0, y: 0, color: '#00b0ff' };
let blocks = [];

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 70;
}

function handleMove(clientX) {
    if (isGameOver) return;
    player.x = clientX - player.width / 2;
    
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
}

window.addEventListener('touchmove', (e) => {
    handleMove(e.touches[0].clientX);
    e.preventDefault(); 
}, { passive: false });

window.addEventListener('mousemove', (e) => {
    handleMove(e.clientX);
});

let lastSpawnTime = 0;
function manageSpawning(currentTime) {
    const elapsed = (Date.now() - startTime) / 1000;
    const diff = 1 + (elapsed / 60) * 2; 
    
    const spawnInterval = 1000 / diff;

    if (currentTime - lastSpawnTime > spawnInterval) {
        blocks.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            size: 30,
            type: Math.random() > 0.3 ? 'green' : 'red',
            speed: (3 + Math.random() * 2) * diff
        });
        lastSpawnTime = currentTime;
    }
}

function update() {
    if (isGameOver) return;
    const elapsed = (Date.now() - startTime) / 1000;

    for (let i = blocks.length - 1; i >= 0; i--) {
        let b = blocks[i];
        b.y += b.speed;

        if (b.y + b.size > player.y && 
            b.x < player.x + player.width && 
            b.x + b.size > player.x) {
            
            b.type === 'green' ? score += 10 : score -= 20;
            blocks.splice(i, 1);
            continue;
        }

        // ลบเมื่อหลุดจอ
        if (b.y > canvas.height) {
            blocks.splice(i, 1);
        }
    }

    if (elapsed >= gameDuration) {
        isGameOver = true;
        overlay.style.display = 'flex';
        document.getElementById('final-score').innerText = `Score: ${score}`;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    blocks.forEach(b => {
        ctx.fillStyle = b.type === 'green' ? '#00e676' : '#ff1744';
        ctx.fillRect(b.x, b.y, b.size, b.size);
    });

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, 1050, 50);
    
    let timeLeft = Math.max(0, gameDuration - (Date.now() - startTime) / 1000);
    let m = Math.floor(timeLeft / 60);
    let s = Math.floor(timeLeft % 60);
    ctx.fillText(`Time: ${m}:${s < 10 ? '0'+s : s}`, 1050, 85);
}

function loop(currentTime) {
    manageSpawning(currentTime);
    update();
    draw();
    if (!isGameOver) requestAnimationFrame(loop);
}

init();
window.addEventListener('resize', init);
requestAnimationFrame(loop);