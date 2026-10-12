/**
 * KINGDOM RUSH: FRONTIER DEFENSE - Kingdom Battlefields & Maps System
 */

class MapManager {
  constructor() {
    this.currentMapId = 'linirea_plains';
    this.cols = CONFIG.GRID_COLS;
    this.rows = CONFIG.GRID_ROWS;
    this.cellSize = CONFIG.CELL_SIZE;
    this.pathPulse = 0;

    this.maps = {
      linirea_plains: {
        id: 'linirea_plains',
        name: 'Linirea Plains: Verdant Valley',
        description: 'Winding dirt road through the kingdom\'s lush meadows with prime flanking bluffs.',
        difficulty: 'Standard',
        spawns: [{ x: 0, y: 3 }],
        base: { x: 31, y: 15 },
        paths: [
          [
            { col: -1, row: 3 },
            { col: 7, row: 3 },
            { col: 7, row: 9 },
            { col: 15, row: 9 },
            { col: 15, row: 4 },
            { col: 23, row: 4 },
            { col: 23, row: 15 },
            { col: 31, row: 15 },
            { col: 33, row: 15 }
          ]
        ],
        // Dedicated Kingdom Rush Strategic Stone Foundation Plots
        plots: [
          { col: 4, row: 1 }, { col: 10, row: 3 },
          { col: 4, row: 6 }, { col: 10, row: 7 },
          { col: 12, row: 11 }, { col: 18, row: 9 },
          { col: 12, row: 2 }, { col: 18, row: 2 },
          { col: 20, row: 7 }, { col: 26, row: 4 },
          { col: 20, row: 13 }, { col: 26, row: 13 },
          { col: 26, row: 17 }, { col: 18, row: 17 }
        ],
        scenery: [
          { type: 'tree', x: 80, y: 380 }, { type: 'tree', x: 120, y: 440 },
          { type: 'tree', x: 380, y: 80 }, { type: 'tree', x: 520, y: 640 },
          { type: 'tree', x: 820, y: 120 }, { type: 'tree', x: 1180, y: 320 }
        ]
      },

      crossroads: {
        id: 'crossroads',
        name: 'Twin Rivers: Crossroads of Valor',
        description: 'Hostile armies invade from two quadrants and converge at the royal fortress bridge.',
        difficulty: 'Tactical',
        spawns: [{ x: 0, y: 4 }, { x: 0, y: 14 }],
        base: { x: 31, y: 9 },
        paths: [
          // Northern Path
          [
            { col: -1, row: 4 },
            { col: 8, row: 4 },
            { col: 8, row: 8 },
            { col: 16, row: 8 },
            { col: 16, row: 9 },
            { col: 24, row: 9 },
            { col: 24, row: 5 },
            { col: 31, row: 5 },
            { col: 31, row: 9 },
            { col: 33, row: 9 }
          ],
          // Southern Path
          [
            { col: -1, row: 14 },
            { col: 8, row: 14 },
            { col: 8, row: 10 },
            { col: 16, row: 10 },
            { col: 16, row: 9 },
            { col: 24, row: 9 },
            { col: 24, row: 13 },
            { col: 31, row: 13 },
            { col: 31, row: 9 },
            { col: 33, row: 9 }
          ]
        ],
        plots: [
          { col: 4, row: 2 }, { col: 11, row: 4 },
          { col: 4, row: 16 }, { col: 11, row: 14 },
          { col: 12, row: 9 }, { col: 20, row: 7 },
          { col: 20, row: 11 }, { col: 27, row: 3 },
          { col: 27, row: 15 }, { col: 20, row: 2 },
          { col: 20, row: 16 }, { col: 28, row: 7 },
          { col: 28, row: 11 }, { col: 5, row: 9 }
        ],
        scenery: [
          { type: 'tree', x: 240, y: 380 }, { type: 'tree', x: 620, y: 80 },
          { type: 'tree', x: 620, y: 680 }, { type: 'tree', x: 1020, y: 400 }
        ]
      },

      citadel_pass: {
        id: 'citadel_pass',
        name: 'The Citadel Gates: Mountain Pass',
        description: 'Multi-switchback royal fortress road with stone battlements and narrow gorges.',
        difficulty: 'Complex',
        spawns: [{ x: 4, y: 0 }],
        base: { x: 27, y: 18 },
        paths: [
          [
            { col: 4, row: -1 },
            { col: 4, row: 5 },
            { col: 11, row: 5 },
            { col: 11, row: 2 },
            { col: 20, row: 2 },
            { col: 20, row: 7 },
            { col: 8, row: 7 },
            { col: 8, row: 12 },
            { col: 24, row: 12 },
            { col: 24, row: 6 },
            { col: 28, row: 6 },
            { col: 28, row: 15 },
            { col: 15, row: 15 },
            { col: 15, row: 18 },
            { col: 27, row: 18 },
            { col: 27, row: 20 }
          ]
        ],
        plots: [
          { col: 1, row: 3 }, { col: 7, row: 3 },
          { col: 14, row: 3 }, { col: 14, row: 7 },
          { col: 5, row: 9 }, { col: 11, row: 10 },
          { col: 18, row: 10 }, { col: 21, row: 14 },
          { col: 26, row: 9 }, { col: 18, row: 17 },
          { col: 22, row: 17 }, { col: 26, row: 3 },
          { col: 17, row: 0 }, { col: 6, row: 14 }
        ],
        scenery: [
          { type: 'tree', x: 120, y: 120 }, { type: 'tree', x: 420, y: 520 },
          { type: 'tree', x: 920, y: 240 }, { type: 'tree', x: 1200, y: 640 }
        ]
      }
    };

    this.grid = []; // 0 = empty, 1 = road, 2 = stone plot (buildable!), 3 = occupied
    this.cacheCurrentMap();
  }

