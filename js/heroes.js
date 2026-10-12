/**
 * KINGDOM RUSH: FRONTIER DEFENSE - Controllable Hero System (Sir Gerald Lightseeker)
 */

class Hero {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.destX = x;
    this.destY = y;

    this.level = 1;
    this.maxLevel = 10;
    this.exp = 0;
    this.expNext = 100;

    // Base Combat Stats
    this.maxHp = 450;
    this.hp = this.maxHp;
    this.damageMin = 18;
    this.damageMax = 28;
    this.armor = 0.40; // 40% physical armor
    this.speed = 85;
    this.attackInterval = 1.0;
    this.attackTimer = 0.5;

    // Special Skill: Heroic Strike
    this.heroicStrikeCooldown = 6.0;
    this.heroicStrikeTimer = 3.0;

    // Out-of-Combat Regeneration
    this.outOfCombatTimer = 0;
    this.regenRate = 0.08; // 8% max HP/s

    // Combat State
    this.targetEnemies = []; // Can engage up to 2 enemies!
    this.isDead = false;
    this.reviveTimer = 0;
    this.reviveDuration = 15.0;

    this.isSelected = false;
    this.walkAnim = 0;
    this.facing = 1;
    this.name = 'Sir Gerald Lightseeker';
    this.title = 'Paladin of the Realm';
  }

  commandMove(tx, ty) {
    this.destX = tx;
    this.destY = ty;
    this.disengageAll();
    window.soundEngine.playHeroCommand();
    window.particleEngine.addFloater('FOR HONOR!', this.x, this.y - 24, '#facc15', 13, true);
    window.particleEngine.addShockwave(tx, ty, '#facc15', 30, 0.3);
  }

  disengageAll() {
    this.targetEnemies.forEach(e => {
      if (e.blockedBy === this) {
        e.blockedBy = null;
        e.isBlocked = false;
      }
    });
    this.targetEnemies = [];
  }

  takeDamage(amount, damageType = 'physical') {
    if (this.isDead) return;

    this.outOfCombatTimer = 3.5; // Reset out-of-combat timer

    let finalDmg = amount;
    if (damageType === 'physical' && this.armor > 0) {
      finalDmg *= (1 - this.armor);
    }
    finalDmg = Math.max(1, Math.round(finalDmg));

    this.hp -= finalDmg;
    window.particleEngine.addFloater(`-${finalDmg}`, this.x, this.y - 16, '#ef4444', 12);
    window.particleEngine.createSparks(this.x, this.y, '#facc15', 3);

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.disengageAll();
    this.reviveTimer = this.reviveDuration;
    window.soundEngine.playCoreHit();
    window.particleEngine.createExplosion(this.x, this.y, '#facc15', 35, 120);
    window.particleEngine.addFloater('HERO FALLEN!', this.x, this.y - 20, '#ef4444', 16, true);
  }

  revive() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.x = this.destX;
    this.y = this.destY;
    window.soundEngine.playUpgrade();
    window.particleEngine.addShockwave(this.x, this.y, '#facc15', 80, 0.6);
    window.particleEngine.addFloater('SIR GERALD REVIVED!', this.x, this.y - 25, '#facc15', 16, true);
  }

  gainExp(amount) {
    if (this.level >= this.maxLevel) return;
    this.exp += amount;
    if (this.exp >= this.expNext) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.exp -= this.expNext;
    this.expNext = Math.round(this.expNext * 1.55);

    // Stat bonuses per level
    this.maxHp += 55;
    this.hp = this.maxHp;
    this.damageMin += 4;
    this.damageMax += 6;
    this.armor = Math.min(0.65, this.armor + 0.025);

    window.soundEngine.playUpgrade();
    window.particleEngine.addShockwave(this.x, this.y, '#facc15', 90, 0.8);
    window.particleEngine.addFloater(`HERO LEVEL ${this.level}!`, this.x, this.y - 28, '#facc15', 18, true);
  }

  update(dt, enemies, soldiers = []) {
    // 1. Dead Revive Timer
    if (this.isDead) {
      this.reviveTimer -= dt;
      if (this.reviveTimer <= 0) {
        this.revive();
      }
      return;
    }

    // 2. Out-of-Combat Health Regeneration
    if (this.targetEnemies.length === 0) {
      if (this.outOfCombatTimer > 0) {
        this.outOfCombatTimer -= dt;
      } else if (this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * this.regenRate * dt);
      }
    }

    // 3. Inspiring Aura: Buff nearby soldiers (+15% armor & morale)
    soldiers.forEach(s => {
      if (!s.isDead && Math.hypot(s.x - this.x, s.y - this.y) <= 120) {
        s.hasHeroAura = true;
      }
    });

    // 4. Clean up invalid engaged enemies
    this.targetEnemies = this.targetEnemies.filter(e => {
      if (e.isDead || e.reachedEnd) {
        if (e.blockedBy === this) e.blockedBy = null;
        return false;
      }
      return true;
    });

    // 5. In Melee Combat
    if (this.targetEnemies.length > 0) {
      const primaryTarget = this.targetEnemies[0];
      this.facing = (primaryTarget.x >= this.x) ? 1 : -1;

      // Ensure enemies are blocked
      this.targetEnemies.forEach(e => {
        e.isBlocked = true;
        e.blockedBy = this;
      });

      // Regular Attack
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = this.attackInterval;
        this.strikeEnemy(primaryTarget);
      }

      // Heroic Cleave Skill (AoE Strike)
      this.heroicStrikeTimer -= dt;
      if (this.heroicStrikeTimer <= 0) {
        this.heroicStrikeTimer = this.heroicStrikeCooldown;
        this.executeHeroicCleave(enemies);
      }
      return;
    }

    // 6. Not in Combat: Check if enemies passing nearby to block (up to 2 enemies)
    const distToDest = Math.hypot(this.destX - this.x, this.destY - this.y);
    if (distToDest < 100) {
      const candidates = enemies.filter(e => {
        if (e.isDead || e.reachedEnd || e.isFlying || e.isPhased) return false;
        if (e.blockedBy && e.blockedBy !== this) return false;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        return d <= 48;
      });

      if (candidates.length > 0) {
        candidates.sort((a, b) => b.distanceTraveled - a.distanceTraveled);
        const toEngage = candidates.slice(0, 2);
        this.targetEnemies = toEngage;
        toEngage.forEach(e => {
          e.isBlocked = true;
          e.blockedBy = this;
        });
        window.soundEngine.playSwordClash();
        return;
      }
    }

    // 7. March towards commanded destination
    if (distToDest > 4) {
      const angle = Math.atan2(this.destY - this.y, this.destX - this.x);
      this.x += Math.cos(angle) * this.speed * dt;
      this.y += Math.sin(angle) * this.speed * dt;
      this.facing = Math.cos(angle) >= 0 ? 1 : -1;
      this.walkAnim += dt * 10;
    } else {
      this.x = this.destX;
      this.y = this.destY;
    }
  }

  strikeEnemy(enemy) {
    if (!enemy || enemy.isDead) return;

    window.soundEngine.playSwordClash();
    const rawDmg = Math.floor(this.damageMin + Math.random() * (this.damageMax - this.damageMin + 1));
    enemy.applyDamage(rawDmg, 'physical');
    this.gainExp(15);

    window.particleEngine.createSparks(enemy.x, enemy.y, '#facc15', 5);
  }

  executeHeroicCleave(allEnemies) {
    window.soundEngine.playEMP(); // Resonant holy burst sound
    window.particleEngine.addShockwave(this.x, this.y, '#facc15', 85, 0.45);
    window.particleEngine.addFloater('HEROIC STRIKE!', this.x, this.y - 25, '#facc15', 15, true);

    allEnemies.forEach(e => {
      if (!e.isDead && !e.isFlying && Math.hypot(e.x - this.x, e.y - this.y) <= 85) {
        const cleaveDmg = Math.round((this.damageMax * 2.5));
        e.applyDamage(cleaveDmg, 'physical');
        this.gainExp(25);
        window.particleEngine.createSparks(e.x, e.y, '#ffffff', 6);
      }
    });
  }

  draw(ctx) {
    if (this.isDead) {
      // Draw ghost revival ring on battlefield
      ctx.save();
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(this.destX, this.destY, 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.fillText(`REVIVING IN ${Math.ceil(this.reviveTimer)}s`, this.destX, this.destY - 26);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    // Golden Selection Ring when chosen by player
    if (this.isSelected) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 8, 22, 10, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsing corners
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, -32, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 9, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inspiring Aura Ground Ring
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    const bob = Math.sin(this.walkAnim) * 2;
    ctx.scale(this.facing, 1);

    // Royal Blue Cape / Cloak
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.moveTo(-6, -10 + bob);
    ctx.lineTo(-14, 6 + bob);
    ctx.lineTo(-4, 8 + bob);
    ctx.closePath();
    ctx.fill();

    // Golden Plated Torso
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-7, -10 + bob, 14, 15);
    ctx.strokeRect(-7, -10 + bob, 14, 15);

    // Blue Tabard with Golden Cross
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-3, -8 + bob, 6, 12);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-2, -4 + bob, 4, 2);
    ctx.fillRect(-1, -6 + bob, 2, 6);

    // Steel Armored Legs
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-5, 5 + bob, 4, 6);
    ctx.fillRect(1, 5 + bob, 4, 6);

    // Winged Golden Helm
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -14 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Helm Visor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-4, -14 + bob, 8, 3);

    // Helm Crest Feather (Royal Red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -21 + bob);
    ctx.lineTo(4, -16 + bob);
    ctx.lineTo(-4, -16 + bob);
    ctx.closePath();
    ctx.fill();

    // Tower Shield (Held on off-hand)
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-12, -9 + bob, 7, 14, 3);
    ctx.fill();
    ctx.stroke();

    // Shining Broadsword
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, -6 + bob);
    ctx.lineTo(16, -18 + bob);
    ctx.stroke();

    // Sword Crossguard & Pommel (Gold)
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(4, -9 + bob);
    ctx.lineTo(10, -3 + bob);
    ctx.stroke();

    ctx.restore();

    // Hero Health Bar & Level Crown (Rendered un-rotated above head)
    this.drawHeroHud(ctx);
  }

  drawHeroHud(ctx) {
    const barW = 32;
    const barH = 5;
    const barX = this.x - barW / 2;
    const barY = this.y - 28;

    ctx.save();
    // Background frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // Health ratio
    const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    ctx.fillStyle = ratio > 0.5 ? '#10b981' : (ratio > 0.25 ? '#facc15' : '#ef4444');
    ctx.fillRect(barX, barY, barW * ratio, barH);

    // Level Badge Tag
    ctx.fillStyle = '#facc15';
    ctx.fillRect(barX - 10, barY - 2, 8, 8);
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.level}`, barX - 6, barY + 5);

    // Name label
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.fillText('SIR GERALD', this.x, barY - 4);

    ctx.restore();
  }
}

window.Hero = Hero;
