/**
 * KINGDOM RUSH: FRONTIER DEFENSE - Enemy AI & Unit System
 */

class Enemy {
  constructor(typeKey, pathIndex = 0, waveNum = 1, modeConfig = null) {
    const config = CONFIG.ENEMIES[typeKey] || CONFIG.ENEMIES.goblin;
    this.typeKey = typeKey;
    this.name = config.name;
    this.type = config.type;
    this.pathIndex = pathIndex;
    this.waveNum = waveNum;
    this.modeConfig = modeConfig;

    // HP Scaling
    const hpGrowth = config.isBoss ? (config.hpPerWave * Math.pow(1.14, waveNum - 1)) : (config.hpPerWave * (waveNum - 1));
    const modeHpMult = (modeConfig && modeConfig.hpMultiplier) ? modeConfig.hpMultiplier : 1.0;
    const endlessHpFactor = (modeConfig && modeConfig.isEndless && waveNum > 25) ? Math.pow(1.065, waveNum - 25) : 1.0;
    this.maxHp = Math.max(10, Math.round((config.baseHp + hpGrowth) * modeHpMult * endlessHpFactor));
    this.hp = this.maxHp;

    // Speed Scaling
    const modeSpeedMult = (modeConfig && modeConfig.speedMultiplier) ? modeConfig.speedMultiplier : 1.0;
    const endlessSpeedFactor = (modeConfig && modeConfig.isEndless && waveNum > 25) ? Math.min(1.4, 1 + (waveNum - 25) * 0.006) : 1.0;
    this.baseSpeed = Math.round(config.speed * modeSpeedMult * endlessSpeedFactor);
    this.speed = this.baseSpeed;

    this.radius = config.radius;
    this.color = config.color;
    this.shape = config.shape;
    this.bounty = Math.max(1, Math.round(config.bounty * (1 + waveNum * 0.04)));

    // Score Scaling
    const scoreMult = (modeConfig && modeConfig.scoreMultiplier) ? modeConfig.scoreMultiplier : 1.0;
    this.score = Math.max(1, Math.round(config.score * scoreMult));

    // Resistances
    const armorBonus = (modeConfig && modeConfig.armorBonus) ? modeConfig.armorBonus : 0;
    this.armor = Math.min(0.85, (config.armor || 0) + armorBonus); // Physical armor
    this.magicResist = config.magicResist || 0;                    // Magic resistance

    // Flying flag
    this.isFlying = !!config.isFlying;
    this.isBoss = !!config.isBoss;

    // Melee attack damage against soldiers/hero
    this.damage = config.damage || 5;
    this.attackInterval = 1.2;
    this.attackTimer = Math.random() * 0.8;

    // Blocking State
    this.isBlocked = false;
    this.blockedBy = null; // Soldier or Hero instance

    // Special traits
    this.isPhaseable = !!config.isPhaseable; // Brigand evasion
    this.phaseTimer = 0;
    this.isPhased = false;

    this.regenRate = config.regenRate || 0; // Troll regeneration
    this.healInterval = config.healInterval || 0; // Shaman heal ward
    this.healTimer = 0;
    this.healAmount = config.healAmount || 25;

    this.summonInterval = config.summonInterval || 0; // Necromancer summon
    this.summonTimer = 0;

    this.groundSlamInterval = config.groundSlamInterval || 0; // Juggernaut ground slam
    this.slamTimer = 0;

    this.empInterval = config.empInterval || 0; // Vez'nan soul shackles
    this.empTimer = 0;

    // Path position
    this.distanceTraveled = 0;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.reachedEnd = false;
    this.isDead = false;

    // Status Effects
    this.slowTimer = 0;
    this.slowFactor = 0;
    this.freezeTimer = 0;
    this.stunTimer = 0;
    this.burnTimer = 0;
    this.burnDps = 0;
    this.burnTickTimer = 0;
    this.poisonTimer = 0;
    this.poisonDps = 0;

    this.animTimer = Math.random() * Math.PI * 2;
    this.hitFlashTimer = 0;

    this.updatePosition();
  }

  updatePosition() {
    const pos = window.mapManager.getPositionAlongPath(this.pathIndex, this.distanceTraveled);
    this.x = pos.x;
    this.y = pos.y;
    this.angle = pos.angle;
    this.reachedEnd = pos.reachedEnd;
  }

