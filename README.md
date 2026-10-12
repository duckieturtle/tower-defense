# 🏰 Kingdom Rush: Frontier Defense

A high-intensity, medieval fantasy 2D tactical Tower Defense game inspired by **Kingdom Rush**, built with pure HTML5 Canvas, Vanilla JavaScript, and the Web Audio API. Zero dependencies, 100% client-side.

🎮 **Play Live**: [https://duckieturtle.github.io/tower-defense/](https://duckieturtle.github.io/tower-defense/)

---

## ⚔️ Core Gameplay Features

### 1. The 4 Iconic Kingdom Rush Towers
- **🏹 Archer Tower (70 Gold)**: Rapid-fire marksmen with long range. Effective against ground and flying units.
  - *Upgrade Path*: Marksman Tower $\to$ Sharpshooter Tower $\to$ **Ranger Hideout** (Poison arrows & rapid multi-shot).
- **🛡️ Militia Barracks (70 Gold)**: Trains **3 brave soldiers** who physically deploy onto the road to **block ground enemies** in hand-to-hand combat.
  - *Movable Rally Point (<kbd>R</kbd>)*: Command your soldiers to hold any choke point within the tower's command radius.
  - *Upgrade Path*: Footmen Barracks $\to$ Plated Knights (50% armor) $\to$ **Holy Order Paladins** (75% plate armor & Holy Light healing aura).
- **🔮 Mage Spire (100 Gold)**: Fires concentrated arcane bolts with **True Magic Damage** that ignores physical armor.
  - *Upgrade Path*: Adept Spire $\to$ Wizard Spire $\to$ **Arcane Wizard** (Disintegration Ray).
- **💣 Dwarven Bombard (125 Gold)**: Heavy siege artillery launching parabolic cannonballs dealing massive area-of-effect splash damage to enemy swarms.
  - *Upgrade Path*: Heavy Bombard $\to$ Dwarven Howitzer $\to$ **Big Bertha 500mm** (Dragonfire cluster missiles).

---

### 2. Controllable Hero: Sir Gerald Lightseeker 👑
- **Manual Click-to-Move**: Click Sir Gerald or press <kbd>H</kbd> to command him to reposition anywhere on the battlefield.
- **Dual-Enemy Blocking**: Halts and duels up to **2 enemies simultaneously** with high melee damage and heavy armor.
- **Level Progression (1–10)**: Earns EXP by defeating foes in combat, increasing maximum health, attack damage, and physical armor.
- **Special Abilities**:
  - **Holy Cleave**: Whirling AoE sword strike hitting all adjacent enemies.
  - **Inspiring Aura**: Passively buffs the defense and combat morale of nearby soldiers.
  - **Out-of-Combat Regeneration**: Bandages wounds and regenerates HP when disengaged.
  - **Battlefield Revival**: Respawns after recovery if defeated in battle.

---

### 3. Tactical Kingdom Spells
- **👨‍🌾 Call Reinforcements (<kbd>Q</kbd>)**: Instantly calls 2 peasant militia soldiers anywhere on the road to intercept, stall, and engage enemies.
- **☄️ Rain of Fire (<kbd>W</kbd>)**: Summons fiery meteors from the sky with screen shake, obliterating enemy clusters and leaving scorched fiery earth that burns passing foes.

---

### 4. Diverse Enemy Bestiary
- **Goblin Scouts**: Agile swarmers running in packs.
- **Orc Warriors**: Resilient frontline brutes.
- **Armored Dark Knights**: Heavy physical armor (invulnerable to arrows and artillery; vulnerable to Mage Spires).
- **Shamans**: High magic resistance that heal wounded allies.
- **Gargoyles**: **Flying units** that soar right over your soldiers and artillery.
- **Mountain Trolls**: Massive health pools with rapid out-of-combat regeneration.
- **Shadow Necromancers**: Dark warlocks who summon Skeletons from fallen enemies.
- **Boss Incursions**: The colossal **Juggernaut Golem** and the sorcerer **Vez'nan**.

---

### 5. Kingdom Campaign Modes
- 👑 **Normal Campaign**: 25 waves, 20 Kingdom Lives, balanced pacing.
- 🔥 **Veteran Mode**: 30 waves, 10 Kingdom Lives, +40% enemy HP, +15% enemy speed, and Dual Boss Encounters.
- 💀 **Iron Challenge (1 HP)**: 35 waves, **1 Kingdom Life** (sudden death!), +85% enemy HP, boss incursions every 4 waves, 3.0x honor multiplier.
- 🌌 **Heroic Endless Survival**: Infinite waves ($\infty$) with exponential scaling and survival milestones.
- ⚡ **Blitz Rush**: 20 rapid-fire accelerated enemy swarms.
- 🧪 **King's Vault (Sandbox)**: 99,999 Gold, 9,999 Lives, and 3s spell cooldowns for testing max-level tower synergies.
- 🏆 **Personal Records**: High score and wave tracking saved persistently in `localStorage`.

---

## 🎮 Controls & Shortcuts

| Hotkey | Action |
| :--- | :--- |
| <kbd>1</kbd> – <kbd>4</kbd> | Select Tower (Archer, Barracks, Mage, Bombard) |
| <kbd>Click</kbd> / <kbd>H</kbd> | Select & Command Hero Sir Gerald |
| <kbd>R</kbd> | Set Rally Point for selected Barracks |
| <kbd>Q</kbd> | Call Reinforcements spell |
| <kbd>W</kbd> | Rain of Fire spell |
| <kbd>N</kbd> | Call next wave early (+Gold bounty) |
| <kbd>U</kbd> | Upgrade selected tower |
| <kbd>S</kbd> | Sell selected tower |
| <kbd>Space</kbd> | Pause / Resume |
| <kbd>M</kbd> | Campaign Modes Intel Matrix |
| <kbd>Esc</kbd> | Clear selection / Cancel targeting |

---

## 🛠️ Technology Stack

- **Rendering**: HTML5 Canvas 2D
- **Audio**: Web Audio API (100% procedural synthesized medieval SFX)
- **Architecture**: Modular Object-Oriented JavaScript (ES6+)
- **Styling**: Responsive CSS3 Medieval Fantasy Theme

---

## 📜 License

MIT License. Created by [duckieturtle](https://github.com/duckieturtle).
