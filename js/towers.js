/**
 * KINGDOM RUSH: FRONTIER DEFENSE - Towers & Projectiles System
 */

class Projectile {
  constructor(type, startX, startY, target, damage, speed, tower) {
    this.type = type; // 'arrow', 'magic_bolt', 'cannonball', 'cluster_bomb', 'dragonfire'
    this.x = startX;
    this.y = startY;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.tower = tower;
    this.isDead = false;

    this.splashRadius = tower.splashRadius || 0;
    this.angle = Math.atan2(target.y - startY, target.x - startX);

    // Parabolic Arc setup for Artillery Cannonballs & Arrows
    if (this.type === 'cannonball' || this.type === 'cluster_bomb') {
      this.startX = startX;
      this.startY = startY;
      this.targetX = target.x;
      this.targetY = target.y;
      const totalDist = Math.hypot(this.targetX - startX, this.targetY - startY);
      this.totalTime = Math.max(0.55, totalDist / speed);
      this.elapsedTime = 0;
      this.peakHeight = Math.min(160, totalDist * 0.45);
    }
  }

  update(dt, allEnemies) {
    if (this.isDead) return;

    if (this.type === 'arrow') {
      // Fast guided arrow
      if (this.target && !this.target.isDead) {
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      }
      this.x += Math.cos(this.angle) * this.speed * dt;
      this.y += Math.sin(this.angle) * this.speed * dt;

      // Check impact
      if (this.target && !this.target.isDead) {
        if (Math.hypot(this.target.x - this.x, this.target.y - this.y) <= this.target.radius + 8) {
          this.hit(this.target);
          return;
        }
      } else {
        for (const enemy of allEnemies) {
          if (!enemy.isDead && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= enemy.radius + 8) {
            this.hit(enemy);
            return;
          }
        }
      }

      // Out of bounds
      if (this.x < 0 || this.x > CONFIG.CANVAS_WIDTH || this.y < 0 || this.y > CONFIG.CANVAS_HEIGHT) {
        this.isDead = true;
      }
    } else if (this.type === 'magic_bolt') {
      // Homing Arcane Bolt
      if (this.target && !this.target.isDead) {
        const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        let diff = targetAngle - this.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += Math.max(-8 * dt, Math.min(8 * dt, diff));
      }

      this.x += Math.cos(this.angle) * this.speed * dt;
      this.y += Math.sin(this.angle) * this.speed * dt;

      window.particleEngine.createSparks(this.x, this.y, '#c084fc', 1);

      if (this.target && !this.target.isDead) {
        if (Math.hypot(this.target.x - this.x, this.target.y - this.y) <= this.target.radius + 10) {
          this.hitMagic(this.target);
          return;
        }
      } else {
        this.isDead = true;
      }
    } else if (this.type === 'cannonball' || this.type === 'cluster_bomb') {
      // Parabolic Arc Lob
      this.elapsedTime += dt;
      const progress = Math.min(1.0, this.elapsedTime / this.totalTime);

      const linearX = this.startX + (this.targetX - this.startX) * progress;
      const linearY = this.startY + (this.targetY - this.startY) * progress;
      const arcOffset = Math.sin(progress * Math.PI) * this.peakHeight;

      this.x = linearX;
      this.y = linearY - arcOffset;

      if (progress >= 1.0) {
        this.detonateBomb(allEnemies);
        this.isDead = true;
      }
    }
  }

  hit(enemy) {
    this.isDead = true;
    window.soundEngine.playArrowHit();

    // Ranger Hideout Poison
    if (this.tower.isRanger) {
      enemy.applyPoison(16, 3.5);
    }

    // Musketeer Sniper Shot Instakill chance (5% on non-boss)
    if (this.tower.isMusketeer && !enemy.isBoss && Math.random() < 0.08) {
      window.particleEngine.addFloater('HEADSHOT!', enemy.x, enemy.y - 18, '#ef4444', 16, true);
      enemy.applyDamage(9999, 'physical', true);
      return;
    }

    enemy.applyDamage(this.damage, 'physical');
    this.tower.recordDamage(this.damage);
  }

  hitMagic(enemy) {
    this.isDead = true;
    window.soundEngine.playMagicHit();

    // Arcane Wizard Disintegration Ray chance
    if (this.tower.isArcane && !enemy.isBoss && Math.random() < 0.05) {
      window.particleEngine.addFloater('DISINTEGRATE!', enemy.x, enemy.y - 18, '#c084fc', 16, true);
      enemy.applyDamage(9999, 'magic', true);
      return;
    }

    enemy.applyDamage(this.damage, 'magic');
    this.tower.recordDamage(this.damage);
  }

