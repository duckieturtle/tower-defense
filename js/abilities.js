/**
 * KINGDOM RUSH: FRONTIER DEFENSE - Tactical Kingdom Spells (Reinforcements & Rain of Fire)
 */

class AbilityManager {
  constructor() {
    this.abilities = {
      reinforcements: {
        id: 'reinforcements',
        name: CONFIG.ABILITIES.reinforcements.name,
        key: '1',
        cooldownMax: CONFIG.ABILITIES.reinforcements.cooldown,
        cooldown: 0,
        radius: CONFIG.ABILITIES.reinforcements.radius,
        color: CONFIG.ABILITIES.reinforcements.color,
        desc: 'Summons 2 peasant militia soldiers to block the road.'
      },
      rain_of_fire: {
        id: 'rain_of_fire',
        name: CONFIG.ABILITIES.rain_of_fire.name,
        key: '2',
        cooldownMax: CONFIG.ABILITIES.rain_of_fire.cooldown,
        cooldown: 0,
        radius: CONFIG.ABILITIES.rain_of_fire.radius,
        damage: CONFIG.ABILITIES.rain_of_fire.damage,
        color: CONFIG.ABILITIES.rain_of_fire.color,
        desc: 'Calls down blazing fiery meteors obliterating enemies.'
      }
    };

    this.activeTargeting = null; // 'reinforcements' | 'rain_of_fire' | 'rally_point'
    this.pendingRallyTower = null;
    this.pendingMeteors = [];
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;
  }

  setMode(modeConfig) {
    const mult = (modeConfig && modeConfig.superweaponCdMultiplier) ? modeConfig.superweaponCdMultiplier : 1.0;
    for (const key in this.abilities) {
      const baseCd = CONFIG.ABILITIES[key].cooldown;
      this.abilities[key].cooldownMax = Math.max(3, Math.round(baseCd * mult));
      this.abilities[key].cooldown = 0;
    }
  }

  triggerAbility(id, enemies = [], towers = []) {
    if (id === 'rally_point') {
      this.activeTargeting = 'rally_point';
      return true;
    }

    const ab = this.abilities[id];
    if (!ab || ab.cooldown > 0) return false;

    this.activeTargeting = id;
    window.soundEngine.playRallyHorn();
    return true;
  }

  cancelTargeting() {
    this.activeTargeting = null;
    this.pendingRallyTower = null;
  }

  executeTargeted(mouseX, mouseY, game) {
    if (!this.activeTargeting) return;

    if (this.activeTargeting === 'rally_point') {
      if (game.selectedTower && game.selectedTower.isBarracks) {
        // Verify within range
        const d = Math.hypot(mouseX - game.selectedTower.x, mouseY - game.selectedTower.y);
        if (d <= game.selectedTower.range + 30) {
          game.selectedTower.setRallyPoint(mouseX, mouseY);
        } else {
          window.particleEngine.addFloater('OUT OF RANGE!', mouseX, mouseY - 15, '#ef4444', 12, true);
        }
      }
      this.activeTargeting = null;
      return;
    }

    const ab = this.abilities[this.activeTargeting];
    if (!ab || ab.cooldown > 0) {
      this.activeTargeting = null;
      return;
    }

    if (this.activeTargeting === 'reinforcements') {
      ab.cooldown = ab.cooldownMax;
      window.soundEngine.playRallyHorn();

      // Spawn 2 farmer militia soldiers at target location
      const soldier1 = new Soldier('farmer', mouseX - 10, mouseY, null, 0);
      const soldier2 = new Soldier('farmer', mouseX + 10, mouseY, null, 1);
      game.temporarySoldiers.push(soldier1, soldier2);

      window.particleEngine.addShockwave(mouseX, mouseY, '#3b82f6', 50, 0.4);
      window.particleEngine.addFloater('FOR THE KING!', mouseX, mouseY - 20, '#3b82f6', 15, true);
    } else if (this.activeTargeting === 'rain_of_fire') {
      ab.cooldown = ab.cooldownMax;
      window.soundEngine.playMeteorRoar();
      this.triggerScreenShake(0.65, 8);

      // Queue 5 fiery meteors falling with slight delays
      for (let m = 0; m < 5; m++) {
        const ox = (Math.random() - 0.5) * ab.radius * 0.9;
        const oy = (Math.random() - 0.5) * ab.radius * 0.9;
        this.pendingMeteors.push({
          targetX: mouseX + ox,
          targetY: mouseY + oy,
          startX: mouseX + ox - 80,
          startY: mouseY + oy - 300,
          progress: 0,
          delay: m * 0.18,
          radius: 55,
          damage: ab.damage
        });
      }

      window.particleEngine.addFloater('RAIN OF FIRE!', mouseX, mouseY - 30, '#f97316', 18, true);
    }

    this.activeTargeting = null;
  }

  triggerScreenShake(duration, intensity) {
    this.screenShakeTime = duration;
    this.screenShakeIntensity = intensity;
  }

  update(dt, enemies) {
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
    }

    for (const key in this.abilities) {
      const ab = this.abilities[key];
      if (ab.cooldown > 0) {
        ab.cooldown -= dt;
      }
    }

    // Update pending falling meteors
    for (let i = this.pendingMeteors.length - 1; i >= 0; i--) {
      const meteor = this.pendingMeteors[i];
      if (meteor.delay > 0) {
        meteor.delay -= dt;
        continue;
      }

      meteor.progress += dt * 3.5;
      if (meteor.progress >= 1.0) {
        // Impact!
        this.pendingMeteors.splice(i, 1);
        window.soundEngine.playExplosion(true);
        this.triggerScreenShake(0.3, 5);

        window.particleEngine.createExplosion(meteor.targetX, meteor.targetY, '#f97316', 35, 180);
        window.particleEngine.addShockwave(meteor.targetX, meteor.targetY, '#ef4444', meteor.radius, 0.45);

        // Scorched earth lava pool for 4s
        window.particleEngine.addPlasmaPool(meteor.targetX, meteor.targetY, meteor.radius * 0.8, 4.0, 45);

        // Deal impact damage to ground enemies
        enemies.forEach(e => {
          if (!e.isDead && !e.isFlying) {
            const d = Math.hypot(e.x - meteor.targetX, e.y - meteor.targetY);
            if (d <= meteor.radius) {
              e.applyDamage(meteor.damage, 'true');
              e.applyBurn(35, 3.5);
            }
          }
        });
      }
    }
  }

  drawPendingStrikes(ctx) {
    this.pendingMeteors.forEach(m => {
      if (m.delay <= 0) {
        const curX = m.startX + (m.targetX - m.startX) * m.progress;
        const curY = m.startY + (m.targetY - m.startY) * m.progress;

        ctx.save();
        // Fiery meteor ball
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(curX, curY, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(curX, curY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Smoke & Fire trail
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(curX - 40, curY - 120);
        ctx.stroke();

        ctx.restore();
      }
    });
  }

  drawTargetingReticle(ctx, mouseX, mouseY) {
    ctx.save();
    if (this.activeTargeting === 'reinforcements') {
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DEPLOY REINFORCEMENTS', mouseX, mouseY - 46);
    } else if (this.activeTargeting === 'rain_of_fire') {
      ctx.strokeStyle = '#f97316';
      ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RAIN OF FIRE TARGET', mouseX, mouseY - 116);
    } else if (this.activeTargeting === 'rally_point') {
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SET RALLY POINT', mouseX, mouseY - 30);
    }
    ctx.restore();
  }
}

window.abilityManager = new AbilityManager();
