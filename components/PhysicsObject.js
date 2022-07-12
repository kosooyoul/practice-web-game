class PhysicsObject {
    x = -20;
    y = 0;
    width = 40;
    height = 40;

    physics = {
        speedX: 0,
        speedY: 0,
        accelerationX: 0,
        accelerationY: 0,
        maxSpeedX: 10,
        movingPowerPerTick: 0.03,
        leftJumpingPower: 0,
        maxJumpingPower: 18,
        jumpingPowerPerTick: 3,
        jumpedAt: null,
        flapped: 0,
        flappable: 1,
        reflectionDecrement: 5,
        reflectivity: 0.4,
        groundResistivity: 0.14,
        airResistivity: 0.01
    };

    constructor(x, y, width, height, physics) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        Object.assign(this.physics, physics);
    }
}