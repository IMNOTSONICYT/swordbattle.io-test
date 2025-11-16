const Evolution = require('./BasicEvolution');
const Types = require('../Types');

module.exports = class Necromancer extends Evolution {
  static type = Types.Evolution.Necromancer;
  static level = 20;
  static previousEvol = Types.Evolution.Werewolf;
  static abilityDuration = 8;
  static abilityCooldown = 70;

  constructor(player) {
    super(player);
    this.soulStacks = 0;
    this.maxSoulStacks = 8;
  }


  applyAbilityEffects() {
    // Ability: Soul Harvest - consume all soul stacks for massive temporary power
    const stackBonus = 1 + (this.soulStacks * 0.15); // +15% per stack

    if (this.player.sword && this.player.sword.damage) {
      this.player.sword.damage.multiplier *= stackBonus;
    }
    if (this.player.speed) {
      this.player.speed.multiplier *= stackBonus;
    }
    if (this.player.health && this.player.health.regeneration) {
      this.player.health.regeneration.multiplier *= (stackBonus * 2);
    }
    this.player.shape.setScale(1 + (this.soulStacks * 0.05));
  }

  deactivateAbility() {
    // Consume all souls when ability ends
    this.soulStacks = 0;
    super.deactivateAbility();
  }

  update(dt) {
    // Check for player kills and gain soul stacks
    if (this.player.flags && this.player.flags.has(Types.Flags.PlayerKill)) {
      if (this.soulStacks < this.maxSoulStacks) {
        this.soulStacks += 1;
      }
    }

    // Base stats: Slightly more size, low regen, higher health, lower speed
    this.player.shape.setScale(1.1);
    if (this.player.health && this.player.health.regeneration) {
      this.player.health.regeneration.multiplier *= 0.6;
    }
    if (this.player.health && this.player.health.max) {
      this.player.health.max.multiplier *= 1.25;
    }
    if (this.player.speed) {
      this.player.speed.multiplier *= 0.9;
    }

    // Passive: Gain stats based on soul stacks
    const stackBonus = this.soulStacks * 0.05; // +5% per stack when passive
    if (this.player.sword && this.player.sword.damage) {
      this.player.sword.damage.multiplier *= (1 + stackBonus);
    }
    if (this.player.health && this.player.health.max) {
      this.player.health.max.multiplier *= (1 + stackBonus);
    }

    this.player.modifiers.candyMultiplier = 2; // Inherit from Candygrabber chain

    super.update(dt);
  }
}
