/**
 * KINGDOM RUSH: FRONTIER DEFENSE - UI & Interaction Controller
 */

class UIManager {
  constructor(game) {
    this.game = game;

    // DOM Elements Cache
    this.elCredits = document.getElementById('stat-credits');
    this.elLives = document.getElementById('stat-lives');
    this.elWave = document.getElementById('stat-wave');
    this.elScore = document.getElementById('stat-score');
    this.elTimer = document.getElementById('wave-timer');
    this.elEarlyWaveBtn = document.getElementById('btn-early-wave');
    this.elWaveEarlyBonus = document.getElementById('early-wave-bonus');

    // Hero HUD elements
    this.heroHudCard = document.getElementById('hero-hud-card');
    this.heroHudName = document.getElementById('hero-hud-name');
    this.heroHudLvl = document.getElementById('hero-hud-lvl');
    this.heroHudHpBar = document.getElementById('hero-hud-hp-bar');

    // Mode UI elements
    this.elMode = document.getElementById('stat-mode');
    this.elChipMode = document.getElementById('chip-mode');
    this.elSelectMode = document.getElementById('select-mode');
    this.btnModeInfo = document.getElementById('btn-mode-info');
    this.modalModes = document.getElementById('modal-modes');
    this.modesGridContainer = document.getElementById('modes-grid-container');

    this.elSpeed1 = document.getElementById('btn-speed-1');
    this.elSpeed2 = document.getElementById('btn-speed-2');
    this.elSpeed4 = document.getElementById('btn-speed-4');
    this.elPause = document.getElementById('btn-pause');
    this.elMute = document.getElementById('btn-mute');

    // Inspector Panel
    this.inspectorPanel = document.getElementById('tower-inspector');
    this.inspName = document.getElementById('insp-name');
    this.inspLevel = document.getElementById('insp-level');
    this.inspLblDmg = document.getElementById('insp-lbl-dmg');
    this.inspDamage = document.getElementById('insp-damage');
    this.inspRange = document.getElementById('insp-range');
    this.inspLblRate = document.getElementById('insp-lbl-rate');
    this.inspFireRate = document.getElementById('insp-firerate');
    this.inspLblDps = document.getElementById('insp-lbl-dps');
    this.inspDps = document.getElementById('insp-dps');
    this.inspKills = document.getElementById('insp-kills');
    this.inspTotalDmg = document.getElementById('insp-total-dmg');

    this.btnTargetStrategy = document.getElementById('btn-target-strategy');
    this.btnSetRally = document.getElementById('btn-set-rally');
    this.btnUpgrade = document.getElementById('btn-upgrade');
    this.btnSell = document.getElementById('btn-sell');
    this.upgradeCostText = document.getElementById('upgrade-cost');
    this.sellValueText = document.getElementById('sell-value');

    // Modals
    this.modalGameOver = document.getElementById('modal-gameover');
    this.modalVictory = document.getElementById('modal-victory');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalWavesEl = document.getElementById('final-waves');

    // Kingdom Spells Elements
    this.abReinforceBtn = document.getElementById('btn-ab-reinforcements');
    this.abReinforceCd = document.getElementById('cd-ab-reinforcements');
    this.abMeteorBtn = document.getElementById('btn-ab-meteor');
    this.abMeteorCd = document.getElementById('cd-ab-meteor');

    this.bindEvents();
  }