  setMap(mapId) {
    if (this.maps[mapId]) {
      this.currentMapId = mapId;
      this.cacheCurrentMap();
    }
  }

  getCurrentMap() {
    return this.maps[this.currentMapId];
  }

  cacheCurrentMap() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = 0; // Meadow
      }
    }

    const map = this.getCurrentMap();

    // Mark road cells
    map.paths.forEach(path => {
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];

        const startC = Math.max(0, Math.min(p1.col, p2.col));
        const endC = Math.min(this.cols - 1, Math.max(p1.col, p2.col));
        const startR = Math.max(0, Math.min(p1.row, p2.row));
        const endR = Math.min(this.rows - 1, Math.max(p1.row, p2.row));

        for (let r = startR; r <= endR; r++) {
          for (let c = startC; c <= endC; c++) {
            this.grid[r][c] = 1; // Road
          }
        }
      }
    });

    // Mark dedicated Kingdom Rush stone building plots!
    if (map.plots) {
      map.plots.forEach(plot => {
        if (plot.row >= 0 && plot.row < this.rows && plot.col >= 0 && plot.col < this.cols) {
          this.grid[plot.row][plot.col] = 2; // Stone Foundation Plot
        }
      });
    }

    this.cachePixelPaths();
  }

  cachePixelPaths() {
    const map = this.getCurrentMap();
    this.pixelPaths = map.paths.map(path => {
      const pxPath = path.map(pt => ({
        x: pt.col * this.cellSize + this.cellSize / 2,
        y: pt.row * this.cellSize + this.cellSize / 2
      }));

      const segments = [];
      let totalLen = 0;

      for (let i = 0; i < pxPath.length - 1; i++) {
        const p1 = pxPath[i];
        const p2 = pxPath[i + 1];
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        segments.push({
          start: p1,
          end: p2,
          length: len,
          distStart: totalLen,
          distEnd: totalLen + len
        });
        totalLen += len;
      }

      return { points: pxPath, segments, totalLength: totalLen };
    });
  }

  isCellBuildable(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    // In Kingdom Rush, towers are built on dedicated plots (2) or open meadow (0)
    return this.grid[row][col] === 2 || this.grid[row][col] === 0;
  }

  setCellTower(col, row, towerId = null) {
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      this.grid[row][col] = towerId ? 3 : 2;
    }
  }

  getPositionAlongPath(pathIndex, distanceTraveled) {
    const pxPath = this.pixelPaths[pathIndex] || this.pixelPaths[0];
    if (!pxPath || pxPath.segments.length === 0) return { x: 0, y: 0, angle: 0, reachedEnd: true };

    if (distanceTraveled >= pxPath.totalLength) {
      const last = pxPath.points[pxPath.points.length - 1];
      return { x: last.x, y: last.y, angle: 0, reachedEnd: true };
    }

    for (const seg of pxPath.segments) {
      if (distanceTraveled >= seg.distStart && distanceTraveled <= seg.distEnd) {
        const segDist = distanceTraveled - seg.distStart;
        const t = seg.length > 0 ? segDist / seg.length : 0;
        const x = seg.start.x + (seg.end.x - seg.start.x) * t;
        const y = seg.start.y + (seg.end.y - seg.start.y) * t;
        const angle = Math.atan2(seg.end.y - seg.start.y, seg.end.x - seg.start.x);
        return { x, y, angle, reachedEnd: false };
      }
    }

    const first = pxPath.points[0];
    return { x: first.x, y: first.y, angle: 0, reachedEnd: false };
  }

  update(dt) {
    this.pathPulse = (this.pathPulse + dt * 2.5) % (Math.PI * 2);
  }

  draw(ctx) {
    // 1. Kingdom Meadow Grass Background (Lush Green)
    ctx.fillStyle = '#457d3b';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Subtle grass texture patches
    ctx.fillStyle = '#4c8a42';
    for (let c = 0; c < this.cols; c += 2) {
      for (let r = 0; r < this.rows; r += 2) {
        ctx.fillRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
      }
    }

    // 2. Draw Kingdom Dirt & Cobblestone Roads
    const map = this.getCurrentMap();
    this.pixelPaths.forEach(pxPath => {
      ctx.save();
      // Road Outer Dirt Edge
      ctx.strokeStyle = '#8c6a3e';
      ctx.lineWidth = this.cellSize + 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      pxPath.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Road Inner Cobblestone
      ctx.strokeStyle = '#c29b63';
      ctx.lineWidth = this.cellSize - 2;
      ctx.stroke();

      // Road Center Pathway
      ctx.strokeStyle = '#d4b27d';
      ctx.lineWidth = this.cellSize - 10;
      ctx.stroke();

      ctx.restore();
    });

    // 3. Draw Dedicated Kingdom Rush Stone Building Plots!
    if (map.plots) {
      map.plots.forEach(plot => {
        const isOccupied = this.grid[plot.row] && this.grid[plot.row][plot.col] === 3;
        if (!isOccupied) {
          const px = plot.col * this.cellSize + this.cellSize / 2;
          const py = plot.row * this.cellSize + this.cellSize / 2;

          ctx.save();
          // Stone Circle Base
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.ellipse(px, py + 2, 18, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Wooden Stakes
          ctx.fillStyle = '#78350f';
          ctx.fillRect(px - 14, py - 4, 3, 5);
          ctx.fillRect(px + 11, py - 4, 3, 5);

          // Golden Rune Inscription Ring
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.ellipse(px, py + 2, 13, 8, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Hammer / Wrench Icon
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚒', px, py + 6);

          ctx.restore();
        }
      });
    }

    // 4. Draw Trees & Kingdom Scenery
    if (map.scenery) {
      map.scenery.forEach(item => {
        if (item.type === 'tree') {
          ctx.save();
          // Tree Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.ellipse(item.x, item.y + 12, 16, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Trunk
          ctx.fillStyle = '#78350f';
          ctx.fillRect(item.x - 4, item.y - 2, 8, 14);

          // Green Canopy
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.arc(item.x, item.y - 12, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(item.x - 3, item.y - 16, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    }

    // 5. Draw Spawn Portals / Caves
    map.spawns.forEach(sp => {
      const sx = sp.x * this.cellSize + this.cellSize / 2;
      const sy = sp.y * this.cellSize + this.cellSize / 2;

      ctx.save();
      // Ominous Skull Cave Entrance
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(sx, sy, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Cave Eyes Glow
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(sx - 6, sy - 2, 3, 0, Math.PI * 2);
      ctx.arc(sx + 6, sy - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sx - 12, sy - 14);
      ctx.lineTo(sx - 18, sy - 24);
      ctx.moveTo(sx + 12, sy - 14);
      ctx.lineTo(sx + 18, sy - 24);
      ctx.stroke();

      ctx.restore();
    });

    // 6. Draw Royal Citadel & Castle Gates (Kingdom Base Goal)
    const bx = map.base.x * this.cellSize + this.cellSize / 2;
    const by = map.base.y * this.cellSize + this.cellSize / 2;

    const modeConfig = (window.game && window.game.currentModeConfig) ? window.game.currentModeConfig : null;
    const isNightmare = modeConfig && modeConfig.id === 'nightmare';

    ctx.save();
    // Fortress Castle Gateway
    ctx.fillStyle = '#475569';
    ctx.fillRect(bx - 24, by - 26, 48, 52);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx - 24, by - 26, 48, 52);

    // Castle Portcullis / Iron Gate
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(bx, by + 8, 14, Math.PI, 0);
    ctx.lineTo(bx + 14, by + 26);
    ctx.lineTo(bx - 14, by + 26);
    ctx.closePath();
    ctx.fill();

    // Twin Castle Towers with Royal Banners
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx - 26, by - 36, 14, 20);
    ctx.fillRect(bx + 12, by - 36, 14, 20);

    // Royal Blue Banners (or Crimson for Nightmare!)
    const bannerColor = isNightmare ? '#ef4444' : '#2563eb';
    ctx.fillStyle = bannerColor;
    ctx.beginPath();
    ctx.moveTo(bx - 19, by - 36);
    ctx.lineTo(bx - 19, by - 52);
    ctx.lineTo(bx - 8, by - 44);
    ctx.lineTo(bx - 19, by - 38);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bx + 19, by - 36);
    ctx.lineTo(bx + 19, by - 52);
    ctx.lineTo(bx + 30, by - 44);
    ctx.lineTo(bx + 19, by - 38);
    ctx.fill();

    // Kingdom Crown Insignia
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(bx - 7, by - 14);
    ctx.lineTo(bx - 5, by - 20);
    ctx.lineTo(bx, by - 16);
    ctx.lineTo(bx + 5, by - 20);
    ctx.lineTo(bx + 7, by - 14);
    ctx.closePath();
    ctx.fill();

    // Nightmare Warning
    if (isNightmare) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText('1 LIFE ONLY', bx, by - 38);
    }

    ctx.restore();
  }
}

window.mapManager = new MapManager();
