class Orb {
    constructor(game, x, y) {
        this.isTemp = false;
        this.game = game;
        this.regen();

        if (x && y) {
            this.x = x;
            this.y = y;
            this.isTemp = true;
        }

        this.hasBeenAttractedThisFrame = false;
    }

    regen() {
        if (this.isTemp) {
            this.game.orbs.splice(this.game.orbs.indexOf(this), 1);
            return
        }

        this.x = signedGaussRand(0, this.game.worldRadius);
        this.y = signedGaussRand(0, this.game.worldRadius);
        this.radius = randomInt(ORB_SIZE.min, ORB_SIZE.max);

        const primaryRgb = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const colors = genColors(primaryRgb);
        this.primary = colors.primary;
        this.accent = colors.accent;
        this.dim = colors.dim;
    }

    snakeStep(snake) {
        const head = snake.segments[0];
        const dx = this.x - head.x;
        const dy = this.y - head.y;

        const dist = Math.sqrt(dx ** 2 + dy ** 2)
            - this.radius - snakeRadius(snake.length);

        if (dist < EAT_DISTANCE && !this.hasBeenAttractedThisFrame) {
            this.hasBeenAttractedThisFrame = true;
            const speed = BOOST_SPEED * 1.3 * this.game.dt;
            const direction = normalise({ x: dx, y: dy }, speed);
            this.x -= direction.x;
            this.y -= direction.y;
        }
        if (dist <= 0) {
            snake.grow(this.radius);
            snake.lastOrbTime = 0;
            this.regen();

            if (snake === this.game.player) {
                this.game.ui.lengthSizeBoost += 5;
                playSfx("hitHurt");
            }
        }
    }

    step() {
        this.hasBeenAttractedThisFrame = false;

        for (let i = 0; i < this.game.bots.length; i++)
            this.snakeStep(this.game.bots[i]);
        const snake = this.game.player;
        this.snakeStep(snake);
    }

    draw() {
        const head = this.game.player.segments[0];

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const x = (this.x - head.x) * this.game.zoom + centerX;
        const y = (this.y - head.y) * this.game.zoom + centerY;

        if (x < -this.radius * 2 || x > canvas.width + this.radius * 2) return;
        if (y < -this.radius * 2 || y > canvas.height + this.radius * 2) return;

        ctx.fillStyle = this.primary;
        ctx.beginPath();
        ctx.arc(x, y, this.radius * this.game.zoom, 0, Math.PI * 2);
        ctx.fill();
    }
}
