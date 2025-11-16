const Evolution = require('./BasicEvolution');
const Types = require('../Types');

module.exports = class Candygrabber extends Evolution {
  static type = Types.Evolution.Candygrabber;
  static level = 1;
  static abilityDuration = 5;
  static abilityCooldown = 45;

  constructor(player) {
    super(player);
    this.lastTrickOrTreat = null;
  }

  applyAbilityEffects() {
    // Trick or Treat ability - randomly gets a Trick or Treat
    if (!this.player.sword || !this.player.sword.damage) return;

    if (!this.lastTrickOrTreat || this.abilityDurationTimer.time < 0.1) {
      // Roll for Trick or Treat when ability is activated
      const isTreat = Math.random() > 0.5;
      this.lastTrickOrTreat = isTreat;

      if (isTreat) {
        // Treat - positive effects
        this.player.speed.multiplier *= 1.3;
        this.player.health.max.multiplier *= 1.2;
        this.player.sword.damage.multiplier *= 1.25;
      } else {
        // Trick - negative effects but with some compensation
        this.player.speed.multiplier *= 0.7;
        this.player.shape.setScale(0.7);
        this.player.health.max.multiplier *= 0.8;
        // But gain more knockback resistance and damage
        this.player.sword.damage.multiplier *= 1.4;
        this.player.modifiers.knockbackResistance = 0.6;
      }
    } else {
      // Reapply the same effect
      if (this.lastTrickOrTreat) {
        // Treat
        this.player.speed.multiplier *= 1.3;
        this.player.health.max.multiplier *= 1.2;
        this.player.sword.damage.multiplier *= 1.25;
      } else {
        // Trick
        this.player.speed.multiplier *= 0.7;
        this.player.shape.setScale(0.7);
        this.player.health.max.multiplier *= 0.8;
        this.player.sword.damage.multiplier *= 1.4;
        this.player.modifiers.knockbackResistance = 0.6;
      }
    }
  }

  update(dt) {
    // Passive: Collects 2x candy (will be handled in coin collection logic)
    this.player.modifiers.candyMultiplier = 2;

    super.update(dt);
  }
}
