const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const peopleInput = document.getElementById('peopleCount');
const matchDisplay = document.getElementById('matchCount');
const probDisplay = document.getElementById('probMath');

// --- DEBUG PANEL ELEMENTS ---
const debugInputs = {
    attrForce: document.getElementById('in-attr-force'),
    attrRange: document.getElementById('in-attr-range'),
    repForce: document.getElementById('in-rep-force'),
    repRange: document.getElementById('in-rep-range'),
    repDist: document.getElementById('in-rep-dist')
};

const debugLabels = {
    attrForce: document.getElementById('val-attr-force'),
    attrRange: document.getElementById('val-attr-range'),
    repForce: document.getElementById('val-rep-force'),
    repRange: document.getElementById('val-rep-range'),
    repDist: document.getElementById('val-rep-dist')
};

// --- CONFIGURATION OBJECT ---
// We store values here so sliders can update them instantly
const CONFIG = {
    friction: 0.95,
    radius: 8,
    attractionForce: 0.03,
    attractionDateRange: 40,
    repulsionForce: 0.005,
    repulsionDateRange: 100,
    repulsionDistLimit: 100
};

// Listeners for Debug Panel
function setupDebugListeners() {
    debugInputs.attrForce.addEventListener('input', (e) => {
        CONFIG.attractionForce = parseFloat(e.target.value);
        debugLabels.attrForce.innerText = CONFIG.attractionForce;
    });
    debugInputs.attrRange.addEventListener('input', (e) => {
        CONFIG.attractionDateRange = parseInt(e.target.value);
        debugLabels.attrRange.innerText = CONFIG.attractionDateRange;
    });
    debugInputs.repForce.addEventListener('input', (e) => {
        CONFIG.repulsionForce = parseFloat(e.target.value);
        debugLabels.repForce.innerText = CONFIG.repulsionForce;
    });
    debugInputs.repRange.addEventListener('input', (e) => {
        CONFIG.repulsionDateRange = parseInt(e.target.value);
        debugLabels.repRange.innerText = CONFIG.repulsionDateRange;
    });
    debugInputs.repDist.addEventListener('input', (e) => {
        CONFIG.repulsionDistLimit = parseInt(e.target.value);
        debugLabels.repDist.innerText = CONFIG.repulsionDistLimit;
    });
}
setupDebugListeners();

// ---------------------------

let width, height;
let people = [];
let mouse = { x: -1000, y: -1000 };

