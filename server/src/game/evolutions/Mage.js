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
  static abilityDuration = 6;
  static abilityCooldown = 50;

  constructor(player) {
    super(player);
    this.currentElement = Math.floor(Math.random() * 7);
    this.abilityUsed = false;
  }

  applyAbilityEffects() {
    // Conjure ability - enhances current element and then switches
    if (!this.abilityUsed) {
      // Switch to random different element
      const oldElement = this.currentElement;
      do {
        this.currentElement = Math.floor(Math.random() * 7);
      } while (this.currentElement === oldElement);
      this.abilityUsed = true;
    }

    // Massively enhanced effects during ability
    switch (this.currentElement) {
      case ELEMENTS.FIRE:
        if (this.player.sword && this.player.sword.damage) {
          this.player.sword.damage.multiplier *= 1.8;
        }
        break;
      case ELEMENTS.WATER:
        if (this.player.health && this.player.health.regeneration) {
          this.player.health.regeneration.multiplier *= 4;
        }
        this.player.viewport.zoom.multiplier *= 1.5;
        break;
      case ELEMENTS.EARTH:
        this.player.shape.setScale(1.5);
        if (this.player.sword && this.player.sword.knockback) {
          this.player.sword.knockback.multiplier['element'] = 2;
        }
        this.player.knockbackResistance.multiplier *= 3;
        break;
      case ELEMENTS.AIR:
        if (this.player.speed) {
          this.player.speed.multiplier *= 2;
        }
        if (this.player.sword && this.player.sword.knockback) {
          this.player.sword.knockback.multiplier['throw'] = 3;
        }
        break;
      case ELEMENTS.DARKNESS:
        this.player.modifiers.invisible = true;
        if (this.player.sword && this.player.sword.damage) {
          this.player.sword.damage.multiplier *= 1.5;
        }
        break;
      case ELEMENTS.NATURE:
        if (this.player.health && this.player.health.regeneration) {
          this.player.health.regeneration.multiplier *= 6;
        }
        if (this.player.health && this.player.health.max) {
          this.player.health.max.multiplier *= 1.3;
        }
        break;
      case ELEMENTS.LIGHTNING:
        if (this.player.speed) {
          this.player.speed.multiplier *= 2.5;
        }
        if (this.player.sword && this.player.sword.damage) {
          this.player.sword.damage.multiplier *= 1.4;
        }
        break;
    }
  }

  deactivateAbility() {
    this.abilityUsed = false;
    super.deactivateAbility();
  }

  update(dt) {
    // Base stats: Higher health, higher speed
    if (this.player.health && this.player.health.max) {
      this.player.health.max.multiplier *= 1.15;
    }
    if (this.player.speed) {
      this.player.speed.multiplier *= 1.2;
    }

    // Passive: Master of all elements - different abilities per element
    switch (this.currentElement) {
      case ELEMENTS.FIRE:
        // Higher damage
        if (this.player.sword && this.player.sword.damage) {
          this.player.sword.damage.multiplier *= 1.25;
        }
        break;
      case ELEMENTS.WATER:
        // Better regen and vision
        if (this.player.health && this.player.health.regeneration) {
          this.player.health.regeneration.multiplier *= 1.4;
        }
        this.player.viewport.zoom.multiplier *= 1.2;
        break;
      case ELEMENTS.EARTH:
        // Increased knockback & resistance
        if (this.player.sword && this.player.sword.knockback) {
          this.player.sword.knockback.multiplier['element'] = 1.3;
        }
        this.player.knockbackResistance.multiplier *= 1.4;
        this.player.shape.setScale(1.15);
        break;
      case ELEMENTS.AIR:
        // Speed and throw knockback
        if (this.player.speed) {
          this.player.speed.multiplier *= 1.25;
        }
        if (this.player.sword && this.player.sword.knockback) {
          this.player.sword.knockback.multiplier['throw'] = 1.5;
        }
        break;
      case ELEMENTS.DARKNESS:
        // Stealth and damage
        this.player.modifiers.invisible = true;
        if (this.player.sword && this.player.sword.damage) {
          this.player.sword.damage.multiplier *= 1.15;
        }
        break;
      case ELEMENTS.NATURE:
        // Strong regen
        if (this.player.health && this.player.health.regeneration) {
          this.player.health.regeneration.multiplier *= 2;
        }
        break;
      case ELEMENTS.LIGHTNING:
        // High speed
        if (this.player.speed) {
          this.player.speed.multiplier *= 1.35;
        }
        break;
    }

    // Store current element for client rendering
    this.player.modifiers.mageElement = this.currentElement;
    this.player.modifiers.candyMultiplier = 2; // Inherit from Candygrabber chain

    super.update(dt);
  }
}
