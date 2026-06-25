const WIDTH = 900;
const HEIGHT = 520;
const MAX_WAVE = 8;

const canvas = document.getElementById("g");
const ctx = canvas.getContext("2d");
const goldValueEl = document.getElementById("goldValue");
const hpValueEl = document.getElementById("hpValue");
const waveValueEl = document.getElementById("waveValue");
const threatValueEl = document.getElementById("threatValue");
const selectedValueEl = document.getElementById("selectedValue");
const statusValueEl = document.getElementById("statusValue");
const towerInfoEl = document.getElementById("towerInfo");
const msgEl = document.getElementById("msg");
const waveBtn = document.getElementById("waveBtn");
const restartBtn = document.getElementById("restartBtn");
const towerButtons = [...document.querySelectorAll("[data-type]")];

function injectEntryMenuStyles() {
  if (document.getElementById("entryMenuStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "entryMenuStyles";
  style.textContent = `
    body.entry-menu-open {
      overflow: hidden;
    }

    .entry-shell {
      position: fixed;
      inset: 0;
      z-index: 120;
      display: grid;
      place-items: center;
      padding: 16px;
      padding-top: max(16px, env(safe-area-inset-top));
      padding-right: max(16px, env(safe-area-inset-right));
      padding-bottom: max(16px, env(safe-area-inset-bottom));
      padding-left: max(16px, env(safe-area-inset-left));
      background: rgba(2, 8, 23, 0.54);
      backdrop-filter: blur(16px);
      opacity: 1;
      visibility: visible;
      transition: opacity 220ms ease, visibility 220ms ease;
    }

    .entry-shell.is-hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .entry-panel {
      position: relative;
      width: min(540px, 100%);
      padding: clamp(20px, 4vw, 30px);
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: linear-gradient(180deg, rgba(10, 18, 33, 0.96), rgba(4, 10, 20, 0.96));
      box-shadow: 0 30px 80px rgba(2, 8, 23, 0.46);
      overflow: hidden;
      animation: entryRise 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .entry-panel::before {
      content: "";
      position: absolute;
      inset: 0 0 auto 0;
      height: 120px;
      background: radial-gradient(circle at top, rgba(255, 255, 255, 0.12), transparent 70%);
      pointer-events: none;
    }

    .entry-screen {
      position: relative;
      z-index: 1;
      display: none;
      gap: 14px;
    }

    .entry-screen.is-active {
      display: grid;
      animation: entryCopy 0.24s ease;
    }

    .entry-kicker {
      margin: 0;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent, #34d399);
    }

    .entry-panel h2 {
      margin: 0;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      line-height: 1;
      color: var(--text, #f7fbff);
    }

    .entry-copy {
      margin: 0;
      color: var(--muted, #c5d8e8);
      font-weight: 700;
      line-height: 1.6;
    }

    .entry-guide {
      display: grid;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .entry-guide p {
      margin: 0;
      color: var(--muted, #c5d8e8);
      font-weight: 600;
      line-height: 1.55;
    }

    .entry-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 8px;
    }

    .entry-actions button {
      flex: 1 1 180px;
    }

    .entry-secondary {
      background: transparent !important;
      color: var(--text, #f7fbff) !important;
      border: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: none !important;
    }

    @media (max-width: 480px) {
      .entry-panel {
        border-radius: 24px;
        padding: 18px;
      }

      .entry-actions button {
        flex-basis: 100%;
      }
    }

    @keyframes entryRise {
      from { transform: translateY(24px) scale(0.98); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    @keyframes entryCopy {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.append(style);
}

function createEntryMenu({ title, kicker, description, tutorial, onStart }) {
  injectEntryMenuStyles();

  const shell = document.createElement("section");
  shell.className = "entry-shell is-hidden";
  shell.hidden = true;
  shell.innerHTML = `
    <article class="entry-panel" aria-label="${title} start screen">
      <section class="entry-screen is-active" data-entry-screen="home">
        <p class="entry-kicker">${kicker}</p>
        <h2>${title}</h2>
        <p class="entry-copy">${description}</p>
        <div class="entry-actions">
          <button type="button" data-entry-start>Start New Game</button>
          <button type="button" class="entry-secondary" data-entry-tutorial>Tutorial / Help</button>
        </div>
      </section>
      <section class="entry-screen" data-entry-screen="tutorial" hidden>
        <p class="entry-kicker">Tutorial</p>
        <h2>How To Play</h2>
        <div class="entry-guide">${tutorial.map((item) => `<p>${item}</p>`).join("")}</div>
        <div class="entry-actions">
          <button type="button" class="entry-secondary" data-entry-back>Back</button>
          <button type="button" data-entry-start>Start Game</button>
        </div>
      </section>
    </article>
  `;
  document.body.append(shell);

  const screens = [...shell.querySelectorAll(".entry-screen")];

  const showScreen = (name) => {
    screens.forEach((screen) => {
      const active = screen.dataset.entryScreen === name;
      screen.hidden = !active;
      screen.classList.toggle("is-active", active);
    });
  };

  const close = () => {
    shell.classList.add("is-hidden");
    document.body.classList.remove("entry-menu-open");
    window.setTimeout(() => {
      shell.hidden = true;
    }, 220);
  };

  const open = (screen = "home") => {
    showScreen(screen);
    shell.hidden = false;
    document.body.classList.add("entry-menu-open");
    requestAnimationFrame(() => {
      shell.classList.remove("is-hidden");
    });
  };

  shell.querySelectorAll("[data-entry-start]").forEach((button) => {
    button.addEventListener("click", () => {
      onStart();
      close();
    });
  });
  shell.querySelector("[data-entry-tutorial]").addEventListener("click", () => {
    showScreen("tutorial");
  });
  shell.querySelector("[data-entry-back]").addEventListener("click", () => {
    showScreen("home");
  });

  open();
}

const pathPoints = [
  { x: 0, y: 260 },
  { x: 198, y: 260 },
  { x: 198, y: 118 },
  { x: 520, y: 118 },
  { x: 520, y: 382 },
  { x: 900, y: 382 },
];

const towerTypes = {
  pulse: {
    label: "Pulse",
    cost: 50,
    range: 138,
    damage: 16,
    fireRate: 0.34,
    color: "#22d3ee",
    detail: "Fast close-range tower. Best for finishing runners and softened targets.",
  },
  beam: {
    label: "Beam",
    cost: 90,
    range: 214,
    damage: 42,
    fireRate: 0.95,
    color: "#fbbf24",
    detail: "Long-range heavy tower. Punches through armor but fires slowly.",
  },
  frost: {
    label: "Frost",
    cost: 70,
    range: 156,
    damage: 7,
    fireRate: 0.55,
    slow: 0.48,
    slowDuration: 1.35,
    color: "#67e8f9",
    detail: "Control tower. Slows enemies so Pulse and Beam towers can finish them.",
  },
};

const enemyTypes = {
  scout: { label: "Scout", hp: 34, speed: 92, bounty: 13, color: "#fb7185", size: 18 },
  grunt: { label: "Grunt", hp: 58, speed: 66, bounty: 17, color: "#f472b6", size: 22 },
  brute: { label: "Brute", hp: 128, speed: 42, bounty: 30, color: "#fb923c", size: 28 },
  shield: { label: "Shield", hp: 88, speed: 54, bounty: 24, armor: 5, color: "#a78bfa", size: 24 },
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
let spawnQueue;
let spawnTimer;
let shots;
let particles;
let mousePoint;
let kills;
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
  threatValueEl.textContent = `${enemies.length + spawnQueue.length}/${currentWaveSize()}`;
  towerInfoEl.textContent = towerTypes[selectedType].detail;
}

function updateTowerButtons() {
  towerButtons.forEach((button) => {
    const selected = button.dataset.type === selectedType;
    button.dataset.selected = String(selected);
    button.classList.toggle("ghost", !selected);
  });
}

function currentWaveSize() {
  const baseSize = 7 + wave * 2 + Math.floor(wave / 2);
  return wave === MAX_WAVE ? baseSize + 3 : baseSize;
}

function buildWaveQueue() {
  const queue = [];
  const total = 7 + wave * 2 + Math.floor(wave / 2);

  for (let index = 0; index < total; index += 1) {
    if (wave >= 6 && index % 7 === 4) {
      queue.push("shield");
    } else if (wave >= 4 && index % 6 === 5) {
      queue.push("brute");
    } else if (wave >= 2 && index % 4 === 1) {
      queue.push("scout");
    } else {
      queue.push("grunt");
    }
  }

  if (wave === MAX_WAVE) {
    queue.push("brute", "shield", "scout");
  }

  return queue;
}

function resetGame() {
  gold = 175;
  baseHp = 14;
  wave = 1;
  selectedType = "pulse";
  towers = [];
  enemies = [];
  spawnQueue = [];
  spawnTimer = 0;
  shots = [];
  particles = [];
  mousePoint = null;
  kills = 0;
  setPhase("build");
  msgEl.textContent = "Build a layered defense. Frost slows, Beam cracks armor, Pulse cleans up leaks.";
  syncHud();
  updateTowerButtons();
  draw();
}

function startWave() {
  if (phase !== "build") {
    return;
  }
  spawnQueue = buildWaveQueue();
  spawnTimer = 0.2;
  setPhase("battle");
  msgEl.textContent = `Wave ${wave} begins: ${spawnQueue.length} enemies incoming.`;
  syncHud();
}

function spawnEnemy(typeKey) {
  const type = enemyTypes[typeKey];
  const scale = 1 + (wave - 1) * 0.16;
  enemies.push({
    type: typeKey,
    distance: 0,
    speed: type.speed + wave * 3 + Math.random() * 7,
    hp: Math.round(type.hp * scale),
    maxHp: Math.round(type.hp * scale),
    bounty: type.bounty + Math.floor(wave * 1.6),
    armor: type.armor || 0,
    color: type.color,
    size: type.size,
    slowTimer: 0,
    slowFactor: 1,
  });
}

function completeWave() {
  if (wave >= MAX_WAVE) {
    setPhase("won");
    msgEl.textContent = `All waves cleared with ${kills} enemies destroyed. The base holds.`;
    return;
  }
  wave += 1;
  gold += 36 + wave * 5 + Math.max(0, baseHp - 8);
  setPhase("build");
  msgEl.textContent = `Wave clear. Bonus gold awarded. Prepare for ${currentWaveSize()} enemies in wave ${wave}.`;
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
  return 34 + tower.level * 24 + (tower.type === "beam" ? 8 : 0);
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
    existingTower.range += existingTower.type === "beam" ? 12 : 10;
    existingTower.damage += existingTower.type === "beam" ? 15 : existingTower.type === "frost" ? 4 : 8;
    existingTower.fireRate = Math.max(0.16, existingTower.fireRate * 0.9);
    existingTower.slowDuration += existingTower.type === "frost" ? 0.2 : 0;
    existingTower.slow = existingTower.type === "frost" ? Math.max(0.33, existingTower.slow - 0.03) : existingTower.slow;
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
    targetPoint: null,
    slow: type.slow || 1,
    slowDuration: type.slowDuration || 0,
  });
  msgEl.textContent = `${type.label} tower deployed.`;
  syncHud();
}

function findTarget(tower) {
  return enemies
    .filter((enemy) => !enemy.dead)
    .sort((a, b) => b.distance - a.distance)
    .find((enemy) => {
      const position = pointOnPath(enemy.distance);
      return Math.hypot(position.x - tower.x, position.y - tower.y) <= tower.range;
    });
}

function createImpact(x, y, color, count = 5) {
  for (let index = 0; index < count; index += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 78,
      vy: (Math.random() - 0.5) * 78,
      life: 0.35,
      maxLife: 0.35,
      color,
    });
  }
}

function damageEnemy(enemy, rawDamage, tower) {
  const armorPierce = tower.type === "beam" ? 0.65 : 0.25;
  const armorBlock = enemy.armor * (1 - armorPierce);
  enemy.hp -= Math.max(1, Math.round(rawDamage - armorBlock));

  if (tower.type === "frost") {
    enemy.slowFactor = tower.slow;
    enemy.slowTimer = tower.slowDuration;
  }

  if (enemy.hp <= 0 && !enemy.dead) {
    enemy.dead = true;
    kills += 1;
    gold += enemy.bounty;
    const impactPoint = pointOnPath(enemy.distance);
    createImpact(impactPoint.x, impactPoint.y, enemy.color, 8);
    syncHud();
  }
}

function updateTowers(dt) {
  for (const tower of towers) {
    tower.cooldown -= dt;
    tower.flash = Math.max(0, tower.flash - dt);
    if (tower.cooldown > 0) {
      continue;
    }
    const target = findTarget(tower);

    if (!target) {
      tower.targetPoint = null;
      continue;
    }

    const targetPoint = pointOnPath(target.distance);
    tower.targetPoint = targetPoint;
    shots.push({
      fromX: tower.x,
      fromY: tower.y,
      toX: targetPoint.x,
      toY: targetPoint.y,
      life: 0.12,
      maxLife: 0.12,
      color: tower.color,
      width: tower.type === "beam" ? 4 : 2,
    });
    damageEnemy(target, tower.damage, tower);
    tower.cooldown = tower.fireRate;
    tower.flash = 0.14;
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
    if (enemy.slowTimer <= 0) {
      enemy.slowFactor = 1;
    }
    enemy.distance += enemy.speed * enemy.slowFactor * dt;
    if (enemy.distance >= pathLength) {
      enemy.dead = true;
      baseHp = Math.max(0, baseHp - (enemy.type === "brute" ? 2 : 1));
      syncHud();
      if (baseHp <= 0) {
        setPhase("game-over");
        msgEl.textContent = `The base fell after ${kills} takedowns. Restart to defend it again.`;
        return;
      }
    }
  }
  enemies = enemies.filter((enemy) => !enemy.dead);
  syncHud();
}

function updateEffects(dt) {
  shots = shots
    .map((shot) => ({ ...shot, life: shot.life - dt }))
    .filter((shot) => shot.life > 0);
  particles = particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * dt,
      y: particle.y + particle.vy * dt,
      life: particle.life - dt,
    }))
    .filter((particle) => particle.life > 0);
}

function update(dt) {
  updateEffects(dt);

  if (phase !== "battle") {
    return;
  }

  spawnTimer -= dt;
  if (spawnQueue.length > 0 && spawnTimer <= 0) {
    spawnEnemy(spawnQueue.shift());
    spawnTimer = Math.max(0.24, 0.68 - wave * 0.035);
    syncHud();
  }

  updateEnemies(dt);
  if (phase === "game-over") {
    return;
  }
  updateTowers(dt);

  if (spawnQueue.length === 0 && enemies.length === 0) {
    completeWave();
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#1f4b3f");
  gradient.addColorStop(0.58, "#132522");
  gradient.addColorStop(1, "#070a0f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(250, 204, 21, 0.07)";
  ctx.lineWidth = 1;
  for (let x = 36; x < WIDTH; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 140, HEIGHT);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(250, 204, 21, 0.16)";
  ctx.fillRect(WIDTH - 52, 342, 34, 80);
  ctx.fillStyle = "rgba(251, 113, 133, 0.22)";
  ctx.fillRect(WIDTH - 44, 352, 18, 58);
}

function drawRoad() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 38;
  ctx.strokeStyle = "#3f4a3f";
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (const point of pathPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  ctx.lineWidth = 24;
  ctx.strokeStyle = "#7a7060";
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (const point of pathPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.46)";
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (const point of pathPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
}

function drawTowers() {
  for (const tower of towers) {
    if (tower.flash > 0) {
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(125, 211, 252, 0.18)";
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(2, 8, 23, 0.45)";
    ctx.beginPath();
    ctx.ellipse(tower.x, tower.y + 14, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = tower.color;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 14, 0, Math.PI * 2);
    ctx.fill();

    if (tower.targetPoint) {
      const angle = Math.atan2(tower.targetPoint.y - tower.y, tower.targetPoint.x - tower.x);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(tower.x, tower.y);
      ctx.lineTo(tower.x + Math.cos(angle) * 25, tower.y + Math.sin(angle) * 25);
      ctx.stroke();
      ctx.strokeStyle = tower.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tower.x, tower.y);
      ctx.lineTo(tower.x + Math.cos(angle) * 23, tower.y + Math.sin(angle) * 23);
      ctx.stroke();
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 11px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(String(tower.level), tower.x, tower.y + 4);
  }
}

function drawShots() {
  for (const shot of shots) {
    const alpha = Math.max(0, shot.life / shot.maxLife);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = shot.color;
    ctx.lineWidth = shot.width;
    ctx.beginPath();
    ctx.moveTo(shot.fromX, shot.fromY);
    ctx.lineTo(shot.toX, shot.toY);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawRoundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function drawEnemies() {
  for (const enemy of enemies) {
    const point = pointOnPath(enemy.distance);
    const half = enemy.size / 2;

    ctx.fillStyle = "rgba(2, 8, 23, 0.38)";
    ctx.beginPath();
    ctx.ellipse(point.x, point.y + half, half, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.color;
    if (enemy.type === "scout") {
      ctx.beginPath();
      ctx.moveTo(point.x + half, point.y);
      ctx.lineTo(point.x - half * 0.75, point.y - half);
      ctx.lineTo(point.x - half * 0.75, point.y + half);
      ctx.closePath();
      ctx.fill();
    } else if (enemy.type === "brute") {
      ctx.beginPath();
      drawRoundedRect(point.x - half, point.y - half, enemy.size, enemy.size, 6);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(point.x, point.y, half, 0, Math.PI * 2);
      ctx.fill();
    }

    if (enemy.armor > 0) {
      ctx.strokeStyle = "rgba(248, 250, 252, 0.74)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(point.x, point.y, half + 4, -0.8, 1.2);
      ctx.stroke();
    }

    if (enemy.slowTimer > 0) {
      ctx.strokeStyle = "rgba(103, 232, 249, 0.76)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(point.x, point.y, half + 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.fillRect(point.x - 16, point.y - half - 12, 32, 5);
    ctx.fillStyle = enemy.hp / enemy.maxHp < 0.35 ? "#fb7185" : "#34d399";
    ctx.fillRect(point.x - 16, point.y - half - 12, Math.max(0, (32 * enemy.hp) / enemy.maxHp), 5);
  }
}

function drawParticles() {
  for (const particle of particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3 + alpha * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlacementPreview() {
  if (!mousePoint || phase !== "build") {
    return;
  }

  const existingTower = findTowerAt(mousePoint);
  const type = towerTypes[selectedType];
  const valid = existingTower || canPlaceTower(mousePoint);

  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = valid ? "rgba(52, 211, 153, 0.58)" : "rgba(251, 113, 133, 0.7)";
  ctx.fillStyle = valid ? "rgba(52, 211, 153, 0.08)" : "rgba(251, 113, 133, 0.08)";
  ctx.beginPath();
  ctx.arc(mousePoint.x, mousePoint.y, existingTower ? existingTower.range : type.range, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = existingTower ? existingTower.color : type.color;
  ctx.beginPath();
  ctx.arc(mousePoint.x, mousePoint.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawWaveMeter() {
  const total = currentWaveSize();
  const remaining = phase === "battle" ? enemies.length + spawnQueue.length : 0;
  const complete = phase === "battle" && total > 0 ? 1 - remaining / total : 0;
  ctx.fillStyle = "rgba(2, 8, 23, 0.5)";
  ctx.fillRect(24, 24, 212, 12);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(24, 24, 212 * Math.max(0, Math.min(1, complete)), 12);
  ctx.strokeStyle = "rgba(248, 250, 252, 0.42)";
  ctx.strokeRect(24, 24, 212, 12);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 12px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText(`Wave ${wave}`, 24, 52);
}

function drawBuildZones() {
  if (phase !== "build") {
    return;
  }

  ctx.fillStyle = "rgba(52, 211, 153, 0.06)";
  ctx.fillRect(24, 42, 136, 156);
  ctx.fillRect(604, 174, 246, 138);
  ctx.fillRect(264, 304, 186, 148);
  ctx.strokeStyle = "rgba(52, 211, 153, 0.14)";
  ctx.strokeRect(24, 42, 136, 156);
  ctx.strokeRect(604, 174, 246, 138);
  ctx.strokeRect(264, 304, 186, 148);
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
  drawBuildZones();
  drawRoad();
  drawPlacementPreview();
  drawShots();
  drawTowers();
  drawEnemies();
  drawParticles();
  drawWaveMeter();
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
    msgEl.textContent = `${towerTypes[selectedType].label} selected. ${towerTypes[selectedType].detail}`;
  });
});

canvas.addEventListener("pointerdown", (event) => {
  mousePoint = canvasPointFromEvent(event);
  placeOrUpgradeTower(mousePoint);
});

canvas.addEventListener("pointermove", (event) => {
  mousePoint = canvasPointFromEvent(event);
});

canvas.addEventListener("pointerleave", () => {
  mousePoint = null;
});

buildPathData();
resetGame();
createEntryMenu({
  title: "Tower Defense Mini",
  kicker: "Lane Defense",
  description: "Start with a clean map, choose a tower plan, and hold the road through an escalating set of waves.",
  tutorial: [
    "Pick a tower type, then tap the field to place it away from the road.",
    "Pulse towers are cheaper and faster, while Beam towers hit harder from farther away.",
    "Between waves, tap an existing tower to upgrade it if you have enough gold.",
    "Protect the base through all waves. If enemies reach the end, your base HP drops.",
  ],
  onStart: resetGame,
});
requestAnimationFrame(frame);
