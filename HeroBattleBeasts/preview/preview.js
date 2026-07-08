import { GameRuntime } from '../assets/scripts/runtime/GameRuntime.js';
import { normalizeKeyboardInput } from '../assets/scripts/runtime/InputAdapter.js';

export function createPreviewInputState() {
  return {
    activeCodes: new Set()
  };
}

export function createPreviewRuntime() {
  return new GameRuntime({
    levelConfig: {
      id: 'level-001',
      objective: { type: 'defeatEnemiesAndReachExit', requiredDefeats: 3 },
      playerSpawn: { x: 120, y: 480 },
      physics: {
        gravity: 1400,
        maxFallSpeed: 900,
        playerBounds: { width: 32, height: 48 }
      },
      combat: {
        bulletBounds: { width: 18, height: 12 },
        enemyBounds: { width: 48, height: 48 },
        pickupBounds: { width: 32, height: 32 },
        bulletLifetimeSeconds: 1.2
      },
      platforms: [
        { id: 'ground', x: 0, y: 480, width: 2100, height: 90 },
        { id: 'bridge-left', x: 360, y: 410, width: 260, height: 28 },
        { id: 'tree-root-mid', x: 800, y: 320, width: 300, height: 28 },
        { id: 'bridge-right', x: 1240, y: 430, width: 320, height: 28 }
      ],
      enemies: [
        { id: 'slime-a', enemyId: 'forest-slime', x: 520, y: 420 },
        { id: 'slime-b', enemyId: 'forest-slime', x: 940, y: 330 },
        { id: 'slime-c', enemyId: 'forest-slime', x: 1450, y: 430 }
      ],
      pickups: [
        { id: 'coin-a', type: 'coin', x: 420, y: 370, value: 1 },
        { id: 'coin-b', type: 'coin', x: 840, y: 280, value: 1 },
        { id: 'boost-a', type: 'weaponBoost', x: 1280, y: 380, weaponId: 'starter-blaster' }
      ],
      exit: { x: 1830, y: 360, width: 90, height: 130 }
    },
    playerConfig: {
      id: 'hero-ranger',
      maxHealth: 5,
      moveSpeed: 260,
      jumpVelocity: 620,
      invulnerableSecondsAfterHit: 1,
      startWeaponId: 'starter-blaster'
    },
    weaponConfig: {
      id: 'starter-blaster',
      damage: 1,
      bulletSpeed: 720,
      fireCooldownSeconds: 0.22,
      boostedFireCooldownSeconds: 0.11,
      boostDurationSeconds: 8
    },
    enemyConfig: {
      id: 'forest-slime',
      maxHealth: 2,
      contactDamage: 1,
      moveSpeed: 90,
      patrolDistance: 160,
      score: 100
    }
  });
}

