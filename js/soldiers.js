/**
 * KINGDOM RUSH: FRONTIER DEFENSE - Soldier & Melee Combat System
 */

class Soldier {
  constructor(type, x, y, tower = null, slotIndex = 0) {
    this.type = type; // 'militia', 'footman', 'knight', 'paladin', 'barbarian', 'farmer' (reinforcement), 'elemental'
    this.tower = tower;
    this.slotIndex = slotIndex;

    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;

    // Formation offset around rally point
    const offsets = [
      { x: -14, y: -10 },
      { x: 14, y: -10 },
      { x: 0, y: 14 }
    ];
    this.offset = offsets[slotIndex % offsets.length];

    this.targetEnemy = null;
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnDuration = 10.0;

    // Temporary reinforcement expiration
    this.isTemporary = (type === 'farmer');
    this.lifeTimer = this.isTemporary ? 22.0 : Infinity;

    this.attackTimer = Math.random() * 0.5;
    this.walkAnim = Math.random() * Math.PI * 2;
    this.facing = 1; // 1 = right, -1 = left

    this.initStats();
  }

  initStats() {
    switch (this.type) {
      case 'militia':
        this.maxHp = 60;
        this.damageMin = 2;
        this.damageMax = 4;
        this.armor = 0; // 0%
        this.speed = 65;
        this.attackInterval = 1.0;
        this.name = 'Militia';
        break;

      case 'footman':
        this.maxHp = 120;
        this.damageMin = 4;
        this.damageMax = 7;
        this.armor = 0.25; // 25% physical damage reduction
        this.speed = 65;
        this.attackInterval = 1.0;
        this.name = 'Footman';
        break;

      case 'knight':
        this.maxHp = 200;
        this.damageMin = 8;
        this.damageMax = 13;
        this.armor = 0.50; // 50%
        this.speed = 60;
        this.attackInterval = 1.0;
        this.name = 'Knight';
        break;

      case 'paladin':
        this.maxHp = 320;
        this.damageMin = 14;
        this.damageMax = 22;
        this.armor = 0.75; // 75% heavy plate armor!
        this.speed = 60;
        this.attackInterval = 1.1;
        this.name = 'Holy Paladin';
        this.healCooldown = 4.0;
        this.healTimer = 2.0;
        break;

      case 'barbarian':
        this.maxHp = 300;
        this.damageMin = 20;
        this.damageMax = 32;
        this.armor = 0.20;
        this.speed = 70;
        this.attackInterval = 0.85;
        this.name = 'Barbarian Berserker';
        break;

      case 'elemental':
        this.maxHp = 500;
        this.damageMin = 30;
        this.damageMax = 50;
        this.armor = 0.50;
        this.speed = 50;
        this.attackInterval = 1.4;
        this.name = 'Earth Elemental';
        break;

      case 'farmer': // Call Reinforcements spell
      default:
        this.maxHp = 70;
        this.damageMin = 3;
        this.damageMax = 5;
        this.armor = 0.10;
        this.speed = 75;
        this.attackInterval = 0.95;
        this.name = 'Farmer Militia';
        break;
    }
    this.hp = this.maxHp;
  }

  setRallyPoint(rx, ry) {
    this.homeX = rx;
    this.homeY = ry;
    if (this.targetEnemy) {
      this.disengage();
    }
  }

  getTargetDestination() {
    return {
      x: this.homeX + this.offset.x,
      y: this.homeY + this.offset.y
    };
  }

  disengage() {
    if (this.targetEnemy) {
      if (this.targetEnemy.blockedBy === this) {
        this.targetEnemy.blockedBy = null;
        this.targetEnemy.isBlocked = false;
      }
      this.targetEnemy = null;
    }
  }

  takeDamage(amount, damageType = 'physical') {
    if (this.isDead) return;

    let finalDmg = amount;
    if (damageType === 'physical' && this.armor > 0) {
      finalDmg *= (1 - this.armor);
    }
    finalDmg = Math.max(1, Math.round(finalDmg));

    this.hp -= finalDmg;
    window.particleEngine.addFloater(`-${finalDmg}`, this.x, this.y - 12, '#f87171', 11);
    window.particleEngine.createSparks(this.x, this.y, '#f87171', 2);

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.disengage();
    window.soundEngine.playSwordClash();
    window.particleEngine.createExplosion(this.x, this.y, '#94a3b8', 12, 60);

    if (this.isTemporary) {
      // Disappear permanently
      return;
    }

    this.respawnTimer = this.respawnDuration;
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    if (this.tower) {
      this.x = this.tower.x;
      this.y = this.tower.y;
    }
    window.particleEngine.addFloater('REINFORCEMENT!', this.x, this.y - 15, '#10b981', 12, true);
  }

