const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');

// Sonidos
const menuMusic = new Audio('asset/menu-music.mp3'); 
const hoverSound = new Audio('asset/hover-sound.mp3'); 
const carMoveSound = new Audio('asset/car-move.mp3'); 
const carCrashSound = new Audio('asset/car-crash.mp3');

// Imagen de fondo para la pantalla de Game Over
let gameOverBackground = new Image();
gameOverBackground.src = 'asset/gameover.webp'; 

// Imagen de explosión
const explosionImage = new Image();
explosionImage.src = 'asset/explosion.png'; // Ruta a la imagen de explosión estática

menuMusic.loop = true; 
menuMusic.volume = 0.5; 
hoverSound.volume = 0.7; 
carMoveSound.loop = true; 
carMoveSound.volume = 0.3; 
carCrashSound.volume = 0.5; 

window.onload = () => {};

startButton.addEventListener('click', () => {
  menuMusic.currentTime = 0; 
  menuMusic.play();

  menu.style.display = 'none';
  gameContainer.style.display = 'block';
  resizeCanvas(); 
  startScoreCounter();
  carMoveSound.play(); 
  startCarMovement();
  scheduleNextObstacle();
  gameInterval = setInterval(gameLoop, 1000 / 60);
});

function stopCarMoveSound() {
  carMoveSound.pause();
  carMoveSound.currentTime = 0;
}

startButton.addEventListener('mouseover', () => {
  hoverSound.currentTime = 0; 
  hoverSound.play();
});

function resizeCanvas() {
  canvas.width = window.innerWidth;  
  canvas.height = window.innerHeight; 
}

window.addEventListener('resize', resizeCanvas); 
resizeCanvas(); 

let gameSpeed = 1.5; 
let score = 0;
let lives = 3;
let maxObstacles = 1;
let gameInterval;
let scoreInterval;
let gameOver = false;

let backgroundImage = new Image();
backgroundImage.src = 'asset/pista.webp';

let carImage = new Image();
carImage.src = 'asset/carro.png';

const heartImage = new Image();
heartImage.src = 'asset/heart.png'; 

let obstacleImages = {
  stone: new Image(),
  car: new Image(),
  log: new Image()
};

obstacleImages.stone.src = 'asset/stone.png';
obstacleImages.car.src = 'asset/obstacle_car.png';
obstacleImages.log.src = 'asset/log.png';

let car = {
  x: canvas.width / 2,
  y: 100,
  width: 100,
  height: 100,
  color: 'red',
  moveDirection: 1
};

let obstacles = [];
const obstacleTypes = ['stone', 'car', 'log'];

let carOscillation = {
  amplitude: 10,
  frequency: 0.02,
  angle: 0
};

// Array para manejar explosiones
let explosions = [];

function createExplosion(x, y) {
  explosions.push({
    x: x,
    y: y,
    displayWidth: 200,  // Tamaño de la explosión en pantalla
    displayHeight: 200,
    duration: 30, // Duración de la explosión en frames
    currentFrame: 0,
    finished: false
  });
}

function drawExplosions() {
  explosions.forEach((explosion, index) => {
    if (explosion.finished) {
      explosions.splice(index, 1);
      return;
    }

    ctx.drawImage(
      explosionImage,
      explosion.x - explosion.displayWidth / 2, // Centrar la explosión
      explosion.y - explosion.displayHeight / 2,
      explosion.displayWidth,
      explosion.displayHeight
    );

    explosion.currentFrame++;
    if (explosion.currentFrame >= explosion.duration) {
      explosion.finished = true;
    }
  });
}

function createScaledPattern(image, context, width, height) {
  let tempCanvas = document.createElement('canvas');
  let tempCtx = tempCanvas.getContext('2d');

  tempCanvas.width = width;
  tempCanvas.height = height;

  tempCtx.drawImage(image, 0, 0, width, height);

  return context.createPattern(tempCanvas, 'no-repeat');
}

