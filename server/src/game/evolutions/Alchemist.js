const Evolution = require('./BasicEvolution');
const Types = require('../Types');

module.exports = class Alchemist extends Evolution {
  static type = Types.Evolution.Alchemist;
  static level = 15;
  static previousEvol = Types.Evolution.Spirit;
  static abilityDuration = 10;
  static abilityCooldown = 55;

  constructor(player) {
    super(player);
    this.potionThrowTimer = 0;
    this.potionThrowInterval = 2; // Change potion every 2 seconds
    this.currentPotion = 0;
  }

  applyAbilityEffects() {
    // Ability: Quick Potions - gain all potion buffs at once
    if (this.player.sword && this.player.sword.damage) {
      this.player.sword.damage.multiplier *= 1.5;
    }
    if (this.player.speed) {
      this.player.speed.multiplier *= 1.5;
    }
    if (this.player.health && this.player.health.regeneration) {
      this.player.health.regeneration.multiplier *= 3;
    }
    this.player.shape.setScale(1.3);
  }

  throwPotion() {
    // Cycle through different potion effects
    this.currentPotion = (this.currentPotion + 1) % 7;
  }

  getCurrentPotionEffect() {
    // Returns stat multipliers based on current potion
    const effects = {
      0: { damage: 1.2, speed: 1, health: 1, regen: 1 }, // Fire - more damage
      1: { damage: 1, speed: 1, health: 1.2, regen: 1.5 }, // Water - more health/regen
      2: { damage: 1, speed: 0.9, health: 1.3, regen: 1 }, // Earth - tankier but slower
      3: { damage: 1, speed: 1.3, health: 0.9, regen: 1 }, // Air - faster but frailer
      4: { damage: 1.15, speed: 1.1, health: 0.95, regen: 0.9 }, // Darkness - offensive
      5: { damage: 0.95, speed: 1, health: 1.1, regen: 1.3 }, // Nature - healing
      6: { damage: 1.1, speed: 1.15, health: 1, regen: 1 }, // Lightning - balanced buff
    };
    return effects[this.currentPotion];
  }

  update(dt) {
    // Base stats: Lower health, lower speed, higher size
    if (this.player.health && this.player.health.max) {
      this.player.health.max.multiplier *= 0.9;
    }
    if (this.player.speed) {
      this.player.speed.multiplier *= 0.85;
    }
    this.player.shape.setScale(1.15);

    // Passive: Cycle through different potion effects every 2 seconds
    this.potionThrowTimer += dt;
    if (this.potionThrowTimer >= this.potionThrowInterval) {
      this.throwPotion();
      this.potionThrowTimer = 0;
    }

    // Apply current potion effect
    const effect = this.getCurrentPotionEffect();
    if (this.player.sword && this.player.sword.damage) {
      this.player.sword.damage.multiplier *= effect.damage;
    }
    if (this.player.speed) {
      this.player.speed.multiplier *= effect.speed;
    }
    if (this.player.health && this.player.health.max) {
      this.player.health.max.multiplier *= effect.health;
    }
    if (this.player.health && this.player.health.regeneration) {
      this.player.health.regeneration.multiplier *= effect.regen;
    }

    this.player.modifiers.candyMultiplier = 2; // Inherit from Candygrabber chain

    super.update(dt);
  }
}
