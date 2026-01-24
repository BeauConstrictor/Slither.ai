// MAP
const TILE = "./assets/bg.png";
const WORLD_RADIUS = 2000;
const SIM_SPEED = 1;
const ZOOM_SPEED_BOOST = 2;

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

// SNAKES
const SPEED = 250;
const SPACING = 10;
const EYE_SIZE = 0.45;
const PUPIL_SIZE = 0.2;
const INITIAL_LENGTH = 20;
const STOMACH = 30;
const TURN_SPEED = 5;
const EYE_DISTANCE = 0.5;
const EYE_FORWARD = 0.4;
const BOOST_SPEED = 550;
const BOOST_FLASH_SPEED = 100;
const BOOST_LOSS_FREQ = 1;

const INITIAL_ENERGY = 1000;
const MAX_ENERGY = 1000;

function energyLoss(length) {
    return 3 + length / 40;
}

function snakeRadius(length) {
    return 9 + length / 4;
}

// ORBS
const ORB_COUNT = 700;
const EAT_DISTANCE = 100
const ORB_SIZE = { min: 5, max: 20 };
const SHAKE_SIZE = 20;
const SHAKE_SPEED = 2;

// AI
const BOT_COUNT = 99;
const BOT_TURN_SPEED = 4.2;
const BOT_ORB_ATTRACT = 0.32;
const BOT_ORB_ATTRACT_FAR = 0.08;
const BOT_REPEL_DISTANCE = 190;
const BOT_REPEL_WEIGHT = 6.5;
const BOT_REPEL_EXPONENT = 2.8;
const BOT_SEGMENT_SKIP = 2;
const BOT_NOISE_SWAY = 0.16;
const BOT_NOISE_SCALE = 0.09;
const BOT_EDGE_BUFFER = WORLD_RADIUS * 2.3;
const BOT_EDGE_FORCE = 1.4;
const BOT_AGGRESSION = 1.25;

// UI
const TITLE_ANIM_SPEED = 0.1;
const TITLE_WOBBLE = 0.016;
const TITLE_SCALE = 0.02;

const LENGTH_TEXT_HEIGHT = 80;
const LENGTH_FONT_SIZE = 30;
const LENGTH_MAX_FONT_SIZE = 55;
const LENGTH_SHAKE = 0.08;

const PAUSE_ICON_X_DIST = 10;
const PAUSE_ICON_WIDTH = 20;
const PAUSE_ICON_HEIGHT = 80;

const MINIMAP_PADDING = 50;
const MINIMAP_RADIUS = 100;
const MINIMAP_BOT_SPOT_SIZE = 80;
