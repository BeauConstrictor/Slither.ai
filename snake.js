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
        for (let s of this.segments) {
            this.game.orbs.push(new Orb(this.game, s.x, s.y))
        }
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

    checkPlayerBotCollisions() {
        if (this.dead) return;

        const player = this.game.player;

        let snakesToCheck = [];
        if (this instanceof BotSnake) {
            if (!player.dead) snakesToCheck.push(player);
        } else if (this instanceof PlayerSnake) {
            snakesToCheck = this.game.bots.filter(bot => !bot.dead);
        } else {
            return;
        }

        const myHead = this.head;
        const myRadius = snakeRadius(this.length);

        for (const snake of snakesToCheck) {
            const otherHead = snake.head;
            const otherRadius = snakeRadius(snake.length);

            const dxH = myHead.x - otherHead.x;
            const dyH = myHead.y - otherHead.y;
            const headDist = Math.sqrt(dxH * dxH + dyH * dyH);

            if (headDist < myRadius + otherRadius) {
                if (this instanceof PlayerSnake) {
                    this.kill();
                } else if (snake instanceof PlayerSnake) {
                    snake.kill();
                }
                return;
            }

            for (let i = 1; i < snake.segments.length; i++) {
                const seg = snake.segments[i];
                const dx = myHead.x - seg.x;
                const dy = myHead.y - seg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < myRadius) {
                    this.kill();
                    return;
                }
            }
        }
    }

    step() {
        if (this.dead) return;

        let targetVec = this.target();
        this.boost = targetVec.boost;
        targetVec = normalise(targetVec, 1);

        let speed;
        if (this.boost) {
            speed = BOOST_SPEED * this.game.dt;

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

        this.checkPlayerBotCollisions();
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

class BotSnake extends Snake {
    constructor(game) {
        super(game);
        this.currentHeading = Math.random() * Math.PI * 2;
        this.id = Math.floor(Math.random() * 10000);
    }

    target() {
        const head = this.head;
        let desired = this.currentHeading;

        if (this.game.orbs.length > 0) {
            let closestOrb = null;
            let minDistSq = Infinity;

            for (const orb of this.game.orbs) {
                const dx = orb.x - head.x;
                const dy = orb.y - head.y;
                const d = dx * dx + dy * dy;
                if (d < minDistSq) {
                    minDistSq = d;
                    closestOrb = orb;
                }
            }

            if (closestOrb) {
                const angleToOrb = Math.atan2(
                    closestOrb.y - head.y,
                    closestOrb.x - head.x
                );

                const orbWeight =
                    this.threatLevel > 0.1
                        ? BOT_ORB_ATTRACT_FAR
                        : BOT_ORB_ATTRACT;

                desired += orbWeight *
                    normaliseAngle(angleToOrb - desired);
            }
        } else {
            const t = performance.now() * 0.001 * BOT_NOISE_SCALE + this.id;
            desired += Math.sin(t * Math.PI * 2) * BOT_NOISE_SWAY;
        }

        let closestDist = Infinity;
        let repelAngle = null;

        const snakes = [this.game.player, ...this.game.bots];
        for (const snake of snakes) {
            if (snake === this || snake.dead) continue;

            for (let i = 0; i < snake.segments.length; i += BOT_SEGMENT_SKIP) {
                const s = snake.segments[i];
                const dx = s.x - head.x;
                const dy = s.y - head.y;

                let dist = Math.hypot(dx, dy);
                dist -= snakeRadius(snake.length);

                if (dist < closestDist) {
                    closestDist = dist;
                    repelAngle = Math.atan2(dy, dx);
                }
            }
        }

        this.threatLevel = 0;

        if (closestDist < BOT_REPEL_DISTANCE && repelAngle !== null) {
            const danger = 1 - (closestDist / BOT_REPEL_DISTANCE);
            const scaled = Math.pow(danger, BOT_REPEL_EXPONENT);

            this.threatLevel = scaled;

            desired +=
                BOT_REPEL_WEIGHT *
                BOT_AGGRESSION *
                scaled *
                normaliseAngle(repelAngle + Math.PI - desired);
        }

        const distFromCenter = Math.hypot(head.x, head.y);
        const REAL_EDGE_RADIUS = WORLD_RADIUS * 2.5;

        if (distFromCenter > BOT_EDGE_BUFFER) {
            const toCenter = Math.atan2(-head.y, -head.x);
            const t = (distFromCenter - BOT_EDGE_BUFFER) /
                (REAL_EDGE_RADIUS - BOT_EDGE_BUFFER);

            desired = lerpAngle(
                desired,
                toCenter,
                t * BOT_EDGE_FORCE
            );
        }

        let delta = normaliseAngle(desired - this.currentHeading);
        const maxTurn = BOT_TURN_SPEED * this.game.dt;
        delta = Math.max(-maxTurn, Math.min(maxTurn, delta));
        this.currentHeading += delta;

        return {
            x: Math.cos(this.currentHeading),
            y: Math.sin(this.currentHeading),
            boost: false
        };
    }
}
