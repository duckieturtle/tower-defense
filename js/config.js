/**
 * KINGDOM RUSH: FRONTIER DEFENSE - Configuration & Balance Database
 */

const CONFIG = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 768,
  GRID_COLS: 32,
  GRID_ROWS: 19,
  CELL_SIZE: 40,

  INITIAL_CREDITS: 350, // Starting Gold
  INITIAL_LIVES: 20,    // Royal Kingdom Lives
  WAVE_INTERVAL_SECONDS: 18,
  EARLY_WAVE_BONUS_PER_SEC: 6,

  // Campaign Game Modes
  MODES: {
    normal: {
      id: 'normal',
      name: 'Normal Campaign',
      badge: 'NORMAL',
      color: '#38bdf8',
      threat: '★★★☆☆',
      threatLevel: 'Standard',
      description: 'The classic Kingdom Rush tactical experience. 20 Kingdom Lives, 25 waves.',
      maxWaves: 25,
      initialCredits: 350,
      initialLives: 20,
      waveInterval: 18,
      earlyWaveBonusPerSec: 6,
      hpMultiplier: 1.0,
      speedMultiplier: 1.0,
      armorBonus: 0,
      scoreMultiplier: 1.0,
      superweaponCdMultiplier: 1.0,
      spawnDelayMultiplier: 1.0,
      isEndless: false,
      features: ['25 Campaign Waves', '20 Kingdom Lives', 'Balanced Enemy Armies', 'Iconic Kingdom Rush Bosses (Waves 10, 20, 25)']
    },
    hard: {
      id: 'hard',
      name: 'Veteran Mode',
      badge: 'HARD',
      color: '#f97316',
      threat: '★★★★☆',
      threatLevel: 'Veteran',
      description: 'Hostile horde with +40% HP & +15% Speed. 10 Kingdom Lives, 30 waves, and Dual Boss Encounters!',
      maxWaves: 30,
      initialCredits: 300,
      initialLives: 10,
      waveInterval: 14,
      earlyWaveBonusPerSec: 7,
      hpMultiplier: 1.4,
      speedMultiplier: 1.15,
      armorBonus: 0.10,
      scoreMultiplier: 1.75,
      superweaponCdMultiplier: 1.0,
      spawnDelayMultiplier: 0.88,
      isEndless: false,
      features: ['30 Veteran Waves', '10 Kingdom Lives', '+40% Enemy HP & +15% Speed', 'Dual Boss Incursions', '1.75x Score Multiplier']
    },
    nightmare: {
      id: 'nightmare',
      name: 'Iron Challenge (1 HP)',
      badge: 'IRON 1-HP',
      color: '#ef4444',
      threat: '★★★★★',
      threatLevel: 'Iron Challenge',
      description: 'Zero margin for error! 1 Kingdom Life (any leak is defeat!), +85% HP, +25% Speed, 35 waves.',
      maxWaves: 35,
      initialCredits: 280,
      initialLives: 1,
      waveInterval: 12,
      earlyWaveBonusPerSec: 9,
      hpMultiplier: 1.85,
      speedMultiplier: 1.25,
      armorBonus: 0.15,
      scoreMultiplier: 3.0,
      superweaponCdMultiplier: 0.9,
      spawnDelayMultiplier: 0.8,
      isEndless: false,
      features: ['1 Kingdom Life (Sudden Death)', '35 Brutal Waves', 'Boss Incursions Every 4 Waves', '+85% Enemy Health', '3.0x Score Multiplier']
    },
    endless: {
      id: 'endless',
      name: 'Heroic Endless Survival',
      badge: 'ENDLESS ∞',
      color: '#c084fc',
      threat: '★★★★★',
      threatLevel: 'Infinite Incursion',
      description: 'Infinite assault waves scaling exponentially. How long can your kingdom stand?',
      maxWaves: Infinity,
      initialCredits: 400,
      initialLives: 20,
      waveInterval: 15,
      earlyWaveBonusPerSec: 7,
      hpMultiplier: 1.1,
      speedMultiplier: 1.05,
      armorBonus: 0.05,
      scoreMultiplier: 2.0,
      superweaponCdMultiplier: 0.9,
      spawnDelayMultiplier: 0.85,
      isEndless: true,
      features: ['Infinite Waves (∞)', 'Exponential Enemy Scaling', 'Boss Hordes Every 5 Waves', 'Tracks Highest Wave Record', '2.0x+ Score Multiplier']
    },
    blitz: {
      id: 'blitz',
      name: 'Blitz (Swarm Rush)',
      badge: 'BLITZ',
      color: '#facc15',
      threat: '★★★☆☆',
      threatLevel: 'Fast Paced',
      description: 'High-speed action. 650 Starting Gold, 50% faster Rain of Fire & Reinforcements, 2x faster spawns.',
      maxWaves: 20,
      initialCredits: 650,
      initialLives: 15,
      waveInterval: 8,
      earlyWaveBonusPerSec: 5,
      hpMultiplier: 0.95,
      speedMultiplier: 1.2,
      armorBonus: 0,
      scoreMultiplier: 1.5,
      superweaponCdMultiplier: 0.5,
      spawnDelayMultiplier: 0.5,
      isEndless: false,
      features: ['20 Rapid Waves', '650 Starting Gold', '50% Faster Spells', '2x Faster Enemy Spawns', '1.5x Score Multiplier']
    },
    sandbox: {
      id: 'sandbox',
      name: 'King\'s Vault (Sandbox)',
      badge: 'SANDBOX',
      color: '#10b981',
      threat: '★☆☆☆☆',
      threatLevel: 'Castle Vault',
      description: 'Unlimited 99,999 Gold, 9,999 Lives, rapid spells. Test maximum upgrades and tower combinations!',
      maxWaves: 50,
      initialCredits: 99999,
      initialLives: 9999,
      waveInterval: 14,
      earlyWaveBonusPerSec: 1,
      hpMultiplier: 1.0,
      speedMultiplier: 1.0,
      armorBonus: 0,
      scoreMultiplier: 0.1,
      superweaponCdMultiplier: 0.2,
      spawnDelayMultiplier: 1.0,
      isEndless: false,
      features: ['99,999 Starting Gold', '9,999 Lives (Invulnerable)', '3s Spell Cooldowns', '50 Test Waves', 'DPS & Synergy Testing']
    }
  },

  // 4 Core Kingdom Rush Towers
  TOWERS: {
    archer: {
      id: 'archer',
      name: 'Archer Tower',
      category: 'ranged',
      description: 'Rapid-fire archers with long range. Effective against unarmored and flying units.',
      cost: 70,
      color: '#10b981', // Forest Green
      accentColor: '#059669',
      baseRange: 145,
      baseDamage: 5, // 4-6 average
      baseFireRate: 1.6, // shots per sec
      projectileType: 'arrow',
      projectileSpeed: 650,
      upgrades: [
        {
          name: 'Marksman Tower',
          cost: 110,
          rangeBonus: 20,
          damageBonus: 5,
          fireRateBonus: 0.2,
          desc: 'Sharpened broadhead arrows, +Range & Damage'
        },
        {
          name: 'Sharpshooter Tower',
          cost: 160,
          rangeBonus: 25,
          damageBonus: 9,
          fireRateBonus: 0.3,
          desc: 'Hawk-eye precision, shoots high-velocity piercing arrows'
        },
        {
          name: 'Ranger Hideout',
          cost: 230,
          rangeBonus: 35,
          damageBonus: 16,
          fireRateBonus: 0.6,
          desc: 'Poison arrows dealing damage over time + rapid multi-shot'
        }
      ]
    },

    barracks: {
      id: 'barracks',
      name: 'Militia Barracks',
      category: 'melee',
      description: 'Trains 3 soldiers to block and engage enemies on the road. Features movable Rally Point.',
      cost: 70,
      color: '#3b82f6', // Royal Blue
      accentColor: '#1d4ed8',
      baseRange: 130, // Rally Point command radius
      baseDamage: 4,
      baseFireRate: 1.0,
      projectileType: 'melee',
      soldierType: 'militia',
      upgrades: [
        {
          name: 'Footmen Barracks',
          cost: 110,
          rangeBonus: 15,
          damageBonus: 4,
          fireRateBonus: 0,
          desc: 'Armored footmen with buckler shields and +25% armor'
        },
        {
          name: 'Knight Garrison',
          cost: 160,
          rangeBonus: 20,
          damageBonus: 8,
          fireRateBonus: 0,
          desc: 'Plated knights with broadswords and 50% physical armor'
        },
        {
          name: 'Holy Order (Paladins)',
          cost: 230,
          rangeBonus: 30,
          damageBonus: 14,
          fireRateBonus: 0,
          desc: 'Legendary Paladins with 75% armor and Holy Light healing aura'
        }
      ]
    },

    mage: {
      id: 'mage',
      name: 'Mage Spire',
      category: 'magic',
      description: 'Fires armor-piercing magic bolts that ignore physical armor. Essential against heavy units.',
      cost: 100,
      color: '#a855f7', // Arcane Purple
      accentColor: '#7e22ce',
      baseRange: 135,
      baseDamage: 14,
      baseFireRate: 0.75, // 1 shot every 1.3s
      projectileType: 'magic_bolt',
      projectileSpeed: 450,
      upgrades: [
        {
          name: 'Adept Spire',
          cost: 160,
          rangeBonus: 18,
          damageBonus: 16,
          fireRateBonus: 0.1,
          desc: 'Focused eldritch bolts melting armored brutes'
        },
        {
          name: 'Wizard Spire',
          cost: 240,
          rangeBonus: 22,
          damageBonus: 32,
          fireRateBonus: 0.15,
          desc: 'High magic burst shattering magical resistances'
        },
        {
          name: 'Arcane Wizard',
          cost: 300,
          rangeBonus: 35,
          damageBonus: 60,
          fireRateBonus: 0.2,
          desc: 'Disintegration Ray (instakill heavy foes) & Teleport magic'
        }
      ]
    },

    artillery: {
      id: 'artillery',
      name: 'Dwarven Bombard',
      category: 'artillery',
      description: 'Lobs heavy iron cannonballs dealing massive area-of-effect damage to ground swarms.',
      cost: 125,
      color: '#f97316', // Fiery Orange
      accentColor: '#c2410c',
      baseRange: 140,
      baseDamage: 22,
      baseFireRate: 0.38, // 1 shot every 2.6s
      projectileType: 'cannonball',
      projectileSpeed: 300,
      splashRadius: 65,
      upgrades: [
        {
          name: 'Heavy Bombard',
          cost: 180,
          rangeBonus: 20,
          damageBonus: 24,
          fireRateBonus: 0.05,
          desc: '+Radius & Heavy steel shrapnel blast'
        },
        {
          name: 'Dwarven Howitzer',
          cost: 260,
          rangeBonus: 25,
          damageBonus: 48,
          fireRateBonus: 0.08,
          desc: 'Devastating high-explosive concussive shells'
        },
        {
          name: 'Big Bertha 500mm',
          cost: 380,
          rangeBonus: 40,
          damageBonus: 95,
          fireRateBonus: 0.12,
          desc: 'Colossal siege cannon firing Dragonfire cluster missiles'
        }
      ]
    }
  },

  // Kingdom Rush Enemy Bestiary
  ENEMIES: {
    goblin: {
      name: 'Goblin Scout',
      type: 'scout',
      baseHp: 45,
      hpPerWave: 12,
      speed: 120,
      bounty: 8,
      score: 10,
      radius: 10,
      armor: 0,
      magicResist: 0,
      damage: 3,
      color: '#84cc16',
      shape: 'goblin',
      desc: 'Swift unarmored green horde runners.'
    },

    orc: {
      name: 'Orc Warrior',
      type: 'soldier',
      baseHp: 130,
      hpPerWave: 32,
      speed: 75,
      bounty: 18,
      score: 20,
      radius: 14,
      armor: 0.20, // 20% physical armor
      magicResist: 0,
      damage: 7,
      color: '#15803d',
      shape: 'orc',
      desc: 'Brutal frontline foot soldier with light armor.'
    },

    dark_knight: {
      name: 'Dark Knight',
      type: 'tank',
      baseHp: 420,
      hpPerWave: 95,
      speed: 46,
      bounty: 45,
      score: 50,
      radius: 18,
      armor: 0.65, // 65% physical armor! Highly resistant to arrows/artillery!
      magicResist: 0,
      damage: 18,
      color: '#334155',
      shape: 'dark_knight',
      desc: 'Heavily plated juggernaut. Weak to Mage Spire magic!'
    },

    shaman: {
      name: 'Orc Shaman',
      type: 'shaman',
      baseHp: 180,
      hpPerWave: 45,
      speed: 68,
      bounty: 32,
      score: 35,
      radius: 14,
      armor: 0,
      magicResist: 0.50, // 50% magic resistance! Weak to physical arrows!
      damage: 10,
      color: '#06b6d4',
      shape: 'shaman',
      healInterval: 3.5,
      healAmount: 30,
      desc: 'Casts healing wards. Resistant to magic, weak to archers.'
    },

    gargoyle: {
      name: 'Gargoyle Flier',
      type: 'gargoyle',
      isFlying: true, // Flying unit! Cannot be blocked by soldiers or hero!
      baseHp: 95,
      hpPerWave: 24,
      speed: 105,
      bounty: 22,
      score: 25,
      radius: 13,
      armor: 0,
      magicResist: 0.15,
      damage: 6,
      color: '#9333ea',
      shape: 'gargoyle',
      desc: 'Winged monster flying over soldier blockades. Shoot with Archers/Mages!'
    },

    brigand: {
      name: 'Brigand Raider',
      type: 'brigand',
      baseHp: 160,
      hpPerWave: 40,
      speed: 95,
      bounty: 28,
      score: 30,
      radius: 13,
      armor: 0.15,
      magicResist: 0,
      damage: 14,
      isPhaseable: true, // Stealth / evasion
      color: '#d97706',
      shape: 'brigand',
      desc: 'Swift cutthroat with evasive shadow steps.'
    },

    troll: {
      name: 'Forest Troll',
      type: 'troll',
      baseHp: 560,
      hpPerWave: 120,
      speed: 50,
      bounty: 55,
      score: 65,
      radius: 20,
      armor: 0.20,
      magicResist: 0.20,
      damage: 30,
      regenRate: 25, // Regens 25 HP per sec!
      color: '#047857',
      shape: 'troll',
      desc: 'Colossal regenerating forest brute. Smashes through soldier shields!'
    },

    necromancer: {
      name: 'Necromancer',
      type: 'necromancer',
      baseHp: 260,
      hpPerWave: 60,
      speed: 55,
      bounty: 42,
      score: 45,
      radius: 15,
      armor: 0,
      magicResist: 0.40,
      damage: 12,
      color: '#6b21a8',
      shape: 'necromancer',
      summonInterval: 5.0,
      desc: 'Dark sorcerer raising Skeletons from the dead.'
    },

    skeleton: {
      name: 'Skeleton Warrior',
      type: 'skeleton',
      baseHp: 55,
      hpPerWave: 12,
      speed: 75,
      bounty: 5,
      score: 6,
      radius: 9,
      armor: 0.10,
      magicResist: 0,
      damage: 5,
      color: '#e2e8f0',
      shape: 'skeleton',
      desc: 'Risen undead summoned by dark sorcery.'
    },

    // Epic Bosses
    boss_juggernaut: {
      name: 'BOSS: The Juggernaut',
      type: 'boss',
      isBoss: true,
      baseHp: 3200,
      hpPerWave: 750,
      speed: 38,
      bounty: 300,
      score: 600,
      radius: 28,
      armor: 0.40,
      magicResist: 0.20,
      damage: 65,
      color: '#b91c1c',
      shape: 'boss_juggernaut',
      groundSlamInterval: 7.0, // Stuns all nearby soldiers/hero
      desc: 'Massive iron-clad siege engine with devastating seismic ground slams.'
    },

    boss_veznan: {
      name: 'BOSS: Dark Lord Vez\'nan',
      type: 'boss',
      isBoss: true,
      baseHp: 5200,
      hpPerWave: 1200,
      speed: 34,
      bounty: 500,
      score: 1000,
      radius: 30,
      armor: 0.25,
      magicResist: 0.55,
      damage: 85,
      color: '#581c87',
      shape: 'boss_veznan',
      empInterval: 6.5, // Soul shackles that freeze towers
      desc: 'The arch-sorcerer of darkness! Casts soul shackles disabling defense towers.'
    }
  },

  // Kingdom Rush Tactical Spells
  ABILITIES: {
    reinforcements: {
      id: 'reinforcements',
      name: 'Call Reinforcements',
      description: 'Summons 2 peasant militia soldiers anywhere on the road to intercept and block enemies.',
      key: '1',
      cooldown: 15,
      radius: 50,
      color: '#3b82f6'
    },

    rain_of_fire: {
      id: 'rain_of_fire',
      name: 'Rain of Fire',
      description: 'Calls down blazing meteors from the sky, scorching ground targets with massive explosive damage.',
      key: '2',
      cooldown: 45,
      radius: 120,
      damage: 350,
      color: '#f97316'
    }
  }
};

window.CONFIG = CONFIG;