  update(dt, enemies) {
    // 1. Temporary expiration for reinforcement spell
    if (this.isTemporary) {
      this.lifeTimer -= dt;
      if (this.lifeTimer <= 0) {
        this.die();
        return;
      }
    }

    // 2. Dead respawn handling
    if (this.isDead) {
      if (!this.isTemporary) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          this.respawn();
        }
      }
      return;
    }

    // 3. Paladin Holy Light healing aura
    if (this.type === 'paladin') {
      this.healTimer -= dt;
      if (this.healTimer <= 0) {
        this.healTimer = this.healCooldown;
        if (this.hp < this.maxHp) {
          this.hp = Math.min(this.maxHp, this.hp + 45);
          window.particleEngine.addFloater('+45 HP', this.x, this.y - 15, '#facc15', 12, true);
          window.particleEngine.createSparks(this.x, this.y, '#facc15', 5);
        }
      }
    }

    // 4. Melee combat engagement
    if (this.targetEnemy) {
      // Verify target validity
      if (this.targetEnemy.isDead || this.targetEnemy.reachedEnd) {
        this.disengage();
      } else {
        // Keep enemy locked in melee
        this.targetEnemy.isBlocked = true;
        this.targetEnemy.blockedBy = this;

        // Face towards enemy
        this.facing = (this.targetEnemy.x >= this.x) ? 1 : -1;

        // Move into close combat contact (20px)
        const dist = Math.hypot(this.targetEnemy.x - this.x, this.targetEnemy.y - this.y);
        if (dist > 22) {
          const angle = Math.atan2(this.targetEnemy.y - this.y, this.targetEnemy.x - this.x);
          this.x += Math.cos(angle) * this.speed * dt;
          this.y += Math.sin(angle) * this.speed * dt;
        }

        // Attack exchange
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackInterval;
          this.strikeEnemy(this.targetEnemy);
        }
        return;
      }
    }

    // 5. Not engaged: Scan for nearby passing ground enemies to block
    const dest = this.getTargetDestination();
    const distToHome = Math.hypot(dest.x - this.x, dest.y - this.y);

    // If near formation spot, search for enemies to intercept
    if (distToHome < 120) {
      const candidates = enemies.filter(e => {
        if (e.isDead || e.reachedEnd || e.isFlying || e.isPhased) return false;
        // Can engage if enemy is unblocked or only blocked by 1 unit
        if (e.blockedBy && e.blockedBy !== this) return false;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        return d <= 42; // Intercept radius
      });

      if (candidates.length > 0) {
        // Intercept enemy furthest along the path
        candidates.sort((a, b) => b.distanceTraveled - a.distanceTraveled);
        this.targetEnemy = candidates[0];
        this.targetEnemy.isBlocked = true;
        this.targetEnemy.blockedBy = this;
        window.soundEngine.playSwordClash();
        return;
      }
    }

    // 6. March towards formation rally point
    if (distToHome > 3) {
      const angle = Math.atan2(dest.y - this.y, dest.x - this.x);
      this.x += Math.cos(angle) * this.speed * dt;
      this.y += Math.sin(angle) * this.speed * dt;
      this.facing = Math.cos(angle) >= 0 ? 1 : -1;
      this.walkAnim += dt * 10;
    } else {
      this.x = dest.x;
      this.y = dest.y;
    }
  }

  strikeEnemy(enemy) {
    if (!enemy || enemy.isDead) return;

    window.soundEngine.playSwordClash();
    const rawDmg = Math.floor(this.damageMin + Math.random() * (this.damageMax - this.damageMin + 1));
    enemy.applyDamage(rawDmg, 'physical');

    // Visual melee slash sparks
    window.particleEngine.createSparks(enemy.x, enemy.y, '#ffffff', 4);

    // Barbarian Whirlwind AoE chance
    if (this.type === 'barbarian' && Math.random() < 0.3) {
      window.particleEngine.addShockwave(this.x, this.y, '#fb923c', 45, 0.3);
      window.particleEngine.addFloater('WHIRLWIND!', this.x, this.y - 18, '#fb923c', 12, true);
    }
  }

  draw(ctx) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Bobbing walk bounce
    const bob = Math.sin(this.walkAnim) * 2;

    // Unit Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paladin Holy Light Aura
    if (this.type === 'paladin') {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Direction flip
    ctx.scale(this.facing, 1);

    // Body armor & tunic
    let bodyColor = '#3b82f6';
    let shieldColor = '#94a3b8';
    let helmetColor = '#cbd5e1';

    if (this.type === 'militia') {
      bodyColor = '#854d0e';
      shieldColor = '#a16207';
      helmetColor = '#78350f';
    } else if (this.type === 'knight') {
      bodyColor = '#1e3a8a';
      shieldColor = '#38bdf8';
      helmetColor = '#f8fafc';
    } else if (this.type === 'paladin') {
      bodyColor = '#facc15';
      shieldColor = '#fef08a';
      helmetColor = '#fef08a';
    } else if (this.type === 'barbarian') {
      bodyColor = '#ea580c';
      shieldColor = '#7c2d12';
      helmetColor = '#fed7aa';
    } else if (this.type === 'elemental') {
      bodyColor = '#78716c';
      shieldColor = '#57534e';
      helmetColor = '#44403c';
    }

    // Torso
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-5, -8 + bob, 10, 11);

    // Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-4, 3 + bob, 3, 5);
    ctx.fillRect(1, 3 + bob, 3, 5);

    // Helmet / Head
    ctx.fillStyle = helmetColor;
    ctx.beginPath();
    ctx.arc(0, -11 + bob, 5, 0, Math.PI * 2);
    ctx.fill();

    // Shield (held in off-hand)
    ctx.fillStyle = shieldColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-8, -7 + bob, 5, 9, 2);
    ctx.fill();
    ctx.stroke();

    // Weapon (sword / axe / spear)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, -4 + bob);
    ctx.lineTo(10, -11 + bob);
    ctx.stroke();

    // Weapon Hilt
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(3, -6 + bob);
    ctx.lineTo(6, -3 + bob);
    ctx.stroke();

    ctx.restore();

    // Health Bar (Rendered un-rotated above unit)
    this.drawHealthBar(ctx);
  }

  drawHealthBar(ctx) {
    const barW = 20;
    const barH = 3;
    const barX = this.x - barW / 2;
    const barY = this.y - 20;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    ctx.fillStyle = ratio > 0.5 ? '#10b981' : (ratio > 0.25 ? '#facc15' : '#ef4444');
    ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.restore();
  }
}

window.Soldier = Soldier;
