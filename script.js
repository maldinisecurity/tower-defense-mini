const WIDTH = 900;
const HEIGHT = 520;
const MAX_WAVE = 8;

const canvas = document.getElementById("g");
const ctx = canvas.getContext("2d");
const goldValueEl = document.getElementById("goldValue");
const hpValueEl = document.getElementById("hpValue");
const waveValueEl = document.getElementById("waveValue");
const selectedValueEl = document.getElementById("selectedValue");
const statusValueEl = document.getElementById("statusValue");
const msgEl = document.getElementById("msg");
const waveBtn = document.getElementById("waveBtn");
const restartBtn = document.getElementById("restartBtn");
const towerButtons = [...document.querySelectorAll("[data-type]")];

const pathPoints = [
  { x: 0, y: 260 },
  { x: 198, y: 260 },
  { x: 198, y: 118 },
  { x: 520, y: 118 },
  { x: 520, y: 382 },
  { x: 900, y: 382 },
];

const towerTypes = {
  pulse: { label: "Pulse", cost: 50, range: 140, damage: 16, fireRate: 0.42, color: "#22d3ee" },
  beam: { label: "Beam", cost: 85, range: 205, damage: 34, fireRate: 0.9, color: "#fbbf24" },
};

let pathSegments;
let pathLength;
let gold;
let baseHp;
let wave;
let phase;
let selectedType;
let towers;
let enemies;
let enemiesToSpawn;
let spawnTimer;
let lastFrame = performance.now();

