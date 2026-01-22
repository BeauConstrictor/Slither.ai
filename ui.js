class RollingAverage {
  constructor(size, initialValue = 0) {
    this.size = size;
    this.sum = size * initialValue;

  }

  push(value) {
    this.sum += value - this.sum / this.size;
  }

  get average() {
    return this.sum / this.size;
  }
}

class UserInterface {
  constructor(game) {
    this.game = game;

    this.fps = new RollingAverage(60, 60 * 5);
    this.lengthSizeBoost = 0;
  }

  draw() {
    const centerX = canvas.width / 2;

    const centerY = canvas.height / 2;
    let text = ``;

    const instantFps = 1 / this.game.dt;
    if (instantFps != Infinity) {
      this.fps.push(instantFps);
      text += `FPS: ${Math.round(this.fps.average)}\n`;
    }

    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillStyle = "#cdd6f4";

    const lines = text.split("\n");
    const x = 50;
    let y = 50;
    const lineHeight = 24;

    for (const line of lines) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }

    this.lengthSizeBoost = Math.max(0, this.lengthSizeBoost - 0.2);
    this.lengthSizeBoost = Math.min(this.lengthSizeBoost,
      LENGTH_MAX_FONT_SIZE - LENGTH_FONT_SIZE);

    const fontSize = LENGTH_FONT_SIZE + this.lengthSizeBoost;
    ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = "#cdd6f4";
    ctx.textAlign = "center";
    ctx.fillText(this.game.player.length.toString(), centerX,
      LENGTH_TEXT_HEIGHT);

    const barXOffset = 10;
    const PAUSE_ICON_WIDTH = 20;
    const PAUSE_ICON_HEIGHT = 80;

    if (this.game.gameOvered) {
      ctx.font = `bold 50px "JetBrains Mono", monospace`;
      ctx.fillStyle = "#cdd6f4";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", centerX,
        centerY);

      ctx.font = `bold 20px "JetBrains Mono", monospace`;
      ctx.fillText("Press any key...", centerX,
        centerY + 40);
    } else if (this.game.paused) {
      ctx.fillStyle = "#cdd6f4";
      ctx.fillRect(
        centerX - PAUSE_ICON_WIDTH - barXOffset,
        centerY - PAUSE_ICON_HEIGHT / 2,
        PAUSE_ICON_WIDTH,
        PAUSE_ICON_HEIGHT
      );
      ctx.fillRect(
        centerX + barXOffset,
        centerY - PAUSE_ICON_HEIGHT / 2,
        PAUSE_ICON_WIDTH,
        PAUSE_ICON_HEIGHT
      );
    }
  }
}
