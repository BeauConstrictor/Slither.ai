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
        this.lastTarget = { x: 0, y: 0 };

        this.dead = false;
    }

    kill() {
        this.dead = true;
    }

    get length() {
        return this.segments.length;
    }

    get head() {
        return this.segments[0];
    }

    target() {
        return { x: 0, y: 0, boost: false };
    }

    step() {
        if (this.dead) return;

        let targetVec = this.target();
        this.boost = targetVec.boost;
        targetVec = normalise(targetVec, 1);

        let speed;
        if (this.boost) {
            speed = BOOST_SPEED * this.game.dt;

            // Accumulate time boosting
            if (!this.boostTime) this.boostTime = 0;
            this.boostTime += this.game.dt;

            if (this.boostTime >= BOOST_LOSS_FREQ) {
                this.boostTime -= BOOST_LOSS_FREQ;
                if (this.segments.length > INITIAL_LENGTH) {
                    this.segments.pop();
                }
            }
        } else {
            speed = SPEED * this.game.dt;
            this.boostTime = 0;
        }

        const turnRate = TURN_SPEED * this.game.dt;

        const head = this.head;

        this.lastTarget = targetVec;
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

            if (distance <= SPACING) continue;
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
        if (this.dead) return;

        const radius = snakeRadius(this.length) * this.game.zoom;

        let color;
        if (this.boost) {
            const t = performance.now() / BOOST_FLASH_SPEED;
            const factor = (Math.sin(t) + 1) / 2;
            color = lerpColorHex(this.primary, this.accent, factor);
        } else {
            color = this.accent;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = radius * 2;
        ctx.beginPath();

        const camera = this.game.player.head;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const head = this.head;

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
        fillCircle(
            (tail.x - camera.x) * this.game.zoom + centerX,
            (tail.y - camera.y) * this.game.zoom + centerY,
            radius, color,
        );

        const headX = (head.x - camera.x) * this.game.zoom + centerX;
        const headY = (head.y - camera.y) * this.game.zoom + centerY;

        fillCircle(headX, headY, radius, color);

        const next = this.segments[1] || head;
        const dir = normalise(
            { x: head.x - next.x, y: head.y - next.y },
            1
        );

        const side = { x: -dir.y, y: dir.x };

        const pupilLook = normalise(this.lastTarget, radius * PUPIL_SIZE);

        const leftEyeX =
            headX +
            side.x * radius * EYE_DISTANCE +
            dir.x * radius * EYE_FORWARD;
        const leftEyeY =
            headY +
            side.y * radius * EYE_DISTANCE +
            dir.y * radius * EYE_FORWARD;

        fillCircle(leftEyeX, leftEyeY, radius * EYE_SIZE, "white");
        fillCircle(
            leftEyeX + pupilLook.x,
            leftEyeY + pupilLook.y,
            radius * PUPIL_SIZE,
            "black"
        );

        const rightEyeX =
            headX -
            side.x * radius * EYE_DISTANCE +
            dir.x * radius * EYE_FORWARD;
        const rightEyeY =
            headY -
            side.y * radius * EYE_DISTANCE +
            dir.y * radius * EYE_FORWARD;

        fillCircle(rightEyeX, rightEyeY, radius * EYE_SIZE, "white");
        fillCircle(
            rightEyeX + pupilLook.x,
            rightEyeY + pupilLook.y,
            radius * PUPIL_SIZE,
            "black"
        );

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
            boost: this.game.input.mouseDown,
        }
    }

    kill() {
        this.game.gameOver();
    }
}

const RAYS = 10;
const SIGHT_DISTANCE = 500;
const MAX_NO_ORB_TIME = 10; // seconds

const SNAKE_DBG_COL = genColors(PALETTE[0]).accent;
const ORB_DBG_COL = genColors(PALETTE[3]).accent;
const WALL_DBG_COL = genColors(PALETTE[6]).accent;

class BotSnake extends Snake {
    constructor(game, genome, population) {
        super(game);

        this.genome = genome;
        this.population = population;
        this.rayAngles = generateAngles(RAYS);
        this.rayResults = [];

        this.lastOrbTime = 0;

        this.previousSteer = 0;
    }