function startPreview() {
  const canvas = document.querySelector('#gameCanvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const context = canvas.getContext('2d');
  const runtime = createPreviewRuntime();
  const inputState = createPreviewInputState();
  let lastFrameAt = performance.now();

  window.addEventListener('keydown', (event) => {
    inputState.activeCodes.add(event.code);
    if (event.code === 'KeyR') {
      runtime.restart();
      inputState.activeCodes.clear();
    }
  });
  window.addEventListener('keyup', (event) => inputState.activeCodes.delete(event.code));

  const tick = (now) => {
    const deltaSeconds = Math.min(0.033, (now - lastFrameAt) / 1000);
    lastFrameAt = now;

    const command = normalizeKeyboardInput(inputState.activeCodes);
    runtime.step(command, deltaSeconds);
    drawPreview(context, runtime.getViewModel(), runtime.getState(), canvas);

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function drawPreview(context, view, state, canvas) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(context, canvas);

  const cameraX = Math.max(0, view.player.position.x - 240);
  const toScreen = (position) => ({
    x: position.x - cameraX,
    y: position.y
  });

  drawPlatforms(context, state.platforms, cameraX);
  drawExit(context, view.exit, cameraX);

  for (const pickup of view.pickups) {
    if (!pickup.collected) {
      drawPickup(context, toScreen(pickup.position), pickup.type);
    }
  }

  for (const enemy of view.enemies) {
    if (!enemy.defeated) {
      drawEnemy(context, toScreen(enemy.position), enemy.health / enemy.maxHealth);
    }
  }

  for (const bullet of view.bullets) {
    drawBullet(context, toScreen(bullet.position));
  }

  drawPlayer(context, toScreen(view.player.position), view.player.facing, view.player.grounded);
  drawHud(context, view);
}

function drawBackground(context, canvas) {
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#8fd7ff');
  gradient.addColorStop(0.58, '#c9f2ff');
  gradient.addColorStop(1, '#7ac45a');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#ffffff';
  for (const cloud of [
    [120, 90, 70],
    [420, 70, 48],
    [760, 110, 64]
  ]) {
    drawCloud(context, cloud[0], cloud[1], cloud[2]);
  }
}

function drawCloud(context, x, y, size) {
  context.beginPath();
  context.arc(x, y, size * 0.42, 0, Math.PI * 2);
  context.arc(x + size * 0.35, y - size * 0.18, size * 0.34, 0, Math.PI * 2);
  context.arc(x + size * 0.72, y, size * 0.42, 0, Math.PI * 2);
  context.fill();
}

function drawPlatforms(context, platforms, cameraX) {
  for (const platform of platforms) {
    const x = platform.x - cameraX;
    context.fillStyle = '#5e8d42';
    context.fillRect(x, platform.y, platform.width, platform.height);
    context.fillStyle = '#80c65a';
    context.fillRect(x, platform.y, platform.width, 12);
  }
}

function drawExit(context, exit, cameraX) {
  const x = exit.x - cameraX;
  context.fillStyle = '#4b2f7f';
  context.fillRect(x, exit.y, exit.width, exit.height);
  context.fillStyle = '#ffd15c';
  context.fillRect(x + 16, exit.y + 18, exit.width - 32, exit.height - 36);
}

function drawPlayer(context, position, facing, grounded) {
  context.save();
  context.translate(position.x, position.y);
  context.scale(facing, 1);
  context.fillStyle = grounded ? '#ff6f61' : '#ff9f43';
  context.fillRect(-18, -44, 36, 44);
  context.fillStyle = '#ffe0a6';
  context.beginPath();
  context.arc(0, -58, 18, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#2d3b55';
  context.fillRect(10, -34, 34, 10);
  context.restore();
}

function drawEnemy(context, position, healthRatio) {
  context.fillStyle = '#6cc36c';
  context.beginPath();
  context.arc(position.x, position.y - 22, 26, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#24364f';
  context.fillRect(position.x - 18, position.y - 60, 36, 5);
  context.fillStyle = '#ff5c5c';
  context.fillRect(position.x - 18, position.y - 60, 36 * healthRatio, 5);
}

function drawBullet(context, position) {
  context.fillStyle = '#ffe45c';
  context.beginPath();
  context.arc(position.x, position.y - 24, 6, 0, Math.PI * 2);
  context.fill();
}

function drawPickup(context, position, type) {
  context.fillStyle = type === 'weaponBoost' ? '#7b61ff' : '#ffd15c';
  context.beginPath();
  context.arc(position.x, position.y - 18, 12, 0, Math.PI * 2);
  context.fill();
}

function drawHud(context, view) {
  context.fillStyle = 'rgba(24, 40, 57, 0.86)';
  context.fillRect(16, 16, 430, 42);
  context.fillStyle = '#ffffff';
  context.font = '18px Microsoft YaHei, sans-serif';
  context.fillText(
    `生命 ${view.hud.healthText}  金币 ${view.hud.coinText}  目标 ${view.hud.objectiveText}  武器 ${view.hud.weaponText}`,
    28,
    43
  );

  if (view.result) {
    context.fillStyle = 'rgba(24, 40, 57, 0.72)';
    context.fillRect(0, 0, 960, 540);
    context.fillStyle = '#ffffff';
    context.font = '42px Microsoft YaHei, sans-serif';
    context.fillText(view.result.title, 380, 230);
    context.font = '20px Microsoft YaHei, sans-serif';
    context.fillText(
      `分数 ${view.result.score}  金币 ${view.result.coins}  击败 ${view.result.defeatedEnemies}  用时 ${view.result.elapsedSeconds}s`,
      260,
      278
    );
    context.fillText('按 R 重新开始', 410, 318);
  }
}

if (typeof window !== 'undefined') {
  startPreview();
}
