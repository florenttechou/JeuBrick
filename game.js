/* 
  Jeu de bricks fluo, avec explosion et animations.
  - Canvas HTML5
  - Couleurs fluo random
  - Effets d'explosion (particules)
  - Texture simple via pattern
*/

const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
const width   = canvas.width;
const height  = canvas.height;
const explosionSound = document.getElementById('explosionSound');
const startButton     = document.getElementById('startBtn');

// --- Paramètres de jeu ---
const paddleWidth  = 100;
const paddleHeight = 15;
const paddleSpeed  = 8;

const ballRadius   = 8;
let   ballSpeed    = 5;

const brickRowCount    = 5;
const brickColumnCount = 10;
const brickWidth       = 70;
const brickHeight      = 20;
const brickPadding     = 10;
const brickOffsetTop   = 50;
const brickTotalWidth  = brickColumnCount * brickWidth + (brickColumnCount - 1) * brickPadding;
const brickOffsetLeft  = (width - brickTotalWidth) / 2;

// --- État du joueur ---
let score = 0;
let lives = 3;

// --- Paddle ---
let paddleX = (width - paddleWidth) / 2;

// --- Ball ---
let ballX = width / 2;
let ballY = height - 50;
let ballDX = ballSpeed;
let ballDY = -ballSpeed;

// --- Bricks ---
let bricks = [];

// --- Particules (explosions) ---
let particles = [];

// --- Création des bricks avec couleurs fluo et texture ---
function initBricks() {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      const color = `hsl(${Math.random() * 360}, 100%, 50%)`;

      // Petite texture fluo répétée
      const offCanvas = document.createElement('canvas');
      offCanvas.width  = 10;
      offCanvas.height = 10;
      const offCtx     = offCanvas.getContext('2d');
      offCtx.fillStyle = color;
      offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
      offCtx.fillStyle = "rgba(255,255,255,0.2)";
      offCtx.fillRect(0, 0, 5, 5);
      offCtx.fillRect(5, 5, 5, 5);
      const texture = ctx.createPattern(offCanvas, 'repeat');

      bricks[c][r] = {
        x: 0, y: 0,
        status: 1,
        color,
        texture
      };
    }
  }
}

// --- Gestion du clavier ---
let rightPressed = false;
let leftPressed  = false;

document.addEventListener("keydown", e => {
  if(e.key === "ArrowRight") rightPressed = true;
  else if(e.key === "ArrowLeft") leftPressed = true;
});
document.addEventListener("keyup", e => {
  if(e.key === "ArrowRight") rightPressed = false;
  else if(e.key === "ArrowLeft") leftPressed = false;
});

// --- Dessin du paddle ---
function drawPaddle() {
  ctx.save();
  ctx.fillStyle = "#0ff";
  ctx.fillRect(paddleX, height - paddleHeight - 10, paddleWidth, paddleHeight);
  ctx.restore();
}

// --- Dessin de la balle ---
function drawBall() {
  ctx.save();
  const gradient = ctx.createRadialGradient(ballX, ballY, ballRadius/4, ballX, ballY, ballRadius);
  gradient.addColorStop(0, '#fff');
  gradient.addColorStop(1, '#f0f');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI*2);
  ctx.fill();
  ctx.closePath();
  ctx.restore();
}

// --- Dessin des bricks ---
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        const brickX = (c*(brickWidth+brickPadding)) + brickOffsetLeft;
        const brickY = (r*(brickHeight+brickPadding)) + brickOffsetTop;
        b.x = brickX;
        b.y = brickY;
        ctx.save();
        ctx.fillStyle = b.texture;
        ctx.fillRect(brickX, brickY, brickWidth, brickHeight);

        // Dégradés pour accentuer le relief
        const reliefV = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
        reliefV.addColorStop(0, "rgba(255,255,255,0.6)");
        reliefV.addColorStop(0.5, "rgba(255,255,255,0)");
        reliefV.addColorStop(1, "rgba(0,0,0,0.6)");
        ctx.fillStyle = reliefV;
        ctx.fillRect(brickX, brickY, brickWidth, brickHeight);

        const reliefH = ctx.createLinearGradient(brickX, brickY, brickX + brickWidth, brickY);
        reliefH.addColorStop(0, "rgba(255,255,255,0.2)");
        reliefH.addColorStop(0.5, "rgba(255,255,255,0)");
        reliefH.addColorStop(1, "rgba(0,0,0,0.2)");
        ctx.fillStyle = reliefH;
        ctx.fillRect(brickX, brickY, brickWidth, brickHeight);

        const hueMatch = /hsl\((\d+),/.exec(b.color);
        if (hueMatch) {
          const h = hueMatch[1];
          ctx.fillStyle = `hsl(${h}, 100%, 85%)`;
          ctx.fillRect(brickX, brickY, brickWidth, 3);
          ctx.fillRect(brickX, brickY, 3, brickHeight);
          ctx.fillStyle = `hsl(${h}, 100%, 15%)`;
          ctx.fillRect(brickX, brickY + brickHeight - 3, brickWidth, 3);
          ctx.fillRect(brickX + brickWidth - 3, brickY, 3, brickHeight);
        }
        ctx.restore();
      }
    }
  }
}

// --- Dessin des particules (explosion) ---
function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.life -= 0.02;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
}

// --- Création des particules ---
function createExplosion(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x, y,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      size: Math.random() * 5 + 2,
      life: 1,
      color
    });
  }
}

// --- Détection collisions ---
function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (ballX > b.x && ballX < b.x + brickWidth &&
            ballY > b.y && ballY < b.y + brickHeight) {
          ballDY = -ballDY;
          b.status = 0;
          score++;

          // Explosion
          createExplosion(ballX, ballY, b.color);
          explosionSound.currentTime = 0;
          explosionSound.play();

          if (score === brickRowCount * brickColumnCount) {
            alert("Félicitations, vous avez gagné !");
            document.location.reload();
          }
        }
      }
    }
  }
}

// --- Dessin du score et des vies ---
function drawHUD() {
  ctx.fillStyle = "#0ff";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Vies: " + lives, width - 70, 20);
}

// --- Boucle de jeu ---
function draw() {
  ctx.clearRect(0, 0, width, height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawHUD();
  drawParticles();

  collisionDetection();

  // Bords
  if (ballX + ballDX > width - ballRadius || ballX + ballDX < ballRadius) {
    ballDX = -ballDX;
  }
  if (ballY + ballDY < ballRadius) {
    ballDY = -ballDY;
  } else if (ballY + ballDY > height - paddleHeight - 10 - ballRadius) {
    if (ballX > paddleX && ballX < paddleX + paddleWidth) {
      // Variations de direction en fonction de l’endroit frappé
      const hitPoint = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
      ballDX = ballSpeed * hitPoint;
      ballDY = -ballDY;
    } else if (ballY + ballDY > height - ballRadius) {
      lives--;
      if (!lives) {
        alert("Game Over !");
        document.location.reload();
      } else {
        ballX = width / 2;
        ballY = height - 50;
        ballDX = ballSpeed;
        ballDY = -ballSpeed;
      }
    }
  }

  ballX += ballDX;
  ballY += ballDY;

  // Mouvement du paddle
  if (rightPressed && paddleX < width - paddleWidth) {
    paddleX += paddleSpeed;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= paddleSpeed;
  }

  requestAnimationFrame(draw);
}

// --- Initialisation ---
function startGame() {
  startButton.style.display = 'none';
  initBricks();
  explosionSound.play().then(() => {
    explosionSound.pause();
    explosionSound.currentTime = 0;
  });
  draw();
}

startButton.addEventListener('click', startGame);