    raycast(origin, angle, maxDistance = SIGHT_DISTANCE) {
        const step = 5;
        const worldEdge = WORLD_RADIUS * 2.5;
        let distance = 0;

        while (distance < maxDistance) {
            const x = origin.x + Math.cos(angle) * distance;
            const y = origin.y + Math.sin(angle) * distance;

            if (x < -worldEdge || x > worldEdge || y < -worldEdge || y > worldEdge) {
                return { distance, type: 'wall', x, y };
            }

            for (const food of this.game.orbs) {
                const dx = food.x - x;
                const dy = food.y - y;
                if (dx * dx + dy * dy < food.radius * food.radius) {
                    return { distance, type: 'food', x, y };
                }
            }

            for (const snake of [this.game.player, ...this.game.bots]) {
                if (snake === this) continue;
                for (const seg of snake.segments) {
                    const dx = seg.x - x;
                    const dy = seg.y - y;
                    if (dx * dx + dy * dy < (SPACING / 2) ** 2) {
                        return { distance, type: 'snake', x, y };
                    }
                }
            }

            distance += step;
        }

        const x = origin.x + Math.cos(angle) * maxDistance;
        const y = origin.y + Math.sin(angle) * maxDistance;
        return { distance: maxDistance, type: 'none', x, y };
    }

    target() {
        const inputs = [];

        for (const r of this.rayResults) {
            if (r.type == "food") {
                inputs.push(1 / r.distance);
            } else {
                inputs.push(1 / SIGHT_DISTANCE);
            }
        }

        inputs.push(this.previousSteer);
        inputs.push(this.length);

        let outputs = this.genome.propagate(inputs);
        this.previousSteer = outputs[0];
        const newHeading = this.heading + outputs[0] * TURN_SPEED;
        return {
            x: Math.cos(newHeading),
            y: Math.sin(newHeading),
            boost: outputs[1] > 0,
        };
    }

    fitness() {
        return this.length;
    }

    kill() {
        super.kill();
        this.genome.fitness = this.fitness();
        this.game.bots.splice(this.game.bots.indexOf(this), 1);
        if (this.game.bots.length > 0) return;

        console.log("evolve!");
        this.population.evolve();
        this.game.bots = [];
        for (let genome of this.population.genomes) {
            this.game.bots.push(new BotSnake(this.game,
                genome,
                this.population));
        }
        this.game.ui.generation ++;
    }

    step() {
        if (this.dead) return;

        this.rayResults = [];
        for (const a of this.rayAngles) {
            const ray = this.raycast(this.head, this.heading + a, SIGHT_DISTANCE);
            this.rayResults.push(ray);
        }

        this.lastOrbTime += this.game.dt;
        if (this.lastOrbTime > MAX_NO_ORB_TIME) return this.kill();

        super.step();
    }

    draw() {
        if (this.dead) return;
        super.draw();

        const head = this.head;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for (const ray of this.rayResults) {
            let color = 'transparent';
            if (ray.type === 'wall') color = WALL_DBG_COL;
            else if (ray.type === 'snake') color = SNAKE_DBG_COL;
            else if (ray.type === 'food') color = ORB_DBG_COL;

            ctx.strokeStyle = color;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(
                (head.x - this.game.player.head.x) * this.game.zoom + centerX,
                (head.y - this.game.player.head.y) * this.game.zoom + centerY
            );
            ctx.lineTo(
                (ray.x - this.game.player.head.x) * this.game.zoom + centerX,
                (ray.y - this.game.player.head.y) * this.game.zoom + centerY
            );
            ctx.stroke();
        }
    }
}

// neural network:
//   inputs:
//   - raycasts
//   - length
//   - previous turn angle
//   outputs:
//   - turn angle

function createPopulation(game) {
    const config = new NEATJavaScript.Config({
        inputSize: RAYS + 2,
        outputSize: 2,
        populationSize: BOT_COUNT,
        activationFunction: "Tanh",
    });

    const population = new NEATJavaScript.Population(config);
    const bots = [];

    for (let genome of population.genomes) {
        bots.push(new BotSnake(game, genome, population));
    }

    return bots;
}