  bindEvents() {
    // 1. Tower build buttons (archer, barracks, mage, artillery)
    const towerBtns = document.querySelectorAll('.tower-card');
    towerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const towerType = btn.getAttribute('data-tower');
        this.game.selectTowerToBuild(towerType);
      });
    });

    // 2. Hero HUD Card click -> selects Hero Sir Gerald
    if (this.heroHudCard) {
      this.heroHudCard.addEventListener('click', () => {
        if (this.game.hero && !this.game.hero.isDead) {
          this.game.hero.isSelected = true;
          this.game.clearSelection();
          window.soundEngine.playHeroCommand();
          window.particleEngine.addFloater('COMMAND ME, SIRE!', this.game.hero.x, this.game.hero.y - 20, '#facc15', 13, true);
        }
      });
    }

    // 3. Early wave call
    if (this.elEarlyWaveBtn) {
      this.elEarlyWaveBtn.addEventListener('click', () => {
        this.game.callWaveEarly();
      });
    }

    // 4. Game Speed
    this.elSpeed1.addEventListener('click', () => this.game.setGameSpeed(1));
    this.elSpeed2.addEventListener('click', () => this.game.setGameSpeed(2));
    this.elSpeed4.addEventListener('click', () => this.game.setGameSpeed(4));
    this.elPause.addEventListener('click', () => this.game.togglePause());

    // 5. Mute
    this.elMute.addEventListener('click', () => {
      const active = window.soundEngine.toggleMute();
      this.elMute.innerHTML = active ? '🔊 SOUND' : '🔇 MUTED';
      this.elMute.classList.toggle('muted', !active);
    });

    // 6. Inspector actions
    if (this.btnTargetStrategy) {
      this.btnTargetStrategy.addEventListener('click', () => {
        if (this.game.selectedTower) {
          this.game.selectedTower.cycleTargetStrategy();
          this.updateInspector(this.game.selectedTower);
        }
      });
    }

    if (this.btnSetRally) {
      this.btnSetRally.addEventListener('click', () => {
        if (this.game.selectedTower && this.game.selectedTower.isBarracks) {
          window.abilityManager.triggerAbility('rally_point');
          window.particleEngine.addFloater('CLICK ON ROAD TO RALLY', this.game.selectedTower.x, this.game.selectedTower.y - 24, '#3b82f6', 13, true);
        }
      });
    }

    if (this.btnUpgrade) {
      this.btnUpgrade.addEventListener('click', () => {
        if (this.game.selectedTower) {
          this.game.upgradeSelectedTower();
        }
      });
    }

    if (this.btnSell) {
      this.btnSell.addEventListener('click', () => {
        if (this.game.selectedTower) {
          this.game.sellSelectedTower();
        }
      });
    }

    // 7. Tactical Kingdom Spells
    if (this.abReinforceBtn) {
      this.abReinforceBtn.addEventListener('click', () => {
        window.abilityManager.triggerAbility('reinforcements', this.game.enemies, this.game.towers);
      });
    }
    if (this.abMeteorBtn) {
      this.abMeteorBtn.addEventListener('click', () => {
        window.abilityManager.triggerAbility('rain_of_fire', this.game.enemies, this.game.towers);
      });
    }

    // 8. Map & Mode Selectors
    const mapSelect = document.getElementById('select-map');
    if (mapSelect) {
      mapSelect.addEventListener('change', (e) => {
        this.game.changeMap(e.target.value);
      });
    }

    if (this.elSelectMode) {
      this.elSelectMode.addEventListener('change', (e) => {
        this.game.changeMode(e.target.value);
      });
    }

    if (this.btnModeInfo) {
      this.btnModeInfo.addEventListener('click', () => this.showModesModal());
    }
    if (this.elChipMode) {
      this.elChipMode.addEventListener('click', () => this.showModesModal());
    }

    const closeModesBtn = document.getElementById('btn-close-modes');
    if (closeModesBtn) {
      closeModesBtn.addEventListener('click', () => this.hideModesModal());
    }
    if (this.modalModes) {
      this.modalModes.addEventListener('click', (e) => {
        if (e.target === this.modalModes) this.hideModesModal();
      });
    }

    // 9. Modal restart buttons
    document.querySelectorAll('.btn-restart-game').forEach(btn => {
      btn.addEventListener('click', () => {
        this.modalGameOver.classList.add('hidden');
        this.modalVictory.classList.add('hidden');
        this.game.restart();
      });
    });

    // 10. Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      window.soundEngine.init();

      if (e.key >= '1' && e.key <= '4') {
        const towerKeys = ['archer', 'barracks', 'mage', 'artillery'];
        const chosen = towerKeys[parseInt(e.key) - 1];
        if (chosen) this.game.selectTowerToBuild(chosen);
      } else if (e.code === 'KeyQ') {
        window.abilityManager.triggerAbility('reinforcements', this.game.enemies, this.game.towers);
      } else if (e.code === 'KeyW') {
        window.abilityManager.triggerAbility('rain_of_fire', this.game.enemies, this.game.towers);
      } else if (e.code === 'KeyR') {
        if (this.game.selectedTower && this.game.selectedTower.isBarracks) {
          window.abilityManager.triggerAbility('rally_point');
          window.particleEngine.addFloater('CLICK ON ROAD TO RALLY', this.game.selectedTower.x, this.game.selectedTower.y - 24, '#3b82f6', 13, true);
        }
      } else if (e.code === 'KeyH') {
        if (this.game.hero && !this.game.hero.isDead) {
          this.game.hero.isSelected = true;
          this.game.clearSelection();
          window.soundEngine.playHeroCommand();
          window.particleEngine.addFloater('FOR THE REALM!', this.game.hero.x, this.game.hero.y - 20, '#facc15', 13, true);
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.game.togglePause();
      } else if (e.code === 'KeyN') {
        this.game.callWaveEarly();
      } else if (e.code === 'KeyU') {
        if (this.game.selectedTower) this.game.upgradeSelectedTower();
      } else if (e.code === 'KeyS') {
        if (this.game.selectedTower) this.game.sellSelectedTower();
      } else if (e.code === 'KeyM') {
        this.showModesModal();
      } else if (e.code === 'Escape') {
        this.game.clearSelection();
        if (this.game.hero) this.game.hero.isSelected = false;
        window.abilityManager.cancelTargeting();
        this.hideModesModal();
      }
    });
  }

  showModesModal() {
    if (!this.modalModes) return;
    this.renderModesGrid();
    this.modalModes.classList.remove('hidden');
  }

  hideModesModal() {
    if (!this.modalModes) return;
    this.modalModes.classList.add('hidden');
  }

  renderModesGrid() {
    if (!this.modesGridContainer) return;
    this.modesGridContainer.innerHTML = '';

    for (const key in CONFIG.MODES) {
      const mode = CONFIG.MODES[key];
      const stats = this.game.getStats(key);
      const isCurrent = (this.game.currentMode === key);

      const card = document.createElement('div');
      card.className = `mode-intel-card ${isCurrent ? 'active-mode' : ''}`;
      card.style.borderColor = isCurrent ? mode.color : 'rgba(56, 189, 248, 0.2)';

      const wavesText = mode.isEndless ? 'Infinite (∞)' : `${mode.maxWaves} Waves`;

      card.innerHTML = `
        <div class="mode-card-header">
          <div>
            <div class="mode-card-title" style="color: ${mode.color};">${mode.name}</div>
            <div class="mode-threat">${mode.threat} ${mode.threatLevel}</div>
          </div>
          <span class="mode-tag" style="background: ${mode.color}22; color: ${mode.color}; border: 1px solid ${mode.color}66;">${mode.badge}</span>
        </div>

        <p class="mode-desc">${mode.description}</p>

        <div class="mode-stats-grid">
          <div class="mode-stat-item">
            <span class="lbl">LIVES</span>
            <span class="val" style="color: ${mode.initialLives === 1 ? '#ef4444' : '#38bdf8'};">${mode.initialLives}</span>
          </div>
          <div class="mode-stat-item">
            <span class="lbl">START GOLD</span>
            <span class="val" style="color: #facc15;">${mode.initialCredits.toLocaleString()} G</span>
          </div>
          <div class="mode-stat-item">
            <span class="lbl">WAVES</span>
            <span class="val" style="color: #10b981;">${wavesText}</span>
          </div>
          <div class="mode-stat-item">
            <span class="lbl">HONOR MULT</span>
            <span class="val" style="color: #c084fc;">${mode.scoreMultiplier}x</span>
          </div>
        </div>

        <ul class="mode-features-list">
          ${mode.features.map(f => `<li>⚔️ ${f}</li>`).join('')}
        </ul>

        <div class="mode-records-box">
          <div>RECORD HONOR: <strong style="color: #facc15;">${stats.highScore.toLocaleString()}</strong></div>
          <div>HIGHEST WAVE: <strong style="color: #38bdf8;">${stats.highestWave}</strong></div>
          <div>VICTORIES: <strong style="color: #10b981;">${stats.victories || 0}</strong></div>
        </div>

        <button class="btn-engage-mode ${isCurrent ? 'btn-active' : ''}" style="${isCurrent ? `background: ${mode.color}; color: #000; font-weight: 800;` : ''}">
          ${isCurrent ? 'ACTIVE CAMPAIGN' : 'ENTER CAMPAIGN'}
        </button>
      `;

      const engageBtn = card.querySelector('.btn-engage-mode');
      if (!isCurrent) {
        engageBtn.addEventListener('click', () => {
          this.game.changeMode(key);
          this.hideModesModal();
        });
      }

      this.modesGridContainer.appendChild(card);
    }
  }

  updateHUD() {
    this.elCredits.innerText = `${this.game.credits.toLocaleString()} G`;
    this.elLives.innerText = this.game.lives.toLocaleString();

    if (this.game.currentModeConfig.isEndless) {
      this.elWave.innerText = `${this.game.waveNum} / ∞`;
    } else {
      this.elWave.innerText = `${this.game.waveNum} / ${this.game.maxWaves}`;
    }

    this.elScore.innerText = this.game.score.toLocaleString();

    // Mode HUD status
    if (this.elMode) {
      this.elMode.innerText = this.game.currentModeConfig.badge;
      this.elMode.style.color = this.game.currentModeConfig.color;
    }
    if (this.elChipMode) {
      this.elChipMode.style.borderColor = `${this.game.currentModeConfig.color}66`;
    }
    if (this.elSelectMode && this.elSelectMode.value !== this.game.currentMode) {
      this.elSelectMode.value = this.game.currentMode;
    }

    // Hero HUD Status Card
    if (this.heroHudCard && this.game.hero) {
      const hero = this.game.hero;
      this.heroHudCard.classList.toggle('selected', hero.isSelected);
      this.heroHudCard.classList.toggle('hero-dead', hero.isDead);

      if (this.heroHudLvl) {
        this.heroHudLvl.innerText = hero.isDead ? 'REVIVING' : `LV ${hero.level}`;
      }

      if (this.heroHudHpBar) {
        const pct = hero.isDead ? 0 : Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));
        this.heroHudHpBar.style.width = `${pct}%`;
        this.heroHudHpBar.style.background = hero.isDead ? '#ef4444' : (pct > 50 ? '#10b981' : (pct > 25 ? '#f59e0b' : '#ef4444'));
      }
    }

    // Wave countdown
    if (this.game.isWaveActive) {
      this.elTimer.innerText = `HORDE INVASION [${this.game.enemies.length} FOES]`;
      this.elEarlyWaveBtn.disabled = true;
      this.elEarlyWaveBtn.classList.add('opacity-50');
      this.elWaveEarlyBonus.innerText = '';
    } else {
      const remainingSecs = Math.max(0, Math.ceil(this.game.waveTimer));
      this.elTimer.innerText = `NEXT WAVE IN: ${remainingSecs}s`;
      this.elEarlyWaveBtn.disabled = false;
      this.elEarlyWaveBtn.classList.remove('opacity-50');
      const bonusPerSec = this.game.currentModeConfig.earlyWaveBonusPerSec || CONFIG.EARLY_WAVE_BONUS_PER_SEC;
      const bonus = remainingSecs * bonusPerSec;
      this.elWaveEarlyBonus.innerText = `+${bonus} G`;
    }

    // Update build card affordability
    document.querySelectorAll('.tower-card').forEach(card => {
      const type = card.getAttribute('data-tower');
      const towerConf = CONFIG.TOWERS[type];
      if (!towerConf) return;

      const isSelected = this.game.selectedBuildTower === type;
      card.classList.toggle('selected', isSelected);

      const canAfford = this.game.credits >= towerConf.cost;
      card.classList.toggle('unaffordable', !canAfford);
    });

    // Update Kingdom Spells CD overlays
    const abs = window.abilityManager.abilities;
    if (abs.reinforcements) {
      this.updateAbilityCooldown(abs.reinforcements, this.abReinforceBtn, this.abReinforceCd);
    }
    if (abs.rain_of_fire) {
      this.updateAbilityCooldown(abs.rain_of_fire, this.abMeteorBtn, this.abMeteorCd);
    }

    // Update Speed button states
    this.elSpeed1.classList.toggle('active', this.game.gameSpeed === 1 && !this.game.isPaused);
    this.elSpeed2.classList.toggle('active', this.game.gameSpeed === 2 && !this.game.isPaused);
    this.elSpeed4.classList.toggle('active', this.game.gameSpeed === 4 && !this.game.isPaused);
    this.elPause.classList.toggle('active', this.game.isPaused);
    this.elPause.innerText = this.game.isPaused ? '▶ RESUME' : '⏸ PAUSE';

    // Update Inspector if tower selected
    if (this.game.selectedTower) {
      this.updateInspector(this.game.selectedTower);
    }
  }

  updateAbilityCooldown(ability, btn, cdEl) {
    if (!btn || !cdEl) return;
    if (ability.cooldown > 0) {
      btn.disabled = true;
      cdEl.style.height = `${(ability.cooldown / ability.cooldownMax) * 100}%`;
      cdEl.innerText = `${Math.ceil(ability.cooldown)}s`;
    } else {
      btn.disabled = false;
      cdEl.style.height = '0%';
      cdEl.innerText = '';
    }
  }

  showInspector(tower) {
    this.inspectorPanel.classList.remove('hidden');
    this.updateInspector(tower);
  }

  hideInspector() {
    this.inspectorPanel.classList.add('hidden');
  }

  updateInspector(tower) {
    this.inspName.innerText = tower.name;
    this.inspName.style.color = tower.color;
    this.inspLevel.innerText = `LEVEL ${tower.level}`;

    if (tower.isBarracks) {
      const s0 = tower.soldiers && tower.soldiers[0];
      const dmgMin = s0 ? s0.damageMin : 3;
      const dmgMax = s0 ? s0.damageMax : 6;
      const armor = s0 ? Math.round(s0.armor * 100) : 0;

      if (this.inspLblDmg) this.inspLblDmg.innerText = 'DAMAGE';
      this.inspDamage.innerText = `${dmgMin}-${dmgMax}`;

      this.inspRange.innerText = tower.range;

      if (this.inspLblRate) this.inspLblRate.innerText = 'GARRISON';
      this.inspFireRate.innerText = '3 Units';

      if (this.inspLblDps) this.inspLblDps.innerText = 'ARMOR';
      this.inspDps.innerText = `${armor}%`;

      // Barracks uses Rally Point instead of targeting strategy
      if (this.btnTargetStrategy) this.btnTargetStrategy.classList.add('hidden');
      if (this.btnSetRally) this.btnSetRally.classList.remove('hidden');
    } else {
      if (this.inspLblDmg) this.inspLblDmg.innerText = 'DAMAGE';
      this.inspDamage.innerText = Math.round(tower.damage);

      this.inspRange.innerText = tower.range;

      if (this.inspLblRate) this.inspLblRate.innerText = 'RATE';
      this.inspFireRate.innerText = `${tower.fireRate.toFixed(1)}/s`;

      if (this.inspLblDps) this.inspLblDps.innerText = 'DPS';
      this.inspDps.innerText = Math.round(tower.damage * tower.fireRate);

      if (this.btnTargetStrategy) {
        this.btnTargetStrategy.classList.remove('hidden');
        this.btnTargetStrategy.innerText = `TARGET: ${tower.targetStrategy.toUpperCase()}`;
      }
      if (this.btnSetRally) this.btnSetRally.classList.add('hidden');
    }

    this.inspKills.innerText = tower.totalKills;
    this.inspTotalDmg.innerText = Math.round(tower.totalDamageDealt);

    const upInfo = tower.getUpgradeInfo();
    if (upInfo) {
      this.btnUpgrade.disabled = (this.game.credits < upInfo.cost);
      this.upgradeCostText.innerText = `${upInfo.cost} G`;
      this.btnUpgrade.title = `${upInfo.name}: ${upInfo.desc}`;
    } else {
      this.btnUpgrade.disabled = true;
      this.upgradeCostText.innerText = 'MAX LVL';
    }

    this.sellValueText.innerText = `+${tower.getSellValue()} G`;
  }

  showGameOver(score, wavesDefeated, modeConfig = null, record = null) {
    this.finalScoreEl.innerText = score.toLocaleString();
    this.finalWavesEl.innerText = wavesDefeated;

    const modeBadge = document.getElementById('gameover-mode-badge');
    if (modeBadge && modeConfig) {
      modeBadge.innerText = `${modeConfig.name.toUpperCase()} CAMPAIGN`;
      modeBadge.style.color = modeConfig.color;
      modeBadge.style.borderColor = `${modeConfig.color}88`;
    }

    const recordBanner = document.getElementById('gameover-record-banner');
    if (recordBanner && record) {
      if (record.isNewHighScore || record.isNewBestWave) {
        recordBanner.innerHTML = `🏆 NEW PERSONAL RECORD! (Honor: ${record.highScore.toLocaleString()} | Best Wave: ${record.highestWave})`;
        recordBanner.classList.remove('hidden');
      } else {
        recordBanner.innerHTML = `Personal Record: ${record.highScore.toLocaleString()} pts | Wave ${record.highestWave}`;
        recordBanner.classList.remove('hidden');
      }
    }

    this.modalGameOver.classList.remove('hidden');
  }

  showVictory(score, waveNum = 25, modeConfig = null, record = null) {
    const victoryScoreEl = document.getElementById('victory-score');
    if (victoryScoreEl) victoryScoreEl.innerText = score.toLocaleString();

    const victoryWavesEl = document.getElementById('victory-waves');
    if (victoryWavesEl && modeConfig) {
      victoryWavesEl.innerText = `${waveNum} / ${modeConfig.maxWaves}`;
    }

    const modeBadge = document.getElementById('victory-mode-badge');
    if (modeBadge && modeConfig) {
      modeBadge.innerText = `${modeConfig.name.toUpperCase()} CAMPAIGN`;
      modeBadge.style.color = modeConfig.color;
      modeBadge.style.borderColor = `${modeConfig.color}88`;
    }

    const titleEl = document.getElementById('victory-title');
    const descEl = document.getElementById('victory-desc');
    if (modeConfig && titleEl && descEl) {
      if (modeConfig.id === 'hard') {
        titleEl.innerText = 'VETERAN CAMPAIGN CONQUERED!';
        descEl.innerText = 'All 30 brutal enemy assault waves and Dual Dark Warlords were routed by royal forces!';
      } else if (modeConfig.id === 'nightmare') {
        titleEl.innerText = 'IRON CHALLENGE TRIUMPH!';
        descEl.innerText = 'Legendary flawless victory! 1-HP realm defended against 35 apocalyptic waves of horrors!';
      } else if (modeConfig.id === 'blitz') {
        titleEl.innerText = 'BLITZ HORDE CRUSHED!';
        descEl.innerText = 'Swift tactical execution crushed 20 hyper-accelerated enemy swarms!';
      } else {
        titleEl.innerText = 'ROYAL VICTORY ACHIEVED!';
        descEl.innerText = 'The Kingdom stands triumphant! All monstrous invaders and warlords have been routed!';
      }
    }

    const recordBanner = document.getElementById('victory-record-banner');
    if (recordBanner && record) {
      if (record.isNewHighScore) {
        recordBanner.innerHTML = `🏆 NEW ALL-TIME RECORD HONOR: ${record.highScore.toLocaleString()}!`;
        recordBanner.classList.remove('hidden');
      } else {
        recordBanner.innerHTML = `All-Time Record: ${record.highScore.toLocaleString()} pts`;
        recordBanner.classList.remove('hidden');
      }
    }

    this.modalVictory.classList.remove('hidden');
  }
}

window.UIManager = UIManager;
