const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const gameOverText = document.getElementById("gameOver");
const menu = document.getElementById("menu");

// ===== ДАНІ =====
let score = 0;
let best = localStorage.getItem("best") || 0;
let speed = 4;
let running = false;
let night = false;
let explosion = 0;

bestText.textContent = "Best: " + best;

// ===== СМУГИ =====
const lanes = [80, 140, 200, 260, 320];

// ===== ГРАВЕЦЬ =====
const player = {
    lane: 2,
    x: lanes[2],
    y: 480,
    w: 40,
    h: 80,
    color: "blue"
};

// ===== ДОРОГА =====
let road = [];
for (let i = 0; i < 10; i++) road.push({ y: i * 70 });

// ===== ВОРОГИ =====
let enemies = [];

// ===== КЕРУВАННЯ =====
let keys = {};
document.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (!running && e.key.toLowerCase() === "r") restart();
});
document.addEventListener("keyup", e => keys[e.key] = false);

// ===== ВИБІР МАШИНИ =====
function selectCar(color) {
    player.color = color;
}

// ===== СТАРТ =====
function startGame() {
    menu.style.display = "none";
    canvas.style.display = "block";
    running = true;
    loop();
}

// ===== ГОЛОВНИЙ ЦИКЛ =====
function loop() {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
}

// ===== ОНОВЛЕННЯ =====
function update() {
    score++;
    if (score > best) {
        best = score;
        localStorage.setItem("best", best);
    }

    speed = 4 + Math.floor(score / 500);
    night = score > 1000;

    scoreText.textContent = "Score: " + score;
    bestText.textContent = "Best: " + best;

    movePlayer();
    moveRoad();
    spawnEnemy();
    moveEnemies();
    checkCollision();
}

// ===== РУХ ГРАВЦЯ =====
function movePlayer() {
    if (keys["ArrowLeft"] && player.lane > 0) {
        player.lane--;
        keys["ArrowLeft"] = false;
    }
    if (keys["ArrowRight"] && player.lane < lanes.length - 1) {
        player.lane++;
        keys["ArrowRight"] = false;
    }
    player.x = lanes[player.lane];
}

// ===== ДОРОГА =====
function moveRoad() {
    road.forEach(l => {
        l.y += speed;
        if (l.y > 600) l.y = -60;
    });
}

// ===== СПАВН AI =====
function spawnEnemy() {
    if (Math.random() < 0.02) {
        enemies.push({
            lane: Math.floor(Math.random() * lanes.length),
            x: 0,
            y: -100,
            w: 40,
            h: 80,
            s: speed - 1 + Math.random() * 2,
            ai: ["calm", "aggressive", "random"][Math.floor(Math.random() * 3)],
            cooldown: 0
        });
    }
}

// ===== AI ЛОГІКА =====
function updateEnemyAI(enemy) {
    enemy.x = lanes[enemy.lane];

    if (enemy.cooldown > 0) {
        enemy.cooldown--;
        return;
    }

    let danger = enemies.some(e =>
        e !== enemy &&
        e.lane === enemy.lane &&
        e.y > enemy.y &&
        e.y - enemy.y < 120
    );

    if (danger) {
        if (enemy.lane > 0 && Math.random() > 0.5) enemy.lane--;
        else if (enemy.lane < lanes.length - 1) enemy.lane++;
    }

    if (enemy.ai === "aggressive" && Math.random() < 0.03) {
        if (player.lane < enemy.lane) enemy.lane--;
        else if (player.lane > enemy.lane) enemy.lane++;
    }

    if (enemy.ai === "random" && Math.random() < 0.05) {
        enemy.lane += Math.random() < 0.5 ? -1 : 1;
        enemy.lane = Math.max(0, Math.min(lanes.length - 1, enemy.lane));
    }

    enemy.cooldown = 25;
}

// ===== РУХ ВОРОГІВ =====
function moveEnemies() {
    enemies.forEach(e => {
        updateEnemyAI(e);
        e.y += e.s;
    });
    enemies = enemies.filter(e => e.y < 700);
}

// ===== ЗІТКНЕННЯ =====
function checkCollision() {
    enemies.forEach(e => {
        if (
            player.x < e.x + e.w &&
            player.x + player.w > e.x &&
            player.y < e.y + e.h &&
            player.y + player.h > e.y
        ) {
            running = false;
            gameOverText.classList.remove("hidden");
        }
    });
}

// ===== МАЛЮВАННЯ =====
function draw() {
    ctx.fillStyle = night ? "#111" : "#555";
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = "white";
    road.forEach(l => ctx.fillRect(195, l.y, 10, 40));

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);

    enemies.forEach(e => {
        if (e.ai === "calm") ctx.fillStyle = "green";
        if (e.ai === "aggressive") ctx.fillStyle = "red";
        if (e.ai === "random") ctx.fillStyle = "orange";
        ctx.fillRect(e.x, e.y, e.w, e.h);
    });

    if (!running) {
        explosion++;
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(player.x + 20, player.y + 40, explosion * 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ===== РЕСТАРТ =====
function restart() {
    score = 0;
    enemies = [];
    explosion = 0;
    gameOverText.classList.add("hidden");
    running = true;
    loop();
}
