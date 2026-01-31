/**
 * Collision - Collision detection utilities
 */

/**
 * Check if two axis-aligned bounding boxes overlap
 * @param {Object} a - First box {left, right, top, bottom}
 * @param {Object} b - Second box {left, right, top, bottom}
 * @returns {boolean}
 */
export const isAABBOverlap = (a, b) => {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
};

/**
 * Collision result types
 */
export const CollisionSide = {
  NONE: null,
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
};

/**
 * Detect collision between a moving body and a ground line
 * @param {Object} body - Physics body with current and next position
 * @param {number} groundY - Y position of ground (bottom of body touches this)
 * @returns {string|null} Collision side or null
 */
export const detectGroundCollision = (body, groundY) => {
  // Only check if moving downward
  if (body.y >= body._to.y) {
    return CollisionSide.NONE;
  }

  // Check if crossing ground line
  if (groundY >= body.bottom && groundY < body._to.bottom) {
    return CollisionSide.TOP;
  }

  return CollisionSide.NONE;
};

/**
 * Detect collision between two bodies
 * @param {Object} movingBody - Moving physics body
 * @param {Object} staticBody - Static physics body (obstacle)
 * @returns {string|null} Collision side from moving body's perspective
 */
export const detectBoxCollision = (movingBody, staticBody) => {
  const current = {
    left: movingBody.left,
    right: movingBody.right,
    top: movingBody.top,
    bottom: movingBody.bottom,
  };

  const next = {
    left: movingBody._to.left,
    right: movingBody._to.right,
    top: movingBody._to.top,
    bottom: movingBody._to.bottom,
  };

  const obstacle = {
    left: staticBody.left,
    right: staticBody.right,
    top: staticBody.top,
    bottom: staticBody.bottom,
  };

  // Check if next position would miss obstacle horizontally
  if (next.left > obstacle.right || next.right < obstacle.left) {
    // Check if we just left a platform (falling off edge)
    if (current.left <= obstacle.right && current.right >= obstacle.left) {
      if (movingBody.y < movingBody._to.y) {
        return 'fall';
      }
    }
    return CollisionSide.NONE;
  }

  // Check if next position would miss obstacle vertically
  if (next.top > obstacle.bottom || next.bottom < obstacle.top) {
    return CollisionSide.NONE;
  }

  // Landing on top of obstacle (moving downward)
  if (movingBody.y < movingBody._to.y) {
    if (next.left < obstacle.right && next.right > obstacle.left) {
      if (obstacle.top >= current.bottom && obstacle.top < next.bottom) {
        return CollisionSide.TOP;
      }
    }
  }

  // Hitting bottom of obstacle (moving upward)
  if (movingBody.y > movingBody._to.y) {
    if (next.left < obstacle.right && next.right > obstacle.left) {
      if (obstacle.bottom <= current.top && obstacle.bottom >= next.top) {
        return CollisionSide.BOTTOM;
      }
    }
  }

  // Hitting left side of obstacle (moving right)
  if (movingBody.x < movingBody._to.x) {
    if (next.top < obstacle.bottom && next.bottom > obstacle.top) {
      if (obstacle.left <= next.right && obstacle.right >= next.left) {
        return CollisionSide.LEFT;
      }
    }
  }

  // Hitting right side of obstacle (moving left)
  if (movingBody.x > movingBody._to.x) {
    if (next.top < obstacle.bottom && next.bottom > obstacle.top) {
      if (obstacle.right >= next.left && obstacle.left <= next.right) {
        return CollisionSide.RIGHT;
      }
    }
  }

  return CollisionSide.NONE;
};
