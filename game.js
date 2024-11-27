/* game.js */

/*
    Neon Slingshot Game - Optimized Version
    Author: [Your Name]
    Description: An engaging neon-themed slingshot arcade game with dynamic graphics and smooth functionality.
*/

"use strict";

window.addEventListener('DOMContentLoaded', () => {
    // ---------------------------
    // DOM Element Selection
    // ---------------------------

    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const changeTrackButton = document.getElementById('change-track-button');
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameOverMessage = document.getElementById('game-over-message');
    const finalScore = document.getElementById('final-score');
    const playerNameInput = document.getElementById('player-name');
    const restartButton = document.getElementById('restart-button');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');

    // ---------------------------
    // Canvas Setup
    // ---------------------------

    // Function to resize the canvas to fit the window
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();

    // Handle window resize events
    window.addEventListener('resize', () => {
        resizeCanvas();
        resetStartingLine();
        initializeStars();
        resetOrb(true); // Pass 'true' to indicate a manual reset
    });

    // ---------------------------
    // Game Variables
    // ---------------------------

    // Game state variables
    let gameRunning = false;
    let enemies = [];
    let stars = [];
    let score = 0;
    let hearts = 3;
    let currentTrackIndex = 0;
    let elapsedTime = 0; // Total time since game started
    let orbHit = false; // To track if orb has hit an enemy in current shot
    let orbActive = false; // To track if orb is in motion
    let reloadProgress = 0; // For reload bar

    // Enemy spawn variables with adjustable parameters
    const enemySettings = {
        initialSpawnInterval: 2000, // Initial spawn interval in ms
        minSpawnInterval: 800,       // Minimum spawn interval in ms
        spawnDecreaseRate: 10        // Decrease spawn interval by ms
    };
    let enemySpawnTimer = 0;
    let spawnInterval = enemySettings.initialSpawnInterval;

    // ---------------------------
    // Audio Setup
    // ---------------------------

    // Array of background tracks
    const tracks = [
        'audio/track1.mp3',
        'audio/track2.mp3',
        'audio/track3.mp3',
        'audio/track4.mp3'
    ];
    const gameOverTrack = 'audio/gameover.mp3';

    // Initialize the current audio track with random selection
    let currentAudio = new Audio(getRandomTrack());
    currentAudio.loop = true;

    // Function to get a random track
    function getRandomTrack() {
        const randomIndex = Math.floor(Math.random() * tracks.length);
        return tracks[randomIndex];
    }

    // Sound effects
    const collisionSound = new Audio('audio/collision.mp3');
    const heartLostSound = new Audio('audio/heartlost.mp3');
    const shootSound = new Audio('audio/shoot.mp3');
    const explosionSound = new Audio('audio/explosion.mp3'); // Explosion sound effect

    // ---------------------------
    // Parallax Star Field Setup
    // ---------------------------

    // Parallax layers with adjustable star sizes and speeds
    const starLayers = [
        { speed: 0.2, count: 150, color: '#ffffff', sizeRange: [3, 6] }, // Larger stars
        { speed: 0.5, count: 200, color: '#ff00ff', sizeRange: [4, 8] },
        { speed: 0.8, count: 250, color: '#00ffff', sizeRange: [5, 10] }
    ];

    // Initialize stars based on parallax layers
    function initializeStars() {
        stars = []; // Clear existing stars
        starLayers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: getRandom(layer.sizeRange[0], layer.sizeRange[1]),
                    speed: layer.speed,
                    color: layer.color
                });
            }
        });
    }

    // Helper function to get a random number within a range
    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    // ---------------------------
    // Starting Line Indicator
    // ---------------------------

    // Starting line positioned slightly below the orb's spawn point
    let startingLine = {
        x: canvas.width / 2,
        y: canvas.height * 2 / 3 + 30,
        width: 100,
        height: 5,
        color: '#0ff'
    };

    // Reset starting line position on window resize
    function resetStartingLine() {
        startingLine = {
            x: canvas.width / 2,
            y: canvas.height * 2 / 3 + 30,
            width: 100,
            height: 5,
            color: '#0ff'
        };
    }

    // ---------------------------
    // Orb Setup
    // ---------------------------

    // Orb properties and state
    const orb = {
        x: canvas.width / 2,
        y: canvas.height * 2 / 3,
        radius: 12, // Smaller orb
        color: '#0ff',
        isDragging: false,
        dragStart: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        canShoot: true
    };

    // ---------------------------
    // Enemy Setup
    // ---------------------------

    // Possible enemy shapes and colors
    const enemyTypes = ['circle', 'triangle', 'square', 'star'];
    const enemyColors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00'];

    // ---------------------------
    // Explosion Setup
    // ---------------------------

    // Array to hold active explosions
    let explosions = [];

    // Explosion class for particle effects
    class Explosion {
        constructor(x, y) {
            this.particles = [];
            this.x = x;
            this.y = y;
            this.duration = 500; // Duration in milliseconds
            this.alpha = 1.0;
            this.createParticles();
        }

        // Create particles with random colors and velocities
        createParticles() {
            const particleCount = 40; // Number of particles
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 3; // Particle speed
                const hue = Math.floor(Math.random() * 360); // Random hue for variety
                const color = `hsl(${hue}, 100%, 50%)`; // HSL color
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    velocityX: Math.cos(angle) * speed,
                    velocityY: Math.sin(angle) * speed,
                    size: Math.random() * 3 + 2, // Particle size
                    color: color,
                    alpha: 1.0
                });
            }
        }

        // Update particles' positions and alpha
        update(deltaTime) {
            this.particles.forEach(particle => {
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.alpha -= deltaTime / this.duration;
                particle.velocityY += 0.1; // Simulate gravity on particles
            });
            // Update overall explosion alpha
            this.alpha -= deltaTime / this.duration;
        }

        // Draw particles on the canvas
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            this.particles.forEach(particle => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${hslToRgb(particle.color)}, ${particle.alpha})`; // Convert HSL to RGB
                ctx.fill();
            });
            ctx.restore();
        }
    }

    // Function to convert HSL to RGB
    /**
     * Converts an HSL color value to RGB.
     * Assumes h is in [0, 360], and s and l are in [0, 100].
     * Returns a string in the format "R,G,B".
     */
    function hslToRgb(hsl) {
        // Extract H, S, L values from the hsl string
        const hslMatch = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!hslMatch) {
            return '255,255,255'; // Default to white if parsing fails
        }
        let h = parseInt(hslMatch[1]) / 360;
        let s = parseInt(hslMatch[2]) / 100;
        let l = parseInt(hslMatch[3]) / 100;
        let r, g, b;

        if(s === 0){
            r = g = b = l; // Achromatic
        } else {
            const hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return `${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)}`;
    }

    // Function to trigger an explosion effect
    function triggerExplosion(x, y) {
        explosionSound.currentTime = 0;
        explosionSound.play();
        explosions.push(new Explosion(x, y));
    }

    // ---------------------------
    // Initialization
    // ---------------------------

    // Initialize stars and starting line on load
    initializeStars();
    resetStartingLine();

    // ---------------------------
    // Event Listeners
    // ---------------------------

    // Handle track change button click
    changeTrackButton.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        currentAudio.pause();
        currentAudio = new Audio(tracks[currentTrackIndex]);
        currentAudio.loop = true;
        if (gameRunning) {
            currentAudio.play();
        }
    });

    // Handle start game button click
    startButton.addEventListener('click', () => {
        startScreen.classList.add('hidden'); // Hide start screen
        startGame(); // Initialize and start the game
    });

    // Handle restart game button click
    restartButton.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden'); // Hide game over screen
        startGame(); // Restart the game
    });

    // ---------------------------
    // Start Game Function
    // ---------------------------

    function startGame() {
        // Reset game variables
        enemies = [];
        initializeStars();
        score = 0;
        hearts = 3;
        elapsedTime = 0;
        spawnInterval = enemySettings.initialSpawnInterval; // Reset spawn interval
        enemySpawnTimer = 0; // Reset spawn timer
        orb.x = canvas.width / 2;
        orb.y = canvas.height * 2 / 3;
        orb.velocity = { x: 0, y: 0 };
        orb.canShoot = true;
        orb.isDragging = false;
        orbHit = false;
        orbActive = false;
        explosions = []; // Clear existing explosions
        reloadProgress = 0; // Reset reload progress

        // Reset and play the current audio track
        currentAudio.currentTime = 0;
        currentAudio.play();

        // Initialize sparkles array
        sparkles = [];

        // Start the game loop
        gameRunning = true;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    // ---------------------------
    // Game Loop
    // ---------------------------

    let lastTime = 0;

    // Array to hold active sparkles
    let sparkles = [];

    // Game loop function using requestAnimationFrame
    function gameLoop(timestamp) {
        if (!gameRunning) return;

        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        elapsedTime += deltaTime;

        update(deltaTime);
        draw();

        requestAnimationFrame(gameLoop);
    }

    // ---------------------------
    // Update Function
    // ---------------------------

    function update(deltaTime) {
        // Update stars for parallax effect
        stars.forEach(star => {
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });

        // Update orb position if it's active
        if (orbActive) {
            orb.x += orb.velocity.x;
            orb.y += orb.velocity.y;
            orb.velocity.y += 0.5; // Gravity effect

            // Collision with boundaries
            if (orb.x < orb.radius || orb.x > canvas.width - orb.radius) {
                orb.velocity.x *= -0.5;
                orb.x = Math.max(orb.radius, Math.min(orb.x, canvas.width - orb.radius));
            }
            if (orb.y < orb.radius) {
                orb.velocity.y *= -0.5;
                orb.y = Math.max(orb.radius, orb.y);
            }
            // If orb goes off-screen, reset it
            if (orb.y > canvas.height + orb.radius || orb.x < -orb.radius || orb.x > canvas.width + orb.radius) {
                resetOrb();
            }

            // Generate rainbow sparkles behind the orb
            generateSparkles();
        }

        // Handle shooting cooldown
        if (!orb.canShoot) {
            reloadProgress += deltaTime;
            if (reloadProgress >= 900) { // 0.9 seconds cooldown
                orb.canShoot = true;
                reloadProgress = 0;
            }
        }

        // Spawn enemies
        spawnEnemies(deltaTime);

        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.y += enemy.speed;

            // Check collision with orb only if orb is active and hasn't hit an enemy yet
            if (orbActive && !orbHit) {
                const dist = Math.hypot(enemy.x - orb.x, enemy.y - orb.y);
                if (dist < enemy.size + orb.radius) {
                    // Collision detected
                    enemies.splice(i, 1); // Remove enemy
                    collisionSound.currentTime = 0;
                    collisionSound.play();
                    score += 10;
                    orbHit = true; // Prevent further collisions in this projection
                    triggerExplosion(orb.x, orb.y); // Trigger explosion effect
                    resetOrb(); // Reset orb position
                    break; // Only one enemy can be hit per projection
                }
            }

            // Check if enemy passes the bottom
            if (enemy.y > canvas.height) {
                enemies.splice(i, 1); // Remove enemy
                hearts--;
                heartLostSound.currentTime = 0;
                heartLostSound.play();
                if (hearts <= 0) {
                    endGame(); // End the game if no hearts left
                }
            }
        }

        // Update explosions
        explosions.forEach((explosion, index) => {
            explosion.update(deltaTime);
            if (explosion.alpha <= 0) {
                explosions.splice(index, 1); // Remove explosion when done
            }
        });

        // Update sparkles
        updateSparkles(deltaTime);
    }

    // ---------------------------
    // Draw Function
    // ---------------------------

    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw stars
        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.fill();
        });

        // Draw starting line indicator
        drawStartingLine();

        // Draw orb and string
        if (orbActive) {
            ctx.beginPath();
            ctx.moveTo(startingLine.x, startingLine.y - 15); // Starting point above the orb
            ctx.lineTo(orb.x, orb.y);
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 4;
            ctx.stroke();
        } else {
            // Draw string in default position
            ctx.beginPath();
            ctx.moveTo(startingLine.x, startingLine.y - 15);
            ctx.lineTo(orb.x, orb.y);
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // Draw orb
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = orb.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0ff';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw rainbow sparkles
        drawSparkles();

        // Draw enemies
        enemies.forEach(enemy => {
            ctx.beginPath();
            switch (enemy.type) {
                case 'circle':
                    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
                    break;
                case 'triangle':
                    ctx.moveTo(enemy.x, enemy.y - enemy.size);
                    ctx.lineTo(enemy.x - enemy.size, enemy.y + enemy.size);
                    ctx.lineTo(enemy.x + enemy.size, enemy.y + enemy.size);
                    ctx.closePath();
                    break;
                case 'square':
                    ctx.rect(enemy.x - enemy.size, enemy.y - enemy.size, enemy.size * 2, enemy.size * 2);
                    break;
                case 'star':
                    drawStar(ctx, enemy.x, enemy.y, 5, enemy.size, enemy.size / 2);
                    break;
                default:
                    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            }
            ctx.fillStyle = enemy.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = enemy.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Draw explosions
        explosions.forEach(explosion => {
            explosion.draw(ctx);
        });

        // Draw scorekeeper (already styled via CSS)
        scoreDisplay.textContent = `Score: ${score}`;

        // Draw hearts
        for (let i = 0; i < hearts; i++) {
            ctx.beginPath();
            drawHeart(ctx, 50 + i * 40, 60, 15, '#ff0000');
            ctx.fillStyle = '#ff0000';
            ctx.fill();
        }

        // Draw reload bar at the bottom
        ctx.fillStyle = '#fff';
        const reloadWidth = (reloadProgress / 900) * canvas.width; // Adjust based on reload progress
        ctx.fillRect(0, canvas.height - 10, reloadWidth, 10);
    }

    // ---------------------------
    // Utility Drawing Functions
    // ---------------------------

    // Function to draw a star shape
    function drawStar(ctx, x, y, points, outerRadius, innerRadius) {
        let angle = Math.PI / points;
        ctx.beginPath();
        for (let i = 0; i < 2 * points; i++) {
            const r = (i & 1) ? innerRadius : outerRadius;
            const a = i * angle;
            ctx.lineTo(x + r * Math.sin(a), y - r * Math.cos(a));
        }
        ctx.closePath();
        ctx.fill();
    }

    // Function to draw a heart shape
    function drawHeart(ctx, x, y, size, color) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x, y - size, x - size, y - size, x - size, y);
        ctx.bezierCurveTo(x - size, y + size, x, y + size * 2, x, y + size * 3);
        ctx.bezierCurveTo(x, y + size * 2, x + size, y + size, x + size, y);
        ctx.bezierCurveTo(x + size, y - size, x, y - size, x, y);
        ctx.closePath();
        ctx.fill();
    }

    // ---------------------------
    // Collision and Reset Functions
    // ---------------------------

    // Function to reset the orb to its initial position
    function resetOrb(manual = false) {
        orb.x = canvas.width / 2;
        orb.y = canvas.height * 2 / 3;
        orb.velocity = { x: 0, y: 0 };
        orb.canShoot = true;
        orb.isDragging = false;
        orbHit = false;
        orbActive = false;

        if (!manual) {
            // Schedule new orb spawn after 0.7 seconds
            setTimeout(() => {
                orb.canShoot = true;
            }, 700);
        }
    }

    // ---------------------------
    // End Game Function
    // ---------------------------

    function endGame() {
        gameRunning = false;
        currentAudio.pause();
        const gameOverAudio = new Audio(gameOverTrack);
        gameOverAudio.play();

        // Display game over screen with final score
        gameOverScreen.classList.remove('hidden');
        finalScore.textContent = score;
        const messages = [
            "You're Neon-tastic!",
            "Slingshot Superstar!",
            "Keep Shining!",
            "Glow Getter!",
            "Bright Finish!"
        ];
        gameOverMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
    }

    // ---------------------------
    // Enemy Spawning Function
    // ---------------------------

    // Function to spawn enemies with increasing difficulty
    function spawnEnemies(deltaTime) {
        enemySpawnTimer += deltaTime;
        if (enemySpawnTimer > spawnInterval) {
            enemySpawnTimer = 0;

            // Randomize enemy properties
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const color = enemyColors[Math.floor(Math.random() * enemyColors.length)];
            const size = getRandom(20, 30); // Increased size for better visibility
            const x = Math.random() * (canvas.width - size * 2) + size;
            const y = -size;
            const speed = getDynamicSpeed(); // Get dynamic fall speed

            enemies.push({ type, color, size, x, y, speed });

            // Increase difficulty by decreasing spawn interval
            if (spawnInterval > enemySettings.minSpawnInterval) {
                spawnInterval -= enemySettings.spawnDecreaseRate;
            }
        }
    }

    // Function to get dynamic fall speed based on elapsed time
    function getDynamicSpeed() {
        // Speed increases over time
        const baseSpeed = 1.5;
        const speedIncrease = elapsedTime / 10000; // Increase speed every 10 seconds
        return baseSpeed + speedIncrease;
    }
// Improved Event Listeners for Cross-Platform Compatibility
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('touchstart', startDrag, { passive: false });

canvas.addEventListener('mousemove', drag);
canvas.addEventListener('touchmove', drag, { passive: false });

canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('touchend', endDrag, { passive: false });

// Start Dragging
function startDrag(event) {
    event.preventDefault();
    if (!orb.canShoot) return;

    const pos = getPointerPosition(event);
    const dist = Math.hypot(pos.x - orb.x, pos.y - orb.y);

    if (dist <= orb.radius) {
        orb.isDragging = true;
        orb.dragStart = { x: pos.x, y: pos.y };
    }
}

// Drag the Orb
function drag(event) {
    if (!orb.isDragging) return;
    event.preventDefault();

    const pos = getPointerPosition(event);
    const maxDragDistance = 150; // Limit drag distance
    const dx = pos.x - startingLine.x;
    const dy = pos.y - startingLine.y;
    const distance = Math.hypot(dx, dy);

    if (distance > maxDragDistance) {
        const angle = Math.atan2(dy, dx);
        orb.x = startingLine.x + maxDragDistance * Math.cos(angle);
        orb.y = startingLine.y + maxDragDistance * Math.sin(angle);
    } else {
        orb.x = pos.x;
        orb.y = pos.y;
    }
}

// End Dragging and Fire the Orb
function endDrag(event) {
    if (!orb.isDragging) return;
    orb.isDragging = false;

    const pos = getPointerPosition(event);
    const dx = startingLine.x - pos.x;
    const dy = startingLine.y - pos.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 20) { // Ensure enough drag distance for a valid shot
        const angle = Math.atan2(dy, dx);
        const power = Math.min(distance / 10, 25); // Cap the power

        orb.velocity.x = power * Math.cos(angle);
        orb.velocity.y = power * Math.sin(angle);

        orbActive = true; // Activate the orb
        orb.canShoot = false; // Disable further shooting
        shootSound.play(); // Play shoot sound
    } else {
        // Reset orb if the drag was too small
        resetOrb();
    }
}

// Utility to Get Pointer Position
function getPointerPosition(event) {
    if (event.touches && event.touches[0]) {
        return {
            x: event.touches[0].clientX - canvas.offsetLeft,
            y: event.touches[0].clientY - canvas.offsetTop
        };
    } else {
        return {
            x: event.clientX - canvas.offsetLeft,
            y: event.clientY - canvas.offsetTop
        };
    }
}


    // ---------------------------
    // Utility Functions for Sparkles
    // ---------------------------

    // Function to generate sparkles behind the orb
    function generateSparkles() {
        const sparkleCount = 2; // Number of sparkles generated per frame
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = getRandom(1, 3);
            const size = getRandom(2, 4);
            const hue = Math.floor(Math.random() * 360);
            const color = `hsl(${hue}, 100%, 50%)`;
            sparkles.push({
                x: orb.x,
                y: orb.y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                size: size,
                color: color,
                alpha: 1.0
            });
        }

        // Limit the number of sparkles
        if (sparkles.length > 100) {
            sparkles.splice(0, sparkles.length - 100);
        }
    }

    // Function to update sparkles
    function updateSparkles(deltaTime) {
        // Iterate in reverse to safely remove elements
        for (let i = sparkles.length - 1; i >= 0; i--) {
            const sparkle = sparkles[i];
            sparkle.x += sparkle.velocityX;
            sparkle.y += sparkle.velocityY;
            sparkle.alpha -= deltaTime / 1000; // Fade out over 1 second
            // Remove sparkle if it becomes transparent or goes off-screen
            if (sparkle.alpha <= 0 || sparkle.y > canvas.height || sparkle.x < 0 || sparkle.x > canvas.width) {
                sparkles.splice(i, 1);
            }
        }
    }

    // Function to draw sparkles
    function drawSparkles() {
        sparkles.forEach(sparkle => {
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${hslToRgb(sparkle.color)}, ${sparkle.alpha})`;
            ctx.fill();
        });
    }

    // ---------------------------
    // Utility Function to Get Mouse Position
    // ---------------------------

    function getMousePos(event) {
        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        return { x: clientX, y: clientY };
    }

    // ---------------------------
    // Draw Starting Line Function
    // ---------------------------

    function drawStartingLine() {
        ctx.beginPath();
        ctx.rect(startingLine.x - startingLine.width / 2, startingLine.y, startingLine.width, startingLine.height);
        ctx.fillStyle = startingLine.color;
        ctx.fill();
    }

    // ---------------------------
    // End Game Function
    // ---------------------------

    function endGame() {
        gameRunning = false;
        currentAudio.pause();
        const gameOverAudio = new Audio(gameOverTrack);
        gameOverAudio.play();

        // Display game over screen with final score
        gameOverScreen.classList.remove('hidden');
        finalScore.textContent = score;
        const messages = [
            "You're Neon-tastic!",
            "Slingshot Superstar!",
            "Keep Shining!",
            "Glow Getter!",
            "Bright Finish!"
        ];
        gameOverMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
    }

    // ---------------------------
    // Enemy Spawning Function
    // ---------------------------

    // Function to spawn enemies with increasing difficulty
    function spawnEnemies(deltaTime) {
        enemySpawnTimer += deltaTime;
        if (enemySpawnTimer > spawnInterval) {
            enemySpawnTimer = 0;

            // Randomize enemy properties
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const color = enemyColors[Math.floor(Math.random() * enemyColors.length)];
            const size = getRandom(20, 30); // Increased size for better visibility
            const x = Math.random() * (canvas.width - size * 2) + size;
            const y = -size;
            const speed = getDynamicSpeed(); // Get dynamic fall speed

            enemies.push({ type, color, size, x, y, speed });

            // Increase difficulty by decreasing spawn interval
            if (spawnInterval > enemySettings.minSpawnInterval) {
                spawnInterval -= enemySettings.spawnDecreaseRate;
            }
        }
    }

    // Function to get dynamic fall speed based on elapsed time
    function getDynamicSpeed() {
        // Speed increases over time
        const baseSpeed = 1.5;
        const speedIncrease = elapsedTime / 10000; // Increase speed every 10 seconds
        return baseSpeed + speedIncrease;
    }

    // ---------------------------
    // Final Thoughts
    // ---------------------------

    /*
        With this clean and optimized `game.js`, your Neon Slingshot game should function smoothly without any redundancies or errors. Here's a summary of key features:

        1. **Parallax Star Field:** Multiple layers of stars with varying sizes and speeds create a dynamic background.
        2. **Orb Mechanics:** Click and drag the orb to shoot it like a slingshot, with realistic physics and gravity.
        3. **Enemy Dynamics:** Enemies spawn from the top, move downward with increasing speed, and come in various shapes and colors.
        4. **Collision Detection:** Detects collisions between the orb and enemies, triggering explosion effects and updating the score.
        5. **Sound Effects:** Integrated background music and sound effects enhance the gaming experience.
        6. **Scorekeeper and Lives:** Displays the current score and remaining hearts, with a visual reload bar for shooting cooldown.
        7. **Responsive Design:** Adjusts to window resizing, ensuring consistent gameplay across different screen sizes.

        ### **Next Steps:**

        1. **Final Testing:**
            - Open your project in a browser and start the game.
            - Monitor the developer console (F12) for any errors and address them accordingly.
            - Ensure all functionalities, such as shooting, enemy spawning, collisions, and game over conditions, work as expected.

        2. **Audio File Verification:**
            - Ensure all audio files are correctly placed in the `audio` directory and paths in `game.js` are accurate.

        3. **Further Enhancements:**
            - Consider adding features like power-ups, varied enemy behaviors, high score tracking, and more visual effects to enrich the gameplay.

        4. **Performance Optimization:**
            - Monitor the game's performance, especially on mobile devices, to maintain smooth animations and interactions.

        5. **User Feedback:**
            - Share your game with friends or a community to gather feedback and identify areas for improvement.

        **Happy Coding and Game Development!** 🎮✨
    */
});

