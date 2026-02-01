/**
 * Background element type definitions
 * Data-driven background system for visual atmosphere
 */

// Layer depth for parallax effect (0 = far, 1 = same as player)
export const LAYER_DEPTH = {
  SKY: 0,
  FAR: 0.1,      // Mountains, distant scenery
  MID: 0.4,      // Trees, forests
  NEAR: 0.8,     // Grass, flowers
  EFFECTS: 1,    // Butterflies, fog (moves with camera)
};

/**
 * Background element types
 */
export const BG_TYPES = {
  // === FAR LAYER - Mountains & Hills ===
  mountain: {
    layer: 'far',
    render: 'mountain',
    width: 400,
    height: 300,
    colors: ['#8B9DC3', '#7189B0', '#5A7AA0'],
  },
  
  hill: {
    layer: 'far',
    render: 'hill',
    width: 300,
    height: 150,
    colors: ['#9CAF88', '#7D9B6B', '#6B8A5A'],
  },

  distantTree: {
    layer: 'far',
    render: 'simpleTree',
    width: 40,
    height: 80,
    colors: ['#6B8E6B', '#5A7D5A'],
  },

  // === MID LAYER - Trees & Forests ===
  tree: {
    layer: 'mid',
    render: 'tree',
    width: 60,
    height: 120,
    colors: {
      trunk: '#8B5A2B',
      leaves: ['#4A7C4A', '#3D6B3D', '#2D5A2D'],
    },
  },

  tallTree: {
    layer: 'mid',
    render: 'tallTree',
    width: 50,
    height: 180,
    colors: {
      trunk: '#6B4423',
      leaves: ['#3D6B3D', '#2D5A2D', '#1D4A1D'],
    },
  },

  bush: {
    layer: 'mid',
    render: 'bush',
    width: 50,
    height: 35,
    colors: ['#5A8A5A', '#4A7A4A', '#3A6A3A'],
  },

  rock: {
    layer: 'mid',
    render: 'rock',
    width: 40,
    height: 30,
    colors: ['#888888', '#777777', '#666666'],
  },

  // === NEAR LAYER - Ground Details & Foreground ===
  // Foreground trees (in front of player)
  fgTree: {
    layer: 'near',
    render: 'tree',
    width: 70,
    height: 140,
    colors: {
      trunk: '#5A4020',
      leaves: ['#3A6A3A', '#2D5A2D', '#1D4A1D'],
    },
  },

  fgBush: {
    layer: 'near',
    render: 'bush',
    width: 55,
    height: 40,
    colors: ['#4A7A4A', '#3A6A3A', '#2A5A2A'],
  },

  grass: {
    layer: 'near',
    render: 'grass',
    width: 30,
    height: 20,
    colors: ['#6B9B4B', '#5A8A3A', '#4A7A2A'],
    animated: true,
  },

  tallGrass: {
    layer: 'near',
    render: 'tallGrass',
    width: 25,
    height: 35,
    colors: ['#7BAB5B', '#6A9A4A', '#5A8A3A'],
    animated: true,
  },

  flower: {
    layer: 'near',
    render: 'flower',
    width: 15,
    height: 20,
    colors: {
      stem: '#5A8A3A',
      petals: ['#FF6B8A', '#FFB347', '#87CEEB', '#DDA0DD', '#F0E68C'],
    },
    animated: true,
  },

  smallRock: {
    layer: 'near',
    render: 'smallRock',
    width: 20,
    height: 15,
    colors: ['#999999', '#888888'],
  },

  // === EFFECTS LAYER - Animated Elements ===
  butterfly: {
    layer: 'effects',
    render: 'butterfly',
    width: 12,
    height: 10,
    colors: ['#FF69B4', '#87CEEB', '#FFD700', '#98FB98'],
    animated: true,
    movement: { type: 'flutter', rangeX: 100, rangeY: 50, speed: 0.02 },
  },

  fog: {
    layer: 'effects',
    render: 'fog',
    width: 200,
    height: 80,
    colors: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'],
    animated: true,
    movement: { type: 'drift', speed: 0.3 },
  },

  particle: {
    layer: 'effects',
    render: 'particle',
    width: 4,
    height: 4,
    colors: ['rgba(255,255,255,0.6)', 'rgba(255,255,200,0.4)'],
    animated: true,
    movement: { type: 'float', speed: 0.5 },
  },
};

/**
 * Sky gradient presets with ground colors
 */
export const SKY_PRESETS = {
  day: {
    gradient: ['#87CEEB', '#B0E0E6', '#E0F0FF'],
    sunPosition: { x: 0.7, y: 0.2 },
    sunColor: '#FFF8DC',
    ground: {
      top: '#8B7355',      // Earthy brown
      middle: '#6B5344',   // Darker dirt
      bottom: '#4A3728',   // Deep earth
    },
  },
  sunset: {
    gradient: ['#FF7F50', '#FFB347', '#FFE4B5', '#87CEEB'],
    sunPosition: { x: 0.8, y: 0.4 },
    sunColor: '#FF6347',
    ground: {
      top: '#A0522D',      // Warm sienna
      middle: '#8B4513',   // Saddle brown
      bottom: '#5D3A1A',   // Dark brown
    },
  },
  night: {
    gradient: ['#0C1445', '#1A237E', '#283593'],
    stars: true,
    moonPosition: { x: 0.3, y: 0.2 },
    ground: {
      top: '#2F2F3F',      // Dark purple-gray
      middle: '#1F1F2F',   // Darker
      bottom: '#0F0F1F',   // Almost black
    },
  },
  cloudy: {
    gradient: ['#A0A0A0', '#B8B8B8', '#D0D0D0'],
    clouds: true,
    ground: {
      top: '#696969',      // Dim gray
      middle: '#505050',   // Darker gray
      bottom: '#383838',   // Charcoal
    },
  },
};

/**
 * Get background element type
 */
export const getBgType = (type) => {
  return BG_TYPES[type] || null;
};