function drawCar() {
  if (carImage.complete) {
    ctx.drawImage(carImage, car.x, car.y, car.width, car.height);
  } else {
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.width, car.height);
  }
}

function drawTrack() {
  if (backgroundImage.complete) {
    let pattern = createScaledPattern(backgroundImage, ctx, canvas.width, canvas.height);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height); 
  } else {
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function createObstacle() {
  let maxAllowedObstacles = Math.min(Math.floor(score / 10) + 1, 4);

  if (maxObstacles < maxAllowedObstacles) {
    maxObstacles = maxAllowedObstacles;
  }

  if (obstacles.length < maxObstacles) {
    let x = canvas.width / 2 + 50;
    let y = canvas.height / 2 - 70;
    let targetX = car.x + car.width / 2;
    let type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    let maxWidth = type === 'car' ? 50 : type === 'log' ? 30 : 25;
    let maxHeight = type === 'car' ? 50 : type === 'log' ? 30 : 25;

    obstacles.push({
      x: x - maxWidth / 2,
      y: y,
      targetX: targetX,
      width: 5, 
      height: 5, 
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      growthRate: 0.2, 
      type: type,
      movingDiagonally: true
    });
  }
}

function scheduleNextObstacle() {
  const delay = Math.random() * 2000 + 500;
  setTimeout(() => {
    createObstacle();
    if (!gameOver) {
      scheduleNextObstacle();
    }
  }, delay);
}

function drawObstacles() {
  obstacles.forEach(obstacle => {
    if (obstacle.width < obstacle.maxWidth) {
      obstacle.width = Math.min(obstacle.width + obstacle.growthRate, obstacle.maxWidth);
    }
    if (obstacle.height < obstacle.maxHeight) {
      obstacle.height = Math.min(obstacle.height + obstacle.growthRate, obstacle.maxHeight);
    }
    if (obstacle.movingDiagonally) {
      let deltaX = obstacle.targetX - obstacle.x;
      let deltaY = car.y - obstacle.y;
      let angle = Math.atan2(deltaY, deltaX);

      obstacle.x += Math.cos(angle) * gameSpeed;
      obstacle.y += Math.sin(angle) * gameSpeed;

      if (Math.abs(obstacle.x - obstacle.targetX) < 5) {
        obstacle.movingDiagonally = false;
      }
    } else {
      obstacle.y += gameSpeed;
    }

    let image = obstacleImages[obstacle.type];
    if (image.complete) {
      ctx.drawImage(image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else {
      ctx.fillStyle = obstacle.type === 'stone' ? 'brown' : obstacle.type === 'car' ? 'blue' : 'darkgreen';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  });

  obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);
}

function checkCollision() {
  obstacles.forEach(obstacle => {
    if (
      car.x < obstacle.x + obstacle.width &&
      car.x + car.width > obstacle.x &&
      car.y < obstacle.y + obstacle.height &&
      car.y + car.height > obstacle.y
    ) {
      lives--;
      playCarCrashSound(); 
      createExplosion(car.x + car.width / 2, car.y + car.height / 2); 
      resetCar();

      if (lives === 0) {
        endGame();
      }
    }
  });
}

function playCarCrashSound() {
  carCrashSound.currentTime = 0;
  carCrashSound.play();
}

function resetCar() {
  car.x = canvas.width / 2;
  obstacles = [];
}

function drawScoreAndLives() {
  ctx.fillStyle = 'white';
  ctx.font = '24px Audiowide, sans-serif';
  ctx.textAlign = 'left';

  ctx.fillText(`Score: ${score}`, canvas.width / 2 - 40, 40); 
}

let keysPressed = {}; 

document.addEventListener('keydown', (e) => {
  keysPressed[e.key] = true;
});

document.addEventListener('keyup', (e) => {
  keysPressed[e.key] = false;
});

function updateCarPosition() {
  if (keysPressed['ArrowLeft'] && car.x > canvas.width / 4 + 110) {
    car.x -= 5;
  }
  if (keysPressed['ArrowRight'] && car.x < canvas.width * 3 / 4 - 155) {
    car.x += 5;
  }
}

function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTrack();
  updateCarPosition();
  drawCar();
  drawObstacles();
  drawExplosions(); // Dibujar explosiones activas
  for (let i = 0; i < lives; i++) {
    ctx.drawImage(heartImage, canvas.width - 20 - (65 * (i + 1)), 10, 80, 80);
  }
  drawScoreAndLives();
  checkCollision();
}

function startScoreCounter() {
  scoreInterval = setInterval(() => {
    if (!gameOver) {
      score++;
    }
  }, 1000);
}

function endGame() {
  gameOver = true;
  stopCarMoveSound(); 
  clearInterval(gameInterval);
  clearInterval(scoreInterval);
  drawGameOverScreen();
}

function drawGameOverScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOverBackground.complete) {
    let pattern = createScaledPattern(gameOverBackground, ctx, canvas.width, canvas.height);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = 'rgba(50, 50, 50, 0.8)'; 
  const rectWidth = 300;
  const rectHeight = 200;
  const rectX = (canvas.width - rectWidth) / 2;
  const rectY = (canvas.height - rectHeight) / 2 - 30;
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

  ctx.fillStyle = 'white';
  ctx.font = '40px Audiowide, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, rectY + 40);

  ctx.font = '20px Audiowide, sans-serif';
  ctx.fillText('Score: ' + score, canvas.width / 2, rectY + 80);

  ctx.fillStyle = 'red';
  ctx.fillRect(canvas.width / 2 - 75, rectY + 120, 150, 50);

  ctx.fillStyle = 'white';
  ctx.fillText('Retry', canvas.width / 2, rectY + 155);

  canvas.removeEventListener('click', handleRetryClick); 
  canvas.addEventListener('click', handleRetryClick);
}

function handleRetryClick(event) {
  const rect = canvas.getBoundingClientRect(); 
  const x = event.clientX - rect.left; 
  const y = event.clientY - rect.top; 

  const buttonX = (canvas.width - 150) / 2; 
  const buttonY = (canvas.height - 200) / 2 + 120; 

  if (
    x >= buttonX &&
    x <= buttonX + 150 && 
    y >= buttonY &&
    y <= buttonY + 50    
  ) {
    canvas.removeEventListener('click', handleRetryClick); 
    resetGame(); 
  }
}

function resetGame() {
  gameOver = false;
  score = 0;
  lives = 3;
  gameSpeed = 2;
  obstacles = [];
  startScoreCounter();
  menuMusic.currentTime = 0;
  carMoveSound.play();
  scheduleNextObstacle();
  gameInterval = setInterval(gameLoop, 1000 / 60);
}

function startCarMovement() {
  setInterval(() => {
    if (!gameOver) {
      car.y = canvas.height - 100 + carOscillation.amplitude * Math.sin(carOscillation.angle);
      carOscillation.angle += carOscillation.frequency;
      if (carOscillation.angle > 2 * Math.PI) {
        carOscillation.angle = 0;
      }
    }
  }, 1000 / 60);
}

startCarMovement();

const carSprites = [
  new Image(),
  new Image(),
  new Image(),
  new Image()
];

carSprites[0].src = 'asset/carro.png';
carSprites[1].src = 'asset/carro2.png';
carSprites[2].src = 'asset/carro3.png';
carSprites[3].src = 'asset/carro4.png';

let currentCarSprite = 0; 

function animateCar() {
  currentCarSprite = (currentCarSprite + 1) % carSprites.length; 
}

function drawCar() {
  if (carSprites[currentCarSprite].complete) {
    ctx.drawImage(carSprites[currentCarSprite], car.x, car.y, car.width, car.height);
  } else {
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.width, car.height);
  }
}

setInterval(animateCar, 100);
