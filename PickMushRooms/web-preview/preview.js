const levelUrl = '../assets/resources/levels/level-001.json';
const art = {
  branch: '../assets/resources/art/placeholder/branch-pile.png',
  thatch: '../assets/resources/art/placeholder/thatch-pile.png',
  mushroom: '../assets/resources/art/placeholder/mushroom.png'
};

const app = document.querySelector('#app');
const playfield = document.querySelector('[data-testid="playfield"]');
const progress = document.querySelector('[data-testid="progress"]');
const completePanel = document.querySelector('[data-testid="complete-panel"]');
const replayButton = document.querySelector('[data-testid="replay-button"]');

let level;
let state;

function toScreenPosition(x, y) {
  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(56% + ${-y}px)`
  };
}

function createInitialState(sourceLevel) {
  return {
    pickedCount: 0,
    completed: false,
    piles: sourceLevel.piles.map((pile) => ({
      ...pile,
      remainingLayers: [...pile.layers]
    })),
    pickedMushrooms: new Set()
  };
}

function getPile(pileId) {
  return state.piles.find((pile) => pile.id === pileId);
}

function isMushroomVisible(item) {
  return getPile(item.pileId).remainingLayers.length === 0;
}

function updateHud() {
  progress.textContent = `${state.pickedCount}/${level.targetCount}`;
  completePanel.classList.toggle('visible', state.completed);
}

function showFeedback(text, x, y) {
  const node = document.createElement('div');
  node.className = 'feedback';
  node.textContent = text;
  Object.assign(node.style, toScreenPosition(x, y));
  app.append(node);
  node.addEventListener('animationend', () => node.remove(), { once: true });
}

function render() {
  playfield.textContent = '';

  for (const pile of state.piles) {
    if (pile.remainingLayers.length === 0) {
      continue;
    }

    const topLayer = pile.remainingLayers[0];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pile';
    button.dataset.testid = `pile-${pile.id}`;
    button.ariaLabel = `${topLayer.label} ${pile.remainingLayers.length}`;
    Object.assign(button.style, toScreenPosition(pile.x, pile.y));

    const image = document.createElement('img');
    image.alt = topLayer.label;
    image.src = art[topLayer.kind] ?? art.thatch;

    const count = document.createElement('span');
    count.className = 'pile-count';
    count.textContent = String(pile.remainingLayers.length);

    button.append(image, count);
    button.addEventListener('click', () => {
      pile.remainingLayers.shift();
      showFeedback('-1', pile.x, pile.y + 52);
      render();
    });
    playfield.append(button);
  }

  for (const item of level.items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mushroom';
    button.dataset.testid = `mushroom-${item.id}`;
    button.ariaLabel = item.id;
    Object.assign(button.style, toScreenPosition(item.x, item.y));

    const image = document.createElement('img');
    image.alt = '菌子';
    image.src = art.mushroom;
    button.append(image);

    if (isMushroomVisible(item)) {
      button.classList.add('visible');
    }
    if (state.pickedMushrooms.has(item.id)) {
      button.classList.add('picked');
    }

    button.addEventListener('click', () => {
      if (!isMushroomVisible(item) || state.pickedMushrooms.has(item.id) || state.completed) {
        return;
      }

      state.pickedMushrooms.add(item.id);
      state.pickedCount += 1;
      state.completed = state.pickedCount >= level.targetCount;
      showFeedback('+1', item.x, item.y + 34);
      render();
    });

    playfield.append(button);
  }

  updateHud();
}

function restart() {
  state = createInitialState(level);
  render();
}

async function boot() {
  const response = await fetch(levelUrl);
  level = await response.json();
  restart();
}

replayButton.addEventListener('click', restart);
boot().catch((error) => {
  progress.textContent = '加载失败';
  console.error(error);
});
