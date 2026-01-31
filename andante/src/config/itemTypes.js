/**
 * Item type definitions - Data-driven item system
 * Add new item types here without writing new classes
 */

export const ITEM_TYPES = {
  cell: {
    name: 'Cell',
    description: 'Basic currency',
    width: 24,
    height: 24,
    effect: { type: 'currency', key: 'cell', value: 1 },
    render: {
      shape: 'circle',
      colors: {
        primary: '#FFD700',
        secondary: '#DAA520',
        highlight: '#FFE066',
        glow: 'rgba(255, 215, 0, 0.3)',
      },
      glow: true,
      float: true,
    },
  },

  // Example: Add more item types here
  // gem: {
  //   name: 'Gem',
  //   description: 'Valuable gem',
  //   width: 20,
  //   height: 20,
  //   effect: { type: 'currency', key: 'gem', value: 1 },
  //   render: {
  //     shape: 'diamond',
  //     colors: {
  //       primary: '#00BFFF',
  //       secondary: '#0080FF',
  //       highlight: '#80DFFF',
  //       glow: 'rgba(0, 191, 255, 0.3)',
  //     },
  //     glow: true,
  //     float: true,
  //   },
  // },

  // heart: {
  //   name: 'Heart',
  //   description: 'Restores health',
  //   width: 22,
  //   height: 20,
  //   effect: { type: 'heal', value: 1 },
  //   render: {
  //     shape: 'heart',
  //     colors: {
  //       primary: '#FF6B6B',
  //       secondary: '#CC5555',
  //       highlight: '#FFB3B3',
  //       glow: 'rgba(255, 107, 107, 0.3)',
  //     },
  //     glow: true,
  //     float: true,
  //   },
  // },
};

/**
 * Get item type definition
 * @param {string} type
 * @returns {Object|null}
 */
export const getItemType = (type) => {
  return ITEM_TYPES[type] || null;
};