  applyDamage(amount, damageType = 'physical', canCrit = false) {
    if (this.isDead) return;

    // Brigand shadow evasion
    if (this.isPhased) {
      window.particleEngine.addFloater('EVADED', this.x, this.y - 12, '#c084fc', 11);
      return;
    }

    let finalDamage = amount;

    // 1. Physical Armor reduction (vs arrows, artillery, soldiers, hero)
    if (damageType === 'physical') {
      if (this.armor > 0) {
        finalDamage *= (1 - this.armor);
      }
    }

    // 2. Magic Resistance reduction (vs mage bolts)
    if (damageType === 'magic') {
      if (this.magicResist > 0) {
        finalDamage *= (1 - this.magicResist);
      }
      // Magic deals bonus against heavy physical armor!
      if (this.armor >= 0.5) {
        finalDamage *= 1.25;
      }
    }

    // 3. True / Pure / Thermal damage ignores armor entirely
    finalDamage = Math.max(1, Math.round(finalDamage));
    this.hp -= finalDamage;
    this.hitFlashTimer = 0.08;

    // Floating combat text
    const isBig = finalDamage >= 45 || canCrit;
    const floaterColor = canCrit ? '#fb923c' : (damageType === 'magic' ? '#c084fc' : (damageType === 'physical' ? '#fef08a' : '#f97316'));
    window.particleEngine.addFloater(
      canCrit ? `CRIT ${finalDamage}` : `${finalDamage}`,
      this.x,
      this.y - this.radius,
      floaterColor,
      isBig ? 14 : 11,
      canCrit
    );

    if (this.hp <= 0) {
      this.die();
    }
  }

  applySlow(slowFactor, duration) {
    if (this.slowFactor < slowFactor || this.slowTimer <= 0) {
      this.slowFactor = slowFactor;
      this.slowTimer = duration;
    }
  }

  applyStun(duration) {
    this.stunTimer = Math.max(this.stunTimer, duration);
    window.particleEngine.addFloater('STUNNED', this.x, this.y - 10, '#facc15', 12, true);
  }

  applyBurn(dps, duration) {
    this.burnDps = Math.max(this.burnDps, dps);
    this.burnTimer = Math.max(this.burnTimer, duration);
  }

  applyPoison(dps, duration) {
    this.poisonDps = Math.max(this.poisonDps, dps);
    this.poisonTimer = Math.max(this.poisonTimer, duration);
  }

  die() {
    this.isDead = true;
    if (this.blockedBy) {
      if (this.blockedBy.targetEnemy === this) this.blockedBy.targetEnemy = null;
      if (this.blockedBy.targetEnemies) {
        this.blockedBy.targetEnemies = this.blockedBy.targetEnemies.filter(e => e !== this);
      }
      this.blockedBy = null;
      this.isBlocked = false;
    }

    window.soundEngine.playExplosion(this.isBoss);
    window.particleEngine.createExplosion(this.x, this.y, this.color, this.isBoss ? 48 : 20, this.isBoss ? 220 : 120);
  }

  update(dt, allEnemies = [], allTowers = [], allSoldiers = [], hero = null) {
    if (this.isDead) return;
    this.animTimer += dt * 4;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Stun check
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return;
    }

    // Troll health regeneration
    if (this.regenRate > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
    }

    // Shaman healing ward
    if (this.healInterval > 0) {
      this.healTimer += dt;
      if (this.healTimer >= this.healInterval) {
        this.healTimer = 0;
        this.castHealWard(allEnemies);
      }
    }

    // Necromancer summon skeleton
    if (this.summonInterval > 0) {
      this.summonTimer += dt;
      if (this.summonTimer >= this.summonInterval) {
        this.summonTimer = 0;
        this.summonSkeleton(allEnemies);
      }
    }

    // Boss Juggernaut ground slam
    if (this.groundSlamInterval > 0) {
      this.slamTimer += dt;
      if (this.slamTimer >= this.groundSlamInterval) {
        this.slamTimer = 0;
        this.executeGroundSlam(allSoldiers, hero);
      }
    }

