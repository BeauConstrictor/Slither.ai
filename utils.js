function normalise(v, length = 1) {
    const currentLength = Math.sqrt(v.x * v.x + v.y * v.y);
    if (currentLength === 0) return { x: 0, y: 0 };
    const scale = length / currentLength;
    return { x: v.x * scale, y: v.y * scale };
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function lerpColorHex(c1, c2, t) {
    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        const bigint = parseInt(hex, 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    function rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)
            .toUpperCase();
    }

    const [r1, g1, b1] = hexToRgb(c1);
    const [r2, g2, b2] = hexToRgb(c2);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return rgbToHex(r, g, b);
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

function generateAngles(n) {
    const angles = [];
    const start = -Math.PI / 2;
    const end = Math.PI / 2;
    const interval = (end - start) / (n - 1);

    for (let i = 0; i < n; i++) {
        angles.push(start + i * interval);
    }

    return angles;
}

function fillCircle(x, y, radius, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(
        x,
        y,
        radius, 0, Math.PI * 2
    );
    ctx.fill();
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

function lerpColor(c1, c2, t) {
    const [r1, g1, b1] = c1.match(/\d+/g).map(Number);
    const [r2, g2, b2] = c2.match(/\d+/g).map(Number);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r},${g},${b})`;
}

function signedGaussRand(mean = 0, stdDev = 1) {
    const value = gaussRand(mean, stdDev);
    return Math.random() < 0.5 ? -Math.abs(value) : Math.abs(value);
}

class Input {
    constructor(game) {
        this.game = game;

        this.mouseX = 0;
        this.mouseY = 0;
        this.scrollDelta = 0;
        this.mouseDown = false;

        canvas.addEventListener("mousemove", (event) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = event.clientX - rect.left;
            this.mouseY = event.clientY - rect.top;
        });

        canvas.addEventListener("mousedown", (event) => this.mouseDown = true);
        canvas.addEventListener("mouseup", (event) => this.mouseDown = false);

        canvas.addEventListener("wheel", (event) => {
            event.preventDefault();
            this.scrollDelta = event.deltaY;
        }, { passive: false });
    }
}

class CircularBuffer {
    constructor(capacity, initialValue) {
        this.capacity = capacity;
        this.buffer = new Array(capacity).fill(initialValue);
        this.size = capacity;
        this.head = 0;
    }

    push(value) {
        this.buffer[this.head] = value;
        this.head = (this.head + 1) % this.capacity;
    }

    toArray() {
        const result = new Array(this.capacity);
        for (let i = 0; i < this.capacity; i++) {
            result[i] = this.buffer[(this.head + i) % this.capacity];
        }
        return result;
    }
}
