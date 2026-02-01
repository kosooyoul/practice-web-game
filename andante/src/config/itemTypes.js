/**
 * Item type definitions - Data-driven item system
 * Add new item types here without writing new classes
 */

export const ITEM_TYPES = {
  cell: {
    name: 'Cell',
    description: 'Basic currency',
    width: 26,
    height: 26,
    effect: { type: 'currency', key: 'cell', value: 1 },
    render: {
      shape: 'hexagon',
      colors: {
        fill: 'rgba(135, 206, 250, 0.4)',       // 맑은 하늘색, 반투명
        stroke: 'rgba(30, 100, 180, 1)',        // 테두리 - 더 진한 파란색
      },
      glow: false,
      float: true,
    },
  },

  seed: {
    name: 'Seed',
    description: 'Potato seed with roots',
    width: 24,
    height: 28,
    effect: { type: 'currency', key: 'seed', value: 1 },
    render: {
      shape: 'potatoSeed',
      colors: {
        body: 'rgba(180, 140, 100, 0.9)',       // 감자색 (베이지/갈색)
        bodyDark: 'rgba(140, 100, 70, 1)',      // 어두운 감자색
        roots: 'rgba(100, 80, 60, 0.8)',        // 뿌리 색
        sprout: 'rgba(120, 160, 80, 0.9)',      // 싹 색 (연두)
      },
      glow: false,
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
