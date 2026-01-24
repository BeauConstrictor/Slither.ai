const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d", {
    alpha: false
});

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
        this.paused = false;

        this.resizeCanvas();
        this.resizeCanvas = this.resizeCanvas.bind(this);
        window.addEventListener("resize", this.resizeCanvas);
    }

    gameOver() {
        this.gameOvered = true;
        window.addEventListener('keydown', () => {
            location.reload();
        }, { once: true });

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
            let zoomChange = this.input.scrollDelta > 0 ? 0.95 : 1.05;
            if (this.input.keys.has("z")) {
                if (zoomChange > 1) zoomChange *= ZOOM_SPEED_BOOST;
                else this.zoom /= ZOOM_SPEED_BOOST;
            };
            this.zoom *= zoomChange;
            this.input.scrollDelta = 0;
        }

        if (this.input.keys.has(" ")) {
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

    start() {
        this.resizeCanvas();

        let gameStarted = false;
        let titleFrame = 0;
        let lastTime;
        const titleL = new Image();
        titleL.src = 'assets/title-l.png';
        let titleLLoaded = false;
        titleL.onload = () => titleLLoaded = true;

        const showTitle = () => {
            if (gameStarted) return;
            if (this.bg.loaded) this.bg.draw({
                x: titleFrame * 4,
                y: titleFrame / 2
            });

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            ctx.font = `bold 20px "JetBrains Mono", monospace`;
            ctx.fillStyle = "#cdd6f4";
            ctx.textAlign = "left";
            ctx.fillText("Welcome to", centerX - 190,
                centerY - 78);

            const rotation = Math.sin(titleFrame * TITLE_ANIM_SPEED) * TITLE_WOBBLE;
            const scale = 1 + Math.sin(titleFrame * TITLE_ANIM_SPEED + Math.PI / 2) * TITLE_SCALE;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            ctx.scale(scale, scale);

            ctx.font = `bold 100px "Atma", monospace`;
            ctx.fillStyle = "#cdd6f4";
            ctx.textAlign = "center";
            ctx.fillText("S  ITHER", 0, 3.2);

            if (titleLLoaded) {
                const imgScale = 0.5;
                ctx.drawImage(
                    titleL,
                    -270,
                    -53,
                    titleL.width * imgScale,
                    titleL.height * imgScale * 0.8
                );
            }

            ctx.restore();

            ctx.font = `bold 24px "JetBrains Mono", monospace`;
            ctx.fillStyle = "#cdd6f4";
            ctx.textAlign = "left";
            ctx.fillText("Press       to play.", centerX - 190,
                centerY + 60);
            drawKey(ctx, centerX - 105, centerY + 42, "Enter", 75);

            titleFrame += 1;
            setTimeout(showTitle, 48);
        }
        showTitle();


        const startGame = (event) => {
            if (event.key == "Enter") {
                gameStarted = true;
                playSfx("hitHurt");
                requestAnimationFrame(game.frame);
            } else {
                window.addEventListener("keydown", startGame, { once: true });
            }
        }
        window.addEventListener("keydown", startGame, { once: true });
    }
}

window.game = new Game();
game.start();