    // Boss Vez'nan soul shackles
    if (this.empInterval > 0) {
      this.empTimer += dt;
      if (this.empTimer >= this.empInterval) {
        this.empTimer = 0;
        this.castSoulShackles(allTowers);
      }
    }

    // Brigand shadow evasion cycle
    if (this.isPhaseable) {
      this.phaseTimer += dt;
      this.isPhased = (this.phaseTimer % 4.0 > 2.8);
    }

    // Burning DoT (from Rain of Fire meteors)
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer += dt;
      if (this.burnTickTimer >= 0.25) {
        this.burnTickTimer = 0;
        this.applyDamage(this.burnDps * 0.25, 'true');
        window.particleEngine.createSparks(this.x, this.y, '#f97316', 2);
      }
    }

    // Poison DoT (from Ranger Hideout)
    if (this.poisonTimer > 0) {
      this.poisonTimer -= dt;
      this.applyDamage(this.poisonDps * dt, 'true');
      if (Math.random() < 0.2) window.particleEngine.createSparks(this.x, this.y, '#10b981', 1);
    }

    // Check if engaged in melee combat with a Soldier or Hero
    if (this.isBlocked && this.blockedBy && !this.blockedBy.isDead) {
      // Fighting the blocking soldier or hero!
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = this.attackInterval;
        this.blockedBy.takeDamage(this.damage, 'physical');
      }
      return; // Stop moving along the road while blocked!
    } else {
      this.isBlocked = false;
      this.blockedBy = null;
    }

    // Move along path
    let currentSpeed = this.baseSpeed;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      currentSpeed *= (1 - this.slowFactor);
    }

    this.distanceTraveled += currentSpeed * dt;
    this.updatePosition();
  }

  castHealWard(allEnemies) {
    window.soundEngine.playMagicZap();
    window.particleEngine.addShockwave(this.x, this.y, '#06b6d4', 80, 0.4);
    window.particleEngine.addFloater('HEALING WARD!', this.x, this.y - 18, '#06b6d4', 12, true);

    allEnemies.forEach(other => {
      if (!other.isDead && Math.hypot(other.x - this.x, other.y - this.y) <= 80) {
        other.hp = Math.min(other.maxHp, other.hp + this.healAmount);
        window.particleEngine.createSparks(other.x, other.y, '#06b6d4', 3);
      }
    });
  }

  summonSkeleton(allEnemies) {
    window.soundEngine.playUpgrade();
    window.particleEngine.addShockwave(this.x, this.y, '#6b21a8', 60, 0.4);
    window.particleEngine.addFloater('RISE!', this.x, this.y - 18, '#c084fc', 12, true);

    const skel = new Enemy('skeleton', this.pathIndex, this.waveNum, this.modeConfig);
    skel.distanceTraveled = Math.max(0, this.distanceTraveled - 20);
    skel.updatePosition();
    allEnemies.push(skel);
  }

  executeGroundSlam(allSoldiers, hero) {
    window.soundEngine.playEMP();
    window.abilityManager.triggerScreenShake(0.6, 10);
    window.particleEngine.addShockwave(this.x, this.y, '#b91c1c', 160, 0.6);
    window.particleEngine.addFloater('SEISMIC SLAM!', this.x, this.y - 28, '#ef4444', 16, true);

    allSoldiers.forEach(s => {
      if (!s.isDead && Math.hypot(s.x - this.x, s.y - this.y) <= 120) {
        s.takeDamage(40, 'physical');
      }
    });

    if (hero && !hero.isDead && Math.hypot(hero.x - this.x, hero.y - this.y) <= 120) {
      hero.takeDamage(55, 'physical');
    }
  }

  castSoulShackles(allTowers) {
    window.soundEngine.playEMP();
    window.particleEngine.addShockwave(this.x, this.y, '#581c87', 220, 0.7);
    window.particleEngine.addFloater('SOUL SHACKLES!', this.x, this.y - 25, '#c084fc', 16, true);

    // Disable closest 3 towers for 4.0s
    const sorted = [...allTowers].sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y));
    sorted.slice(0, 3).forEach(t => t.disable(4.0));
  }

  draw(ctx) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Evasion transparency
    if (this.isPhased) {
      ctx.globalAlpha = 0.35;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, this.isFlying ? 12 : 5, this.radius * 0.9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Direction rotation
    ctx.rotate(this.angle);

    const bodyColor = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
    const bob = Math.sin(this.animTimer) * (this.isFlying ? 3 : 1.5);

    switch (this.shape) {
      case 'goblin':
        // Small green scout
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3f6212';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Ears
        ctx.fillStyle = '#65a30d';
        ctx.beginPath();
        ctx.moveTo(-6, -8 + bob);
        ctx.lineTo(-12, -14 + bob);
        ctx.lineTo(-4, -4 + bob);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-6, 8 + bob);
        ctx.lineTo(-12, 14 + bob);
        ctx.lineTo(-4, 4 + bob);
        ctx.fill();
        break;

      case 'orc':
        // Muscular green warrior
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(-this.radius, -this.radius + bob, this.radius * 2, this.radius * 2, 4);
        ctx.fill();
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Spiked pauldrons
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-this.radius * 0.4, -this.radius - 2 + bob, this.radius * 0.8, 3);
        ctx.fillRect(-this.radius * 0.4, this.radius - 1 + bob, this.radius * 0.8, 3);
        break;

      case 'dark_knight':
        // Steel plate juggernaut
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-this.radius, -this.radius + bob, this.radius * 2, this.radius * 2);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-this.radius, -this.radius + bob, this.radius * 2, this.radius * 2);
        // Horned helm
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(this.radius, -4 + bob);
        ctx.lineTo(this.radius + 6, -10 + bob);
        ctx.lineTo(this.radius - 2, 0 + bob);
        ctx.fill();
        break;

      case 'shaman':
        // Robed caster
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Antlers / Feather mask
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-4, -this.radius - 4 + bob, 8, 4);
        break;

      case 'gargoyle':
        // Flapping winged beast
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, bob, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#581c87';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Wings flapping
        const wingSpread = 8 + Math.sin(this.animTimer * 2) * 6;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(0, -this.radius * 0.5 + bob);
        ctx.lineTo(-this.radius * 0.8, -this.radius - wingSpread + bob);
        ctx.lineTo(this.radius * 0.4, -this.radius * 0.3 + bob);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, this.radius * 0.5 + bob);
        ctx.lineTo(-this.radius * 0.8, this.radius + wingSpread + bob);
        ctx.lineTo(this.radius * 0.4, this.radius * 0.3 + bob);
        ctx.fill();
        break;

      case 'troll':
        // Giant brute
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(-this.radius, -this.radius + bob, this.radius * 2, this.radius * 2, 8);
        ctx.fill();
        ctx.strokeStyle = '#065f46';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Massive Club
        ctx.fillStyle = '#78350f';
        ctx.fillRect(this.radius * 0.4, -this.radius - 4 + bob, 8, 5);
        break;

      case 'skeleton':
        // Bone warrior
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;

      case 'boss_juggernaut':
      case 'boss_veznan':
        // Epic Boss Octagon with glowing runes
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const r = (i % 2 === 0) ? this.radius : this.radius * 0.8;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r + bob;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, bob, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // Health Bar with Resistance Badges
    this.drawHealthBar(ctx);
  }

  drawHealthBar(ctx) {
    const barW = Math.max(26, this.radius * 2);
    const barH = this.isBoss ? 6 : 4;
    const barX = this.x - barW / 2;
    const barY = this.y - this.radius - (this.isBoss ? 16 : 9);

    ctx.save();
    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    ctx.fillStyle = ratio > 0.5 ? '#10b981' : (ratio > 0.25 ? '#facc15' : '#ef4444');
    ctx.fillRect(barX, barY, barW * ratio, barH);

    // Resistance Icons beside health bar
    if (this.armor >= 0.5) {
      ctx.fillStyle = '#38bdf8'; // Physical shield badge
      ctx.fillRect(barX - 5, barY, 3, barH);
    }
    if (this.magicResist >= 0.4) {
      ctx.fillStyle = '#c084fc'; // Magic shield badge
      ctx.fillRect(barX + barW + 2, barY, 3, barH);
    }

    // Boss Nameplate
    if (this.isBoss) {
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.fillText(`${this.name} [${this.hp}/${this.maxHp}]`, this.x, barY - 4);
    }

    ctx.restore();
  }
}

window.Enemy = Enemy;