function resize() {
    const container = document.querySelector('.container');
    width = Math.min(container.clientWidth, 800);
    height = 500;
    canvas.width = width;
    canvas.height = height;
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

window.addEventListener('resize', resize);
resize();

function getDateString(dayOfYear) {
    const months = [
        { name: "Jan", days: 31 }, { name: "Feb", days: 29 }, 
        { name: "Mar", days: 31 }, { name: "Apr", days: 30 }, 
        { name: "May", days: 31 }, { name: "Jun", days: 30 },
        { name: "Jul", days: 31 }, { name: "Aug", days: 31 }, 
        { name: "Sep", days: 30 }, { name: "Oct", days: 31 }, 
        { name: "Nov", days: 30 }, { name: "Dec", days: 31 }
    ];
    let day = dayOfYear;
    for (let m of months) {
        if (day <= m.days) return `${m.name} ${day}`;
        day -= m.days;
    }
    return "Dec 31";
}

function calculateProbability(n) {
    if (n > 365) return 100;
    let probNoMatch = 1;
    for (let i = 0; i < n; i++) probNoMatch *= (365 - i) / 365;
    return ((1 - probNoMatch) * 100).toFixed(2);
}

function getDayDistance(d1, d2) {
    const diff = Math.abs(d1 - d2);
    return Math.min(diff, 365 - diff);
}

class Person {
    constructor() {
        let safe = false;
        let attempts = 0;
        while (!safe && attempts < 200) {
            this.x = Math.random() * (width - 60) + 30;
            this.y = Math.random() * (height - 60) + 30;
            safe = !people.some(p => {
                const dx = p.x - this.x;
                const dy = p.y - this.y;
                return Math.sqrt(dx*dx + dy*dy) < (CONFIG.radius * 2 + 5);
            });
            attempts++;
        }

        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.birthday = Math.floor(Math.random() * 365) + 1;
        
        const hue = (this.birthday / 365) * 360;
        this.color = `hsl(${hue}, 70%, 50%)`;
        this.mass = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wall Bounce
        if (this.x < CONFIG.radius) { this.x = CONFIG.radius; this.vx *= -1; }
        if (this.x > width - CONFIG.radius) { this.x = width - CONFIG.radius; this.vx *= -1; }
        if (this.y < CONFIG.radius) { this.y = CONFIG.radius; this.vy *= -1; }
        if (this.y > height - CONFIG.radius) { this.y = height - CONFIG.radius; this.vy *= -1; }

        this.vx *= CONFIG.friction;
        this.vy *= CONFIG.friction;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, CONFIG.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
    }
}

function updatePhysics() {
    let matchedCount = new Set();

    for (let i = 0; i < people.length; i++) {
        for (let j = i + 1; j < people.length; j++) {
            const p1 = people[i];
            const p2 = people[j];
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = CONFIG.radius * 2;

            // 1. HARD COLLISION
            if (dist < minDist) {
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;
                p1.x -= nx * overlap * 0.5;
                p1.y -= ny * overlap * 0.5;
                p2.x += nx * overlap * 0.5;
                p2.y += ny * overlap * 0.5;

                const kx = p1.vx - p2.vx;
                const ky = p1.vy - p2.vy;
                const p = 2 * (nx * kx + ny * ky) / (p1.mass + p2.mass);
                p1.vx -= p * p2.mass * nx;
                p1.vy -= p * p2.mass * ny;
                p2.vx += p * p1.mass * nx;
                p2.vy += p * p1.mass * ny;
            }

            // 2. SOCIAL PHYSICS
            const dayDist = getDayDistance(p1.birthday, p2.birthday);
            if (dayDist === 0) matchedCount.add(p1.birthday);

            if (dist > 0) {
                const nx = dx / dist;
                const ny = dy / dist;

                // Attraction
                if (dayDist < CONFIG.attractionDateRange && dist > minDist) {
                    p1.vx += nx * CONFIG.attractionForce;
                    p1.vy += ny * CONFIG.attractionForce;
                    p2.vx -= nx * CONFIG.attractionForce;
                    p2.vy -= ny * CONFIG.attractionForce;
                }
                // Repulsion
                else if (dayDist > CONFIG.repulsionDateRange && dist < CONFIG.repulsionDistLimit) {
                    p1.vx -= nx * CONFIG.repulsionForce;
                    p1.vy -= ny * CONFIG.repulsionForce;
                    p2.vx += nx * CONFIG.repulsionForce;
                    p2.vy += ny * CONFIG.repulsionForce;
                }
            }
        }
    }
    matchDisplay.innerText = matchedCount.size > 0 ? "YES (" + matchedCount.size + ")" : "NO";
}

function drawScene() {
    ctx.clearRect(0, 0, width, height);

    let matches = [];
    
    // Draw Lines
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00FFFF"; 
    for (let i = 0; i < people.length; i++) {
        for (let j = i + 1; j < people.length; j++) {
            const p1 = people[i];
            const p2 = people[j];
            if (p1.birthday === p2.birthday) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 4;
                ctx.stroke();
                matches.push(getDateString(p1.birthday));
            }
        }
    }
    ctx.shadowBlur = 0;

    // Draw Nodes
    people.forEach(p => p.draw());

    // Hover Tooltip
    let hoverFound = false;
    people.forEach(p => {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        if (!hoverFound && Math.sqrt(dx*dx + dy*dy) < CONFIG.radius + 5) {
            const dateStr = getDateString(p.birthday);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.roundRect(p.x + 10, p.y - 30, 60, 25, 5);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(dateStr, p.x + 18, p.y - 13);
            hoverFound = true;
        }
    });

    if (matches.length > 0) {
        ctx.fillStyle = "#00FFFF";
        ctx.font = "14px monospace";
        ctx.fillText("MATCHES: " + [...new Set(matches)].join(", "), 10, 20);
    }
}

function loop() {
    people.forEach(p => p.update());
    updatePhysics();
    drawScene();
    requestAnimationFrame(loop);
}

function init() {
    const count = parseInt(peopleInput.value);
    probDisplay.innerText = calculateProbability(count) + "%";
    people = [];
    for (let i = 0; i < count; i++) {
        people.push(new Person());
    }
}

init();
loop();
startBtn.addEventListener('click', init);