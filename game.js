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
        let bgFrame = 0;
        let lastTime;

        const showBg = () => {
            if (gameStarted) return;
            if (this.bg.loaded) this.bg.draw({ x: bgFrame * 4, y: bgFrame / 2 });

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            ctx.font = `bold 20px "JetBrains Mono", monospace`;
            ctx.fillStyle = "#cdd6f4";
            ctx.textAlign = "left";
            ctx.fillText("Welcome to", centerX - 200,
                centerY - 78);

            ctx.font = `bold 100px "JetBrains Mono", monospace`;
            ctx.fillStyle = "#cdd6f4";
            ctx.textAlign = "center";
            ctx.fillText("SLITHER", centerX,
                centerY+3.2);

            ctx.font = `bold 24px "JetBrains Mono", monospace`;
            ctx.fillStyle = "#cdd6f4";
            ctx.textAlign = "left";
            ctx.fillText("Press       to play.", centerX - 203,
                centerY + 75);
            drawKey(ctx, centerX - 118, centerY + 57, "Enter", 75);

            bgFrame += 1;
            setTimeout(showBg, 48);
        }
        showBg();


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
