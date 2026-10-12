/**
 * KINGDOM RUSH: FRONTIER DEFENSE - Main Game Engine
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.width = CONFIG.CANVAS_WIDTH;
    this.height = CONFIG.CANVAS_HEIGHT;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game Modes & Configuration
    this.currentMode = 'normal';
    this.currentModeConfig = CONFIG.MODES.normal;

    // Game Economy & Stats
    this.credits = this.currentModeConfig.initialCredits; // Gold
    this.lives = this.currentModeConfig.initialLives;       // Kingdom Lives
    this.score = 0;
    this.waveNum = 0;
    this.maxWaves = this.currentModeConfig.maxWaves;

    // Game Flow
    this.isPaused = false;
    this.gameSpeed = 1;
    this.isGameOver = false;
    this.isVictory = false;

    // Entities
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.temporarySoldiers = []; // Summoned by Call Reinforcements spell

    // Controllable Hero: Sir Gerald Lightseeker
    this.hero = new Hero(260, 260);

    // Wave Management
    this.isWaveActive = false;
    this.waveTimer = Math.min(8.0, this.currentModeConfig.waveInterval);
    this.spawnQueue = [];
    this.spawnTimer = 0;

    // Selection & Cursor
    this.selectedBuildTower = null; // typeKey of tower to place ('archer', 'barracks', 'mage', 'artillery')
    this.selectedTower = null;      // instance of placed tower
    this.mouseGridX = -1;
    this.mouseGridY = -1;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseInCanvas = false;

    // Time tracking
    this.lastTime = performance.now();

    // Initialize Abilities with current mode
    window.abilityManager.setMode(this.currentModeConfig);

    // Initialize UI Manager
    this.ui = new UIManager(this);

    // Setup input listeners
    this.bindMouseEvents();

    // Start Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  getStats(modeId) {
    try {
      const data = JSON.parse(localStorage.getItem('neocore_stats') || '{}');
      return data[modeId] || { highScore: 0, highestWave: 0, victories: 0, gamesPlayed: 0 };
    } catch (e) {
      return { highScore: 0, highestWave: 0, victories: 0, gamesPlayed: 0 };
    }
  }

  saveRecord(modeId, score, wavesRepelled, isVictory) {
    try {
      const data = JSON.parse(localStorage.getItem('neocore_stats') || '{}');
      const cur = data[modeId] || { highScore: 0, highestWave: 0, victories: 0, gamesPlayed: 0 };
      const isNewHighScore = score > cur.highScore;
      const isNewBestWave = wavesRepelled > cur.highestWave;

      cur.highScore = Math.max(cur.highScore, score);
      cur.highestWave = Math.max(cur.highestWave, wavesRepelled);
      cur.gamesPlayed = (cur.gamesPlayed || 0) + 1;
      if (isVictory) cur.victories = (cur.victories || 0) + 1;

      data[modeId] = cur;
      localStorage.setItem('neocore_stats', JSON.stringify(data));

      return {
        isNewHighScore,
        isNewBestWave,
        highScore: cur.highScore,
        highestWave: cur.highestWave,
        victories: cur.victories,
        gamesPlayed: cur.gamesPlayed
      };
    } catch (e) {
      return { isNewHighScore: false, isNewBestWave: false, highScore: score, highestWave: wavesRepelled, victories: 0, gamesPlayed: 1 };
    }
  }

  bindMouseEvents() {
    const updateMousePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
      this.mouseGridX = Math.floor(this.mouseX / CONFIG.CELL_SIZE);
      this.mouseGridY = Math.floor(this.mouseY / CONFIG.CELL_SIZE);
      this.mouseInCanvas = true;
    };

    this.canvas.addEventListener('mousemove', updateMousePos);
    this.canvas.addEventListener('mouseleave', () => {
      this.mouseInCanvas = false;
      this.mouseGridX = -1;
      this.mouseGridY = -1;
    });

    this.canvas.addEventListener('click', (e) => {
      updateMousePos(e);
      window.soundEngine.init();

      // 1. Check if an active tactical spell is targeting (Reinforcements, Rain of Fire, Rally Point)
      if (window.abilityManager.activeTargeting) {
        window.abilityManager.executeTargeted(this.mouseX, this.mouseY, this);
        return;
      }

      // 2. Check if commanding the selected Hero to move
      if (this.hero.isSelected) {
        // If clicking on Hero again, keep selected; if clicking elsewhere, command move
        const distToHero = Math.hypot(this.mouseX - this.hero.x, this.mouseY - this.hero.y);
        if (distToHero > 25) {
          this.hero.commandMove(this.mouseX, this.mouseY);
          this.hero.isSelected = false;
          return;
        }
      }

      // 3. Check if clicking on Hero to select him
      const distToHero = Math.hypot(this.mouseX - this.hero.x, this.mouseY - this.hero.y);
      if (distToHero <= 26 && !this.hero.isDead) {
        this.hero.isSelected = true;
        this.clearSelection();
        window.soundEngine.playHeroCommand();
        window.particleEngine.addFloater('READY FOR BATTLE!', this.hero.x, this.hero.y - 20, '#facc15', 13, true);
        return;
      }

      // 4. Check if clicking on an existing tower
      const clickedTower = this.towers.find(t => t.col === this.mouseGridX && t.row === this.mouseGridY);
      if (clickedTower) {
        this.selectedTower = clickedTower;
        this.selectedBuildTower = null;
        this.hero.isSelected = false;
        this.ui.showInspector(clickedTower);
        window.soundEngine.playPlaceTower();
        return;
      }

      // 5. Build selected tower on empty valid stone foundation plot
      if (this.selectedBuildTower) {
        this.buildTower(this.selectedBuildTower, this.mouseGridX, this.mouseGridY);
        return;
      }

      // 6. Clicked empty plot or ground -> clear selection
      this.clearSelection();
      this.hero.isSelected = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.clearSelection();
      if (this.hero) this.hero.isSelected = false;
      window.abilityManager.cancelTargeting();
    });
  }

  selectTowerToBuild(typeKey) {
    if (this.selectedBuildTower === typeKey) {
      this.selectedBuildTower = null;
    } else {
      this.selectedBuildTower = typeKey;
      this.selectedTower = null;
      if (this.hero) this.hero.isSelected = false;
      this.ui.hideInspector();
      window.abilityManager.cancelTargeting();
    }
  }

  clearSelection() {
    this.selectedBuildTower = null;
    this.selectedTower = null;
    this.ui.hideInspector();
  }

  buildTower(typeKey, col, row) {
    const config = CONFIG.TOWERS[typeKey];
    if (!config) return;

    if (!window.mapManager.isCellBuildable(col, row)) {
      window.particleEngine.addFloater('BLOCKED TERRAIN', col * CONFIG.CELL_SIZE + 20, row * CONFIG.CELL_SIZE + 10, '#ef4444', 12, true);
      return;
    }

    if (this.credits < config.cost) {
      window.particleEngine.addFloater('NEED MORE GOLD!', col * CONFIG.CELL_SIZE + 20, row * CONFIG.CELL_SIZE + 10, '#f87171', 12, true);
      return;
    }

    // Deduct Gold & place tower
    this.credits -= config.cost;
    const newTower = new Tower(typeKey, col, row);
    this.towers.push(newTower);
    window.mapManager.setCellTower(col, row, typeKey);

    window.soundEngine.playPlaceTower();
    window.particleEngine.addShockwave(newTower.x, newTower.y, newTower.color, 45, 0.35);

    // Auto inspect
    this.selectedTower = newTower;
    this.selectedBuildTower = null;
    this.ui.showInspector(newTower);
  }

  upgradeSelectedTower() {
    if (!this.selectedTower) return;
    const upInfo = this.selectedTower.getUpgradeInfo();
    if (!upInfo || this.credits < upInfo.cost) return;

    this.credits -= upInfo.cost;
    this.selectedTower.upgrade();
    this.ui.updateInspector(this.selectedTower);
  }

  sellSelectedTower() {
    if (!this.selectedTower) return;
    const refund = this.selectedTower.getSellValue();
    this.credits += refund;

    // Free cell
    window.mapManager.setCellTower(this.selectedTower.col, this.selectedTower.row, null);

    // Disengage barracks soldiers if sold
    if (this.selectedTower.isBarracks) {
      this.selectedTower.soldiers.forEach(s => s.disengage());
    }

    const idx = this.towers.indexOf(this.selectedTower);
    if (idx !== -1) {
      this.towers.splice(idx, 1);
    }

    window.soundEngine.playSell();
    window.particleEngine.addFloater(`+${refund} GOLD`, this.selectedTower.x, this.selectedTower.y - 15, '#facc15', 14, true);

    this.clearSelection();
  }

  callWaveEarly() {
    if (this.isWaveActive) return;
    const remainingSecs = Math.max(0, Math.ceil(this.waveTimer));
    const bonusPerSec = this.currentModeConfig.earlyWaveBonusPerSec || CONFIG.EARLY_WAVE_BONUS_PER_SEC;
    const bonus = remainingSecs * bonusPerSec;

    if (bonus > 0) {
      this.credits += bonus;
      window.particleEngine.addFloater(`EARLY HORNS: +${bonus} GOLD!`, CONFIG.CANVAS_WIDTH / 2, 120, '#facc15', 17, true);
    }

    this.startNextWave();
  }

  startNextWave() {
    if (!this.currentModeConfig.isEndless && this.waveNum >= this.maxWaves) return;

    this.waveNum++;
    this.isWaveActive = true;
    this.generateWave(this.waveNum);
    window.soundEngine.playWaveStart();

    const waveLabel = this.currentModeConfig.isEndless
      ? `--- WAVE ${this.waveNum} ENGAGED [ENDLESS] ---`
      : `--- WAVE ${this.waveNum} / ${this.maxWaves} ENGAGED [${this.currentModeConfig.name.toUpperCase()}] ---`;

    window.particleEngine.addFloater(
      waveLabel,
      CONFIG.CANVAS_WIDTH / 2,
      80,
      this.currentModeConfig.color,
      20,
      true
    );
  }

  generateWave(wave) {
    this.spawnQueue = [];
    const map = window.mapManager.getCurrentMap();
    const numPaths = map.paths.length;
    const mode = this.currentMode;
    const modeConfig = this.currentModeConfig;
    const delayMult = modeConfig.spawnDelayMultiplier || 1.0;

    let isBossWave = false;
    let bossCount = 1;

    if (mode === 'nightmare') {
      isBossWave = (wave % 4 === 0) || (wave === this.maxWaves);
      if (wave >= 16) bossCount = 2;
      if (wave >= 28) bossCount = 3;
      if (wave === 35) bossCount = 4;
    } else if (modeConfig.isEndless) {
      isBossWave = (wave % 5 === 0);
      bossCount = Math.min(8, 1 + Math.floor(wave / 8));
    } else if (mode === 'hard') {
      isBossWave = (wave % 5 === 0);
      if (wave >= 20) bossCount = 2;
      if (wave === 30) bossCount = 3;
    } else {
      isBossWave = (wave % 5 === 0);
      if (wave === this.maxWaves && wave >= 25) bossCount = 2;
    }

    if (isBossWave) {
      window.soundEngine.playTitanAlarm();
      window.abilityManager.triggerScreenShake(0.55, 9);

      const titanLabel = bossCount > 1
        ? `⚠️ BEWARE: ${bossCount}X EPIC WAR CHIEFTAINS ADVANCING! ⚠️`
        : '⚠️ BEWARE: EPIC WAR CHIEFTAIN ADVANCING! ⚠️';
      window.particleEngine.addFloater(titanLabel, CONFIG.CANVAS_WIDTH / 2, 130, '#ef4444', 19, true);

      // Bosses
      for (let b = 0; b < bossCount; b++) {
        const bossType = (b % 2 === 1 || wave >= 20) ? 'boss_veznan' : 'boss_juggernaut';
        this.spawnQueue.push({
          type: bossType,
          pathIndex: b % numPaths,
          delay: (b === 0 ? 1.0 : 1.6) * delayMult
        });
      }

      // Escorts
      const baseEscorts = 4 + wave * 1.5;
      const escortMultiplier = mode === 'nightmare' ? 1.5 : (mode === 'hard' ? 1.3 : 1.0);
      const escorts = Math.round(baseEscorts * escortMultiplier);

      for (let i = 0; i < escorts; i++) {
        let eType = 'orc';
        if (i % 3 === 0) eType = 'shaman';
        else if (i % 4 === 0 && wave >= 8) eType = 'dark_knight';
        else if (i % 5 === 0 && wave >= 10) eType = 'troll';

        this.spawnQueue.push({
          type: eType,
          pathIndex: i % numPaths,
          delay: Math.max(0.2, (0.65 - Math.min(0.25, wave * 0.01)) * delayMult)
        });
      }
    } else {
      // Standard / Swarm Kingdom Waves
      let count = 8 + wave * 3;
      if (mode === 'blitz') count = Math.round(12 + wave * 4);
      else if (mode === 'hard') count = Math.round(10 + wave * 3.5);
      else if (mode === 'nightmare') count = Math.round(12 + wave * 4);
      else if (modeConfig.isEndless) count = Math.round(10 + wave * 2.8 + Math.min(50, Math.pow(wave, 1.12)));

      for (let i = 0; i < count; i++) {
        let type = 'goblin';

        if (mode === 'nightmare') {
          if (wave >= 1 && Math.random() < 0.38) type = 'orc';
          if (wave >= 2 && Math.random() < 0.28) type = 'brigand';
          if (wave >= 3 && Math.random() < 0.30) type = 'dark_knight';
          if (wave >= 4 && Math.random() < 0.32) type = 'gargoyle'; // Air attack!
          if (wave >= 5 && Math.random() < 0.28) type = 'shaman';
          if (wave >= 7 && Math.random() < 0.35) type = 'troll';
          if (wave >= 9 && Math.random() < 0.28) type = 'necromancer';
        } else if (mode === 'hard') {
          if (wave >= 2 && Math.random() < 0.40) type = 'orc';
          if (wave >= 3 && Math.random() < 0.28) type = 'dark_knight';
          if (wave >= 4 && Math.random() < 0.28) type = 'gargoyle'; // Air attack!
          if (wave >= 5 && Math.random() < 0.26) type = 'shaman';
          if (wave >= 6 && Math.random() < 0.25) type = 'brigand';
          if (wave >= 8 && Math.random() < 0.28) type = 'troll';
          if (wave >= 10 && Math.random() < 0.25) type = 'necromancer';
        } else {
          if (wave >= 2 && Math.random() < 0.45) type = 'orc';
          if (wave >= 4 && Math.random() < 0.28) type = 'gargoyle'; // Air attack!
          if (wave >= 6 && Math.random() < 0.28) type = 'dark_knight';
          if (wave >= 8 && Math.random() < 0.25) type = 'shaman';
          if (wave >= 10 && Math.random() < 0.25) type = 'troll';
          if (wave >= 12 && Math.random() < 0.25) type = 'necromancer';
        }

        const baseDelay = Math.max(0.25, 1.2 - wave * 0.03);
        this.spawnQueue.push({
          type,
          pathIndex: i % numPaths,
          delay: Math.max(0.12, baseDelay * delayMult)
        });
      }
    }

    this.spawnTimer = 0.4 * delayMult;
  }

  handleEnemyDeath(enemy) {
    this.credits += enemy.bounty;
    this.score += enemy.score;
    window.particleEngine.addFloater(`+${enemy.bounty} GOLD`, enemy.x, enemy.y - 18, '#facc15', 12);

    if (this.hero && !this.hero.isDead) {
      this.hero.gainExp(enemy.score);
    }
  }

  handleCoreBreach(enemy) {
    const livesLost = enemy.isBoss ? 5 : 1;
    this.lives = Math.max(0, this.lives - livesLost);
    window.soundEngine.playCoreHit();
    window.abilityManager.triggerScreenShake(0.45, enemy.isBoss ? 12 : 6);

    window.particleEngine.createExplosion(enemy.x, enemy.y, '#ef4444', 35, 200);
    window.particleEngine.addFloater(`KINGDOM BREACH! -${livesLost} LIVES`, enemy.x, enemy.y - 20, '#ef4444', 16, true);

    if (this.lives <= 0 && !this.isGameOver) {
      this.gameOver();
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.isPaused = true;
    window.soundEngine.playExplosion(true);
    const wavesRepelled = Math.max(0, this.waveNum - 1);
    const record = this.saveRecord(this.currentMode, this.score, wavesRepelled, false);
    this.ui.showGameOver(this.score, wavesRepelled, this.currentModeConfig, record);
  }

  victory() {
    this.isVictory = true;
    this.isPaused = true;
    window.soundEngine.playUpgrade();
    const record = this.saveRecord(this.currentMode, this.score, this.waveNum, true);
    this.ui.showVictory(this.score, this.waveNum, this.currentModeConfig, record);
  }

  restart() {
    this.credits = this.currentModeConfig.initialCredits;
    this.lives = this.currentModeConfig.initialLives;
    this.score = 0;
    this.waveNum = 0;
    this.maxWaves = this.currentModeConfig.maxWaves;
    this.isGameOver = false;
    this.isVictory = false;
    this.isPaused = false;
    this.isWaveActive = false;
    this.waveTimer = Math.min(8.0, this.currentModeConfig.waveInterval);

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.temporarySoldiers = [];
    this.spawnQueue = [];

    // Reset Hero
    this.hero = new Hero(260, 260);

    window.abilityManager.setMode(this.currentModeConfig);
    window.mapManager.cacheCurrentMap();
    window.particleEngine.clear();
    this.clearSelection();
  }

  changeMode(modeId) {
    if (!CONFIG.MODES[modeId]) return;
    this.currentMode = modeId;
    this.currentModeConfig = CONFIG.MODES[modeId];
    window.soundEngine.playModeSelect();
    this.restart();

    window.particleEngine.addFloater(
      `MODE: ${this.currentModeConfig.name.toUpperCase()} ACTIVATED`,
      CONFIG.CANVAS_WIDTH / 2,
      120,
      this.currentModeConfig.color,
      18,
      true
    );
  }

  changeMap(mapId) {
    window.mapManager.setMap(mapId);
    this.restart();
  }

  setGameSpeed(speed) {
    this.gameSpeed = speed;
    this.isPaused = false;
  }

  cycleSpeed() {
    if (this.gameSpeed === 1) this.setGameSpeed(2);
    else if (this.gameSpeed === 2) this.setGameSpeed(4);
    else this.setGameSpeed(1);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  // --- Main Simulation Update ---
  update(rawDt) {
    if (this.isPaused) return;

    const dt = Math.min(rawDt, 0.05) * this.gameSpeed;

    // 1. Map Animation
    window.mapManager.update(dt);

    // 2. Wave Spawning Queue
    if (this.isWaveActive) {
      if (this.spawnQueue.length > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          const item = this.spawnQueue.shift();
          const newEnemy = new Enemy(item.type, item.pathIndex, this.waveNum, this.currentModeConfig);
          this.enemies.push(newEnemy);
          this.spawnTimer = item.delay;
        }
      } else if (this.enemies.length === 0) {
        // Wave fully cleared!
        this.isWaveActive = false;
        this.waveTimer = this.currentModeConfig.waveInterval || CONFIG.WAVE_INTERVAL_SECONDS;
        const waveClearBonus = Math.round((50 + this.waveNum * 15) * (this.currentModeConfig.scoreMultiplier >= 1.5 ? 1.25 : 1.0));
        this.credits += waveClearBonus;
        window.particleEngine.addFloater(`WAVE VICTORY! +${waveClearBonus} GOLD`, CONFIG.CANVAS_WIDTH / 2, 100, '#facc15', 18, true);

        // Endless mode milestone fanfare
        if (this.currentModeConfig.isEndless && this.waveNum % 5 === 0) {
          window.soundEngine.playUpgrade();
          window.particleEngine.addShockwave(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, this.currentModeConfig.color, 350, 1.0);
          window.particleEngine.addFloater(`🌟 MILESTONE: WAVE ${this.waveNum} CONQUERED! 🌟`, CONFIG.CANVAS_WIDTH / 2, 140, '#facc15', 20, true);
        }

        if (!this.currentModeConfig.isEndless && this.waveNum >= this.maxWaves) {
          this.victory();
        }
      }
    } else {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.startNextWave();
      }
    }

    // 3. Collect all active soldiers on the field
    const allSoldiers = [...this.temporarySoldiers];
    this.towers.forEach(t => {
      if (t.isBarracks) allSoldiers.push(...t.soldiers);
    });

    // 4. Update Temporary Reinforcements
    for (let i = this.temporarySoldiers.length - 1; i >= 0; i--) {
      const s = this.temporarySoldiers[i];
      s.update(dt, this.enemies);
      if (s.isDead && s.lifeTimer <= 0) {
        this.temporarySoldiers.splice(i, 1);
      }
    }

    // 5. Update Controllable Hero (Sir Gerald)
    if (this.hero) {
      this.hero.update(dt, this.enemies, allSoldiers);
    }

    // 6. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.enemies, this.towers, allSoldiers, this.hero);

      if (e.isDead) {
        this.handleEnemyDeath(e);
        this.enemies.splice(i, 1);
      } else if (e.reachedEnd) {
        this.handleCoreBreach(e);
        this.enemies.splice(i, 1);
      }
    }

    // 7. Update Towers
    this.towers.forEach(t => {
      t.update(dt, this.enemies, this.projectiles);
    });

    // 8. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, this.enemies);
      if (p.isDead) {
        this.projectiles.splice(i, 1);
      }
    }

    // 9. Update Particles & Tactical Spells
    window.particleEngine.update(dt);
    window.abilityManager.update(dt, this.enemies);

    // 10. Scorched Earth (Rain of Fire lava pools) damage
    window.particleEngine.plasmaPools.forEach(pool => {
      this.enemies.forEach(e => {
        if (!e.isDead && !e.isFlying && Math.hypot(e.x - pool.x, e.y - pool.y) <= pool.radius) {
          e.applyDamage(pool.dps * dt, 'true');
        }
      });
    });
  }

  // --- Main Render Method ---
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.save();

    // Screen Shake Offset
    if (window.abilityManager.screenShakeTime > 0) {
      const intensity = window.abilityManager.screenShakeIntensity;
      const ox = (Math.random() - 0.5) * intensity * 2;
      const oy = (Math.random() - 0.5) * intensity * 2;
      this.ctx.translate(ox, oy);
    }

    // 1. Draw Map (Lush Meadows, Dirt Roads, Stone Plots, Castle Gates)
    window.mapManager.draw(this.ctx);

    // 2. Draw Particles & Scorched Ground
    window.particleEngine.draw(this.ctx);

    // 3. Draw Towers
    this.towers.forEach(t => {
      const isSelected = (this.selectedTower === t);
      const isHovered = (this.mouseGridX === t.col && this.mouseGridY === t.row);
      t.draw(this.ctx, isSelected, isHovered);
    });

    // 4. Draw Temporary Reinforcements
    this.temporarySoldiers.forEach(s => s.draw(this.ctx));

    // 5. Draw Hero (Sir Gerald Lightseeker)
    if (this.hero) {
      this.hero.draw(this.ctx);
    }

    // 6. Draw Projectiles (Arrows, Magic Bolts, Cannonballs)
    this.projectiles.forEach(p => p.draw(this.ctx));

    // 7. Draw Enemies
    this.enemies.forEach(e => e.draw(this.ctx));

    // 8. Draw Falling Fiery Meteors (Rain of Fire)
    window.abilityManager.drawPendingStrikes(this.ctx);

    // 9. Draw Placement Hologram Cursor
    if (this.selectedBuildTower && this.mouseInCanvas && this.mouseGridX >= 0 && this.mouseGridY >= 0) {
      this.drawPlacementHologram(this.ctx);
    }

    // 10. Draw Active Spell Targeting Reticle
    if (window.abilityManager.activeTargeting && this.mouseInCanvas) {
      window.abilityManager.drawTargetingReticle(this.ctx, this.mouseX, this.mouseY);
    }

    this.ctx.restore();

    // Update HTML HUD
    this.ui.updateHUD();
  }

  drawPlacementHologram(ctx) {
    const config = CONFIG.TOWERS[this.selectedBuildTower];
    if (!config) return;

    const cellX = this.mouseGridX * CONFIG.CELL_SIZE;
    const cellY = this.mouseGridY * CONFIG.CELL_SIZE;
    const centerX = cellX + CONFIG.CELL_SIZE / 2;
    const centerY = cellY + CONFIG.CELL_SIZE / 2;

    const isBuildable = window.mapManager.isCellBuildable(this.mouseGridX, this.mouseGridY);
    const canAfford = this.credits >= config.cost;
    const isValid = isBuildable && canAfford;

    ctx.save();
    // Range preview circle
    ctx.strokeStyle = isValid ? 'rgba(250, 204, 21, 0.75)' : 'rgba(239, 68, 68, 0.75)';
    ctx.fillStyle = isValid ? 'rgba(250, 204, 21, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, config.baseRange, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stone foundation highlight
    ctx.fillStyle = isValid ? 'rgba(52, 211, 153, 0.35)' : 'rgba(239, 68, 68, 0.4)';
    ctx.strokeStyle = isValid ? '#10b981' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Miniature Tower Hologram
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  loop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
