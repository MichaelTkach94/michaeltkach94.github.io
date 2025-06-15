// Advanced browser mining game implementing multiple features

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = 20;
const HEIGHT = 200; // deeper world
const BLOCK_SIZE = 30;
const VIEW_HEIGHT = 20; // number of blocks tall visible

canvas.width = WIDTH * BLOCK_SIZE;
canvas.height = VIEW_HEIGHT * BLOCK_SIZE;

let offsetY = 0;

const BLOCK = {
  EMPTY: 0,
  DIRT: 1,
  ORE1: 2,
  ORE2: 3,
  ORE3: 4,
  ARTIFACT: 5,
  SHAFT: 6,
};

const ORE_VALUES = {
  [BLOCK.ORE1]: 10,
  [BLOCK.ORE2]: 25,
  [BLOCK.ORE3]: 50,
  [BLOCK.ARTIFACT]: 200,
};

// world generation
const world = [];
for (let y = 0; y < HEIGHT; y++) {
  const row = [];
  for (let x = 0; x < WIDTH; x++) {
    if (y === 0) {
      row.push(BLOCK.EMPTY);
    } else {
      let type = BLOCK.DIRT;
      if (y > 100 && Math.random() < 0.02) type = BLOCK.ARTIFACT;
      else if (y > 80 && Math.random() < 0.05) type = BLOCK.ORE3;
      else if (y > 40 && Math.random() < 0.08) type = BLOCK.ORE2;
      else if (Math.random() < 0.15) type = BLOCK.ORE1;
      row.push(type);
    }
  }
  world.push(row);
}

const shafts = [];
for (let d = 40; d < HEIGHT; d += 40) {
  const x = Math.floor(Math.random() * WIDTH);
  world[d][x] = BLOCK.SHAFT;
  shafts.push({x, y: d, pipe: false});
}

const player = {
  id: Math.random().toString(36).slice(2, 8),
  x: Math.floor(WIDTH / 2),
  y: 0,
  vx: 0,
  vy: 0,
  speed: 1,
  drillPower: 1,
  teleportRange: 20,
  cargo: 0,
  oreCargo: 0,
  cargoLimit: 20,
  oreLimit: 10,
  credits: 0,
  returning: false,
};

const otherPlayers = {};

const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// multiplayer sync using localStorage events
function broadcastState() {
  localStorage.setItem('player_' + player.id, JSON.stringify({x: player.x, y: player.y}));
}

window.addEventListener('storage', e => {
  if (e.key && e.key.startsWith('player_') && e.key !== 'player_' + player.id) {
    const id = e.key.slice(7);
    if (e.newValue) {
      otherPlayers[id] = JSON.parse(e.newValue);
    } else {
      delete otherPlayers[id];
    }
  }
});

setInterval(() => broadcastState(), 100);

function update() {
  if (!player.returning) handleInput();
  movePlayer();
  cameraFollow();
  gainPassiveIncome();
}

function handleInput() {
  if (keys['ArrowLeft'] || keys['a']) player.vx = -player.speed; else if (keys['ArrowRight'] || keys['d']) player.vx = player.speed; else player.vx = 0;

  if (keys['ArrowUp'] || keys['w']) player.vy = -player.speed; else if (keys['ArrowDown'] || keys['s']) {
    drill(player.x, player.y + 1);
    player.vy = player.speed;
  } else player.vy = 0;

  if (keys['p']) {
    buildPipe();
    keys['p'] = false;
  }
  if (keys['t']) {
    teleport();
    keys['t'] = false;
  }
}

function drill(x, y) {
  if (y >= HEIGHT) return;
  const type = world[y][x];
  if (type === BLOCK.EMPTY || type === BLOCK.SHAFT) return;
  if (type > BLOCK.DIRT && player.drillPower < type - 1) {
    message('Need stronger drill');
    return;
  }
  if (type === BLOCK.DIRT) {
    if (player.cargo < player.cargoLimit) {
      player.cargo++;
      world[y][x] = BLOCK.EMPTY;
    }
  } else {
    if (player.oreCargo < player.oreLimit) {
      player.oreCargo++;
      world[y][x] = BLOCK.EMPTY;
    }
  }
}

function movePlayer() {
  player.x += player.vx;
  player.y += player.vy;
  if (player.x < 0) player.x = 0;
  if (player.x >= WIDTH) player.x = WIDTH - 1;
  if (player.y < 0) player.y = 0;
  if (player.y >= HEIGHT) player.y = HEIGHT - 1;

  if (player.cargo >= player.cargoLimit || player.oreCargo >= player.oreLimit) player.returning = true;

  if (player.returning) {
    player.vx = 0;
    player.vy = -player.speed;
    if (player.y === 0) {
      sellCargo();
      player.returning = false;
    }
  }
}

function sellCargo() {
  let value = 0;
  value += player.cargo; // dirt worth 1
  value += player.oreCargo * 10;
  player.cargo = 0;
  player.oreCargo = 0;
  player.credits += value;
  message('Sold cargo for ' + value + ' credits');
  updateStats();
  checkQuestCompletion();
}

