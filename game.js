const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d", {
    alpha: false
});

class Background {
    constructor(game) {
        this.game = game;

        this.image = new Image();
        this.image.src = TILE;
        this.pattern = null;
        this.image.onload = () => {
            this.pattern = ctx.createPattern(this.image, "repeat");
        };
    }

    draw() {
        const head = this.game.player.segments[0];
        const zoom = this.game.zoom;

        if (!this.pattern) return;

        ctx.save();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(zoom, zoom);

        const centerX = canvas.width / 2 / zoom;
        const centerY = canvas.height / 2 / zoom;
        ctx.translate(-head.x + centerX, -head.y + centerY);

        ctx.fillStyle = this.pattern;
        ctx.fillRect(
            head.x - centerX - 500,
            head.y - centerY - 500,
            canvas.width / zoom + 1000,
            canvas.height / zoom + 1000
        );

        ctx.restore();
    }
}

class Wall {
    constructor(game) {
        this.game = game;

        this.radius = WORLD_RADIUS * 2.5;
    }

    snakeStep(snake) {
        const head = snake.segments[0];
        const dist = Math.sqrt(head.x ** 2 + head.y ** 2)
            + snakeRadius(snake.length);

        if (dist > this.radius) {
            snake.kill();
        }
    }

    step() {
        for (let i = 0; i < this.game.bots.length; i++)
            this.snakeStep(this.game.bots[i]);
        const snake = this.game.player;
        this.snakeStep(snake);
    }

    draw() {
        const playerHead = this.game.player.segments[0];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const radius = this.radius * this.game.zoom;

        ctx.save();

        ctx.fillStyle = "#fdf6e3";
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);

        const screenX = (0 - playerHead.x) * this.game.zoom + centerX;
        const screenY = (0 - playerHead.y) * this.game.zoom + centerY;
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2, true);

        ctx.fill('evenodd');

        ctx.restore();
    }
}

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
    }

    regen() {
        if (this.isTemp) {
            this.game.orbs.splice(this.game.orbs.indexOf(this), 1);
            return
        }

        this.x = signedGaussRand(0, WORLD_RADIUS);
        this.y = signedGaussRand(0, WORLD_RADIUS);
        this.radius = randomInt(ORB_SIZE.min, ORB_SIZE.max);

        const primaryRgb = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const colors = genColors(primaryRgb);
        this.primary = colors.primary;
        this.accent = colors.accent;
    }

    snakeStep(snake) {
        const head = snake.segments[0];
        const dx = this.x - head.x;
        const dy = this.y - head.y;

        const dist = Math.sqrt(dx ** 2 + dy ** 2)
            - this.radius - snakeRadius(snake.length);

        if (dist < EAT_DISTANCE) {
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
            }
        }
    }

    step() {
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

class Game {
    constructor() {
        this.input = new Input(this);

        this.bg = new Background(this);
        this.wall = new Wall(this);
        this.player = new PlayerSnake(this);
        this.bots = [];
        for (let i = 0; i < BOT_COUNT; i++) this.bots.push(new BotSnake(this));
        this.orbs = [];
        for (let i = 0; i < ORB_COUNT; i++) this.orbs.push(new Orb(this));
        this.ui = new UserInterface(this);

        this.lastFrame = null;
        this.dt = 0;
        this.frameId = 0;
        this.zoom = 1;

        this.gameOvered = false;

        this.resizeCanvas();
        this.resizeCanvas = this.resizeCanvas.bind(this);
        window.addEventListener("resize", this.resizeCanvas);
    }

    gameOver() {
        this.gameOvered = true;
    }

    updateDeltaTime(timestamp) {
        if (this.lastFrame === null) this.lastFrame = timestamp;
        this.dt = (timestamp - this.lastFrame) / 1000;
        this.lastFrame = timestamp;
    }

    resizeCanvas() {
        canvas.width = window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth;

        canvas.height = window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight;
    }

    step() {
        this.player.step(this.input);
        for (let i = 0; i < this.bots.length; i++) this.bots[i].step(this.input);
        this.wall.step();
        for (let i = 0; i < this.orbs.length; i++) this.orbs[i].step();
    }

    draw() {
        this.bg.draw();
        for (let i = 0; i < this.orbs.length; i++) this.orbs[i].draw();
        for (let i = 0; i < this.bots.length; i++) this.bots[i].draw();
        this.player.draw();
        this.wall.draw();
        this.ui.draw();
    }

    frame = (timestamp) => {
        this.updateDeltaTime(timestamp);

        if (this.input.scrollDelta !== 0) {
            this.zoom *= this.input.scrollDelta > 0 ? 0.95 : 1.05;
            this.input.scrollDelta = 0;
        }

        if (this.input.keys.has("Space")) {
            this.paused = !this.paused;
        }

        if (!this.gameOvered && !this.paused) {
            for (let i = 0; i < SIM_SPEED; i++) this.step();
        }
        this.draw();

        this.frameId += 1;

        this.input.keys.clear();
        requestAnimationFrame(this.frame);
    }
}

window.game = new Game();
game.resizeCanvas();
requestAnimationFrame(game.frame);
