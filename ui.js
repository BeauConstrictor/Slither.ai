class RollingAverage {
  constructor(size, initialValue = 0) {
    this.size = size;
    this.sum = size * initialValue;

    this.generation = 1;
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

    this.fps = new RollingAverage(60, 60);
  }

  draw() {

    let text = "";

    const instantFps = 1 / this.game.dt;
    if (instantFps != Infinity) {
      this.fps.push(instantFps);
      text += `FPS: ${Math.round(this.fps.average)}\n`;
    }

    ctx.fillStyle = "#586e75";
    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.fillText(text, 50, 50);
  }
}
