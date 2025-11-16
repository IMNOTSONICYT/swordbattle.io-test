const Evolution = require('./BasicEvolution');
const Types = require('../Types');

module.exports = class Werewolf extends Evolution {
  static type = Types.Evolution.Werewolf;
  static level = 5;
  static previousEvol = Types.Evolution.Candygrabber;
  static abilityDuration = 8;
  static abilityCooldown = 90;

  constructor(player) {
    super(player);
    this.lastStandActivated = false;
  }

  applyAbilityEffects() {
    // Ability: Last Stand - normally fatal damage sets HP to 1%
    // Increases damage and speed, decreases max health
    this.player.modifiers.lastStand = true;
    if (this.player.sword && this.player.sword.damage) {
      this.player.sword.damage.multiplier *= 1.2;
    }
    this.player.speed.multiplier *= 1.15;
    this.player.health.max.multiplier *= 0.9;
  }

  update(dt) {
    // Base stats: Faster speed, lower size, higher regen
    this.player.speed.multiplier *= 1.25;
    this.player.shape.setScale(0.9);
    this.player.health.regeneration.multiplier *= 1.4;

    // Passive: Lower HP = more damage (up to 50% more based on how low health is)
    if (this.player.sword && this.player.sword.damage) {
      const healthPercent = this.player.health.value / this.player.health.max.value;
      const damageBonus = 1 + (0.5 * (1 - healthPercent)); // 1.0 to 1.5 based on health
      this.player.sword.damage.multiplier *= damageBonus;
    }

    this.player.modifiers.candyMultiplier = 2; // Inherit from Candygrabber

    super.update(dt);
  }
}
