// MAP
const TILE = "./assets/bg.png";
const WORLD_RADIUS = 3000;

// SNAKES
const SPEED = 250;
const SPACING = 10;
const INITIAL_LENGTH = 20;
const STOMACH = 20;
const TURN_SPEED = 5;

// ORBS
const ORB_COUNT = 2000;
const EAT_DISTANCE = 100
const ORB_SIZE = { min: 5, max: 20 };
const SHAKE_SIZE = 20;
const SHAKE_SPEED = 2;

// AI
const BOT_COUNT = 0;
const ORB_ATTRACTION = 1.0;
const PLAYER_REPULSION = 2.5;
const PLAYER_REPULSION_RADIUS = 200;
const WALL_REPULSION = 3.0;
const WALL_REPULSION_RADIUS = 300;
const BOT_REPULSION = 1.8;
const BOT_REPULSION_RADIUS = 150;

const PALETTE = [
    [255, 0, 0],
    [255, 102, 0],
    [255, 255, 0],
    [0, 255, 0],
    [0, 255, 255],
    [0, 102, 255],
    [153, 0, 255],
    [255, 0, 204],
    [255, 0, 255],
    [0, 204, 204],
]

function snakeRadius(length) {
    return 7 + length / 5;
}

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d", {
    alpha: false
});

function normalise(v, length = 1) {
    const currentLength = Math.sqrt(v.x * v.x + v.y * v.y);
    if (currentLength === 0) return { x: 0, y: 0 };
    const scale = length / currentLength;
    return { x: v.x * scale, y: v.y * scale };
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function genColors(rgbArray) {
    const rgbToHex = (rgb) =>
        "#" + rgb.map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();

    const originalHex = rgbToHex(rgbArray);

    const darkenedRgb = rgbArray.map(c => Math.max(0, c - 50));
    const darkenedHex = rgbToHex(darkenedRgb);

    return { primary: originalHex, accent: darkenedHex };
}

function catmullRomToBezier(p0, p1, p2, p3) {
    const bp1 = {
        x: p1.x + (p2.x - p0.x) / 6,
        y: p1.y + (p2.y - p0.y) / 6,
    };
    const bp2 = {
        x: p2.x - (p3.x - p1.x) / 6,
        y: p2.y - (p3.y - p1.y) / 6,
    };
    return [bp1, bp2];
}

function lerp(a, b, t) {
    return a + t * (b - a);
}

function lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff * t;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gaussRand(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
}

function signedGaussRand(mean = 0, stdDev = 1) {
    const value = gaussRand(mean, stdDev);
    return Math.random() < 0.5 ? -Math.abs(value) : Math.abs(value);
}

function perlin1d(x, seed=0) {
    function hash(n) {
        n = (n + seed) & 0xffffffff;
        n = (n << 13) ^ n;
        return (1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    }

    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const t = x - x0;

    const n0 = hash(x0);
    const n1 = hash(x1);

    return lerp(n0, n1, fade(t));
}

function perlin2d(x, seed=0) {
    return {
        x: perlin1d(x, seed) - 1,
        y: perlin1d(x+32758, seed) - 1,
    }
}

export class Input {
    constructor(game) {
        this.game = game;

        this.mouseX = 0;
        this.mouseY = 0;
        this.scrollDelta = 0;

        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = event.clientX - rect.left;
            this.mouseY = event.clientY - rect.top;
        });

        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.scrollDelta = event.deltaY;
        }, { passive: false });
    }
}

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

    step() {
        const head = this.game.player.segments[0];
        const dist = Math.sqrt(head.x ** 2 + head.y ** 2)
            + snakeRadius(this.game.player.length);

        if (dist > this.radius) {
            this.game.gameOver();
        }
    }

    draw() {
        const playerHead = this.game.player.segments[0];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const radius = this.radius * this.game.zoom;

        ctx.save();

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);

        const screenX = (0 - playerHead.x) * this.game.zoom + centerX;
        const screenY = (0 - playerHead.y) * this.game.zoom + centerY;
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2, true);

        ctx.fill('evenodd');

        ctx.restore();
    }
}

class UserInterface {
    constructor(game) {
        this.game = game;
    }

    draw() {
        ctx.fillStyle = "white";

        const fps = 1 / this.game.dt;
        ctx.fillText(`FPS: ${Math.round(fps)}`, 50, 50);
    }
}

class Snake {
    constructor(game) {
        this.game = game;

        const startX = clamp(signedGaussRand(0, WORLD_RADIUS), -WORLD_RADIUS, WORLD_RADIUS);
        const startY = clamp(signedGaussRand(0, WORLD_RADIUS), -WORLD_RADIUS, WORLD_RADIUS);

        this.segments = [];
        for (let i = 0; i < INITIAL_LENGTH; i++) {
            this.segments.push({
                x: startX + i * SPACING,
                y: startY + i * SPACING,
            });
        }

        const primaryRgb = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const colors = genColors(primaryRgb);
        this.primary = colors.primary;
        this.accent = colors.accent;

        this.digesting = STOMACH;

        this.heading = 0;
    }

    get length() {
        return this.segments.length;
    }

