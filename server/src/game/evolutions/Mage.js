const Evolution = require('./BasicEvolution');
const Types = require('../Types');

const ELEMENTS = {
  FIRE: 0,
  WATER: 1,
  EARTH: 2,
  AIR: 3,
  DARKNESS: 4,
  NATURE: 5,
  LIGHTNING: 6
};

module.exports = class Mage extends Evolution {
  static type = Types.Evolution.Mage;
  static level = 15;
  static previousEvol = Types.Evolution.Spirit;
  static abilityDuration = 4;
  static abilityCooldown = 50;

  constructor(player) {
    super(player);
    this.currentElement = Math.floor(Math.random() * 7);
    this.abilityUsed = false;
  }

  applyAbilityEffects() {
    // Conjure ability - uses element ability and switches
    if (!this.abilityUsed) {
      this.performElementAbility();
      // Switch to random different element
      const oldElement = this.currentElement;
      do {
        this.currentElement = Math.floor(Math.random() * 7);
      } while (this.currentElement === oldElement);
      this.abilityUsed = true;
    }

    // Continue applying the element ability effect
    switch (this.currentElement) {
      case ELEMENTS.DARKNESS:
        this.player.modifiers.invisible = true;
        this.player.viewport.multiplier *= 0.3; // Loses vision
        break;
      case ELEMENTS.NATURE:
        // Healing effect is handled in performElementAbility
        break;
    }
  }

  performElementAbility() {
    switch (this.currentElement) {
      case ELEMENTS.FIRE:
        // Summons 16 fireballs (simplified - adds burning effect to nearby)
        this.player.modifiers.fireballBurst = true;
        break;
      case ELEMENTS.WATER:
        // Slowing field
        this.player.modifiers.slowField = true;
        break;
      case ELEMENTS.EARTH:
        // Shockwave knockback
        this.player.modifiers.shockwave = true;
        break;
      case ELEMENTS.AIR:
        // Push away nearby players
        this.player.modifiers.windGust = true;
        break;
      case ELEMENTS.DARKNESS:
        // Invisibility (handled in applyAbilityEffects)
        break;
      case ELEMENTS.NATURE:
        // Heal to full over duration
        this.player.modifiers.rapidHeal = true;
        break;
      case ELEMENTS.LIGHTNING:
        // Dash and stun
        this.player.modifiers.lightningDash = true;
        this.player.speed.multiplier *= 2.5;
        break;
    }
  }

  deactivateAbility() {
    this.abilityUsed = false;
    super.deactivateAbility();
  }

  update(dt) {
    // Base stats: Higher health, higher speed
    this.player.health.max.multiplier *= 1.15;
    this.player.speed.multiplier *= 1.2;

    // Passive: Master of all elements - different abilities per element
    switch (this.currentElement) {
      case ELEMENTS.FIRE:
        // Deals damage over time
        this.player.modifiers.fireDamage = true;
        break;
      case ELEMENTS.WATER:
        // Sees farther in river
        if (this.player.biome === Types.Biome.River) {
          this.player.viewport.multiplier *= 1.5;
        }
        break;
      case ELEMENTS.EARTH:
        // Increased knockback & resistance
        if (this.player.sword && this.player.sword.knockback) {
          this.player.sword.knockback.multiplier['element'] = 1.3;
        }
        this.player.modifiers.knockbackResistance = 0.7;
        break;
      case ELEMENTS.AIR:
        // Swordthrows fling players away
        if (this.player.sword && this.player.sword.knockback) {
          this.player.sword.knockback.multiplier['throw'] = 2;
        }
        break;
      case ELEMENTS.DARKNESS:
        // Lifesteal
        this.player.modifiers.leech = 0.25;
        // Speed boost after getting attacked (handled in damage logic)
        break;
      case ELEMENTS.NATURE:
        // Regens much faster
        this.player.health.regeneration.multiplier *= 1.8;
        break;
      case ELEMENTS.LIGHTNING:
        // Increased speed
        this.player.speed.multiplier *= 1.25;
        break;
    }

    // Store current element for client rendering
    this.player.modifiers.mageElement = this.currentElement;
    this.player.modifiers.candyMultiplier = 2; // Inherit from Candygrabber chain

    super.update(dt);
  }
}
