const field = document.querySelector("#ribbon-field");
const canvas = document.querySelector("#ribbon-canvas");
const startOver = document.querySelector("#start-over");
const context = canvas.getContext("2d");

const PHRASES = ["Ho ho", "Ha ha", "Ho ho ha ha"];
const COLORS = ["#36c6c6", "#ff624d", "#ffd91c"];
const FONT_FAMILY = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';
const laughs = [];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
let animationFrame = null;
let lastPhrase = null;

function resizeCanvas() {
  const bounds = field.getBoundingClientRect();
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  laughs.forEach((laugh) => placeInsideField(laugh));
  draw(performance.now());
}

function randomItem(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function nextPhrase() {
  const choices = PHRASES.filter((phrase) => phrase !== lastPhrase);
  const phrase = randomItem(choices);
  lastPhrase = phrase;
  return phrase;
}

function measureLaugh(laugh) {
  context.save();
  context.font = `700 ${laugh.fontSize}px ${FONT_FAMILY}`;
  const textWidth = context.measureText(laugh.phrase).width;
  context.restore();

  laugh.faceSize = laugh.fontSize * 0.72;
  laugh.gap = laugh.fontSize * 0.28;
  laugh.width = textWidth + laugh.gap + laugh.faceSize;
  laugh.height = Math.max(laugh.fontSize * 1.18, laugh.faceSize);
}

function placeInsideField(laugh) {
  measureLaugh(laugh);
  const width = field.clientWidth;
  const height = field.clientHeight;
  const cosine = Math.abs(Math.cos(laugh.angle));
  const sine = Math.abs(Math.sin(laugh.angle));
  const bounceOvershoot = reducedMotion.matches ? 1 : 1.12;
  const halfWidth = ((laugh.width * cosine + laugh.height * sine) / 2) * bounceOvershoot;
  const halfHeight = ((laugh.width * sine + laugh.height * cosine) / 2) * bounceOvershoot;
  const margin = 14;

  laugh.x = Math.max(margin + halfWidth, Math.min(width - margin - halfWidth, laugh.requestedX));
  laugh.y = Math.max(margin + halfHeight, Math.min(height - margin - halfHeight, laugh.requestedY));
}

function addLaugh(x, y) {
  const responsiveMaximum = Math.max(31, Math.min(54, field.clientWidth / 14));
  const laugh = {
    phrase: nextPhrase(),
    color: randomItem(COLORS),
    fontSize: 24 + Math.random() * (responsiveMaximum - 24),
    angle: ((Math.random() * 18 - 9) * Math.PI) / 180,
    requestedX: x,
    requestedY: y,
    createdAt: performance.now(),
    duration: 430,
    progress: reducedMotion.matches ? 1 : 0,
  };

  placeInsideField(laugh);
  laughs.push(laugh);
  field.classList.add("has-content");
  startAnimation();
}

function drawSmiley(x, y, size, color) {
  const radius = size / 2;
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = Math.max(2.2, size * 0.075);
  context.lineCap = "round";

  context.beginPath();
  context.arc(x, y, radius * 0.88, 0, Math.PI * 2);
  context.stroke();

  context.beginPath();
  context.arc(x - radius * 0.3, y - radius * 0.18, radius * 0.075, 0, Math.PI * 2);
  context.arc(x + radius * 0.3, y - radius * 0.18, radius * 0.075, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.arc(x, y + radius * 0.02, radius * 0.42, 0.2, Math.PI - 0.2);
  context.stroke();
  context.restore();
}

function bounceScale(progress) {
  if (reducedMotion.matches) return 1;
  if (progress < 0.66) {
    const t = progress / 0.66;
    return 0.64 + 0.48 * (1 - Math.pow(1 - t, 3));
  }
  const t = (progress - 0.66) / 0.34;
  return 1.12 - 0.12 * (1 - Math.pow(1 - t, 2));
}

function drawLaugh(laugh, timestamp) {
  laugh.progress = reducedMotion.matches
    ? 1
    : Math.min(1, (timestamp - laugh.createdAt) / laugh.duration);

  const scale = bounceScale(laugh.progress);
  const opacity = reducedMotion.matches ? 1 : Math.min(1, laugh.progress * 4);

  context.save();
  context.translate(laugh.x, laugh.y);
  context.rotate(laugh.angle);
  context.scale(scale, scale);
  context.globalAlpha = opacity;
  context.fillStyle = laugh.color;
  context.font = `700 ${laugh.fontSize}px ${FONT_FAMILY}`;
  context.textAlign = "left";
  context.textBaseline = "middle";

  const left = -laugh.width / 2;
  context.fillText(laugh.phrase, left, 0);
  drawSmiley(left + laugh.width - laugh.faceSize / 2, 0, laugh.faceSize, laugh.color);
  context.restore();
}

function draw(timestamp) {
  context.clearRect(0, 0, field.clientWidth, field.clientHeight);
  laughs.forEach((laugh) => drawLaugh(laugh, timestamp));

  const animating = laughs.some((laugh) => laugh.progress < 1);
  if (animating) animationFrame = requestAnimationFrame(draw);
  else animationFrame = null;
}

function startAnimation() {
  if (animationFrame === null) animationFrame = requestAnimationFrame(draw);
}

function clearLaughs() {
  laughs.length = 0;
  lastPhrase = null;
  field.classList.remove("has-content");
  context.clearRect(0, 0, field.clientWidth, field.clientHeight);
}

field.addEventListener("pointerdown", (event) => {
  const bounds = field.getBoundingClientRect();
  addLaugh(event.clientX - bounds.left, event.clientY - bounds.top);
});

field.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  addLaugh(field.clientWidth / 2, field.clientHeight / 2);
});

startOver.addEventListener("click", clearLaughs);
window.addEventListener("resize", resizeCanvas);
reducedMotion.addEventListener("change", startAnimation);
resizeCanvas();
