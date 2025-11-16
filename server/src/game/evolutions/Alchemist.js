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
    this.potionThrowInterval = 2; // Throw potion every 2 seconds
  }

  applyAbilityEffects() {
    // Ability: Quick Potions - throws 2x faster with 50% increased area
    this.player.modifiers.quickPotions = true;
    this.player.modifiers.potionAreaMultiplier = 1.5;
    this.potionThrowInterval = 1; // 2x faster (1 second instead of 2)
  }

  deactivateAbility() {
    this.potionThrowInterval = 2; // Reset to normal
    super.deactivateAbility();
  }

  throwPotion() {
    // Random element for potion
    const elements = ['fire', 'water', 'earth', 'air', 'darkness', 'nature', 'lightning'];
    const randomElement = elements[Math.floor(Math.random() * elements.length)];

    this.player.modifiers.throwPotion = randomElement;
    this.player.modifiers.potionElement = randomElement;
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

    // Passive: Throws random potions
    this.potionThrowTimer += dt;
    if (this.potionThrowTimer >= this.potionThrowInterval) {
      this.throwPotion();
      this.potionThrowTimer = 0;
    }

    this.player.modifiers.candyMultiplier = 2; // Inherit from Candygrabber chain

    super.update(dt);
  }
}
