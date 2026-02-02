/**
 * Recipe definitions - Item combination recipes for triggers
 */

export const RECIPES = {
  /**
   * Grow Vine - Grows a beautiful potato vine background
   * A visual spectacle of nature growing
   */
  growVine: {
    id: 'growVine',
    name: '감자 덩굴 성장',
    description: '씨앗과 수분으로 감자 덩굴이 자라납니다',
    ingredients: [
      { type: 'seed', count: 1 },
      { type: 'cell', count: 5 },
    ],
    result: {
      type: 'spawnBackground',  // Creates background element
      elementType: 'potatoVine',
      growDuration: 2.5,        // Growth animation duration (seconds)
    },
  },

  /**
   * Open Gate - Opens a blocked path
   */
  openGate: {
    id: 'openGate',
    name: '문 열기',
    description: '셀 에너지로 막힌 길을 엽니다',
    ingredients: [
      { type: 'cell', count: 10 },
    ],
    result: {
      type: 'removePlatforms',  // Removes blocking platforms
      animation: 'dissolve',
      duration: 800,
    },
  },

  /**
   * Create Bridge - Creates horizontal bridge
   */
  createBridge: {
    id: 'createBridge',
    name: '다리 생성',
    description: '씨앗으로 나무 다리를 만듭니다',
    ingredients: [
      { type: 'seed', count: 2 },
      { type: 'cell', count: 3 },
    ],
    result: {
      type: 'spawnPlatforms',
      animation: 'bridgeGrow',
      duration: 1200,
    },
  },
};

/**
 * Get recipe by ID
 * @param {string} recipeId
 * @returns {Object|null}
 */
export const getRecipe = (recipeId) => {
  return RECIPES[recipeId] || null;
};

/**
 * Check if player has enough ingredients for a recipe
 * @param {Object} recipe
 * @param {Object} inventory - { cell: number, seed: number, ... }
 * @returns {boolean}
 */
export const canCraft = (recipe, inventory) => {
  if (!recipe || !recipe.ingredients) {
    return false;
  }

  return recipe.ingredients.every((ingredient) => {
    const count = inventory[ingredient.type] || 0;
    return count >= ingredient.count;
  });
};

/**
 * Consume ingredients from inventory
 * @param {Object} recipe
 * @param {Object} inventory - Will be mutated
 * @returns {boolean} Success
 */
export const consumeIngredients = (recipe, inventory) => {
  if (!canCraft(recipe, inventory)) {
    return false;
  }

  recipe.ingredients.forEach((ingredient) => {
    inventory[ingredient.type] -= ingredient.count;
  });

  return true;
};