function buildPathData() {
  pathSegments = [];
  pathLength = 0;
  for (let index = 0; index < pathPoints.length - 1; index += 1) {
    const start = pathPoints[index];
    const end = pathPoints[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    pathSegments.push({ start, end, length });
    pathLength += length;
  }
}

function pointOnPath(distance) {
  let remaining = distance;
  for (const segment of pathSegments) {
    if (remaining <= segment.length) {
      return {
        x: segment.start.x + ((segment.end.x - segment.start.x) * remaining) / segment.length,
        y: segment.start.y + ((segment.end.y - segment.start.y) * remaining) / segment.length,
      };
    }
    remaining -= segment.length;
  }
  return { ...pathPoints[pathPoints.length - 1] };
}

function setPhase(nextPhase) {
  phase = nextPhase;
  statusValueEl.textContent =
    nextPhase === "game-over"
      ? "Game Over"
      : nextPhase[0].toUpperCase() + nextPhase.slice(1);
  statusValueEl.dataset.state = nextPhase;
  waveBtn.disabled = nextPhase === "battle" || nextPhase === "won" || nextPhase === "game-over";
}

function syncHud() {
  goldValueEl.textContent = String(gold);
  hpValueEl.textContent = String(baseHp);
  waveValueEl.textContent = String(wave);
  selectedValueEl.textContent = towerTypes[selectedType].label;
}

function updateTowerButtons() {
  towerButtons.forEach((button) => {
    const selected = button.dataset.type === selectedType;
    button.dataset.selected = String(selected);
    button.classList.toggle("ghost", !selected);
  });
}

function resetGame() {
  gold = 150;
  baseHp = 12;
  wave = 1;
  selectedType = "pulse";
  towers = [];
  enemies = [];
  enemiesToSpawn = 0;
  spawnTimer = 0;
  setPhase("build");
  msgEl.textContent = "Select a tower, tap the field to place it, or tap an existing tower to upgrade during build time.";
  syncHud();
  updateTowerButtons();
  draw();
}

function startWave() {
  if (phase !== "build") {
    return;
  }
  enemiesToSpawn = 5 + wave * 2;
  spawnTimer = 0.2;
  setPhase("battle");
  msgEl.textContent = `Wave ${wave} begins. Hold the line.`;
}

function spawnEnemy() {
  enemies.push({
    distance: 0,
    speed: 64 + wave * 8 + Math.random() * 10,
    hp: 42 + wave * 12,
    maxHp: 42 + wave * 12,
    bounty: 16 + wave * 2,
  });
}

function completeWave() {
  if (wave >= MAX_WAVE) {
    setPhase("won");
    msgEl.textContent = "All waves cleared. The base holds.";
    return;
  }
  wave += 1;
  gold += 30 + wave * 3;
  setPhase("build");
  msgEl.textContent = `Wave clear. Bonus gold awarded. Build before wave ${wave}.`;
  syncHud();
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const projectionX = start.x + t * dx;
  const projectionY = start.y + t * dy;
  return Math.hypot(point.x - projectionX, point.y - projectionY);
}

function pointOnRoad(point) {
  return pathSegments.some((segment) => distanceToSegment(point, segment.start, segment.end) < 32);
}

function findTowerAt(point) {
  return towers.find((tower) => Math.hypot(point.x - tower.x, point.y - tower.y) <= 18);
}

function canPlaceTower(point) {
  if (point.x < 32 || point.x > WIDTH - 32 || point.y < 32 || point.y > HEIGHT - 32) {
    return false;
  }
  if (pointOnRoad(point)) {
    return false;
  }
  return !towers.some((tower) => Math.hypot(point.x - tower.x, point.y - tower.y) < 48);
}

function upgradeCost(tower) {
  return 40 + tower.level * 18;
}

function placeOrUpgradeTower(point) {
  if (phase !== "build") {
    msgEl.textContent = "Build and upgrades are only available between waves.";
    return;
  }

  const existingTower = findTowerAt(point);
  if (existingTower) {
    const cost = upgradeCost(existingTower);
    if (gold < cost) {
      msgEl.textContent = `Need ${cost} gold to upgrade this tower.`;
      return;
    }
    gold -= cost;
    existingTower.level += 1;
    existingTower.range += 14;
    existingTower.damage += existingTower.type === "beam" ? 12 : 7;
    existingTower.fireRate = Math.max(0.18, existingTower.fireRate * 0.92);
    msgEl.textContent = `${towerTypes[existingTower.type].label} tower upgraded to level ${existingTower.level}.`;
    syncHud();
    return;
  }

  const type = towerTypes[selectedType];
  if (gold < type.cost) {
    msgEl.textContent = `Need ${type.cost} gold for a ${type.label} tower.`;
    return;
  }
  if (!canPlaceTower(point)) {
    msgEl.textContent = "That spot is blocked by the road or another tower.";
    return;
  }

  gold -= type.cost;
  towers.push({
    x: point.x,
    y: point.y,
    type: selectedType,
    range: type.range,
    damage: type.damage,
    fireRate: type.fireRate,
    cooldown: 0,
    color: type.color,
    level: 1,
    flash: 0,
  });
  msgEl.textContent = `${type.label} tower deployed.`;
  syncHud();
}

function updateTowers(dt) {
  for (const tower of towers) {
    tower.cooldown -= dt;
    tower.flash = Math.max(0, tower.flash - dt);
    if (tower.cooldown > 0) {
      continue;
    }
    const target = enemies
      .filter((enemy) => !enemy.dead)
      .sort((a, b) => b.distance - a.distance)
      .find((enemy) => {
        const position = pointOnPath(enemy.distance);
        return Math.hypot(position.x - tower.x, position.y - tower.y) <= tower.range;
      });

    if (!target) {
      continue;
    }

    target.hp -= tower.damage;
    tower.cooldown = tower.fireRate;
    tower.flash = 0.12;

    if (target.hp <= 0) {
      target.dead = true;
      gold += target.bounty;
      syncHud();
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    enemy.distance += enemy.speed * dt;
    if (enemy.distance >= pathLength) {
      enemy.dead = true;
      baseHp = Math.max(0, baseHp - 1);
      syncHud();
      if (baseHp <= 0) {
        setPhase("game-over");
        msgEl.textContent = "The base fell. Restart to defend it again.";
        return;
      }
    }
  }
  enemies = enemies.filter((enemy) => !enemy.dead);
}

function update(dt) {
  if (phase !== "battle") {
    return;
  }

  spawnTimer -= dt;
  if (enemiesToSpawn > 0 && spawnTimer <= 0) {
    spawnEnemy();
    enemiesToSpawn -= 1;
    spawnTimer = Math.max(0.24, 0.72 - wave * 0.04);
  }

  updateEnemies(dt);
  if (phase === "game-over") {
    return;
  }
  updateTowers(dt);

  if (enemiesToSpawn === 0 && enemies.length === 0) {
    completeWave();
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#18364d");
  gradient.addColorStop(0.7, "#0a1623");
  gradient.addColorStop(1, "#040911");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawRoad() {
  ctx.lineWidth = 26;
  ctx.strokeStyle = "#64748b";
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (const point of pathPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#cbd5e1";
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (const point of pathPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTowers() {
  for (const tower of towers) {
    if (tower.flash > 0) {
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(125, 211, 252, 0.18)";
      ctx.stroke();
    }
    ctx.fillStyle = tower.color;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 11px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(String(tower.level), tower.x, tower.y + 4);
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    const point = pointOnPath(enemy.distance);
    ctx.fillStyle = "#f472b6";
    ctx.fillRect(point.x - 11, point.y - 11, 22, 22);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(point.x - 14, point.y - 18, 28, 5);
    ctx.fillStyle = "#34d399";
    ctx.fillRect(point.x - 14, point.y - 18, (28 * enemy.hp) / enemy.maxHp, 5);
  }
}

function drawOverlay() {
  if (phase !== "won" && phase !== "game-over") {
    return;
  }
  ctx.fillStyle = "rgba(2, 8, 23, 0.42)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.font = "700 34px Trebuchet MS";
  ctx.fillText(phase === "won" ? "Victory" : "Base Lost", WIDTH / 2, HEIGHT / 2 - 12);
  ctx.font = "600 18px Trebuchet MS";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("Press Restart to play again.", WIDTH / 2, HEIGHT / 2 + 18);
}

function draw() {
  drawBackground();
  drawRoad();
  drawTowers();
  drawEnemies();
  drawOverlay();
}

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.03);
  lastFrame = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

function canvasPointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
  };
}

waveBtn.addEventListener("click", startWave);
restartBtn.addEventListener("click", resetGame);
towerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedType = button.dataset.type;
    updateTowerButtons();
    syncHud();
  });
});

canvas.addEventListener("pointerdown", (event) => {
  placeOrUpgradeTower(canvasPointFromEvent(event));
});

buildPathData();
resetGame();
requestAnimationFrame(frame);
