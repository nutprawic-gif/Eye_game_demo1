const GRID_SIZE = 8;
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
let currentPreviews = [null, null, null];
let draggingElement = null;
let draggingData = null;
let draggingSlotIndex = null;

const gridElement = document.getElementById('grid-container');
const nowScoreElement = document.getElementById('now-score');
const bestScoreElement = document.getElementById('best-score');

const SHAPES = [
    { dots: [[0,0]] },
    { dots: [[0,0], [0,1]] },
    { dots: [[0,0], [0,1], [0,2]] },
    { dots: [[0,0], [0,1], [1,0], [1,1]] },
    { dots: [[0,0], [1,0], [2,0], [2,1]] },
    { dots: [[0,1], [1,0], [1,1], [1,2]] }
];

function init() {
    bestScoreElement.innerText = bestScore;
    createGrid();
    generateNewSet();
    setupEvents();
}

function createGrid() {
    gridElement.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            gridElement.appendChild(cell);
        }
    }
}

function generateNewSet() {
    for (let i = 0; i < 3; i++) {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        let color = Math.random() > 0.5 ? 'green' : 'red';
        currentPreviews[i] = { dots: shape.dots, color: color };
    }
    if (currentPreviews.every(p => p.color === 'red')) {
        currentPreviews[Math.floor(Math.random() * 3)].color = 'green';
    }
    for (let i = 0; i < 3; i++) renderPreview(i, currentPreviews[i]);
}

function manualReset() {
    score = Math.max(0, score - 50);
    updateScore();
    generateNewSet();
}

function renderPreview(index, data) {
    const slot = document.getElementById(`slot-${index}`);
    slot.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-block-wrapper';
    data.dots.forEach(d => {
        const u = document.createElement('div');
        u.className = `block-unit color-${data.color}`;
        u.style.gridRowStart = d[0] + 1;
        u.style.gridColumnStart = d[1] + 1;
        wrapper.appendChild(u);
    });
    wrapper.onmousedown = (e) => startDrag(e, index, data, wrapper);
    wrapper.ontouchstart = (e) => { startDrag(e.touches[0], index, data, wrapper); e.preventDefault(); };
    slot.appendChild(wrapper);
}

function startDrag(e, index, data, el) {
    draggingData = data;
    draggingSlotIndex = index;
    draggingElement = el.cloneNode(true);
    draggingElement.className = 'preview-block-wrapper dragging-ghost';
    const cellSize = document.querySelector('.cell').offsetWidth;
    draggingElement.style.width = (cellSize * 3) + 'px';
    draggingElement.style.height = (cellSize * 3) + 'px';
    document.body.appendChild(draggingElement);
    el.style.visibility = 'hidden';
    updatePosition(e);
}

function updatePosition(e) {
    if (!draggingElement) return;
    const x = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const y = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    draggingElement.style.left = x + 'px';
    draggingElement.style.top = (y - 60) + 'px';
    const rect = draggingElement.getBoundingClientRect();
    updateHighlight(rect.left + rect.width/2, rect.top + rect.height/2);
}

function updateHighlight(tx, ty) {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('ghost-hover-green', 'ghost-hover-red'));
    const cell = getCellAt(tx, ty);
    if (cell) {
        const r = parseInt(cell.dataset.r), c = parseInt(cell.dataset.c);
        if (canPlace(r, c, draggingData.dots)) {
            draggingData.dots.forEach(d => {
                const target = gridElement.children[(r + d[0]) * GRID_SIZE + (c + d[1])];
                if (target) target.classList.add(draggingData.color === 'green' ? 'ghost-hover-green' : 'ghost-hover-red');
            });
        }
    }
}

function getCellAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return (el && el.className.includes('cell')) ? el : null;
}

function canPlace(r, c, dots) {
    return dots.every(d => {
        const nr = r + d[0], nc = c + d[1];
        return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc] === null;
    });
}

function setupEvents() {
    window.onmousemove = updatePosition;
    window.ontouchmove = (e) => { if (draggingElement) { updatePosition(e.touches[0]); e.preventDefault(); } };
    const end = (e) => {
        if (!draggingElement) return;
        const rect = draggingElement.getBoundingClientRect();
        const cell = getCellAt(rect.left + rect.width/2, rect.top + rect.height/2);
        if (cell) {
            const r = parseInt(cell.dataset.r), c = parseInt(cell.dataset.c);
            if (canPlace(r, c, draggingData.dots)) {
                place(r, c, draggingData);
                generateNewSet();
                checkLines();
            } else resetDrag();
        } else resetDrag();
        draggingElement.remove();
        draggingElement = null;
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('ghost-hover-green', 'ghost-hover-red'));
    };
    window.onmouseup = end;
    window.ontouchend = end;
}

function resetDrag() {
    const slot = document.getElementById(`slot-${draggingSlotIndex}`);
    if (slot.firstChild) slot.firstChild.style.visibility = 'visible';
}

function place(r, c, block) {
    block.dots.forEach(d => {
        const nr = r + d[0], nc = c + d[1];
        grid[nr][nc] = block.color;
        gridElement.children[nr * GRID_SIZE + nc].className = `cell color-${block.color}`;
    });
    if (block.color === 'green') score += (block.dots.length * 10);
    else score = Math.max(0, score - (block.dots.length * 15));
    updateScore();
}

function checkLines() {
    let rs = [], cs = [];
    for (let r = 0; r < GRID_SIZE; r++) if (grid[r].every(v => v !== null)) rs.push(r);
    for (let c = 0; c < GRID_SIZE; c++) {
        let f = true;
        for (let r = 0; r < GRID_SIZE; r++) if (grid[r][c] === null) f = false;
        if (f) cs.push(c);
    }
    rs.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) clear(r, c); score += 150; });
    cs.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) clear(r, c); score += 150; });
    if (rs.length > 0 || cs.length > 0) updateScore();
}

function clear(r, c) {
    grid[r][c] = null;
    gridElement.children[r * GRID_SIZE + c].className = 'cell';
}

function updateScore() {
    nowScoreElement.innerText = score;
    if (score > bestScore) {
        bestScore = score;
        bestScoreElement.innerText = bestScore;
        localStorage.setItem('bestScore', bestScore);
    }
}

init();