  detonateBomb(allEnemies) {
    window.soundEngine.playExplosion(false);
    window.particleEngine.createExplosion(this.targetX, this.targetY, '#f97316', 28, 140);
    window.particleEngine.addShockwave(this.targetX, this.targetY, '#f97316', this.splashRadius, 0.4);

    let totalDealt = 0;
    allEnemies.forEach(e => {
      // Artillery cannot hit flying units!
      if (!e.isDead && !e.isFlying) {
        const d = Math.hypot(e.x - this.targetX, e.y - this.targetY);
        if (d <= this.splashRadius) {
          const falloff = 1 - (d / this.splashRadius) * 0.4;
          const dmg = Math.round(this.damage * falloff);
          e.applyDamage(dmg, 'physical');
          totalDealt += dmg;
        }
      }
    });

    this.tower.recordDamage(totalDealt);
  }

  draw(ctx) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'arrow') {
      ctx.rotate(this.angle);
      // Wooden shaft
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(4, -3);
      ctx.lineTo(4, 3);
      ctx.closePath();
      ctx.fill();

      // Feathers (Fletching)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-8, -2, 3, 4);
    } else if (this.type === 'magic_bolt') {
      ctx.rotate(this.angle);
      // Glowing purple orb
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // Magic halo
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (this.type === 'cannonball' || this.type === 'cluster_bomb') {
      // Heavy iron cannonball
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}

class Tower {
  constructor(typeKey, col, row) {
    const config = CONFIG.TOWERS[typeKey];
    this.typeKey = typeKey;
    this.name = config.name;
    this.category = config.category;
    this.col = col;
    this.row = row;

    this.x = col * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
    this.y = row * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;

    this.level = 1;
    this.totalInvested = config.cost;

    this.baseRange = config.baseRange;
    this.baseDamage = config.baseDamage;
    this.baseFireRate = config.baseFireRate;
    this.projectileType = config.projectileType;
    this.projectileSpeed = config.projectileSpeed || 500;
    this.splashRadius = config.splashRadius || 0;
    this.color = config.color;
    this.accentColor = config.accentColor;

    this.targetStrategy = 'FIRST';
    this.cooldown = 0;
    this.angle = 0;
    this.totalDamageDealt = 0;
    this.totalKills = 0;

    // Kingdom Rush Specializations
    this.isRanger = false;
    this.isMusketeer = false;
    this.isArcane = false;
    this.isSorcerer = false;
    this.isBertha = false;
    this.isTesla = false;

    // Barracks Soldier Garrison
    this.isBarracks = (typeKey === 'barracks');
    this.soldiers = [];
    this.rallyX = this.x;
    this.rallyY = this.y;

    if (this.isBarracks) {
      this.initBarracks();
    }

    this.disabledTimer = 0;
    this.overchargeTimer = 0;
    this.overchargeMultiplier = 1.0;

    this.recalculateStats();
  }

  initBarracks() {
    // Find nearest point along the road to place initial rally point
    const map = window.mapManager.getCurrentMap();
    let bestDist = Infinity;
    let rx = this.x;
    let ry = this.y;

    if (map && map.paths) {
      map.paths.forEach(p => {
        p.forEach(wp => {
          const wpx = wp.col * CONFIG.CELL_SIZE + 20;
          const wpy = wp.row * CONFIG.CELL_SIZE + 20;
          const d = Math.hypot(wpx - this.x, wpy - this.y);
          if (d < bestDist && d <= this.baseRange) {
            bestDist = d;
            rx = wpx;
            ry = wpy;
          }
        });
      });
    }

    this.rallyX = rx;
    this.rallyY = ry;

    // Spawn 3 soldiers
    this.soldiers = [
      new Soldier('militia', rx, ry, this, 0),
      new Soldier('militia', rx, ry, this, 1),
      new Soldier('militia', rx, ry, this, 2)
    ];
  }

  setRallyPoint(rx, ry) {
    this.rallyX = rx;
    this.rallyY = ry;
    this.soldiers.forEach(s => s.setRallyPoint(rx, ry));
    window.soundEngine.playRallyHorn();
    window.particleEngine.addShockwave(rx, ry, '#3b82f6', 45, 0.4);
    window.particleEngine.addFloater('RALLY POINT SET!', rx, ry - 18, '#3b82f6', 13, true);
  }

  recalculateStats() {
    const config = CONFIG.TOWERS[this.typeKey];
    this.range = this.baseRange;
    this.damage = this.baseDamage;
    this.fireRate = this.baseFireRate;

    for (let l = 2; l <= this.level; l++) {
      const up = config.upgrades[l - 2];
      if (up) {
        this.range += up.rangeBonus;
        this.damage += up.damageBonus;
        this.fireRate += up.fireRateBonus;
      }
    }

    // Upgrade soldiers if barracks
    if (this.isBarracks) {
      let soldierType = 'militia';
      if (this.level === 2) soldierType = 'footman';
      else if (this.level === 3) soldierType = 'knight';
      else if (this.level >= 4) soldierType = 'paladin';

      this.soldiers.forEach(s => {
        s.type = soldierType;
        s.initStats();
      });
    }

    if (this.typeKey === 'archer' && this.level >= 4) this.isRanger = true;
    if (this.typeKey === 'mage' && this.level >= 4) this.isArcane = true;
    if (this.typeKey === 'artillery' && this.level >= 4) this.isBertha = true;
  }

  getUpgradeInfo() {
    const config = CONFIG.TOWERS[this.typeKey];
    if (this.level >= 4) return null;
    return config.upgrades[this.level - 1];
  }

  upgrade() {
    const upInfo = this.getUpgradeInfo();
    if (!upInfo) return false;

    this.level++;
    this.totalInvested += upInfo.cost;
    this.recalculateStats();
    window.soundEngine.playUpgrade();
    window.particleEngine.addShockwave(this.x, this.y, '#facc15', 60, 0.5);
    window.particleEngine.addFloater(`LEVEL ${this.level} UPGRADE!`, this.x, this.y - 20, '#facc15', 14, true);
    return true;
  }

  getSellValue() {
    return Math.round(this.totalInvested * 0.75);
  }

  disable(duration) {
    this.disabledTimer = Math.max(this.disabledTimer, duration);
    window.particleEngine.addFloater('SHACKLED', this.x, this.y - 15, '#c084fc', 12, true);
  }

  applyOvercharge(multiplier, duration) {
    this.overchargeMultiplier = multiplier;
    this.overchargeTimer = duration;
    window.particleEngine.addFloater('HASTE AURA', this.x, this.y - 15, '#facc15', 13, true);
  }

  recordDamage(amount) {
    this.totalDamageDealt += amount;
  }

  cycleTargetStrategy() {
    const strategies = ['FIRST', 'LAST', 'STRONGEST', 'WEAKEST', 'CLOSEST'];
    const idx = strategies.indexOf(this.targetStrategy);
    this.targetStrategy = strategies[(idx + 1) % strategies.length];
  }

  findTarget(enemies) {
    const inRange = enemies.filter(e => {
      if (e.isDead) return false;
      // Artillery cannot target flying enemies
      if (this.typeKey === 'artillery' && e.isFlying) return false;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      return d <= this.range + e.radius;
    });

    if (inRange.length === 0) return null;

    switch (this.targetStrategy) {
      case 'FIRST':
        return inRange.reduce((prev, curr) => (curr.distanceTraveled > prev.distanceTraveled ? curr : prev));
      case 'LAST':
        return inRange.reduce((prev, curr) => (curr.distanceTraveled < prev.distanceTraveled ? curr : prev));
      case 'STRONGEST':
        return inRange.reduce((prev, curr) => (curr.hp > prev.hp ? curr : prev));
      case 'WEAKEST':
        return inRange.reduce((prev, curr) => (curr.hp < prev.hp ? curr : prev));
      case 'CLOSEST':
        return inRange.reduce((prev, curr) => {
          const dp = Math.hypot(prev.x - this.x, prev.y - this.y);
          const dc = Math.hypot(curr.x - this.x, curr.y - this.y);
          return dc < dp ? curr : prev;
        });
      default:
        return inRange[0];
    }
  }

  update(dt, enemies, projectiles) {
    // 1. Barracks Soldier Update
    if (this.isBarracks) {
      this.soldiers.forEach(s => s.update(dt, enemies));
      return;
    }

    // 2. Disables
    if (this.disabledTimer > 0) {
      this.disabledTimer -= dt;
      return;
    }

    // 3. Overcharge timer
    if (this.overchargeTimer > 0) {
      this.overchargeTimer -= dt;
      if (this.overchargeTimer <= 0) this.overchargeMultiplier = 1.0;
    }

    // 4. Cooldown
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }

    // 5. Target Acquisition
    const target = this.findTarget(enemies);
    if (!target) return;

    this.angle = Math.atan2(target.y - this.y, target.x - this.x);

    // 6. Fire Weapon
    if (this.cooldown <= 0) {
      const effectiveRate = this.fireRate * this.overchargeMultiplier;
      this.cooldown = 1 / effectiveRate;
      this.fire(target, projectiles);
    }
  }

  fire(target, projectiles) {
    if (this.typeKey === 'archer') {
      window.soundEngine.playBowShot();
      projectiles.push(new Projectile('arrow', this.x, this.y - 12, target, this.damage, this.projectileSpeed, this));
    } else if (this.typeKey === 'mage') {
      window.soundEngine.playMagicZap();
      projectiles.push(new Projectile('magic_bolt', this.x, this.y - 14, target, this.damage, this.projectileSpeed, this));
    } else if (this.typeKey === 'artillery') {
      window.soundEngine.playCannonShot();
      projectiles.push(new Projectile('cannonball', this.x, this.y - 8, target, this.damage, this.projectileSpeed, this));
    }
  }

  draw(ctx, isSelected = false, isHovered = false) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Draw Range Preview Circle
    if (isSelected || isHovered) {
      ctx.save();
      ctx.strokeStyle = isSelected ? 'rgba(250, 204, 21, 0.75)' : 'rgba(56, 189, 248, 0.45)';
      ctx.fillStyle = isSelected ? 'rgba(250, 204, 21, 0.08)' : 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, this.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // If barracks, draw line to rally point and rally flag
      if (this.isBarracks) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.rallyX - this.x, this.rallyY - this.y);
        ctx.stroke();

        // Draw Rally Flag
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(this.rallyX - this.x - 2, this.rallyY - this.y - 16, 4, 16);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(this.rallyX - this.x + 2, this.rallyY - this.y - 16);
        ctx.lineTo(this.rallyX - this.x + 12, this.rallyY - this.y - 11);
        ctx.lineTo(this.rallyX - this.x + 2, this.rallyY - this.y - 6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Tower Stone Foundation Base
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(0, 10, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Tower Unique Architecture
    if (this.typeKey === 'archer') {
      // Wooden watchtower with slate roof
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-10, -12, 20, 22);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-12, -15, 24, 5);

      // Green Tile Roof
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(-15, -15);
      ctx.lineTo(0, -28);
      ctx.lineTo(15, -15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#065f46';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Twin Archer Lookout
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(-4, -13, 3, 0, Math.PI * 2);
      ctx.arc(4, -13, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.typeKey === 'barracks') {
      // Stone Fortification with Royal Blue Banners
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-12, -14, 24, 24);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -14, 24, 24);

      // Crenellations
      ctx.fillStyle = '#475569';
      ctx.fillRect(-12, -18, 6, 5);
      ctx.fillRect(-3, -18, 6, 5);
      ctx.fillRect(6, -18, 6, 5);

      // Blue Shield Heraldry
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(-5, -8, 10, 12, 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, -3, 8, 2);
      ctx.fillRect(-1, -6, 2, 8);
    } else if (this.typeKey === 'mage') {
      // Tall Arcane Spire with glowing crystal
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-8, 10);
      ctx.lineTo(-5, -18);
      ctx.lineTo(5, -18);
      ctx.lineTo(8, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spire Roof
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.moveTo(-9, -18);
      ctx.lineTo(0, -30);
      ctx.lineTo(9, -18);
      ctx.closePath();
      ctx.fill();

      // Floating Glowing Arcane Orb
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, -32, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (this.typeKey === 'artillery') {
      // Dwarven Bombard Iron Turret
      ctx.fillStyle = '#334155';
      ctx.fillRect(-12, -8, 24, 18);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -8, 24, 18);

      // Rotating Heavy Mortar Barrel
      ctx.save();
      ctx.rotate(this.angle);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -6, 18, 12);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(16, -5, 4, 10);
      ctx.restore();
    }

    // 4. Level Stars
    ctx.fillStyle = '#facc15';
    for (let s = 0; s < this.level; s++) {
      ctx.beginPath();
      ctx.arc(-8 + s * 5.5, -22, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 5. Draw Soldiers if Barracks
    if (this.isBarracks) {
      this.soldiers.forEach(s => s.draw(ctx));
    }
  }
}

window.Projectile = Projectile;
window.Tower = Tower;