    target() {
        return { x: 0, y: 0 }
    }

    step(input) {
        const speed = SPEED * this.game.dt;
        const turnRate = TURN_SPEED * this.game.dt;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const head = this.segments[0];

        const dx = input.mouseX - centerX;
        const dy = input.mouseY - centerY;
        const targetVec = normalise(this.target(), 1);
        const target = Math.atan2(targetVec.y, targetVec.x);
        this.heading = lerpAngle(this.heading, target, turnRate);
        head.x += Math.cos(this.heading) * speed;
        head.y += Math.sin(this.heading) * speed;

        for (let i = 1; i < this.length; i++) {
            const p = this.segments[i];

            const front = this.segments[i - 1];
            const dx = front.x - p.x;
            const dy = front.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const moveDistance = Math.min(speed, distance - SPACING);
            const move = normalise({ x: dx, y: dy }, moveDistance);

            p.x += move.x;
            p.y += move.y;
        }
    }

    grow(points) {
        this.digesting -= points;
        while (this.digesting <= 0) {
            this.digesting = STOMACH + this.digesting;
            const tail = this.segments[this.length - 1];
            this.segments.push({ x: tail.x, y: tail.y });
        }
    }

    draw() {
        const radius = snakeRadius(this.length) * this.game.zoom;

        ctx.strokeStyle = this.accent;
        ctx.lineWidth = radius * 2;
        ctx.beginPath();

        const camera = this.game.player.segments[0];

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const head = this.segments[0];

        ctx.moveTo(
            (head.x - camera.x) * this.game.zoom + centerX,
            (head.y - camera.y) * this.game.zoom + centerY
        );

        for (let i = 0; i < this.length - 1; i++) {
            const p0 = this.segments[i - 1 < 0 ? 0 : i - 1];
            const p1 = this.segments[i];
            const p2 = this.segments[i + 1];
            const p3 = this.segments[i + 2 >= this.length ? this.length - 1 : i + 2];

            const [bp1, bp2] = catmullRomToBezier(p0, p1, p2, p3);

            ctx.bezierCurveTo(
                (bp1.x - camera.x) * this.game.zoom + centerX,
                (bp1.y - camera.y) * this.game.zoom + centerY,
                (bp2.x - camera.x) * this.game.zoom + centerX,
                (bp2.y - camera.y) * this.game.zoom + centerY,
                (p2.x - camera.x) * this.game.zoom + centerX,
                (p2.y - camera.y) * this.game.zoom + centerY
            );
        }

        ctx.stroke();

        const tail = this.segments[this.length - 1];
        ctx.fillStyle = this.accent;
        ctx.beginPath();
        ctx.arc(
            (tail.x - camera.x) * this.game.zoom + centerX,
            (tail.y - camera.y) * this.game.zoom + centerY,
            radius, 0, Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = this.primary;
        ctx.beginPath();
        ctx.arc(
            (head.x - camera.x) * this.game.zoom + centerX,
            (head.y - camera.y) * this.game.zoom + centerY,
            radius, 0, Math.PI * 2
        );
        ctx.fill();
    }
}

class PlayerSnake extends Snake {
    constructor(game) {
        super(game);
    }

    target() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        return {
            x: this.game.input.mouseX - centerX,
            y: this.game.input.mouseY - centerY,
        }
    }
}

class BotSnake extends Snake {
    constructor(game) {
        super(game);
    }

    target() {
        return { x: 0, y: 0 };
    }
}

class Orb {
    constructor(game) {
        this.game = game;
        this.regen();

        this.shakeX = 0;
        this.shakeY = 0;

        this.seed = randomInt(0, 1024);
        this.time = randomInt(0, 1024);
    }

    regen() {
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
        const dx = this.shakeX - head.x;
        const dy = this.shakeY - head.y;

        const dist = Math.sqrt(dx ** 2 + dy ** 2)
            - this.radius - snakeRadius(snake.length);

        if (dist < EAT_DISTANCE) {
            const speed = SPEED * 2 * this.game.dt;
            const direction = normalise({ x: dx, y: dy }, speed);
            this.x -= direction.x;
            this.y -= direction.y;
        }
        if (dist <= 0) {
            snake.grow(this.radius);
            this.regen();
        }
    }

    step() {
        this.time += this.game.dt * SHAKE_SPEED
        const shake = perlin2d(this.time, this.seed);
        this.shakeX = this.x + shake.x*10;
        this.shakeY = this.y + shake.y*SHAKE_SIZE;

        const snake = this.game.player;
        for (let i = 0; i < this.game.bots.length; i++)
            this.snakeStep(this.game.bots[i]);
        this.snakeStep(snake);

    }

    draw() {
        const head = this.game.player.segments[0];

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const x = (this.shakeX - head.x) * this.game.zoom + centerX;
        const y = (this.shakeY - head.y) * this.game.zoom + centerY;

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
            this.input.scrollDelta = 0; ``
        }

        this.resizeCanvas();
        if (!this.gameOvered) this.step();
        this.draw();

        this.frameId += 1;

        requestAnimationFrame(this.frame);
    }
}

const game = new Game();
requestAnimationFrame(game.frame);