function buildPipe() {
  const shaft = shafts.find(s => s.x === player.x && s.y === player.y);
  if (!shaft || shaft.pipe) return;
  const cost = 100;
  if (player.credits >= cost) {
    player.credits -= cost;
    shaft.pipe = true;
    message('Pipe built. Passive income increased');
    updateStats();
  } else {
    message('Not enough credits');
  }
}

function gainPassiveIncome() {
  if (!gainPassiveIncome.counter) gainPassiveIncome.counter = 0;
  gainPassiveIncome.counter++;
  if (gainPassiveIncome.counter >= 60) {
    gainPassiveIncome.counter = 0;
    const pipes = shafts.filter(s => s.pipe).length;
    player.credits += pipes;
    if (pipes) updateStats();
  }
}

function teleport() {
  if (player.y === 0) return; // only from underground
  const target = Math.max(0, player.y - player.teleportRange);
  player.y = target;
  cameraFollow();
}

function cameraFollow() {
  offsetY = player.y * BLOCK_SIZE - canvas.height / 2;
  if (offsetY < 0) offsetY = 0;
  const maxOffset = HEIGHT * BLOCK_SIZE - canvas.height;
  if (offsetY > maxOffset) offsetY = maxOffset;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const type = world[y][x];
      if (type !== BLOCK.EMPTY) {
        ctx.fillStyle = getColor(type);
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE - offsetY, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }

  // pipes
  shafts.forEach(s => {
    if (s.pipe) {
      ctx.fillStyle = '#0aa';
      ctx.fillRect(s.x * BLOCK_SIZE + BLOCK_SIZE/4, s.y * BLOCK_SIZE - offsetY, BLOCK_SIZE/2, BLOCK_SIZE);
    }
  });

  // other players
  Object.keys(otherPlayers).forEach(id => {
    const p = otherPlayers[id];
    ctx.fillStyle = '#ff0';
    ctx.fillRect(p.x * BLOCK_SIZE, p.y * BLOCK_SIZE - offsetY, BLOCK_SIZE, BLOCK_SIZE);
  });

  // player
  ctx.fillStyle = '#0f0';
  ctx.fillRect(player.x * BLOCK_SIZE, player.y * BLOCK_SIZE - offsetY, BLOCK_SIZE, BLOCK_SIZE);
}

function getColor(type) {
  switch(type){
    case BLOCK.DIRT: return '#764c24';
    case BLOCK.ORE1: return '#886';
    case BLOCK.ORE2: return '#c97';
    case BLOCK.ORE3: return '#fd0';
    case BLOCK.ARTIFACT: return '#0ff';
    case BLOCK.SHAFT: return '#444';
    default: return '#000';
  }
}

// simple quest
const quest = {
  goal: { ore2: 5 },
  progress: { ore2: 0 },
  reward: 200,
  completed: false,
};

function checkQuestCompletion() {
  if (quest.completed) return;
  if (quest.progress.ore2 >= quest.goal.ore2) {
    quest.completed = true;
    player.credits += quest.reward;
    message('Quest complete! Reward ' + quest.reward);
    updateStats();
  }
}

function updateStats() {
  const pipes = shafts.filter(s => s.pipe).length;
  document.getElementById('stats').innerText =
    `Cargo: ${player.cargo}/${player.cargoLimit} | Ore: ${player.oreCargo}/${player.oreLimit} | Credits: ${player.credits} | Pipes: ${pipes}`;
}

function message(text) {
  document.getElementById('message').innerText = text;
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// upgrade system
const upgrades = [
  {name:'Cargo Space', cost:50, apply:()=>player.cargoLimit+=10},
  {name:'Ore Hold', cost:100, apply:()=>player.oreLimit+=5},
  {name:'Drill Power', cost:200, apply:()=>player.drillPower++},
  {name:'Flight Speed', cost:150, apply:()=>player.speed+=0.5},
  {name:'Teleport Range', cost:300, apply:()=>player.teleportRange+=20},
];

function showUpgrades(){
  const list = document.getElementById('upgradeList');
  list.innerHTML='';
  upgrades.forEach((u,i)=>{
    const btn = document.createElement('button');
    btn.innerText = `${u.name} (${u.cost})`;
    btn.onclick=()=>buyUpgrade(i);
    list.appendChild(btn);
    list.appendChild(document.createElement('br'));
  });
  document.getElementById('upgradeMenu').classList.remove('hidden');
}

function buyUpgrade(i){
  const up = upgrades[i];
  if(player.credits>=up.cost){
    player.credits-=up.cost;
    up.apply();
    up.cost=Math.floor(up.cost*1.5);
    updateStats();
    message('Upgraded '+up.name);
    showUpgrades();
  }else{
    message('Not enough credits');
  }
}

document.getElementById('upgradeBtn').onclick=showUpgrades;
document.getElementById('closeUpgrades').onclick=()=>document.getElementById('upgradeMenu').classList.add('hidden');

// track quest progress when selling
if(!localStorage.getItem('quest_shown')){
  message('Quest: deliver 5 gold ore (ORE2)');
  localStorage.setItem('quest_shown','1');
}

function trackQuest() {
  quest.progress.ore2 += player.oreCargo;
}

function init(){
  updateStats();
  gameLoop();
}

sellCargo = (function(orig){
  return function(){
    trackQuest();
    orig();
  };
})(sellCargo);

init();
