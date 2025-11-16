const Evolution = require('./BasicEvolution');
const Types = require('../Types');

module.exports = class Astral extends Evolution {
  static type = Types.Evolution.Astral;
  static level = 20;
  static previousEvol = Types.Evolution.Werewolf;
  static abilityDuration = 12;
  static abilityCooldown = 80;

  constructor(player) {
    super(player);
    this.stellarProgress = 0;
  }

  applyAbilityEffects() {
    // Ability: Stellar Evolution - gains speed, attack size, regen, size up to 2x each
    const duration = this.constructor.abilityDuration;
    const elapsed = this.abilityDurationTimer.time;
    this.stellarProgress = Math.min(elapsed / duration, 1);

    const multiplier = 1 + this.stellarProgress; // 1x to 2x

    if (this.player.speed) {
      this.player.speed.multiplier *= multiplier;
    }
    if (this.player.sword) {
      this.player.sword.scale *= multiplier;
    }
    if (this.player.health && this.player.health.regeneration) {
      this.player.health.regeneration.multiplier *= multiplier;
    }
    this.player.shape.setScale(1 + (0.5 * this.stellarProgress)); // Base scale plus growth
  }

  deactivateAbility() {
    this.stellarProgress = 0;
    super.deactivateAbility();
  }

  update(dt) {
    // Base stats: Very slow attack speed, high damage, higher health, very low regen
    if (this.player.sword && this.player.sword.swingDuration && this.player.sword.damage) {
      this.player.sword.swingDuration.multiplier['astral'] = 1.6; // Slower attack
      this.player.sword.damage.multiplier *= 1.35;

      // Passive: Sword is 50-75% bigger
      const swordSizeIncrease = 0.5 + (Math.random() * 0.25); // 50-75%
      this.player.sword.scale *= (1 + swordSizeIncrease);
    }

    if (this.player.health && this.player.health.max) {
      this.player.health.max.multiplier *= 1.3;
    }
    if (this.player.health && this.player.health.regeneration) {
      this.player.health.regeneration.multiplier *= 0.4;
    }

    this.player.modifiers.candyMultiplier = 2; // Inherit from Candygrabber chain

    super.update(dt);
  }
}
