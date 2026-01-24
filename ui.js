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

  drawTextOverlay() {
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
  }

  drawMinimap() {
    const mmScale = MINIMAP_RADIUS / this.game.worldRadius / 2.5;
    const mmX = canvas.width - MINIMAP_RADIUS - MINIMAP_PADDING;
    const mmY = canvas.height - MINIMAP_RADIUS - MINIMAP_PADDING;

    ctx.fillStyle = "#313244";
    ctx.beginPath();
    ctx.arc(mmX, mmY, MINIMAP_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    for (let orb of this.game.orbs) {
      const distSq = orb.x * orb.x + orb.y * orb.y;
      const maxDist = this.game.worldRadius * 2.5 - orb.radius;

      if (distSq >= maxDist * maxDist) continue;

      const x = orb.x * mmScale;
      const y = orb.y * mmScale;
      const radius = orb.radius * mmScale;

      ctx.fillStyle = orb.dim;
      ctx.beginPath();
      ctx.arc(mmX + x, mmY + y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const snakes = [...this.game.bots, this.game.player];
    for (let snake of snakes) {
      const distSq = snake.head.x ** 2 + snake.head.y ** 2;
      const maxDist = this.game.worldRadius * 2.5 - MINIMAP_BOT_SPOT_SIZE;

      if (distSq >= maxDist ** 2) continue;

      const x = snake.head.x * mmScale;
      const y = snake.head.y * mmScale;
      const radius = MINIMAP_BOT_SPOT_SIZE * mmScale;

      ctx.fillStyle = snake.primary;
      ctx.beginPath();
      ctx.arc(mmX + x, mmY + y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawLengthValue() {
    const centerX = canvas.width / 2;

    this.lengthSizeBoost = Math.max(0, this.lengthSizeBoost - 0.2);
    this.lengthSizeBoost = Math.min(
      this.lengthSizeBoost,
      LENGTH_MAX_FONT_SIZE - LENGTH_FONT_SIZE
    );

    const shake = Math.sin(performance.now() * 0.02) * LENGTH_SHAKE *
                  (this.lengthSizeBoost / (LENGTH_MAX_FONT_SIZE - LENGTH_FONT_SIZE));

    ctx.save();
    ctx.translate(centerX, LENGTH_TEXT_HEIGHT);
    ctx.rotate(shake);

    const fontSize = LENGTH_FONT_SIZE + this.lengthSizeBoost;
    ctx.font = `bold ${fontSize}px "Atma", monospace`;
    ctx.fillStyle = "#cdd6f4";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(this.game.player.length.toString(), 0, 0);
    ctx.restore();

  }

  drawPausingStatuses() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    if (this.game.gameOvered || this.game.paused) {
      ctx.filter = "blur(6px)";
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = "none";
    }

    if (this.game.gameOvered) {
      ctx.font = `bold 70px "Atma", monospace`;
      ctx.fillStyle = "#cdd6f4";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", centerX, centerY);

      ctx.font = `bold 20px "JetBrains Mono", monospace`;
      ctx.fillText("Press       .", centerX, centerY + 54);
      drawKey(ctx, centerX-6.5, centerY+35, "Enter", 70);
    } else if (this.game.paused) {
      ctx.fillStyle = "#cdd6f4";
      ctx.fillRect(
        centerX - PAUSE_ICON_WIDTH - PAUSE_ICON_X_DIST,
        centerY - PAUSE_ICON_HEIGHT / 2,
        PAUSE_ICON_WIDTH,
        PAUSE_ICON_HEIGHT
      );
      ctx.fillRect(
        centerX + PAUSE_ICON_X_DIST,
        centerY - PAUSE_ICON_HEIGHT / 2,
        PAUSE_ICON_WIDTH,
        PAUSE_ICON_HEIGHT
      );
    }
  }

  draw() {
    this.drawTextOverlay();
    this.drawLengthValue();
    this.drawMinimap();
    this.drawPausingStatuses();
  }
}
