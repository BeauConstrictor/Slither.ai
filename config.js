// MAP
const TILE = "./assets/bg.png";
const WORLD_RADIUS = 600;
const SIM_SPEED = 1;

// SNAKES
const SPEED = 250;
const SPACING = 10;
const EYE_SIZE = 0.45;
const PUPIL_SIZE = 0.2;
const INITIAL_LENGTH = 20;
const STOMACH = 10;
const TURN_SPEED = 5;
const EYE_DISTANCE = 0.5;
const EYE_FORWARD = 0.4;
const BOOST_SPEED = 550;
const BOOST_FLASH_SPEED = 100;
const BOOST_LOSS_FREQ = 0.1;

function snakeRadius(length) {
    return 9 + length / 4;
}

// ORBS
const ORB_COUNT = 200;
const EAT_DISTANCE = 100
const ORB_SIZE = { min: 5, max: 20 };
const SHAKE_SIZE = 20;
const SHAKE_SPEED = 2;

// AI
const BOT_COUNT = 9;

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
