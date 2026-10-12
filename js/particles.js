/**
 * NEO CORE: PROTOCOL DEFENSE - Visual Effects & Particle Engine
 */

class ParticleEngine {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.floaters = [];
    this.plasmaPools = [];
    this.lightningArcs = [];
    this.maxParticles = 600;
  }

  // --- Particles & Shrapnel ---
  createExplosion(x, y, color = '#f97316', count = 24, maxSpeed = 160) {
    // Add primary shockwave
    this.addShockwave(x, y, color, 65, 0.45);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.3 + Math.random() * 0.7) * maxSpeed;
      const size = 2 + Math.random() * 4;
      const life = 0.35 + Math.random() * 0.45;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life,
        maxLife: life,
        drag: 0.92
      });
    }
  }

  createSmokeTrail(x, y, color = 'rgba(156, 163, 175, 0.5)') {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x: x + (Math.random() * 4 - 2),
      y: y + (Math.random() * 4 - 2),
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      size: 2.5 + Math.random() * 3,
      color,
      life: 0.3,
      maxLife: 0.3,
      drag: 0.85
    });
  }

  createSparks(x, y, color = '#38bdf8', count = 6) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 1.5,
        color,
        life: 0.25,
        maxLife: 0.25,
        drag: 0.90
      });
    }
  }

  // --- Expanding Shockwaves ---
  addShockwave(x, y, color = '#38bdf8', maxRadius = 60, duration = 0.4) {
    this.shockwaves.push({
      x,
      y,
      color,
      currentRadius: 4,
      maxRadius,
      life: duration,
      maxLife: duration
    });
  }

  // --- Lingering Plasma Pools (Mortar DoT) ---
  addPlasmaPool(x, y, radius = 60, duration = 4.0, dps = 30) {
    this.plasmaPools.push({
      x,
      y,
      radius,
      duration,
      maxDuration: duration,
      dps,
      lastTickTime: 0
    });
  }

  // --- Lightning Chain Arcs ---
  addLightningArc(startX, startY, targetX, targetY, color = '#c084fc', branches = 3) {
    const points = [{ x: startX, y: startY }];
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(3, Math.floor(dist / 22));

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const normX = -dy / dist;
      const normY = dx / dist;
      const offset = (Math.random() - 0.5) * 24;
      points.push({
        x: startX + dx * t + normX * offset,
        y: startY + dy * t + normY * offset
      });
    }
    points.push({ x: targetX, y: targetY });

    this.lightningArcs.push({
      points,
      color,
      life: 0.14,
      maxLife: 0.14
    });
  }

  // --- Floating Combat Text ---
  addFloater(text, x, y, color = '#ffffff', size = 13, isCrit = false) {
    this.floaters.push({
      text,
      x: x + (Math.random() * 14 - 7),
      y,
      vy: -35 - Math.random() * 15,
      color,
      size,
      isCrit,
      life: 0.8,
      maxLife: 0.8
    });
  }

  // --- Update loop ---
  update(dt) {
    // 1. Update basic particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
    }

    // 2. Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const progress = 1 - (sw.life / sw.maxLife);
      sw.currentRadius = 4 + progress * (sw.maxRadius - 4);
    }

    // 3. Update plasma pools
    for (let i = this.plasmaPools.length - 1; i >= 0; i--) {
      const pool = this.plasmaPools[i];
      pool.duration -= dt;
      if (pool.duration <= 0) {
        this.plasmaPools.splice(i, 1);
      }
    }

    // 4. Update lightning arcs
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      const arc = this.lightningArcs[i];
      arc.life -= dt;
      if (arc.life <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }

    // 5. Update floating combat text
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.floaters.splice(i, 1);
        continue;
      }
      f.y += f.vy * dt;
    }
  }

  // --- Render loop ---
  draw(ctx) {
    // 1. Lingering Plasma Pools on the Ground
    this.plasmaPools.forEach(pool => {
      const alpha = Math.min(1.0, (pool.duration / pool.maxDuration) * 1.5) * 0.45;
      ctx.save();
      ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer radioactive pulsing ring
      ctx.strokeStyle = `rgba(52, 211, 153, ${alpha * 1.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Small bubbling core
      ctx.fillStyle = `rgba(110, 231, 183, ${alpha * 1.6})`;
      ctx.beginPath();
      ctx.arc(pool.x, pool.y, pool.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 2. Shockwaves
    this.shockwaves.forEach(sw => {
      const alpha = (sw.life / sw.maxLife);
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = Math.max(1.5, 3.5 * alpha);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 3. Lightning Arcs
    this.lightningArcs.forEach(arc => {
      const alpha = arc.life / arc.maxLife;
      ctx.save();
      ctx.strokeStyle = arc.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      arc.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
    });

    // 4. Standard Particles
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + 0.4 * alpha), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Floating Text
    this.floaters.forEach(f => {
      const alpha = f.life / f.maxLife;
      ctx.save();
      ctx.font = `${f.isCrit ? 'bold ' : ''}${f.size}px monospace`;
      ctx.fillStyle = f.color;
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    });
  }

  clear() {
    this.particles = [];
    this.shockwaves = [];
    this.floaters = [];
    this.plasmaPools = [];
    this.lightningArcs = [];
  }
}

window.particleEngine = new ParticleEngine();
