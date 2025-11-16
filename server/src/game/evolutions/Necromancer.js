const Evolution = require('./BasicEvolution');
const Types = require('../Types');

module.exports = class Necromancer extends Evolution {
  static type = Types.Evolution.Necromancer;
  static level = 20;
  static previousEvol = Types.Evolution.Werewolf;
  static abilityDuration = 0.1; // Instant
  static abilityCooldown = 70;

  constructor(player) {
    super(player);
    this.minions = [];
    this.maxMinions = 8;
  }

  applyAbilityEffects() {
    // Ability: Minion Upgrade - gives all minions 1000 coins and summons new one
    this.player.modifiers.upgradeMinions = true;
    this.player.modifiers.summonMinion = true;
  }

  update(dt) {
    // Base stats: Slightly more size, low regen, higher health, lower speed
    this.player.shape.setScale(1.1);
    this.player.health.regeneration.multiplier *= 0.6;
    this.player.health.max.multiplier *= 1.25;
    this.player.speed.multiplier *= 0.9;

    // Passive: Kills summon minions
    this.player.modifiers.summonMinionOnKill = true;
    this.player.modifiers.maxMinions = this.maxMinions;
    this.player.modifiers.candyMultiplier = 2; // Inherit from Candygrabber chain

    super.update(dt);
  }
}
