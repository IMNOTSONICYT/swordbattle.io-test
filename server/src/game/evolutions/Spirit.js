const Evolution = require('./BasicEvolution');
const Types = require('../Types');

module.exports = class Spirit extends Evolution {
  static type = Types.Evolution.Spirit;
  static level = 5;
  static previousEvol = Types.Evolution.Candygrabber;
  static abilityDuration = 7;
  static abilityCooldown = 60;

  applyAbilityEffects() {
    // Ability: No Knockback - heavily increases knockback dealt, increases speed, lowers health
    this.player.modifiers.noKnockback = true;
    if (this.player.sword && this.player.sword.knockback) {
      this.player.sword.knockback.multiplier['ability'] = 3.5;
    }
    this.player.speed.multiplier *= 1.4;
    this.player.health.max.multiplier *= 0.85;
  }

  update(dt) {
    // Base stats: Low health, fast speed, lower size, very low knockback resistance
    this.player.health.max.multiplier *= 0.8;
    this.player.speed.multiplier *= 1.3;
    this.player.shape.setScale(0.85);
    this.player.modifiers.knockbackResistance = 0.2;
    if (this.player.sword && this.player.sword.knockback) {
      this.player.sword.knockback.multiplier['passive'] = 0.5;
    }

    // Passive: Phases through objects
    this.player.modifiers.phaseThrough = true;
    this.player.modifiers.candyMultiplier = 2; // Inherit from Candygrabber

    super.update(dt);
  }
}
