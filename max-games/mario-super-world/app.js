// Mario Super World - A platformer for Max
// 50 levels, wing power-ups, beat Bowser!

(function() {
  'use strict';

  const DESIGN_ID = 'ds_db396dea-b340-4c5b-86e3-c59bff2f3ba0';
  const TOTAL_LEVELS = 50;

  // Game state
  const state = {
    level: 1,
    lives: 3,
    maxLives: 3,
    playing: false,
    paused: false,
    startTime: 0,
    hasWings: false,
    wingTimer: 0,
    marioSize: 0, // 0=baby, 1=normal, 2=super
    isBowserLevel: false,
    bowserHits: 0,
    bowserDefeated: false
  };

  // Physics
  const GRAVITY = 0.6;
  const JUMP_POWER = -14;
  const FLY_POWER = -8;
  const MOVE_SPEED = 5;
  const WING_DURATION = 300; // frames

  // Canvas setup
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let width, height;

  // Game objects
  let mario = null;
  let platforms = [];
  let blocks = []; // power-up blocks
  let flag = null;
  let enemies = [];
  let bowser = null;
  let camera = { x: 0, y: 0 };

  // Controls state
  const keys = {
    left: false,
    right: false,
    jump: false
  };

  // Touch controls
  function setupControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');

    function handleStart(key) {
      return (e) => {
        e.preventDefault();
        keys[key] = true;
      };
    }

    function handleEnd(key) {
      return (e) => {
        e.preventDefault();
        keys[key] = false;
      };
    }

    // Left button
    btnLeft.addEventListener('touchstart', handleStart('left'), { passive: false });
    btnLeft.addEventListener('touchend', handleEnd('left'), { passive: false });
    btnLeft.addEventListener('touchcancel', handleEnd('left'), { passive: false });
    btnLeft.addEventListener('mousedown', handleStart('left'));
    btnLeft.addEventListener('mouseup', handleEnd('left'));
    btnLeft.addEventListener('mouseleave', handleEnd('left'));

    // Right button
    btnRight.addEventListener('touchstart', handleStart('right'), { passive: false });
    btnRight.addEventListener('touchend', handleEnd('right'), { passive: false });
    btnRight.addEventListener('touchcancel', handleEnd('right'), { passive: false });
    btnRight.addEventListener('mousedown', handleStart('right'));
    btnRight.addEventListener('mouseup', handleEnd('right'));
    btnRight.addEventListener('mouseleave', handleEnd('right'));

    // Jump button
    btnJump.addEventListener('touchstart', handleStart('jump'), { passive: false });
    btnJump.addEventListener('touchend', handleEnd('jump'), { passive: false });
    btnJump.addEventListener('touchcancel', handleEnd('jump'), { passive: false });
    btnJump.addEventListener('mousedown', handleStart('jump'));
    btnJump.addEventListener('mouseup', handleEnd('jump'));
    btnJump.addEventListener('mouseleave', handleEnd('jump'));

    // Keyboard fallback
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.jump = true;
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.jump = false;
    });
  }

  // Resize canvas
  function resize() {
    const container = document.getElementById('game-container');
    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;
  }

  // Generate level
  function generateLevel(levelNum) {
    platforms = [];
    blocks = [];
    enemies = [];
    flag = null;
    bowser = null;
    state.isBowserLevel = (levelNum === TOTAL_LEVELS);
    state.bowserHits = 0;

    const difficulty = Math.min(levelNum / 10, 5); // 0-5 scale
    const levelWidth = 800 + levelNum * 40; // levels get longer
    const groundY = height - 60;

    // Ground platforms (with gaps that get wider)
    let x = 0;
    while (x < levelWidth) {
      const platformWidth = 150 + Math.random() * 200 - difficulty * 20;
      platforms.push({
        x: x,
        y: groundY,
        w: Math.max(100, platformWidth),
        h: 40,
        type: 'ground'
      });

      // Gap size increases with difficulty
      const gapSize = 60 + difficulty * 15 + Math.random() * 30;
      x += platformWidth + gapSize;
    }

    // Floating platforms
    const numFloating = 3 + Math.floor(levelNum / 5);
    for (let i = 0; i < numFloating; i++) {
      const px = 200 + i * (levelWidth / numFloating) + Math.random() * 100;
      const py = groundY - 100 - Math.random() * 150;
      platforms.push({
        x: px,
        y: py,
        w: 80 + Math.random() * 60,
        h: 20,
        type: 'floating'
      });
    }

    // Wing blocks (1-3 per level, more in harder levels)
    const numBlocks = 1 + Math.floor(levelNum / 20);
    for (let i = 0; i < numBlocks; i++) {
      const bx = 300 + i * (levelWidth / (numBlocks + 1)) + Math.random() * 100;
      const by = groundY - 150 - Math.random() * 100;
      blocks.push({
        x: bx,
        y: by,
        w: 40,
        h: 40,
        hit: false,
        type: 'wing'
      });
    }

    // Enemies (more and faster in later levels)
    if (levelNum > 3) {
      const numEnemies = Math.floor(levelNum / 5) + 1;
      for (let i = 0; i < numEnemies; i++) {
        const ex = 400 + i * 200 + Math.random() * 150;
        enemies.push({
          x: ex,
          y: groundY - 30,
          w: 30,
          h: 30,
          vx: (1 + difficulty * 0.3) * (Math.random() > 0.5 ? 1 : -1),
          startX: ex - 80,
          endX: ex + 80,
          alive: true
        });
      }
    }

    // Flag at the end
    flag = {
      x: levelWidth - 50,
      y: groundY - 150,
      w: 20,
      h: 150,
      poleH: 150
    };

    // Bowser on final level
    if (state.isBowserLevel) {
      bowser = {
        x: levelWidth - 200,
        y: groundY - 80,
        w: 80,
        h: 80,
        vx: 2,
        startX: levelWidth - 350,
        endX: levelWidth - 100,
        hp: 3,
        hit: false,
        hitTimer: 0
      };
      // Remove the flag for Bowser level
      flag = null;
    }

    // Mario start position
    mario = {
      x: 50,
      y: groundY - 60,
      w: 30 + state.marioSize * 5,
      h: 40 + state.marioSize * 10,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 1
    };

    camera.x = 0;
    state.hasWings = false;
    state.wingTimer = 0;
  }

  // Update HUD
  function updateHUD() {
    document.getElementById('level-display').textContent = `Level ${state.level}`;

    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((h, i) => {
      h.classList.toggle('lost', i >= state.lives);
    });

    let powerText = '';
    if (state.hasWings) powerText = '🪽';
    else if (state.marioSize === 2) powerText = '⭐';
    else if (state.marioSize === 1) powerText = '🍄';
    document.getElementById('power-display').textContent = powerText;
  }

  // Physics update
  function update() {
    if (!state.playing || state.paused) return;

    // Wing timer
    if (state.hasWings) {
      state.wingTimer--;
      if (state.wingTimer <= 0) {
        state.hasWings = false;
      }
    }

    // Mario movement
    mario.vx = 0;
    if (keys.left) {
      mario.vx = -MOVE_SPEED;
      mario.facing = -1;
    }
    if (keys.right) {
      mario.vx = MOVE_SPEED;
      mario.facing = 1;
    }

    // Jumping / Flying
    if (keys.jump) {
      if (state.hasWings) {
        // Flying - can keep going up while holding
        mario.vy = FLY_POWER;
      } else if (mario.grounded) {
        mario.vy = JUMP_POWER;
        mario.grounded = false;
      }
    }

    // Gravity
    if (!state.hasWings || !keys.jump) {
      mario.vy += GRAVITY;
    }
    mario.vy = Math.min(mario.vy, 15); // terminal velocity

    // Move Mario
    mario.x += mario.vx;
    mario.y += mario.vy;

    // Keep Mario in bounds (left side)
    if (mario.x < 0) mario.x = 0;

    // Platform collisions
    mario.grounded = false;
    for (const p of platforms) {
      if (rectCollide(mario, p)) {
        // Landing on top
        if (mario.vy > 0 && mario.y + mario.h - mario.vy <= p.y + 5) {
          mario.y = p.y - mario.h;
          mario.vy = 0;
          mario.grounded = true;
        }
        // Hitting from side or bottom - push out
        else if (mario.vy <= 0) {
          // Hitting from below
          if (mario.y < p.y + p.h) {
            mario.y = p.y + p.h;
            mario.vy = 0;
          }
        }
      }
    }

    // Block collisions
    for (const b of blocks) {
      if (!b.hit && rectCollide(mario, b)) {
        // Hit from below
        if (mario.vy < 0 && mario.y > b.y) {
          b.hit = true;
          if (b.type === 'wing') {
            state.hasWings = true;
            state.wingTimer = WING_DURATION;
          }
          mario.vy = 0;
        }
      }
    }

    // Enemy collisions
    for (const e of enemies) {
      if (e.alive) {
        // Move enemy
        e.x += e.vx;
        if (e.x <= e.startX || e.x >= e.endX) {
          e.vx *= -1;
        }

        // Check collision with Mario
        if (rectCollide(mario, e)) {
          // Jumping on enemy
          if (mario.vy > 0 && mario.y + mario.h - 10 < e.y + e.h / 2) {
            e.alive = false;
            mario.vy = JUMP_POWER / 2; // bounce
          } else {
            // Mario got hit
            hitMario();
          }
        }
      }
    }

    // Bowser logic
    if (bowser && bowser.hp > 0) {
      // Move Bowser
      bowser.x += bowser.vx;
      if (bowser.x <= bowser.startX || bowser.x >= bowser.endX) {
        bowser.vx *= -1;
      }

      // Hit timer
      if (bowser.hitTimer > 0) bowser.hitTimer--;

      // Check collision with Mario
      if (rectCollide(mario, bowser)) {
        // Jumping on Bowser
        if (mario.vy > 0 && mario.y + mario.h - 10 < bowser.y + bowser.h / 2 && bowser.hitTimer === 0) {
          bowser.hp--;
          bowser.hitTimer = 60;
          state.bowserHits++;
          mario.vy = JUMP_POWER; // big bounce
          if (bowser.hp <= 0) {
            state.bowserDefeated = true;
            winGame();
          }
        } else if (bowser.hitTimer === 0) {
          // Mario got hit by Bowser
          hitMario();
        }
      }
    }

    // Flag collision (level complete)
    if (flag && rectCollide(mario, { x: flag.x, y: flag.y, w: flag.w, h: flag.poleH })) {
      completeLevel();
      return;
    }

    // Fall detection - kind failure
    if (mario.y > height + 100) {
      handleFall();
    }

    // Camera follow
    const targetX = mario.x - width / 3;
    camera.x = Math.max(0, targetX);

    updateHUD();
  }

  // Rectangle collision
  function rectCollide(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  }

  // Mario got hit
  function hitMario() {
    if (state.marioSize > 0) {
      state.marioSize--;
      mario.w = 30 + state.marioSize * 5;
      mario.h = 40 + state.marioSize * 10;
      // Brief invincibility effect could go here
    } else {
      handleFall();
    }
  }

  // Kind failure - set back a little
  function handleFall() {
    state.lives--;
    if (state.lives <= 0) {
      // Kind failure: restore one life, restart level
      state.lives = 1;
    }
    // Restart current level
    generateLevel(state.level);
    updateHUD();
  }

  // Level complete
  function completeLevel() {
    state.playing = false;
    const seconds = Math.floor((Date.now() - state.startTime) / 1000);

    // Check if flag gives mushroom (if almost out = 1 life or small Mario)
    if (state.lives === 1 || state.marioSize === 0) {
      state.marioSize = Math.min(state.marioSize + 1, 2);
      if (state.lives < state.maxLives) {
        state.lives++;
      }
    }

    // Report to design studio
    reportPlay(true, seconds, `Completed level ${state.level}`);

    if (state.level < TOTAL_LEVELS) {
      showLevelComplete();
    } else {
      // Show Bowser intro
      showBowserScreen();
    }
  }

  // Win the game (beat Bowser)
  function winGame() {
    state.playing = false;
    const seconds = Math.floor((Date.now() - state.startTime) / 1000);
    reportPlay(true, seconds, 'Defeated Bowser and won the game!');
    showVictory();
  }

  // Show level complete overlay
  function showLevelComplete() {
    document.getElementById('complete-title').textContent = `Level ${state.level} Complete!`;
    document.getElementById('level-complete').classList.add('show');
  }

  // Show Bowser screen
  function showBowserScreen() {
    document.getElementById('bowser-screen').classList.add('show');
  }

  // Show victory screen
  function showVictory() {
    document.getElementById('victory').classList.add('show');
  }

  // Start next level
  function nextLevel() {
    document.getElementById('level-complete').classList.remove('show');
    state.level++;
    generateLevel(state.level);
    state.playing = true;
    state.startTime = Date.now();
  }

  // Start Bowser fight
  function startBowserFight() {
    document.getElementById('bowser-screen').classList.remove('show');
    generateLevel(state.level);
    state.playing = true;
    state.startTime = Date.now();
  }

  // Restart game
  function restartGame() {
    document.getElementById('victory').classList.remove('show');
    state.level = 1;
    state.lives = 3;
    state.marioSize = 0;
    state.bowserDefeated = false;
    generateLevel(1);
    state.playing = true;
    state.startTime = Date.now();
  }

  // Draw everything
  function draw() {
    // Sky background
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, width, height);

    // Draw clouds
    drawClouds();

    ctx.save();
    ctx.translate(-camera.x, 0);

    // Draw platforms
    for (const p of platforms) {
      if (p.type === 'ground') {
        // Ground - brown with grass top
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(p.x, p.y, p.w, 10);
      } else {
        // Floating platform - brick style
        ctx.fillStyle = '#cd853f';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
      }
    }

    // Draw blocks
    for (const b of blocks) {
      if (!b.hit) {
        // Wing block - gold with exclamation
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#ff8c00';
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        // Exclamation mark
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', b.x + b.w / 2, b.y + b.h / 2);
      } else {
        // Used block - gray
        ctx.fillStyle = '#999';
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }
    }

    // Draw enemies
    for (const e of enemies) {
      if (e.alive) {
        drawEnemy(e);
      }
    }

    // Draw Bowser
    if (bowser && bowser.hp > 0) {
      drawBowser();
    }

    // Draw flag
    if (flag) {
      drawFlag();
    }

    // Draw Mario
    drawMario();

    ctx.restore();

    // Draw wing indicator
    if (state.hasWings) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.beginPath();
      ctx.roundRect(width - 80, 50, 70, 30, 15);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🪽 FLY!', width - 45, 70);
    }
  }

  // Draw clouds
  function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const cloudX = ((Date.now() / 50) % (width + 200)) - 100;
    drawCloud(cloudX, 60, 60);
    drawCloud(cloudX + 200, 100, 40);
    drawCloud(cloudX + 400, 40, 50);
  }

  function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Mario
  function drawMario() {
    const m = mario;
    const size = state.marioSize;

    // Body color
    ctx.fillStyle = '#e63946';

    // Body
    ctx.beginPath();
    ctx.ellipse(m.x + m.w / 2, m.y + m.h * 0.6, m.w / 2, m.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#ffccaa';
    const headSize = m.w * 0.4 + size * 2;
    ctx.beginPath();
    ctx.arc(m.x + m.w / 2, m.y + m.h * 0.25, headSize, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.ellipse(m.x + m.w / 2, m.y + m.h * 0.15, headSize * 1.1, headSize * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // M on hat
    ctx.fillStyle = 'white';
    ctx.font = `bold ${10 + size * 2}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', m.x + m.w / 2, m.y + m.h * 0.15);

    // Eyes
    ctx.fillStyle = '#333';
    const eyeOffset = 4 * m.facing;
    ctx.beginPath();
    ctx.arc(m.x + m.w / 2 + eyeOffset - 3, m.y + m.h * 0.22, 2, 0, Math.PI * 2);
    ctx.arc(m.x + m.w / 2 + eyeOffset + 3, m.y + m.h * 0.22, 2, 0, Math.PI * 2);
    ctx.fill();

    // Mustache (bigger for bigger Mario)
    if (size > 0) {
      ctx.fillStyle = '#5c3317';
      ctx.beginPath();
      ctx.ellipse(m.x + m.w / 2, m.y + m.h * 0.32, 6 + size * 2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wings if flying
    if (state.hasWings) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const wingFlap = Math.sin(Date.now() / 50) * 10;
      // Left wing
      ctx.beginPath();
      ctx.moveTo(m.x, m.y + m.h * 0.4);
      ctx.quadraticCurveTo(m.x - 25, m.y + m.h * 0.2 + wingFlap, m.x - 5, m.y);
      ctx.quadraticCurveTo(m.x, m.y + m.h * 0.2, m.x, m.y + m.h * 0.4);
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(m.x + m.w, m.y + m.h * 0.4);
      ctx.quadraticCurveTo(m.x + m.w + 25, m.y + m.h * 0.2 + wingFlap, m.x + m.w + 5, m.y);
      ctx.quadraticCurveTo(m.x + m.w, m.y + m.h * 0.2, m.x + m.w, m.y + m.h * 0.4);
      ctx.fill();
    }
  }

  // Draw enemy (Goomba-style)
  function drawEnemy(e) {
    // Body
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h * 0.6, e.w / 2, e.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h * 0.3, e.w * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2 - 5, e.y + e.h * 0.25, 4, 0, Math.PI * 2);
    ctx.arc(e.x + e.w / 2 + 5, e.y + e.h * 0.25, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2 - 5, e.y + e.h * 0.25, 2, 0, Math.PI * 2);
    ctx.arc(e.x + e.w / 2 + 5, e.y + e.h * 0.25, 2, 0, Math.PI * 2);
    ctx.fill();

    // Frown
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h * 0.45, 6, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }

  // Draw Bowser
  function drawBowser() {
    const b = bowser;
    const flash = b.hitTimer > 0 && Math.floor(b.hitTimer / 5) % 2;

    // Shell
    ctx.fillStyle = flash ? '#fff' : '#228b22';
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h * 0.6, b.w / 2, b.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spikes on shell
    ctx.fillStyle = flash ? '#ccc' : '#ffd700';
    for (let i = 0; i < 3; i++) {
      const spikeX = b.x + b.w * 0.25 + i * b.w * 0.25;
      ctx.beginPath();
      ctx.moveTo(spikeX - 8, b.y + b.h * 0.5);
      ctx.lineTo(spikeX, b.y + b.h * 0.2);
      ctx.lineTo(spikeX + 8, b.y + b.h * 0.5);
      ctx.fill();
    }

    // Head
    ctx.fillStyle = flash ? '#fff' : '#90ee90';
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h * 0.2, b.w * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = flash ? '#ccc' : '#ffd700';
    ctx.beginPath();
    ctx.moveTo(b.x + b.w * 0.25, b.y + b.h * 0.15);
    ctx.lineTo(b.x + b.w * 0.15, b.y - 10);
    ctx.lineTo(b.x + b.w * 0.35, b.y + b.h * 0.1);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(b.x + b.w * 0.75, b.y + b.h * 0.15);
    ctx.lineTo(b.x + b.w * 0.85, b.y - 10);
    ctx.lineTo(b.x + b.w * 0.65, b.y + b.h * 0.1);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2 - 10, b.y + b.h * 0.15, 8, 0, Math.PI * 2);
    ctx.arc(b.x + b.w / 2 + 10, b.y + b.h * 0.15, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2 - 10, b.y + b.h * 0.15, 4, 0, Math.PI * 2);
    ctx.arc(b.x + b.w / 2 + 10, b.y + b.h * 0.15, 4, 0, Math.PI * 2);
    ctx.fill();

    // HP indicator
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`❤️ x${b.hp}`, b.x + b.w / 2, b.y - 20);
  }

  // Draw flag
  function drawFlag() {
    const f = flag;

    // Pole
    ctx.fillStyle = '#666';
    ctx.fillRect(f.x + f.w / 2 - 3, f.y, 6, f.poleH);

    // Ball on top
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(f.x + f.w / 2, f.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Flag
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.moveTo(f.x + f.w / 2 + 3, f.y + 5);
    ctx.lineTo(f.x + f.w / 2 + 50, f.y + 25);
    ctx.lineTo(f.x + f.w / 2 + 3, f.y + 45);
    ctx.fill();

    // Star on flag
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⭐', f.x + f.w / 2 + 25, f.y + 30);
  }

  // Report to design studio
  function reportPlay(reachedEnd, seconds, note) {
    const body = {
      action: 'play',
      designId: DESIGN_ID,
      reachedEnd,
      seconds,
      note
    };

    fetch('/api/design-studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(() => {});
  }

  // Game loop
  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  // Initialize
  function init() {
    resize();
    window.addEventListener('resize', resize);
    setupControls();

    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
      document.getElementById('splash').classList.remove('show');
      state.level = 1;
      state.lives = 3;
      state.marioSize = 0;
      generateLevel(1);
      state.playing = true;
      state.startTime = Date.now();
    });

    // Next level button
    document.getElementById('next-btn').addEventListener('click', nextLevel);

    // Fight Bowser button
    document.getElementById('fight-btn').addEventListener('click', startBowserFight);

    // Replay button
    document.getElementById('replay-btn').addEventListener('click', restartGame);

    // Initial draw
    generateLevel(1);
    draw();

    // Start game loop
    gameLoop();
  }

  init();
})();
