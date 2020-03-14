function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, frameDuration, frames, loop, reverse) {
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight = frameHeight;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
}

Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime -= this.totalTime;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    ctx.drawImage(this.spriteSheet,
                  index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth * scaleBy,
                  this.frameHeight * scaleBy);
}

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
}

function verticalCheck(rect, game) {
    var floor = game.background.ground;
    var ceiling = game.background.ceiling;
    var leftBound = game.background.left;
    var rightBound = game.background.right;

    game.platforms.forEach(function(entity) {
        if (entity.position.top >= rect.bottom) {
            if ((rect.left >= entity.position.left && rect.right <= entity.position.right) || 
                    (rect.left <= entity.position.left && rect.right >= entity.position.left) ||
                    (rect.right >= entity.position.right && rect.left <= entity.position.right)) {
                if (entity.position.top <= floor) {
                    floor = entity.position.top;
                    leftBound = entity.position.left;
                    rightBound = entity.position.right;
                } 
            }
        }
    })

    game.walls.forEach(function(entity) {
        if ((rect.left >= entity.position.left && rect.right <= entity.position.right) || 
                    (rect.left <= entity.position.left && rect.right >= entity.position.left) ||
                    (rect.right >= entity.position.right && rect.left <= entity.position.right)) {
            if (entity.position.top >= rect.bottom && entity.position.top <= floor) {
                floor = entity.position.top;
                leftBound = entity.position.left;
                rightBound = entity.position.right;
            }
            if (entity.position.bottom <= rect.top && entity.position.bottom >= ceiling) ceiling = entity.position.bottom;
        }
        /*
        if (entity.position.top >= rect.bottom) {
            if ((rect.left >= entity.position.left && rect.right <= entity.position.right) || 
                    (rect.left <= entity.position.left && rect.right >= entity.position.left) ||
                    (rect.right >= entity.position.right && rect.left <= entity.position.right)) {
                if () {
                    floor = entity.position.top;
                    leftBound = entity.position.left;
                    rightBound = entity.position.right;
                } 
            }
        }
        */
    })

    return {ground: floor, theCeiling: ceiling, theLeft: leftBound, theRight: rightBound};
}

function collisionDetector(position1, position2) {
    if (position1.left < position2.right
            && position1.right > position2.left
            && position1.top < position2.bottom
            && position1.bottom > position2.top) {
        return true;
    }
    return false;
}

function Position(drawX, drawY, boxX, boxY, width, height) {
    this.drawX = drawX;
    this.drawY = drawY;
    this.left = boxX;
    this.right = boxX + width;
    this.top = boxY;
    this.bottom = boxY + height;
    this.width = width;
    this.height = height;
}

// calculates the distance between two entities
// @return negative distance if object is to the right
// @return positive if to the left
function distance(entityA, entityB) {
    var disX = entityA.drawX - entityB.drawX;
    var disY = entityA.drawY - entityB.drawY;
    if (disX < 0) {
        return -Math.sqrt(disX * disX + disY * disY);
    } else if (disX > 0) {
        return Math.sqrt(disX * disX + disY * disY);
    }
}

Position.prototype.moveBy = function(deltaX, deltaY) {
    this.drawX += deltaX;
    this.drawY += deltaY;
    this.left += deltaX;
    this.right += deltaX;
    this.top += deltaY;
    this.bottom += deltaY;
}

// Moves the upper right corner of the bounding box coordinates to the new x and y
Position.prototype.moveTo = function(newX, newY) {
    var deltaX = this.left - this.drawX;
    var deltaY = this.top - this.drawY;
    this.left = newX;
    this.right = newX + this.width;
    this.top = newY;
    this.bottom = newY + this.height;
    this.drawX = newX - deltaX;
    this.drawY = newY - deltaY;
}

function Camera(game) {
    this.game = game;
    this.x = this.game.player.position.left - (this.game.ctx.canvas.width * 0.5) + 32;
    this.y = this.game.player.position.bottom - (this.game.ctx.canvas.height * 0.75) + 32;
    this.fullHeart = new Animation(AM.getAsset("./img/sprites/items/full_heart.png"), 0, 0, 33, 32, 0.125, 1, true, false);
    this.emptyHeart = new Animation(AM.getAsset("./img/sprites/items/empty_heart.png"), 0, 0, 32, 32, 0.125, 1, true, false);
    this.key1 = new Animation(AM.getAsset("./img/sprites/items/key_idle.png"), 0, 0, 32, 32, 0.125, 12, true, false);
    this.key2 = new Animation(AM.getAsset("./img/sprites/items/bosskey_idle.png"), 0, 0, 36, 36, 0.125, 12, true, false);
    this.blink = new Animation(AM.getAsset("./img/sprites/power-ups/blink.png"), 0, 0, 40, 40, .2, 17, true, false);
    this.doubleJump = new Animation(AM.getAsset("./img/sprites/power-ups/double-jump.png"), 0, 0, 40, 40, .2, 17, true, false);
    this.blackMage = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/idle_right.png"), 0, 0, 64, 64, .2, 1, true, false);
    this.monk = new Animation(AM.getAsset("./img/sprites/heroes/monk/idle_right.png"), 0, 0, 32, 32, .2, 1, true, false);
}

Camera.prototype.update = function () {
    // Update camera position
    this.x = this.game.player.position.left - (this.game.ctx.canvas.width * 0.5) + 32; // 32 offset for half of x2 scale player animation frame
    this.y = this.game.player.position.bottom - (this.game.ctx.canvas.height * 0.75) + 32; // 32 offset for half of x2 scale player animation frame
    // Check x-bound
    if (this.x < this.game.background.left) { // Check if to the left of half the canvas width
        this.x = this.game.background.left;
    } else if (this.x > this.game.background.right - this.game.ctx.canvas.width) { // Check if to the right of the background minus canvas width
        this.x = this.game.background.right - this.game.ctx.canvas.width;
    }
    // Check y-bound
    if (this.y < this.game.background.top) { // Check if above half the canvas height
        this.y = this.game.background.top;
    } else if (this.game.background.bottom < this.y + this.game.ctx.canvas.height) { // Check if below the background minus canvas height
        this.y = this.game.background.bottom - this.game.ctx.canvas.height;
    }
    if (this.game.player.gameOver) {
        this.x = 0;
        this.y = 0;
    }
    if (this.game.background.gameStart) {
        if (this.game.mouse) {
            this.game.sceneManager.newStage = true;
        }
    }
}

Camera.prototype.draw = function (ctx) {
    // Head-up display elements here
    if (this.game.background.gameStart) {
        ctx.save();
        ctx.fillStyle = 'White';
        ctx.font = "20px Georgia";
        ctx.fillText("CONTROLS:", 15, 500);
        ctx.font = "15px Georgio";
        ctx.fillText("Left Arrow Key: move left", 15, 520);
        ctx.fillText("Right Arrow Key: move right", 15, 540);
        ctx.fillText("Spacebar: Jump (Monk Double Jump if unlocked)", 15, 560);
        ctx.fillText("Z key: Swap Characters", 15, 580);
        ctx.fillText("X key: Attack - Fireball (Black Mage)", 350, 520);
        ctx.fillText("X key: Attack - Punch/Jumpkick (Monk)", 350, 540);
        ctx.fillText("C key: Frostbolt (Black Mage)", 350, 560);
        ctx.fillText("D key: Blink (Black Mage if unlocked)", 350, 580);
        ctx.fillText("D key: Use door", 650, 520);
        ctx.font = "30px Georgio";
        ctx.fillStyle = 'Red';
        ctx.fillText("Click on the screen to start", 650, 560);
        ctx.restore();
    } else if (this.game.sceneManager.currentStage < 11) {
        var bmOffset = 0;
        var monkOffset = 0;
        if (this.game.player.activeHero === 0) monkOffset = 40;
        else bmOffset = 40;
        
        // Black Mage info
        this.blackMage.drawFrame(this.game.clockTick, ctx, 8, bmOffset + 5, 1);
        for (var i = 0; i < this.game.player.maxHP[0]; i++) {
            if (i < this.game.player.HP[0]) this.fullHeart.drawFrame(this.game.clockTick, ctx, 45 + 40 * i, bmOffset + 25, 1);
            else this.emptyHeart.drawFrame(this.game.clockTick, ctx, 45 + 40 * i, bmOffset + 25, 1);
        }
        
        // Monk info
        this.monk.drawFrame(this.game.clockTick, ctx, 25, monkOffset + 25, 1);
        for (var i = 0; i < this.game.player.maxHP[1]; i++) {
            if (i < this.game.player.HP[1]) this.fullHeart.drawFrame(this.game.clockTick, ctx, 45 + 40 * i, monkOffset + 25, 1);
            else this.emptyHeart.drawFrame(this.game.clockTick, ctx, 45 + 40 * i, monkOffset + 25, 1);
        }
    
        if(this.game.player.keys[0]) this.key1.drawFrame(this.game.clockTick, ctx, 900, 40, 0.5);
        if(this.game.player.keys[1]) this.key2.drawFrame(this.game.clockTick, ctx, 950, 40, 0.5);
        if(this.game.player.blinkEnabled) this.blink.drawFrame(this.game.clockTick, ctx, 165, bmOffset + 25, 0.5);
        if(this.game.player.jumpsMax[1] === 2) this.doubleJump.drawFrame(this.game.clockTick, ctx, 285, monkOffset + 25, 0.5);
    }
}

function Background(game, spritesheet, left, right, top, bottom, width, height) {
    this.top = 0;
    this.bottom = height;
    this.left = 0;
    this.right = width;
    this.ceiling = top;
    this.ground = bottom;
    this.leftWall = left;
    this.rightWall = right;
    this.spritesheet = spritesheet;
    this.game = game;
    this.gameStart = false;
};

Background.prototype.draw = function (ctx) {
    if (this.gameStart) {
        ctx.drawImage(this.spritesheet, 
            this.left, this.right, ctx.canvas.width, ctx.canvas.height, // Only display the canvas size with camera in top left correr
            this.left, this.top, ctx.canvas.width, ctx.canvas.height);
    }
    ctx.drawImage(this.spritesheet, 
        this.game.camera.x, this.game.camera.y, ctx.canvas.width, ctx.canvas.height, // Only display the canvas size with camera in top left correr
        this.left, this.top, ctx.canvas.width, ctx.canvas.height); // Draw into top left corner of canvas, at canvas size
}

Background.prototype.update = function () {
    if (this.gameStart) {

    }

    if(this.game.player.gameOver) {
        if (this.game.space || this.game.xKey || this.game.cKey || this.game.zKey || this.game.dKey) {
            this.game.player = new Player(this.game);
            this.game.sceneManager.currentStage = 0;
            this.game.sceneManager.startNum = 0;
            this.game.sceneManager.newStage = true;
            this.game.sceneManager.key1 = new Key(this.game, 551, 987, 0);
            this.game.sceneManager.key2 = new Key(this.game, 1880, 90, 1);
            this.game.sceneManager.power1 = new PowerUp(this.game, 55, 95);
            this.game.sceneManager.power2 = new PowerUp(this.game, 90, 90);
            this.game.sceneManager.power3 = new PowerUp(this.game, 32, 992);
        }
    }
}

// Platform Prototype
function Platform(game, spritesheet, theX, theY, theWidth, theHeight) {
    this.type = 'Platform';
    this.position = new Position(theX, theY, theX, theY, theWidth, theHeight);
    this.spritesheet = spritesheet;
    this.game = game;
}

Platform.prototype.draw = function (ctx) {
    var cameraOffsetX = this.position.left - this.game.camera.x;
    var cameraOffsetY = this.position.top - this.game.camera.y;
    
    ctx.save();
    if (this.game.showOutlines) {
        ctx.strokeStyle = 'Red';   
        ctx.strokeRect(cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
    }
    /*
    var img = AM.getAsset("./img/sprites/platforms/small_grass_tile.png");
    var pattern = ctx.createPattern(img, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
    */

    ctx.fillStyle = 'DarkGreen';
    ctx.fillRect(cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
    ctx.restore();
}

Platform.prototype.update = function () {
    // Empty
};

// Wall Prototype
function Wall(game, color, theX, theY, theWidth, theHeight) {
    this.type = 'Wall';
    this.position = new Position(theX, theY, theX, theY, theWidth, theHeight);
    this.color = color;
    this.game = game;
}

Wall.prototype.draw = function (ctx) {
    var cameraOffsetX = this.position.left - this.game.camera.x;
    var cameraOffsetY = this.position.top - this.game.camera.y;
    ctx.save();

    if (this.game.showOutlines) {
        ctx.strokeStyle = 'Red';   
        ctx.strokeRect(cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
    }

    /*
    var pattern = ctx.createPattern(this.spritesheet, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
    */

    //if (this.color !== null) ctx.fillStyle = this.color;
    //else 
    ctx.fillStyle = "#532C18";
    ctx.fillRect(cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
    ctx.restore();
}

Wall.prototype.update = function () {
    // Empty
};

function Door(game, theX, theY, theLevel, theDoor, isLocked) {
    this.type = 'Door';
    this.game = game;
    this.position = new Position(theX, theY, theX, theY, 5, 60);
    this.destination = {level: theLevel, door: theDoor};
    this.locked = isLocked;
}

Door.prototype.unlock = function() {
    this.locked = false;
}

// Slime enemy
function Slime(game, theX, theY, faceRight, theColor) {
    this.type = "Enemy";
    this.color = theColor;
    this.HP = 3;
    this.state = 'idle';
    this.position = new Position(theX, theY, theX + 20, theY + 45, 24, 20);
    this.faceRight = faceRight;
    this.velocityX = 0;
    this.velocityY = 0;
    this.aggroCooldown = 0;
    this.animations = {};
    if (theColor === 'Red') {
        this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/idle_left.png"), 0, 1, 32, 32, 0.2, 10, true, false),
                            idleRight: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/idle_right.png"), 0, 1, 32, 32, 0.2, 10, true, false),
                            walkLeft: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/rolling_left.png"), 0, 1, 32, 32, 0.2, 8, true, false),
                            walkRight: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/rolling_right.png"), 0, 1, 32, 32, 0.2, 8, true, false),
                            deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/death_left.png"), 0, 1, 32, 32, 0.125, 12, false, false),
                            deathRight: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/death_right.png"), 0, 1, 32, 32, 0.125, 12, false, false),
                            dmgLeft: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/dmg_left.png"), 0, 1, 32, 32, 0.125, 8, false, false),
                            dmgRight: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/dmg_right.png"), 0, 1, 32, 32, 0.125, 8, false, false),
                            frozen: new Animation(AM.getAsset("./img/ice_cube.png"), 0, 1, 32, 32, 2, 1, false, false)};
    } else if (theColor === 'Green') {
        this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/idle_left.png"), 0, 1, 32, 32, 0.2, 10, true, false),
                            idleRight: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/idle_right.png"), 0, 1, 32, 32, 0.2, 10, true, false),
                            walkLeft: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/rolling_left.png"), 0, 1, 32, 32, 0.2, 8, true, false),
                            walkRight: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/rolling_right.png"), 0, 1, 32, 32, 0.2, 8, true, false),
                            deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/death_left.png"), 0, 1, 32, 32, 0.125, 12, false, false),
                            deathRight: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/death_right.png"), 0, 1, 32, 32, 0.125, 12, false, false),
                            dmgLeft: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/dmg_left.png"), 0, 1, 32, 32, 0.125, 8, false, false),
                            dmgRight: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/dmg_right.png"), 0, 1, 32, 32, 0.125, 8, false, false),
                            frozen: new Animation(AM.getAsset("./img/ice_cube.png"), 0, 1, 32, 32, 2, 1, false, false)};
    } else {
        this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/idle_left.png"), 0, 1, 32, 32, 0.2, 10, true, false),
                            idleRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/idle_right.png"), 0, 1, 32, 32, 0.2, 10, true, false),
                            walkLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/rolling_left.png"), 0, 1, 32, 32, 0.2, 8, true, false),
                            walkRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/rolling_right.png"), 0, 1, 32, 32, 0.2, 8, true, false),
                            deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/death_left.png"), 0, 1, 32, 32, 0.125, 12, false, false),
                            deathRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/death_right.png"), 0, 1, 32, 32, 0.125, 12, false, false),
                            dmgLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/dmg_left.png"), 0, 1, 32, 32, 0.125, 8, false, false),
                            dmgRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/dmg_right.png"), 0, 1, 32, 32, 0.125, 8, false, false),
                            frozen: new Animation(AM.getAsset("./img/ice_cube.png"), 0, 0, 32, 32, 2, 1, false, false)};
    }
    
    this.game = game;
    this.isHit = false;
    this.isHitRight = false;
    this.isChasing = false;
}

Slime.prototype.split = function () {
    this.game.addEntity(new Slime(this.game, this.position.drawX - this.position.width * 0.5, this.position.drawY - 2, false, 'Red'));
    this.game.addEntity(new Slime(this.game, this.position.drawX + this.position.width, this.position.drawY - 2, true, 'Red'));
}

Slime.prototype.draw = function (ctx) {
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();  
    }

    if (this.state === 'idle') {
        (this.faceRight) ? this.animations.idleRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2) : 
                            this.animations.idleLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
    }
    
    if (this.state === 'walk') {
        (this.faceRight) ? this.animations.walkRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2) : 
                            this.animations.walkLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
    }

    if (this.state === 'frozen') this.animations.frozen.drawFrame(this.game.clockTick, ctx, drawOffsetX + 16, drawOffsetY + 36, 1);
    
    if (this.state === 'damaged') {
        if(this.faceRight) {
            if (this.animations.dmgRight.isDone()) {
                this.state = 'idle';
                this.animations.dmgRight.elapsedTime = 0;
            } else {
                this.animations.dmgRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
            }
        } else {
            if (this.animations.dmgLeft.isDone()) {
                this.state = 'idle';
                this.animations.dmgLeft.elapsedTime = 0;
            } else {
                this.animations.dmgLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
            }
        }
    }

    if (this.state === 'dead') {
        if(this.faceRight) {
            if (this.animations.deathRight.isDone()) {
                if (this.color === 'Green') this.split();
                else if (0.33 > Math.random()) this.game.addEntity(new Heart(this.game, this.position.left, this.position.top));
                this.removeFromWorld = true;
            } else {
                this.animations.deathRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
            }
        } else {
            if (this.animations.deathLeft.isDone()) {
                if (this.color === 'Green') this.split();
                else if (0.33 > Math.random()) this.game.addEntity(new Heart(this.game, this.position.left, this.position.top));
                this.removeFromWorld = true;
            } else {
                this.animations.deathLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
            }
        }
    }
}

Slime.prototype.update = function () {

    var currentPlatform = verticalCheck(this.position, this.game);
    var that = this;

    if (this.HP <= 0) this.state = 'dead';

    // Check for player within a certain distance
    // if within set distance enemy aggros
    var playerDistance = distance(this.position, this.game.player.position);
    if ((playerDistance > -200 && playerDistance < 0) || (playerDistance < 200 && playerDistance > 0) && this.aggroCooldown === 0 &&
            this.state !== 'damaged' && !this.game.player.invulnerable) {
        this.isChasing = true;
    } else {
        this.isChasing = false;
    }

    // Falling checks
    if (this.position.bottom === currentPlatform.ground) {
        this.velocityY = 0;
        this.falling = false;
    } else if (this.position.bottom + (this.velocityY + this.game.gravity) * this.game.clockTick >= currentPlatform.ground &&
                this.velocityY > 0) {
        this.position.moveTo(this.position.left, currentPlatform.ground - this.position.height);
        this.velocityY = 0;
        this.falling = false;
    } else {
        this.falling = true;
        (this.velocityY + this.game.gravity >= this.game.terminalVelocity) ? this.velocityY = this.game.terminalVelocity : this.velocityY += this.game.gravity;
    }

    if (this.state === 'walk') {
        if (this.faceRight) {
            if (this.position.right < currentPlatform.theRight - 50 * this.game.clockTick) {
                this.velocityX = 50;
            } else this.faceRight = false;
        } else {
            if (this.position.left > currentPlatform.theLeft + 50 * this.game.clockTick) {
                this.velocityX = -50;
            } else this.faceRight = true;   
        }
    }

    if (this.state === 'frozen') {
        this.velocityX = 0;
        if (this.animations.frozen.isDone()) {
            this.animations.frozen.elapsedTime = 0;
            this.state = 'walk';
        }
    }

    if (this.state === 'dead' || this.state === 'damaged') {
        this.velocityX = 0;
    }

    this.position.moveBy(this.velocityX * this.game.clockTick, this.velocityY * this.game.clockTick);

    if (this.isHit) {
        if (this.isHitRight) {
            this.position.moveBy(5, 0);
            this.isHitRight = false;
        } else {
            this.position.moveBy(-5, 0);
        }
        this.isHit = false;
    }

    if (this.isChasing && this.state !== 'dead' && this.state !== 'damaged' && this.state !== 'frozen') {
        this.state = 'walk';
        (this.position.left < this.game.player.position.left) ? this.faceRight = true : this.faceRight = false;
    }

    
    
    // Wall collision
    this.game.walls.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position) && that.position.bottom > entity.position.top) {
            if (that.position.left < entity.position.left) that.position.moveTo(entity.position.left - that.position.width, that.position.top);
            if (that.position.right > entity.position.right) that.position.moveTo(entity.position.right, that.position.top);
        }
    });

    // Stay on background
    if (this.position.left < this.game.background.leftWall) this.position.moveTo(this.game.background.leftWall, this.position.top);
    if (this.position.right > this.game.background.rightWall) this.position.moveTo(this.game.background.rightWall - this.position.width, this.position.top);

    if (this.aggroCooldown > 0) this.aggroCooldown -= this.game.clockTick;
    else if (this.aggroCooldown < 0) this.aggroCooldown = 0;
};

function SlimeBoss(game) {
    this.type = "Enemy";
    this.boss = true;
    this.HP = 100;
    this.state = 'idle';
    this.next = 'spit';
    this.turning = false;
    this.hasSpit = false;
    this.jumps = 0;
    this.position = new Position(583, 150, 643, 282, 72, 60);
    this.faceRight = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/idle_left.png"), 0, 0, 192, 192, 0.07, 10, false, false),
                        idleRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/idle_right.png"), 0, 0, 192, 192, 0.07, 10, false, false),
                        walkLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/rolling_left.png"), 0, 0, 192, 192, 0.1, 8, false, false),
                        walkRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/rolling_right.png"), 0, 0, 192, 192, 0.1, 8, false, false),
                        deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/death_left.png"), 0, 0, 192, 192, 0.125, 12, false, false),
                        deathRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/death_right.png"), 0, 0, 192, 192, 0.125, 12, false, false),
                        dmgLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/dmg_left.png"), 0, 0, 192, 192, 0.125, 8, false, false),
                        dmgRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/dmg_right.png"), 0, 0, 192, 192, 0.125, 8, false, false),
                        jumpLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/jump_left.png"), 0, 0, 192, 192, 0.2, 4, false, false),
                        fallLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/jump_left.png"), 192, 192, 192, 192, 1, 1, true, false),
                        landLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/jump_left.png"), 384, 192, 192, 192, 0.2, 6, false, false),
                        jumpRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/jump_right.png"), 0, 0, 192, 192, 0.2, 4, false, false),
                        fallRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/jump_right.png"), 192, 192, 192, 192, 1, 1, true, false),
                        landRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/jump_right.png"), 384, 192, 192, 192, 0.2, 6, false, false),
                        spitLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/spit_left.png"), 0, 0, 192, 192, 0.07, 10, false, false),
                        spitRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/spit_right.png"), 0, 0, 192, 192, 0.07, 10, false, false)};
    this.game = game;
    this.isHit = false;
}

SlimeBoss.prototype.draw = function (ctx) {
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();  
    }

    if (this.state === 'idle') {
        if (this.faceRight) {
            if (this.animations.idleRight.isDone()) {
                this.state = this.next;
                this.animations.idleRight.elapsedTime = 0;
            } else this.animations.idleRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        } else {
            if (this.animations.idleLeft.isDone()) {
                this.state = this.next;
                this.animations.idleLeft.elapsedTime = 0;
            } else this.animations.idleLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        }
    }
    
    if (this.state === 'walk') {
        if (this.faceRight) {
            if (this.animations.walkRight.isDone()) {
                this.velocityX = 0;
                this.state = 'idle';
                if (this.turning) {
                    console.log("Turning");
                    this.faceRight = !this.faceRight;
                    this.turning = false;
                } else this.next = 'jump';
                this.animations.walkRight.elapsedTime = 0;
            } else this.animations.walkRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        } else {
            if (this.animations.walkLeft.isDone()) {
                this.state = 'idle';
                if (this.turning) {
                    console.log("Turning");
                    this.faceRight = !this.faceRight;
                    this.turning = false;
                } else this.next = 'jump';
                this.animations.walkLeft.elapsedTime = 0;
            } else this.animations.walkLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        }
    }
    
    if (this.state === 'jump') {
        if (this.faceRight) {
            if (this.animations.jumpRight.isDone()) {
                this.jumps++;
                console.log(`Jumps: ${this.jumps}`);
                this.state = 'idle';
                this.next = 'spit';
                this.animations.jumpRight.elapsedTime = 0;
                if (this.jumps > 1) {
                    console.log("Turn incoming");
                    this.jumps = 0;
                    this.turning = true; 
                }
            } else this.animations.jumpRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        } else {
            if (this.animations.jumpLeft.isDone()) {
                this.jumps++;
                console.log(`Jumps: ${this.jumps}`);
                this.state = 'idle';
                this.next = 'spit';
                this.animations.jumpLeft.elapsedTime = 0;
                if (this.jumps > 1) {
                    console.log("Turn incoming");
                    this.jumps = 0;
                    this.turning = true;
                }
            } else this.animations.jumpLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        }
    }

    if (this.state === 'fall') {
        (this.faceRight) ? this.animations.fallRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1) : 
                            this.animations.fallLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
    }

    if (this.state === 'land') {
        if (this.faceRight) {
            if (this.animations.landRight.isDone()) {
                this.state = 'idle';
                this.animations.landRight.elapsedTime = 0;
            } else this.animations.landRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        } else {
            if (this.animations.landLeft.isDone()) {
                this.state = 'idle';
                this.animations.landLeft.elapsedTime = 0;
            } else this.animations.landLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        }
    }

    if (this.state === 'spit') {
        if (!this.hasSpit && ((this.animations.spitRight.elapsedTime / this.animations.spitRight.totalTime > 0.5) ||
                            (this.animations.spitLeft.elapsedTime / this.animations.spitLeft.totalTime > 0.5))) {
            this.game.addEntity(new Spit(this.game, this.faceRight, this.position));
            this.hasSpit = true;
        }

        if (this.faceRight) {
            if (this.animations.spitRight.isDone()) {
                this.state = 'idle';
                this.next = 'walk';
                this.animations.spitRight.elapsedTime = 0;
                this.hasSpit = false;
            } else this.animations.spitRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        } else {
            if (this.animations.spitLeft.isDone()) {
                this.state = 'idle';
                this.next = 'walk';
                this.animations.spitLeft.elapsedTime = 0;
                this.hasSpit = false;
            } else this.animations.spitLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        }              
    }

    if (this.state === 'damaged') {
        if(this.faceRight) {
            if (this.animations.dmgRight.isDone()) {
                this.state = 'idle';
                this.animations.dmgRight.elapsedTime = 0;
            } else {
                this.animations.dmgRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
            }
        } else {
            if (this.animations.dmgLeft.isDone()) {
                this.state = 'idle';
                this.animations.dmgLeft.elapsedTime = 0;
            } else {
                this.animations.dmgLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
            }
        }
    }

    if (this.state === 'dead') {
        if (this.animations.deathRight.isDone() || this.animations.deathLeft.isDone()){
            this.game.addEntity(new Heart(this.game, this.position.left, this.position.top + 30));
            this.game.addEntity(new Heart(this.game, this.position.left + 20, this.position.top + 30));
            this.game.addEntity(new Heart(this.game, this.position.left - 20, this.position.top + 30));
            this.game.addEntity(new Heart(this.game, this.position.left + 10, this.position.top + 30));
            this.game.addEntity(new Heart(this.game, this.position.left - 10, this.position.top + 30));
            this.game.doors.forEach(function(entity) {
                entity.unlock();
            });
            this.game.boss1Alive = false;
            this.removeFromWorld = true;
        } else if(this.faceRight) this.animations.deathRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
        else this.animations.deathLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
    }
}

SlimeBoss.prototype.update = function () {

    var currentPlatform = verticalCheck(this.position, this.game);

    if (this.HP <= 0) this.state = 'dead';

    // Falling checks
    if (this.position.bottom === currentPlatform.ground) {
        this.velocityX = 0;
        this.velocityY = 0;
        if (this.state === 'fall') this.state = 'land';
    } else if (this.position.bottom + (this.velocityY + this.game.gravity) * this.game.clockTick >= currentPlatform.ground &&
                this.velocityY > 0) {
        this.position.moveTo(this.position.left, currentPlatform.ground - this.position.height);
        this.velocityX = 0;
        this.velocityY = 0;
        this.state = 'land';
    } else {
        this.state = 'fall';
        (this.velocityY + this.game.gravity >= this.game.terminalVelocity) ? this.velocityY = this.game.terminalVelocity : this.velocityY += this.game.gravity;
    }

    if (this.state === 'jump') {
        if (this.faceRight && this.animations.jumpRight.isDone()) {
            this.velocityX = 150;
            this.velocityY = -1200;
        }
        if (!this.faceRight && this.animations.jumpLeft.isDone()) {
            this.velocityX = -150;
            this.velocityY = -1200;
        }
    }

    if (this.state === 'walk') {
        if (this.faceRight && this.position.right < currentPlatform.theRight - 50 * this.game.clockTick + this.position.width * 0.5) {
            this.velocityX = 125;
        } else if (!this.faceRight && this.position.left > currentPlatform.theLeft + 50 * this.game.clockTick - this.position.width * 0.5) {
            this.velocityX = -125;
        }
    }

    if (this.state === 'dead' || this.state === 'damaged' || this.state === 'idle') {
        this.velocityX = 0;
    }

    this.position.moveBy(this.velocityX * this.game.clockTick, this.velocityY * this.game.clockTick);

    /*
    if (this.isHit) {
        if (this.isHitRight) {
            this.position.moveBy(5, 0);
            this.isHitRight = false;
        } else {
            this.position.moveBy(-5, 0);
        }
        this.isHit = false;
    }
    */

    // Stay on background
    if (this.position.left < this.game.background.leftWall) this.position.moveTo(this.game.background.leftWall, this.position.top);
    if (this.position.right > this.game.background.rightWall) this.position.moveTo(this.game.background.rightWall - this.position.width, this.position.top);
};

function Spit(game, goingRight, position) {
    this.type = "Projectile";
    this.game = game;
    this.position = new Position(position.left + 4, position.top - 45, position.left + 24, position.top, 24, 20);
    this.faceRight = goingRight;
    this.velocityX = 300;
    this.velocityY = -1000
    this.animation = new Animation(AM.getAsset("./img/sprites/enemies/green_slime/idle_right.png"), 0, 1, 32, 32, 0.2, 10, true, false);
    if (!goingRight) {
        this.velocityX *= -1;
        this.animation = new Animation(AM.getAsset("./img/sprites/enemies/green_slime/idle_left.png"), 0, 1, 32, 32, 0.2, 10, true, false);
    }
}

Spit.prototype.draw = function (ctx) {
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();
    }

    this.animation.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
}

Spit.prototype.update = function () {
    var collision = false;
    var that = this;

    if (this.velocityY > this.game.terminalVelocity - this.game.gravity) this.velocityY = this.game.terminalVelocity;
    else this.velocityY += this.game.gravity;

    if (this.position.bottom > this.game.background.bottom - this.velocityY * this.game.clockTick) collision = true;

    if (collisionDetector(this.position, this.game.player.position)) {
        this.game.player.damaged = true;
        this.game.player.invulnerable = true;
        this.game.player.HP[this.game.player.activeHero] -= 1;
        collision = true;
    }

    this.game.platforms.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            collision = true;
        } 
    });

    this.game.walls.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            collision = true;
        } 
    });

    if (this.position.left < this.game.background.leftWall) collision = true;
    if (this.position.right > this.game.background.rightWall) collision = true;
    
    if (collision || this.position.right > this.game.background.right || this.position.left < this.game.background.left ||
                    this.position.top < this.game.background.top) {
        this.removeFromWorld = true;
        this.game.addEntity(new Slime(this.game, this.position.drawX, this.position.drawY - this.velocityY * this.game.clockTick - 1, this.faceRight, 'Green'));
    } else {
        this.position.moveBy(this.velocityX * this.game.clockTick, this.velocityY * this.game.clockTick);
    }
}

function Bunny(game, theX, theY, faceRight) {
    this.game = game;
    this.type = "Enemy";
    this.HP = 5;
    this.state = 'idle';
    this.position = new Position(theX, theY, theX + 19, theY + 15, 28, 48);
    this.faceRight = faceRight;
    this.isHit = false;
    this.isHitRight = false;
    this.aggro = false;
    this.shotTimer = 1;
    this.shot = false;
    this.velocityX = 0;
    this.velocityY = 0;
    this.animations = {deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/bunny/death_l.png"), 0, 0, 40, 32.2, 0.125, 8, false, false),
                        deathRight: new Animation(AM.getAsset("./img/sprites/enemies/bunny/death_r.png"), 0, 0, 40, 32.2, 0.125, 8, false, false),
                        dmgLeft: new Animation(AM.getAsset("./img/sprites/enemies/bunny/death_l.png"), 0, 0, 40, 32.2, 0.25, 1, false, false),
                        dmgRight: new Animation(AM.getAsset("./img/sprites/enemies/bunny/death_r.png"), 0, 0, 40, 32.2, 0.25, 1, false, false),
                        idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/bunny/idle_l.png"), 0, 0, 32, 32.3, 0.2, 4, true, false),
                        idleRight: new Animation(AM.getAsset("./img/sprites/enemies/bunny/idle_r.png"), 0, 0, 32, 32.3, 0.2, 4, true, false),
                        atkLeft: new Animation(AM.getAsset("./img/sprites/enemies/bunny/atk_l.png"), 0, 0, 32, 32.2, 0.2, 6, false, false),
                        atkRight: new Animation(AM.getAsset("./img/sprites/enemies/bunny/atk_r.png"), 0, 0, 32, 32.2, 0.2, 6, false, false),
                        frozen: new Animation(AM.getAsset("./img/bunny_ice.png"), 0, 0, 32, 32, 2, 1, false, false)};
}

Bunny.prototype.update = function() {
    var currentPlatform = verticalCheck(this.position, this.game);
    var that = this;

    if (this.HP <= 0) this.state = 'dead';

    // Check for player within a certain distance
    // if within set distance enemy aggros
    var playerDistance = distance(this.position, this.game.player.position);
    if ((playerDistance > -400 && playerDistance < 0) || (playerDistance < 400 && playerDistance > 0)) {
        this.aggro = true;
    } else {
        this.aggro = false;
    }

    // Falling checks
    if (this.position.bottom === currentPlatform.ground) {
        this.velocityY = 0;
        this.falling = false;
    } else if (this.position.bottom + (this.velocityY + this.game.gravity) * this.game.clockTick >= currentPlatform.ground &&
                this.velocityY > 0) {
        this.position.moveTo(this.position.left, currentPlatform.ground - this.position.height);
        this.velocityY = 0;
        this.falling = false;
    } else {
        this.falling = true;
        (this.velocityY + this.game.gravity >= this.game.terminalVelocity) ? this.velocityY = this.game.terminalVelocity : this.velocityY += this.game.gravity;
    }

    if (this.state === 'frozen') {
        this.velocityX = 0;
        //this.velocityY = 0;
        if (this.animations.frozen.isDone()) {
            this.animations.frozen.elapsedTime = 0;
            this.state = 'idle';
        }
    }

    if (this.state === 'dead') {
        this.velocityX = 0;
    }

    this.position.moveBy(this.velocityX * this.game.clockTick, this.velocityY * this.game.clockTick);

    if (this.isHit) {
        if (this.isHitRight) {
            this.position.moveBy(5, 0);
            this.isHitRight = false;
        } else {
            this.position.moveBy(-5, 0);
        }
        this.isHit = false;
    }

    if (this.aggro && this.state !== 'dead' && this.state !== 'damaged' && this.state !== 'frozen') {
        this.state = 'attack';
        // face right
        if (playerDistance > -400 && playerDistance < 0) {
            this.faceRight = true;
        } 
        // face left
        if (playerDistance < 400 && playerDistance > 0) {
            this.faceRight = false;
        }
    } else if (this.state !== 'dead' && this.state !== 'damaged' && this.state != 'frozen') {
        this.state = 'idle';
    }
    
    // Wall collision
    this.game.walls.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position) && that.position.bottom > entity.position.top) {
            if (that.position.left < entity.position.left) that.position.moveTo(entity.position.left - that.position.width, that.position.top);
            if (that.position.right > entity.position.right) that.position.moveTo(entity.position.right, that.position.top);
        }
    });

    // Stay on background
    if (this.position.left < this.game.background.leftWall) this.position.moveTo(this.game.background.leftWall, this.position.top);
    if (this.position.right > this.game.background.rightWall) this.position.moveTo(this.game.background.rightWall - this.position.width, this.position.top);
}

Bunny.prototype.draw = function (ctx) {
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();  
    }

    if (this.state === 'idle') {
        (this.faceRight) ? this.animations.idleRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2) : 
                            this.animations.idleLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
    }

    if (this.state === 'frozen') this.animations.frozen.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
    
    if (this.state === 'damaged') {
        if (this.HP <= 0) this.state = 'dead';
        else {
            if(this.faceRight) {
                if (this.animations.dmgRight.isDone()) {
                    this.state = 'idle';
                } else {
                    this.animations.dmgRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
                }
            } else {
                if (this.animations.dmgLeft.isDone()) {
                    this.state = 'idle';
                } else {
                    this.animations.dmgLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
                }
            }
        }
        
    }

    if (this.state === 'dead') {
        if(this.faceRight) {
            if (this.animations.deathRight.isDone()) {
                if (0.33 > Math.random()) this.game.addEntity(new Heart(this.game, this.position.left, this.position.top));
                this.removeFromWorld = true;
            } else {
                this.animations.deathRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
            }
        } else {
            if (this.animations.deathLeft.isDone()) {
                if (0.33 > Math.random()) this.game.addEntity(new Heart(this.game, this.position.left, this.position.top));
                this.removeFromWorld = true;
            } else {
                this.animations.deathLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
            }
        }
    }

    if (this.state === 'attack') {
        var rockLeft = this.position.left + this.position.width * 0.5;
        var rockTop = this.position.top + this.position.height * 0.25;
        if (this.shotTimer <= 0) {
            if (this.faceRight) {
                if (!this.animations.atkRight.isDone()) {
                    this.animations.atkRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
                    if (this.animations.atkRight.elapsedTime / this.animations.atkRight.totalTime > 0.33 && !this.shot) {
                        this.shot = true;
                        this.game.addEntity(new Rock(this.game, this.faceRight, new Position(rockLeft, rockTop,rockLeft, rockTop, 16, 16), this));
                    }
                } else {
                    this.animations.atkRight.elapsedTime = 0;
                    this.shotTimer = 1.5;
                    this.shot = false;
                }
            } else {
                if (!this.animations.atkLeft.isDone()) {
                    this.animations.atkLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
                    if (this.animations.atkLeft.elapsedTime / this.animations.atkLeft.totalTime > 0.33 && !this.shot) {
                        this.game.addEntity(new Rock(this.game, this.faceRight, new Position(rockLeft, rockTop,rockLeft, rockTop, 16, 16), this));
                        this.shot = true;
                    }
                } else {
                    this.animations.atkLeft.elapsedTime = 0;
                    this.shotTimer = 1.5;
                    this.shot = false;
                }
            }
        } else {
            this.shotTimer -= this.game.clockTick;
            (this.faceRight) ? this.animations.idleRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2) : 
                                this.animations.idleLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
        }
    }
};

function Rock(game, goingRight, position) {
    this.type = "Projectile";
    this.game = game;
    this.position = position;
    this.velocityX = 600;
    this.animation = new Animation(AM.getAsset("./img/sprites/enemies/bunny/medium_rock.png"), 0, 0, 16, 16, 0.125, 1, true, false);
    if (!goingRight) this.velocityX *= -1;
}

Rock.prototype.draw = function (ctx) {
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();
    }

    this.animation.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
}

Rock.prototype.update = function () {
    var collision = false;
    var that = this;

    if (collisionDetector(this.position, this.game.player.position)) {
        this.game.player.damaged = true;
        this.game.player.invulnerable = true;
        this.game.player.HP[this.game.player.activeHero] -= 1;
        collision = true;
    }

    this.game.platforms.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            collision = true;
        } 
    });

    this.game.walls.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            collision = true;
        } 
    });

    if (this.position.left < this.game.background.leftWall) collision = true;
    if (this.position.right > this.game.background.rightWall) collision = true;
    
    if (collision || this.position.right > this.game.background.right
                || this.position.left < this.game.background.left 
                || this.position.right > this.game.camera.x + this.game.ctx.width * 1.5 
                || this.position.left < this.game.camera.x - this.game.ctx.width * 0.5) {
        this.removeFromWorld = true;
    } else {
        this.position.moveBy(this.velocityX * this.game.clockTick, 0);
    }
}

function Jaws(game, theX, theY, faceRight) {
    this.type = "Enemy";
    this.HP = 2;
    this.state = 'idle';
    this.position = new Position(theX, theY, theX + 19, theY + 19, 40, 42);
    this.faceRight = faceRight;
    this.velocityX = 0;
    this.velocityY = 0;
    this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/jaws/idle_left.png"), 0, 0, 50, 50, 0.4, 2, true, false),
                        idleRight: new Animation(AM.getAsset("./img/sprites/enemies/jaws/idle_right.png"), 0, 0, 50, 50, 0.4, 2, true, false), 
                        walkLeft: new Animation(AM.getAsset("./img/sprites/enemies/jaws/walk_left.png"), 0, 0, 50, 50, 0.2, 5, true, false),
                        walkRight: new Animation(AM.getAsset("./img/sprites/enemies/jaws/walk_right.png"), 0, 0, 50, 50, 0.2, 5, true, false),
                        deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/jaws/death_left.png"), 0, 0, 50, 50, 0.15, 11, false, false),
                        deathRight: new Animation(AM.getAsset("./img/sprites/enemies/jaws/death_right.png"), 0, 0, 50, 50, 0.15, 11, false, false),
                        frozen: new Animation(AM.getAsset("./img/ice_cube.png"), 0, 0, 32, 32, 2, 1, false, false)};
    
    this.game = game;
    this.aggroCooldown = 0;
    this.isHit = false;
    this.isHitRight = false;
    this.isChasing = false;
    this.hitPlayer = false;
}

Jaws.prototype.draw = function (ctx) {
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();  
    }

    if (this.state === 'idle') {
        (this.faceRight) ? this.animations.idleRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1.5) : 
                            this.animations.idleLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1.5);
    }
    
    if (this.state === 'walk') {
        (this.faceRight) ? this.animations.walkRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1.5) : 
                            this.animations.walkLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1.5);
    }
    if (this.state === 'frozen') this.animations.frozen.drawFrame(this.game.clockTick, ctx, drawOffsetX + 16, drawOffsetY + 16, 1.5);
    if (this.state === 'dead') {
        if(this.faceRight) {
            if (this.animations.deathRight.isDone()) {
                if (0.33 > Math.random()) this.game.addEntity(new Heart(this.game, this.position.left, this.position.top));
                this.removeFromWorld = true;
            } else {
                this.animations.deathRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1.5);
            }
        } else {
            if (this.animations.deathLeft.isDone()) {
                if (0.33 > Math.random()) this.game.addEntity(new Heart(this.game, this.position.left, this.position.top));
                this.removeFromWorld = true;
            } else {
                this.animations.deathLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1.5);
            }
        }
    }
}

Jaws.prototype.update = function () {
    var currentPlatform = verticalCheck(this.position, this.game);
    var that = this;

    if (this.HP <= 0) this.state = 'dead';

    // Check for player within a certain distance
    // if within set distance enemy aggros
    var playerDistance = distance(this.position, this.game.player.position);
    if ((playerDistance > -200 && playerDistance < 0) || (playerDistance < 200 && playerDistance > 0) && this.aggroCooldown === 0 &&
            !this.game.player.invulnerable) {
        this.isChasing = true;
    } else {
        this.isChasing = false;
    }

    // Falling checks
    if (this.position.bottom === currentPlatform.ground) {
        this.velocityY = 0;
        this.falling = false;
    } else if (this.position.bottom + (this.velocityY + this.game.gravity) * this.game.clockTick >= currentPlatform.ground &&
                this.velocityY > 0) {
        this.position.moveTo(this.position.left, currentPlatform.ground - this.position.height);
        this.velocityY = 0;
        this.falling = false;
    } else {
        this.falling = true;
        (this.velocityY + this.game.gravity >= this.game.terminalVelocity) ? this.velocityY = this.game.terminalVelocity : this.velocityY += this.game.gravity;
    }

    if (this.state === 'walk') {
        if (this.faceRight) {
            if (this.position.right < currentPlatform.theRight - 50 * this.game.clockTick) {
                this.velocityX = 150;
            } else this.faceRight = false;
        } else {
            if (this.position.left > currentPlatform.theLeft + 50 * this.game.clockTick) {
                this.velocityX = -150;
            } else this.faceRight = true;   
        }
    }

    if (this.state === 'frozen') {
        this.velocityX = 0;
        if (this.animations.frozen.isDone()) {
            this.animations.frozen.elapsedTime = 0;
            this.state = 'walk';
        }
    }

    if (this.state === 'dead') {
        this.velocityX = 0;
    }

    if (this.hitPlayer) {
        this.hitPlayer = false;
        this.game.player.HP[this.game.player.activeHero] -= 1;
    }

    this.position.moveBy(this.velocityX * this.game.clockTick, this.velocityY * this.game.clockTick);

    if (this.isHit) {
        this.state = 'dead';
        if (this.isHitRight) {
            this.position.moveBy(5, 0);
            this.isHitRight = false;
        } else {
            this.position.moveBy(-5, 0);
        }
        this.isHit = false;
    }

    if (this.isChasing && this.state !== 'dead' && this.state !== 'frozen') {
        this.state = 'walk';
        (this.position.left < this.game.player.position.left) ? this.faceRight = true : this.faceRight = false;
    }   
    
    // Wall collision
    this.game.walls.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position) && that.position.bottom > entity.position.top) {
            if (that.position.left < entity.position.left) that.position.moveTo(entity.position.left - that.position.width, that.position.top);
            if (that.position.right > entity.position.right) that.position.moveTo(entity.position.right, that.position.top);
        }
    });

    // Stay on background
    if (this.position.left < this.game.background.leftWall) this.position.moveTo(this.game.background.leftWall, this.position.top);
    if (this.position.right > this.game.background.rightWall) this.position.moveTo(this.game.background.rightWall - this.position.width, this.position.top);

    if (this.aggroCooldown > 0) this.aggroCooldown -= this.game.clockTick;
    else if (this.aggroCooldown < 0) this.aggroCooldown = 0;
}

function Licky(game, theX, theY, faceRight) {
    this.type = "Enemy";
    this.HP = 4;
    this.state = 'idle';
    this.position = new Position(theX, theY, theX + 18, theY + 20, 30, 30);
    this.faceRight = faceRight;
    this.velocityX = 0;
    this.velocityY = 0;
    this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/licky/idle_left.png"), 0, 0, 64, 64, 0.2, 5, true, false),
                        idleRight: new Animation(AM.getAsset("./img/sprites/enemies/licky/idle_right.png"), 0, 0, 64, 64, 0.2, 5, true, false),
                        dmgLeft: new Animation(AM.getAsset("./img/sprites/enemies/licky/dmg_left.png"), 0, 0, 64, 64, 0.2, 5, false, false),
                        dmgRight: new Animation(AM.getAsset("./img/sprites/enemies/licky/dmg_right.png"), 0, 0, 64, 64, 0.2, 5, false, false),
                        deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/licky/death_left.png"), 0, 0, 64, 64, 0.2, 10, false, false),
                        deathRight: new Animation(AM.getAsset("./img/sprites/enemies/licky/death_right.png"), 0, 0, 64, 64, 0.2, 10, false, false),
                        frozen: new Animation(AM.getAsset("./img/ice_cube.png"), 0, 0, 32, 32, 2, 1, false, false)};    
    this.game = game;
    this.isHit = false;
    this.isHitRight = false;
    this.hitPlayer = false;
}

Licky.prototype.draw = function (ctx) {
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();  
    }

    if (this.state === 'idle') {
        (this.faceRight) ? this.animations.idleRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1) : 
                            this.animations.idleLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
    }

    if (this.state === 'frozen') this.animations.frozen.drawFrame(this.game.clockTick, ctx, drawOffsetX + 17, drawOffsetY + 18, 1);
    
    if (this.state === 'damaged') {
        if(this.faceRight) {
            if (this.animations.dmgRight.isDone()) {
                this.state = 'idle';
                this.animations.dmgRight.elapsedTime = 0;
            } else {
                this.animations.dmgRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
            }
        } else {
            if (this.animations.dmgLeft.isDone()) {
                this.state = 'idle';
                this.animations.dmgLeft.elapsedTime = 0;
            } else {
                this.animations.dmgLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
            }
        }
    }

    if (this.state === 'dead') {
        if(this.faceRight) {
            if (this.animations.deathRight.isDone()) {
                if (0.33 > Math.random()) this.game.addEntity(new Heart(this.game, this.position.left, this.position.top));
                this.removeFromWorld = true;
            } else {
                this.animations.deathRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
            }
        } else {
            if (this.animations.deathLeft.isDone()) {
                if (0.33 > Math.random()) this.game.addEntity(new Heart(this.game, this.position.left, this.position.top));
                this.removeFromWorld = true;
            } else {
                this.animations.deathLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
            }
        }
    }
}

Licky.prototype.update = function () {
    var that = this;

    if (this.HP <= 0) this.state = 'dead';

    if (this.state === 'idle') {
        if (this.faceRight) {
            this.velocityX = 75;
        } else {
            this.velocityX = -75;
        }
    }

    if (this.state === 'frozen') {
        this.velocityX = 0;
        if (this.animations.frozen.isDone()) {
            this.animations.frozen.elapsedTime = 0;
            this.state = 'idle';
        }
    }

    if (this.state === 'dead' || this.state === 'damaged') {
        this.velocityX = 0;
    }

    this.position.moveBy(this.velocityX * this.game.clockTick, this.velocityY * this.game.clockTick);

    if (this.isHit) {
        if (this.isHitRight) {
            this.position.moveBy(5, 0);
            this.isHitRight = false;
        } else {
            this.position.moveBy(-5, 0);
        }
        this.isHit = false;
    }

    if (this.hitPlayer) {
        this.hitPlayer = false;
        if (this.faceRight) {
            this.faceRight = false;
        } else {
            this.faceRight = true;
        }
    }
    
    // Wall collision
    this.game.walls.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            if (that.position.left < entity.position.left) {
                that.faceRight = false;
            }
            if (that.position.right > entity.position.right) {
                that.faceRight = true;
            } 
        }
    });

    this.game.platforms.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            if (that.position.left < entity.position.left) {
                that.faceRight = false;
            }
            if (that.position.right > entity.position.right) {
                that.faceRight = true;
            }
        }
    })

    // Stay on background
    if (this.position.left < this.game.background.leftWall) {
        this.position.moveTo(this.game.background.leftWall, this.position.top);
        this.faceRight = true;
    } 
    if (this.position.right > this.game.background.rightWall) {
        this.position.moveTo(this.game.background.rightWall - this.position.width, this.position.top);
        this.faceRight = false;
    }
    
}

function Mummy(game, theX, theY, faceRight) {
    this.type = "Enemy";
    this.HP = 50;
    this.state = 'idle';
    this.position = new Position(theX, theY, theX + 30, theY + 10, 35, 60);
    this.faceRight = faceRight;
    this.velocityX = 0;
    this.velocityY = 0;
    this.aggroCooldown = 0;
    this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/mummy/idle_left.png"), 0, 0, 64, 64, 0.2, 4, true, false),
                        idleRight: new Animation(AM.getAsset("./img/sprites/enemies/mummy/idle_right.png"), 0, 0, 64, 64, 0.2, 4, true, false),
                        walkLeft: new Animation(AM.getAsset("./img/sprites/enemies/mummy/walk_left.png"), 0, 0, 64, 64, 0.2, 4, true, false),
                        walkRight: new Animation(AM.getAsset("./img/sprites/enemies/mummy/walk_right.png"), 0, 0, 64, 64, 0.2, 4, true, false),
                        dmgLeft: new Animation(AM.getAsset("./img/sprites/enemies/mummy/dmg_left.png"), 0, 0, 64, 64, 0.2, 5, false, false),
                        dmgRight: new Animation(AM.getAsset("./img/sprites/enemies/mummy/dmg_right.png"), 0, 0, 64, 64, 0.2, 5, false, false),
                        deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/mummy/death_left.png"), 0, 0, 64, 64, 0.2, 10, false, false),
                        deathRight: new Animation(AM.getAsset("./img/sprites/enemies/mummy/death_right.png"), 0, 0, 64, 64, 0.2, 10, false, false),
                        frozen: new Animation(AM.getAsset("./img/bunny_ice.png"), 0, 0, 32, 32, 2, 1, false, false)};
    this.game = game;
    this.isHit = false;
    this.isHitRight = false;
    this.isChasing = false;
}

Mummy.prototype.draw = function (ctx) {
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();  
    }

    if (this.state === 'idle') {
        (this.faceRight) ? this.animations.idleRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY - 20, 1.5) : 
                            this.animations.idleLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY - 20, 1.5);
    }
    
    if (this.state === 'walk') {
        (this.faceRight) ? this.animations.walkRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY - 20, 1.5) : 
                            this.animations.walkLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY - 20, 1.5);
    }

    if (this.state === 'frozen') this.animations.frozen.drawFrame(this.game.clockTick, ctx, drawOffsetX + 14, drawOffsetY + 5, 2);
    
    if (this.state === 'damaged') {
        if(this.faceRight) {
            if (this.animations.dmgRight.isDone()) {
                this.state = 'idle';
                this.animations.dmgRight.elapsedTime = 0;
            } else {
                this.animations.dmgRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY - 20, 1.5);
            }
        } else {
            if (this.animations.dmgLeft.isDone()) {
                this.state = 'idle';
                this.animations.dmgLeft.elapsedTime = 0;
            } else {
                this.animations.dmgLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY - 20, 1.5);
            }
        }
    }

    if (this.state === 'dead') {
        if(this.faceRight) {
            if (this.animations.deathRight.isDone()) {
                if (0.33 > Math.random()) this.game.addEntity(new Heart(this.game, this.position.left, this.position.top));
                this.removeFromWorld = true;
            } else {
                this.animations.deathRight.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY - 20, 1.5);
            }
        } else {
            if (this.animations.deathLeft.isDone()) {
                if (0.33 > Math.random()) this.game.addEntity(new Heart(this.game, this.position.left, this.position.top));
                this.removeFromWorld = true;
            } else {
                this.animations.deathLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY - 20, 1.5);
            }
        }
    }
}

Mummy.prototype.update = function () {
    var currentPlatform = verticalCheck(this.position, this.game);
    var that = this;

    if (this.HP <= 0) this.state = 'dead';

    // Check for player within a certain distance
    // if within set distance enemy aggros
    var playerDistance = distance(this.position, this.game.player.position);
    if ((playerDistance > -200 && playerDistance < 0) || (playerDistance < 200 && playerDistance > 0) && this.aggroCooldown === 0 &&
            this.state !== 'damaged' && !this.game.player.invulnerable) {
        this.isChasing = true;
    } else {
        this.isChasing = false;
    }

    // Falling checks
    if (this.position.bottom === currentPlatform.ground) {
        this.velocityY = 0;
        this.falling = false;
    } else if (this.position.bottom + (this.velocityY + this.game.gravity) * this.game.clockTick >= currentPlatform.ground &&
                this.velocityY > 0) {
        this.position.moveTo(this.position.left, currentPlatform.ground - this.position.height);
        this.velocityY = 0;
        this.falling = false;
    } else {
        this.falling = true;
        (this.velocityY + this.game.gravity >= this.game.terminalVelocity) ? this.velocityY = this.game.terminalVelocity : this.velocityY += this.game.gravity;
    }

    if (this.state === 'walk') {
        if (this.faceRight) {
            if (this.position.right < currentPlatform.theRight - 50 * this.game.clockTick) {
                this.velocityX = 25;
            } else this.faceRight = false;
        } else {
            if (this.position.left > currentPlatform.theLeft + 50 * this.game.clockTick) {
                this.velocityX = -25;
            } else this.faceRight = true;   
        }
    }

    if (this.state === 'frozen') {
        this.velocityX = 0;
        if (this.animations.frozen.isDone()) {
            this.animations.frozen.elapsedTime = 0;
            this.state = 'walk';
        }
    }

    if (this.state === 'dead' || this.state === 'damaged') {
        this.velocityX = 0;
    }

    this.position.moveBy(this.velocityX * this.game.clockTick, this.velocityY * this.game.clockTick);

    if (this.isHit) {
        if (this.isHitRight) {
            this.position.moveBy(5, 0);
            this.isHitRight = false;
        } else {
            this.position.moveBy(-5, 0);
        }
        this.isHit = false;
    }

    if (this.isChasing && this.state !== 'dead' && this.state !== 'damaged' && this.state !== 'frozen') {
        this.state = 'walk';
        (this.position.left < this.game.player.position.left) ? this.faceRight = true : this.faceRight = false;
    }
   
    // Wall collision
    this.game.walls.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position) && that.position.bottom > entity.position.top) {
            if (that.position.left < entity.position.left) that.position.moveTo(entity.position.left - that.position.width, that.position.top);
            if (that.position.right > entity.position.right) that.position.moveTo(entity.position.right, that.position.top);
        }
    });

    // Stay on background
    if (this.position.left < this.game.background.leftWall) this.position.moveTo(this.game.background.leftWall, this.position.top);
    if (this.position.right > this.game.background.rightWall) this.position.moveTo(this.game.background.rightWall - this.position.width, this.position.top);

    if (this.aggroCooldown > 0) this.aggroCooldown -= this.game.clockTick;
    else if (this.aggroCooldown < 0) this.aggroCooldown = 0;
}

function Player(game) {
    this.game = game;
    this.HP = [3,6];
    this.maxHP = [3,6];
    this.activeHero = 0;
    this.walking = false;
    this.damaged = false;
    this.jumping = false;
    this.falling = false;
    this.blinkEnabled = true;
    this.blinking = false;
    this.kicking = false;
    this.jumpkick = null;
    this.punching = false;
    this.punch = null;
    this.startJump = false;
    this.jumpsLeft = [1, 2];
    this.jumpsMax = [1, 2];
    this.invulnerable = false;
    this.invulTimer = 0;
    this.gameOver = false;
    this.position = new Position(0, 320, 52, 367, 24, 40);
    this.faceRight = true;
    this.velocityX = 0;
    this.velocityY = 0;
    this.keys = [false, false];
    this.animations = {idleLeft: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/idle_left.png"), 0, 0, 64, 64, .2, 1, true, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/idle_left.png"), 0, 0, 32, 32, .2, 1, true, false)],
                        idleRight: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/idle_right.png"), 0, 0, 64, 64, .2, 1, true, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/idle_right.png"), 0, 0, 32, 32, .2, 1, true, false)],
                        walkLeft: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/walk_left.png"), 0, 0, 64, 64, .2, 2, true, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/walk_left.png"), 0, 0, 32, 32, .125, 2, true, false)],
                        walkRight: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/walk_right.png"), 0, 0, 64, 64, .2, 2, true, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/walk_right.png"), 0, 0, 32, 32, .125, 2, true, false)],
                        dmgLeft: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/dmg_left.png"), 0, 0, 64, 64, .1, 5, false, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/dmg_l.png"), 0, 0, 36, 36, .1, 5, false, false)],
                        dmgRight: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/dmg_right.png"), 0, 0, 64, 64, .1, 5, false, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/dmg_r.png"), 0, 0, 36, 36, .1, 5, false, false)],
                        deathLeft: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/death_left.png"), 0, 0, 64, 64, .1, 6, false, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/death_l.png"), 0, 0, 36, 36, .06, 10, false, false)], 
                        deathRight: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/death_right.png"), 0, 0, 64, 64, .1, 6, false, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/death_r.png"), 0, 0, 36, 36, .06, 10, false, false)],
                        blinkLeft: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/blink_left.png"), 0, 0, 32, 32, .2, 14, false, false)],
                        blinkRight: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/blink_right.png"), 0, 0, 32, 32, .2, 14, false, false)],
                        gameOver: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/death_right.png"), 64, 128, 64, 64, 1, 1, true, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/death_r.png"), 72, 72, 36, 36, 1, 1, true, false)],
                        punchLeft: new Animation(AM.getAsset("./img/sprites/heroes/monk/punch_l.png"), 0, 0, 36, 36.2, 0.05, 9, false, false),
                        punchRight: new Animation(AM.getAsset("./img/sprites/heroes/monk/punch_r.png"), 0, 0, 36, 36.2, 0.05, 9, false, false),
                        jumpLeft: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/jump_left.png"), 0, 0, 64, 64, 0.05, 5, false, false), 
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/jump_left.png"), 0, 0, 36, 36, .05, 7, false, false)],
                        jumpRight: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/jump_right.png"), 0, 0, 64, 64, 0.05, 5, false, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/jump_right.png"), 0, 0, 36, 36, .05, 7, false, false)],
                        fallLeft: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/jump_left.png"), 64, 64, 64, 64, 0.1, 1, true, false), 
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/jump_left.png"), 0, 72, 36, 36, .1, 1, true, false)],
                        fallRight: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/jump_right.png"), 64, 64, 64, 64, 0.1, 1, true, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/jump_right.png"), 0, 72, 36, 36, .1, 1, true, false)],
                        jumpkickLeft: new Animation(AM.getAsset("./img/sprites/heroes/monk/jump-kick_l.png"), 0, 72, 36, 36, 0.05, 1, true, false),
                        jumpkickRight: new Animation(AM.getAsset("./img/sprites/heroes/monk/jump-kick_r.png"), 0, 72, 36, 36, 0.05, 1, true, false)};
}

Player.prototype.swap = function() {
    if(this.activeHero === 1) {
        this.activeHero = 0;
        if (this.kicking) {
            this.kicking = false;
            this.position.width = 22;
            if (!this.faceRight) this.position.left += 15;
        }
        if (this.faceRight) {
            this.position = new Position(this.position.left + this.position.width * 0.5 - 64, this.position.bottom - 87,
                this.position.left + this.position.width * 0.5 - 11, this.position.bottom - 40, 24, 40);
        } else if (!this.faceRight) {
            this.position = new Position(this.position.left + this.position.width * 0.5 - 64, this.position.bottom - 87,
                this.position.left + this.position.width * 0.5 - 26, this.position.bottom - 40, 24, 40);
        }
        
    } else {
        this.activeHero = 1;
        this.position = new Position(this.position.left + this.position.width * 0.5 - 31, this.position.bottom - 64,
            this.position.left + this.position.width * 0.5 - 11, this.position.bottom - 62, 22, 62);
    }
}

Player.prototype.update = function() {
    var that = this;

    // I-frames
    if(this.invulnerable) {
       this.invulTimer -= this.game.clockTick;
       if (this.invulTimer <= 0) {
           this.invulTimer = 0;
           this.invulnerable = false;
       }
    }

    // ***********************************
    // Updates to state based on key input
    // ***********************************

    // Facing right when left key pressed
    if (this.game.leftKey && !this.game.rightKey && this.faceRight) {
        if(this.punching) {
            if (!this.punch.right) this.faceRight = false;
        } else {
            this.faceRight = false;
        }
    }
    // Facing left when right key pressed
    if (this.game.rightKey && !this.game.leftKey && !this.faceRight) {
        if(this.punching) {
            if (this.punch.right) this.faceRight = true;
        } else { 
            this.faceRight = true;
        } 
    }
    
    // If left or right key pressed, set walking; else set idle
    ((this.game.leftKey && !this.faceRight ) || (this.game.rightKey && this.faceRight)) ? this.walking = true : this.walking = false;

    // Swap key 'Z' pressed
    if (this.game.zKey && !this.damaged && !this.punching) {
        if ((this.activeHero === 0 && this.HP[1] > 0) || (this.activeHero === 1 && this.HP[0] > 0)) this.swap();
    }

    // Attack key 'X' pressed
    if (this.game.xKey && this.activeHero === 0) { // fireball
        var isFireball = false;
        this.game.projectiles.forEach(function(entity) {
            if (entity.player && entity.fireball) isFireball = true;
        })
        if (!isFireball) {
            this.game.addEntity(new Fireball(this.game, this.faceRight, new Position(this.position.left + this.position.width * 0.5 - 16, this.position.top + this.position.height * 0.5 - 16,
                                this.position.left + this.position.width * 0.5 - 6, this.position.top + this.position.height * 0.5 - 6, 12, 12), true, true));
        }
    } else if (this.game.xKey && this.activeHero === 1 && !this.falling && !this.jumping && !this.punching) { // punch attack
        this.punching = true;
        if (this.faceRight) {
            this.punch = new Punch(this.game, new Position(this.position.right - 5, this.position.top, this.position.right - 5, this.position.top, 30, this.position.height), true, this.faceRight);
            this.game.addEntity(this.punch);
        } else if (!this.faceRight) {
            this.punch = new Punch(this.game, new Position(this.position.left - 25, this.position.top, this.position.left - 25, this.position.top, 30, this.position.height), true, this.faceRight);
            this.game.addEntity(this.punch);
        }
    } else if (this.game.xKey && this.activeHero === 1 && (this.falling || !this.jumping)) {
        this.kicking = true
        if (this.faceRight) {
            this.jumpkick = new JumpKick(this.game, new Position(this.position.right - 5, this.position.top, this.position.right, this.position.top - 7, 25, this.position.height), true, this.faceRight);
            this.game.addEntity(this.jumpkick);
        } else if (!this.faceRight) {
            this.jumpkick = new JumpKick(this.game, new Position(this.position.left - 25, this.position.top, this.position.left - 20, this.position.top - 7, 25, this.position.height), true, this.faceRight);
            this.game.addEntity(this.jumpkick);
        }
    }

    // Action key 'C' pressed
    if (this.game.cKey && this.activeHero === 0) {
        var isFrostbolt = false;
        this.game.projectiles.forEach(function(entity) {
            if (entity.player && !entity.fireball) isFrostbolt = true;
        })
        if (!isFrostbolt) {
            this.game.addEntity(new Fireball(this.game, this.faceRight,
                                new Position(this.position.left + this.position.width * 0.5 - 32, this.position.top + this.position.height * 0.5 - 32,
                                this.position.left + this.position.width * 0.5 - 6, this.position.top + this.position.height * 0.5 - 6, 12, 12), true, false));
        }
    }

    // Interact key 'D' pressed
    if (this.game.dKey) {
        var onDoor = false;
        this.game.doors.forEach(function(entity) {
            if (entity.destination.level === 3 && that.keys[0] && that.keys[1]) entity.locked = false;
            if (collisionDetector(that.position, entity.position) && !entity.locked) {
                that.game.sceneManager.currentStage = entity.destination.level;
                that.game.sceneManager.startNum = entity.destination.door;
                that.game.sceneManager.newStage = true;
                onDoor = true;
            }
        })
        if (!onDoor && this.activeHero === 0 && this.blinkEnabled) { // Blink
            var blinkDistance = 100;
            if (!this.faceRight) blinkDistance *= -1;
            var blinkPosition = new Position(this.position.drawX, this.position.drawY, this.position.left, this.position.top, 
                                            this.position.width, this.position.height);
            blinkPosition.moveTo(blinkPosition.left + blinkDistance, blinkPosition.top);
            var collision = false;
            do {
                collision = false;

                if (blinkPosition.right > this.game.background.right) {
                    blinkPosition.moveTo(this.game.background.right - blinkPosition.width - 2, blinkPosition.top);
                }
                if (blinkPosition.left < this.game.background.left) {
                    blinkPosition.moveTo(this.game.background.left, blinkPosition.top);
                }

                this.game.walls.forEach(function(entity) {
                    if (!collision && collisionDetector(blinkPosition, entity.position)) {
                        collision = true;
                        if (that.faceRight) blinkPosition.moveTo(entity.position.left - blinkPosition.width, blinkPosition.top);
                        else blinkPosition.moveTo(entity.position.right, blinkPosition.top);
                    }
                });

                this.game.platforms.forEach(function(entity) {
                    if (!collision && collisionDetector(blinkPosition, entity.position)) {
                        collision = true;
                        if (that.faceRight) blinkPosition.moveTo(entity.position.left - blinkPosition.width, blinkPosition.top);
                        else blinkPosition.moveTo(entity.position.right, blinkPosition.top);
                    }
                });
            
                this.game.enemies.forEach(function(entity) {
                    if (!collision && collisionDetector(blinkPosition, entity.position)) {
                        collision = true;
                        if (that.faceRight) blinkPosition.moveTo(entity.position.left - blinkPosition.width - 5, blinkPosition.top);
                        else blinkPosition.moveTo(entity.position.right + 5, blinkPosition.top);
                    } 
                })
            } while (collision);
            this.position = blinkPosition;
        }
    }

    // Spacebar pressed
    if (this.game.space && this.jumpsLeft[this.activeHero] > 0 && !this.game.downKey) {
        //this.startJump = true;
        this.jumping = true;
        if (this.punching) this.punch.endPunch();
    }

    // ****************
    // Position updates
    // ****************

    // Walking
    if (this.walking) {
        this.faceRight ? this.velocityX = 250 : this.velocityX = -250;
    } else {
        this.velocityX = 0;
    }

    // Activate jump
    if (this.jumping && this.jumpsLeft[this.activeHero] > 0) {
        this.velocityY = -1200;
        this.position.moveBy(0, -1);
        this.jumping = false;
        this.jumpsLeft[this.activeHero]--;
    }

    // Falling
    var currentPlatform = verticalCheck(this.position, this.game);

    // Falling checks
    if (this.position.bottom === currentPlatform.ground) {
        this.velocityY = 0;
        this.falling = false;
        this.kicking = false;
        if (this.position.width > 22) {
            this.position.width = 22;
            if (!this.faceRight) this.position.left += 15;
        }
        this.jumpsLeft[this.activeHero] = this.jumpsMax[this.activeHero];
    } else if (this.position.bottom + (this.velocityY + this.game.gravity) * this.game.clockTick >= currentPlatform.ground &&
                this.velocityY > 0) {
        this.position.moveTo(this.position.left, currentPlatform.ground - this.position.height);
        this.velocityY = 0;
        this.falling = false;
        this.kicking = false;
        if (this.position.width > 22) {
            this.position.width = 22;
            if (!this.faceRight) this.position.left += 15;
        }
        this.jumpsLeft[this.activeHero] = this.jumpsMax[this.activeHero];
    } else {
        this.falling = true;
        ((this.velocityY + this.game.gravity) * this.game.clockTick >= this.game.terminalVelocity) ? 
            this.velocityY = this.game.terminalVelocity : this.velocityY += this.game.gravity;
    }

    // Final position update
    this.position.moveBy(this.velocityX * this.game.clockTick, this.velocityY * this.game.clockTick);

    // Collision checks
    // ****************
    // Left background bound
    if (this.position.left < this.game.background.leftWall) {
        this.position.moveTo(this.game.background.leftWall, this.position.top);
    }

    // Right background bound
    if (this.position.right > this.game.background.rightWall) {
        this.position.moveTo(this.game.background.rightWall - this.position.width, this.position.top);
    }
    
    // Top background/wall bound
    if (this.position.top < currentPlatform.theCeiling) {
        this.position.moveTo(this.position.left, currentPlatform.theCeiling);
        this.velocityY = 0;
    }
    
    // Wall collision
    this.game.walls.forEach(function(entity) {

        if(collisionDetector(that.position, entity.position)) {
            if (that.position.left < entity.position.left) that.position.moveTo(entity.position.left - that.position.width, that.position.top);
            else that.position.moveTo(entity.position.right, that.position.top);
        }
    });

    // Enemy collision
    this.game.enemies.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position) && entity.state !== 'dead') {
            entity.isHit = true;
            if (that.position.left < entity.position.left) {
                entity.isHitRight = true;
                that.position.moveBy(-5, 0);
            } else {
                that.position.moveBy(5, 0);
            }
            if (!that.invulnerable && entity.state !== "frozen" && !this.kicking && !this.punching) {
                that.HP[that.activeHero] -= 1;
                that.damaged = true;
                that.invulnerable = true;
                that.invulTimer = 2;
                entity.hitPlayer = true;
            }
        } 
    })

    // Drop through platforms
    if (this.game.downKey && this.game.space) {
        var onPlatform = false;
        for (var i = 0; i < this.game.platforms.length; i++) {
            if (this.position.bottom == this.game.platforms[i].position.top && 
                (!(this.position.right < this.game.platforms[i].position.left) && !(this.position.left > this.game.platforms[i].position.right))) {
                onPlatform = true;
            }
        }
        if (onPlatform) this.position.moveBy(0, 1);
    }

    Entity.prototype.update.call(this);
}

Player.prototype.draw = function(ctx) {
    /*
    if (this.jumping) {
        this.jump_animation.drawFrame(this.game.clockTick, ctx, this.x + 17, this.y - 34, 2);
    }-
    */
    var cameraOffsetX = this.position.drawX - this.game.camera.x;
    var cameraOffsetY = this.position.drawY - this.game.camera.y;

    if (this.gameOver) {
        this.animations.gameOver[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
    }
    else if (this.HP[this.activeHero] <= 0) {
        if(this.faceRight) {
            if(!this.animations.deathRight[this.activeHero].isDone()) this.animations.deathRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
            else if (this.activeHero === 0 && this.HP[1] <= 0 || this.activeHero === 1 && this.HP[0] <= 0) this.game.sceneManager.gameOver();
            else {
                this.damaged = false;
                this.swap();
            } 
        } else {
            if(!this.animations.deathLeft[this.activeHero].isDone()) this.animations.deathLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
            else if (this.activeHero === 0 && this.HP[1] <= 0 || this.activeHero === 1 && this.HP[0] <= 0) this.game.sceneManager.gameOver();
            else {
                this.damaged = false;
                this.swap();
            }
        }
    } else if (this.damaged) {
        this.punching = false;
        if (this.faceRight) {
            if(!this.animations.dmgRight[this.activeHero].isDone()) this.animations.dmgRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
            else {
                this.damaged = false;
                this.animations.dmgRight[this.activeHero].elapsedTime = 0;
            }
        } else {
            if(!this.animations.dmgLeft[this.activeHero].isDone()) this.animations.dmgLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
            else {
                this.damaged = false;
                this.animations.dmgLeft[this.activeHero].elapsedTime = 0;
            }
        }
    } else if (this.punching) {
        if (this.faceRight) this.animations.punchRight.drawFrame(this.game.clockTick, ctx, cameraOffsetX - 5, cameraOffsetY - 3, 2);
        else this.animations.punchLeft.drawFrame(this.game.clockTick, ctx, cameraOffsetX - 5, cameraOffsetY - 3, 2);
    } else if (this.startJump) {
        if (this.animations.jumpRight[this.activeHero].isDone() || this.animations.jumpLeft[this.activeHero].isDone()) {
            this.animations.jumpRight.elapsedTime = 0;
            this.animations.jumpLeft.elapsedTime = 0;
            this.startJump = false;
        } else if (this.faceRight) {
            this.animations.jumpRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        } else this.animations.jumpLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, came-raOffsetX, cameraOffsetY, 2);
    } else if (this.kicking) {
        if (this.faceRight) this.animations.jumpkickRight.drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        else this.animations.jumpkickLeft.drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
    } else if (this.jumping || this.falling) {
        if (this.faceRight) this.animations.fallRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        else this.animations.fallLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
    } else if (this.walking) {
        if (this.faceRight) this.animations.walkRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        else this.animations.walkLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
    } else {
        if (this.faceRight) this.animations.idleRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        else this.animations.idleLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
    }

    if (this.blinking) {
        if (this.faceRight) this.animations.blinkRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        else this.animations.blinkLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
    }
    Entity.prototype.draw.call(this);

    // Bounding Box draw
    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(this.position.left - this.game.camera.x, this.position.top - this.game.camera.y,
                    this.position.width, this.position.height);
        ctx.restore();
    }
}

// Projectile Entity
function Fireball(game, goingRight, position, player, fireball) {
    this.type = "Projectile";
    this.game = game;
    this.position = position;
    this.player = player;
    this.fireball = fireball;
    this.velocityX = 750;
    this.animation = null;
    if (!goingRight) {
        this.velocityX *= -1;
        if (fireball) {
            this.animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/fireball_left.png"), 0, 0, 32, 32, 0.125, 4, true, false);
        } else {
            this.animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/frostbolt_left.png"), 0, 0, 32, 32, 0.125, 4, true, false);
        }
    } else {
        if (fireball) {
            this.animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/fireball_right.png"), 0, 0, 32, 32, 0.125, 4, true, false);
        } else {
            this.animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/frostbolt_right.png"), 0, 0, 32, 32, 0.125, 4, true, false);
        }
    }
}

Fireball.prototype.draw = function (ctx) {
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();
    }

    if (this.fireball){
        this.animation.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
    } else {
        this.animation.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
    }
    
}

Fireball.prototype.update = function () {
    var collision = false;
    var that = this;
    this.game.enemies.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position) && entity.state !== 'dead') {
            if (that.fireball) {
                collision = true;
                entity.isHit = true;
                entity.HP -= 4;
                if (!entity.boss) entity.state = 'damaged';
                if (that.velocityX > 0) entity.isHitRight = true;
            } else {
                collision = true;
                if (!entity.boss) entity.state = 'frozen';
            }           
        }
    });

    this.game.platforms.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            collision = true;
        } 
    });

    this.game.walls.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            collision = true;
        } 
    });

    if (this.position.left < this.game.background.leftWall) collision = true;
    if (this.position.right > this.game.background.rightWall) collision = true;
    
    if (collision || this.position.right > this.game.background.right
                || this.position.left < this.game.background.left 
                || this.position.right > this.game.camera.x + this.game.ctx.width * 1.5 
                || this.position.left < this.game.camera.x - this.game.ctx.width * 0.5) {
        this.removeFromWorld = true;
    } else {
        this.position.moveBy(this.velocityX * this.game.clockTick, 0);
    }
}

function Punch(game, position, player, right) {
    this.type = "Projectile";
    this.game = game;
    this.position = position;
    this.player = player;
    this.right = right;
}

Punch.prototype.draw = function (ctx) {
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();
    }
}

Punch.prototype.update = function () {
    var that = this;
    if (this.game.player.damaged) this.endPunch();
    else {
        this.game.enemies.forEach(function(entity) {
            if (collisionDetector(that.position, entity.position) && entity.state !== 'dead') {
                entity.isHit = true;
                entity.HP -= 3;
                if (!entity.boss || (entity.boss && entity.state === 'idle')) entity.state = 'damaged';
                if(entity.shotTimer) entity.shotTimer += 1;
                if(entity.aggroCooldown) entity.aggroCooldown += 1.5;
                if (that.game.player.faceRight && !entity.boss) {
                    entity.position.moveBy(10, 0);
                    if(entity.aggroCooldown) entity.faceRight = true;
                }
                else {
                    entity.position.moveBy(-10, 0);
                    if(entity.aggroCooldown) entity.faceRight = false;
                }
            }
        });-

        this.game.walls.forEach(function(entity) {
            if (collisionDetector(that.position, entity.position)) {
                if (that.position.left < entity.position.left && that.game.player.faceRight) that.position.moveTo(entity.position.left - that.position.width, that.position.top);
                else if (that.position.right > entity.position.right && !that.game.player.faceRight) that.position.moveTo(entity.position.right, that.position.top);
            }
        });
    
        if (this.game.player.animations.punchRight.isDone()) {
            this.endPunch();
        } else if (this.game.player.animations.punchLeft.isDone()) {
            this.endPunch();
        } else {
            this.position.moveBy(this.game.player.velocityX * this.game.clockTick, this.game.player.velocityY * this.game.clockTick);
        } 
    }
}

Punch.prototype.endPunch = function () {
    this.removeFromWorld = true;
    this.game.player.punching = false;
    this.game.player.punch = null;
    this.position = null;
    this.game.player.animations.punchRight.elapsedTime = 0;
    this.game.player.animations.punchLeft.elapsedTime = 0;
}

function JumpKick(game, position, player, right) {
    this.type = "Projectile";
    this.game = game;
    this.position = position;
    this.player = player;
    this.right = right;
}

JumpKick.prototype.draw = function (ctx) {
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();
    }
}

JumpKick.prototype.update = function () {
    var that = this;
    if (this.game.player.damaged) this.endKick();
    else {
        this.game.enemies.forEach(function(entity) {
            if (collisionDetector(that.position, entity.position) && entity.state !== 'dead') {
                entity.isHit = true;
                entity.HP -= 5;
                if (!entity.boss || (entity.boss && entity.state === 'idle')) entity.state = 'damaged';
                if(entity.shotTimer) entity.shotTimer += 1;
                if(entity.aggroCooldown) entity.aggroCooldown += 1.5;
                if (that.game.player.faceRight) {
                    entity.position.moveBy(10, 0);
                    if(entity.aggroCooldown) entity.faceRight = true;
                }
                else {
                    entity.position.moveBy(-10, 0);
                    if(entity.aggroCooldown) entity.faceRight = false;
                }
            }
        });

        this.game.walls.forEach(function(entity) {
            if (collisionDetector(that.position, entity.position)) {
                if (that.position.left < entity.position.left && that.game.player.faceRight) that.position.moveTo(entity.position.left - that.position.width, that.position.top);
                else if (that.position.right > entity.position.right && !that.game.player.faceRight) that.position.moveTo(entity.position.right, that.position.top);
            }
        });
    
        if (!this.game.player.kicking) {
            this.endKick();
        } else {
            this.position.moveBy(this.game.player.velocityX * this.game.clockTick, this.game.player.velocityY * this.game.clockTick);
        } 
    }
}

JumpKick.prototype.endKick = function () {
    this.removeFromWorld = true;
    this.game.player.kicking = false;
    this.game.player.jumpkick = null;
    this.position = null;
    this.game.player.animations.jumpkickRight.elapsedTime = 0;
    this.game.player.animations.jumpkickLeft.elapsedTime = 0;
}

function Key(game, theX, theY, number) {
    this.game = game;
    this.position = new Position(theX - 9, theY - 2, theX, theY, 11, 26);
    this.number = number;
    this.animation = [new Animation(AM.getAsset("./img/sprites/items/key_idle_spin.png"), 0, 0, 32, 32, .2, 16, true, false),
                        new Animation(AM.getAsset("./img/sprites/items/bosskey_idle_spin.png"), 0, 0, 32, 32, .2, 16, true, false)];
}

Key.prototype.update = function() {
    if (collisionDetector(this.position, this.game.player.position)) {
        this.game.player.keys[this.number] = true;
        this.removeFromWorld = true;
    }
}

Key.prototype.draw = function(ctx) {
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();
    }

    this.animation[this.number].drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
}

function PowerUp(game, theX, theY) {
    this.game = game;
    this.position = new Position(theX - 4, theY - 4, theX, theY, 32, 32);
    this.animation = [new Animation(AM.getAsset("./img/sprites/power-ups/blink.png"), 0, 0, 40, 40, .2, 17, true, false),
                        new Animation(AM.getAsset("./img/sprites/power-ups/double-jump.png"), 0, 0, 40, 40, .2, 17, true, false)];
}

PowerUp.prototype.update = function() {
    if (collisionDetector(this.position, this.game.player.position)) {
        if (this.game.player.activeHero === 0) {
            if (!this.game.player.blinkEnabled) this.game.player.blinkEnabled = true;
            else this.game.player.jumpsMax[1] = 2;
        } else {
            if (this.game.player.jumpsMax[1] !== 2) this.game.player.jumpsMax[1] = 2;
            else this.game.player.blinkEnabled = true;
        }
        this.removeFromWorld = true;
    }
}

PowerUp.prototype.draw = function(ctx) {
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();
    }

    this.animation[this.game.player.activeHero].drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
}

function Heart(game, theX, theY) {
    this.game = game;
    this.position = new Position(theX - 6, theY - 7, theX, theY, 19, 18);
    this.animation = new Animation(AM.getAsset("./img/sprites/items/heart_idle_spin.png"), 0, 0, 32, 32, 0.2, 11, true, false);
}

Heart.prototype.update = function() {
    if (collisionDetector(this.position, this.game.player.position)) {
        if (this.game.player.HP[0] === 0) this.game.player.HP[0]++;
        else if (this.game.player.HP[1] === 0) this.game.player.HP[1]++;
        if (this.game.player.HP[this.game.player.activeHero] < this.game.player.maxHP[this.game.player.activeHero]) {
            this.game.player.HP[this.game.player.activeHero]++;
            this.removeFromWorld = true;
        } else if (this.game.player.HP[0] < this.game.player.maxHP[0]) {
            this.game.player.HP[0]++;
            this.removeFromWorld = true;
        } else if (this.game.player.HP[1] < this.game.player.maxHP[1]) {
            this.game.player.HP[1]++;
            this.removeFromWorld = true;
        }
    }
}

Heart.prototype.draw = function(ctx) {
    var boxOffsetX = this.position.left - this.game.camera.x;
    var boxOffsetY = this.position.top - this.game.camera.y;
    var drawOffsetX = this.position.drawX - this.game.camera.x;
    var drawOffsetY = this.position.drawY - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';
        ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
        ctx.restore();
    }
    this.animation.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
}

// an entity to display controls in text form
function ControlsText(game, theX, theY) {
    this.x = theX;
    this.y = theY;
    this.game = game;
    this.ctx = game.ctx;
}

ControlsText.prototype.update = function () {
}

ControlsText.prototype.draw = function (ctx) {
    this.ctx.save();
    this.ctx.font = "30px Georgia";
    this.ctx.fillText("CONTROLS:", 700, 30);
    this.ctx.font = "20px Georgio";
    this.ctx.fillText("Left Arrow Key: move left", 650, 60);
    this.ctx.fillText("Right Arrow Key: move right", 650, 90);
    this.ctx.fillText("Spacebar: Jump", 650, 120);
    this.ctx.fillText("X key: Fireball (One at a time)", 650, 150);
    this.ctx.fillText("C key: Frostbolt (One at a time)", 650, 180);
    this.ctx.fillText("Example Animations:", 5, 20);
    this.ctx.restore();
}

class Stage {
    constructor(background, walls, platforms, enemies, doors, items, startPositions) {
        this.background = background;
        this.walls = walls;
        this.platforms = platforms;
        this.enemies = enemies;
        this.doors = doors;
        this.items = items;
        this.startPositions = startPositions;
    }

    getPosition(positionNum) {
        return this.startPositions[positionNum];
    }
}


function SceneManager(game) {
    this.game = game;
    this.newStage = false;
    this.currentStage = 3;
    this.startNum = 0;
    this.key1 = new Key(this.game, 551, 987, 0);
    this.key2 = new Key(this.game, 1880, 90, 1);
    this.power1 = new PowerUp(this.game, 55, 95);
    this.power2 = new PowerUp(this.game, 90, 90);
    this.power3 = new PowerUp(this.game, 32, 992);
    this.stages = [this.createStage(0), this.createStage(1), this.createStage(2), this.createStage(3), this.createStage(4), this.createStage(5), 
                    this.createStage(6), this.createStage(7), this.createStage(8), this.createStage(9), this.createStage(10)];
    
    this.game.player.position.moveTo(this.stages[this.currentStage].getPosition(this.startNum).left, this.stages[this.currentStage].getPosition(this.startNum).top);
}

SceneManager.prototype.gameOver = function() {
    this.game.background = new Background(this.game, AM.getAsset("./img/sprites/backgrounds/game_over.png"), 0, 1000, 0, 452, 1000, 452);
    this.game.entities[0] = this.game.background;
    this.game.entities.length = 2;
    this.game.player.position.moveTo(500 - this.game.player.position.width * 0.5, 452 - this.game.player.height);
    this.game.camera.update();
    this.game.platforms.length = 0;
    this.game.walls.length = 0;
    this.game.items.length = 0;
    this.game.doors.length = 0;
    this.game.enemies.length = 0;
    this.game.projectiles.length = 0;
    this.game.player.gameOver = true;
}

SceneManager.prototype.youWin = function() {
    this.game.background = new Background(this.game, AM.getAsset("./img/sprites/backgrounds/Win.png"), 0, 1000, 0, 600, 1000, 600);
    this.game.entities[0] = this.game.background;
    this.game.entities.length = 2;
    this.game.platforms.length = 0;
    this.game.walls.length = 0;
    this.game.items.length = 0;
    this.game.doors.length = 0;
    this.game.enemies.length = 0;
    this.game.projectiles.length = 0;
}

SceneManager.prototype.update = function() {
    if (this.newStage && this.currentStage === 11) {
        this.youWin();
    } else if (this.newStage) {
        
        var updateStage = this.createStage(this.currentStage);
        this.game.background = this.stages[this.currentStage].background;

        this.game.entities = [this.game.background, this.game.player];
        this.game.platforms.length = 0;
        this.game.walls.length = 0;
        this.game.items.length = 0;
        this.game.doors.length = 0;
        this.game.enemies.length = 0;
        this.game.projectiles.length = 0;

        // Load new entities
        // Walls
        for (var i = 0; i < updateStage.walls.length; i++) {
            this.game.addEntity(updateStage.walls[i]);
        }

        // Platforms
        for (var i = 0; i < updateStage.platforms.length; i++) {
            this.game.addEntity(updateStage.platforms[i]);
        }

        // Enemies
        for (var i = 0; i < updateStage.enemies.length; i++) {
            this.game.addEntity(updateStage.enemies[i]);
        }

        // Doors
        for (var i = 0; i < updateStage.doors.length; i++) {
            this.game.doors.push(updateStage.doors[i]);
        }

        // Items
        for (var i = 0; i < updateStage.items.length; i++) {
            this.game.addEntity(updateStage.items[i]);
        }

        if (this.currentStage === 3) {
            if (this.game.boss1Alive) {
                this.game.addEntity(new SlimeBoss(this.game)); // Add the boss
            } else {
                this.game.doors[0].locked = false;
                this.game.doors[1].locked = false;
            }
        }

        this.game.player.position.moveTo(updateStage.getPosition(this.startNum).left, updateStage.getPosition(this.startNum).top);
        this.game.camera.update();
        this.newStage = false;
    }
}

SceneManager.prototype.draw = function(ctx) {
    // Loading Screen?
}

SceneManager.prototype.createStage = function(theStageNum) {
    var newStage = null;
    var grass = AM.getAsset("./img/platforms/grass_platform.png");
    
    if (theStageNum === 0) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/lv1.png"), 24, 2310, 24, 1030, 2336, 1056),
                    [new Wall(this.game, "SaddleBrown", 262, 664, 338, 96), new Wall(this.game, "SaddleBrown", 262, 760, 18, 200),
                    new Wall(this.game, "SaddleBrown", 390, 390, 18, 256), new Wall(this.game, "SaddleBrown",646, 870, 18, 160),
                    new Wall(this.game, "SaddleBrown", 1030, 234, 18, 412), new Wall(this.game, "SaddleBrown", 1030, 646, 1280, 18), 
                    new Wall(this.game, "SaddleBrown", 1030, 934, 274, 96), new Wall(this.game, "SaddleBrown", 1190, 664, 370, 128), 
                    new Wall(this.game, "SaddleBrown", 1798, 774, 402, 256), new Wall(this.game, "SaddleBrown", 2182, 664, 18, 32),
                    new Wall(this.game, "SaddleBrown", 408, 390, 622, 18)],
                    [new Platform(this.game, grass, 24, 646, 832, 18), new Platform(this.game, grass, 24, 134, 160, 18),
                    new Platform(this.game, grass, 134, 262, 242, 18), new Platform(this.game, grass, 134, 518, 178, 18),
                    new Platform(this.game, grass, 230, 422, 114, 18), new Platform(this.game, grass, 390, 870, 256, 18),
                    new Platform(this.game, grass, 518, 582, 146, 18), new Platform(this.game, grass, 806, 774, 274, 18),
                    new Platform(this.game, grass, 646, 518, 146, 18), new Platform(this.game, grass, 742, 902, 82, 18),
                    new Platform(this.game, grass, 1158, 454, 274, 18), new Platform(this.game, grass, 1286, 262, 402, 18),
                    new Platform(this.game, grass, 1414, 134, 146, 18), new Platform(this.game, grass, 1510, 902, 146, 18),
                    new Platform(this.game, grass, 1798, 390, 274, 18), new Platform(this.game, grass, 2086, 134, 224, 18)],
                    [new Slime(this.game, 209, 448, false, 'Red'), new Slime(this.game, 272, 576, false, 'Red'), 
                    new Slime(this.game, 721, 576, false, 'Red'), new Slime(this.game, 1904, 320, false,'Green'),
                    new Slime(this.game, 240, 192, false, 'Green'), new Slime(this.game, 54, 961, false, 'Green'), 
                    new Slime(this.game, 400, 960, false, 'Green'), new Slime(this.game, 880, 703, false, 'Green'), 
                    new Slime(this.game, 1552, 193, false, 'Green'), new Slime(this.game, 1263, 384, false, 'Green'), 
                    new Slime(this.game, 1936, 704, false, 'Green'), 
                    new Bunny(this.game, 431, 800, false), new Bunny(this.game, 1552, 832, false), 
                    new Bunny(this.game, 561, 512, false), new Bunny(this.game, 880, 320, false),
                    new Bunny(this.game, 686, 448, false), new Bunny(this.game, 1104, 575, false),
                    new Bunny(this.game, 751, 833, false), new Bunny(this.game, 1456, 64, false),
                    new Bunny(this.game, 1326, 191, false), new Bunny(this.game, 2128, 576, false),
                    new Bunny(this.game, 2128, 64, false)], [new Door(this.game, 2304, 72, 1, 0, false), new Door(this.game, 2297, 958, 3, 0, true)], [this.key1, this.power1, this.power3],
                    [new Position(25, 575, 25, 575, 1, 1), new Position (2260, 72, 2260, 72, 1, 1), new Position(2281, 962, 2281, 962, 1, 1)]);
    } else if (theStageNum === 1) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/lv2.png"), 24, 1190, 24, 1958, 1216, 1984),
                    [new Wall(this.game, "SaddleBrown", 24, 24, 366, 160), new Wall(this.game, "SaddleBrown", 390, 24, 242, 384), 
                    new Wall(this.game, "SaddleBrown", 24, 390, 192, 242), new Wall(this.game, "SaddleBrown", 390, 408, 18, 320), 
                    new Wall(this.game, "SaddleBrown", 646, 518, 434, 274), new Wall(this.game, "SaddleBrown", 486, 934, 18, 320), 
                    new Wall(this.game, "SaddleBrown", 294, 1190, 82, 64), new Wall(this.game, "SaddleBrown", 24, 1446, 192, 512), 
                    new Wall(this.game, "SaddleBrown", 216, 1574, 224, 384), new Wall(this.game, "SaddleBrown", 440, 1702, 192, 256), 
                    new Wall(this.game, "SaddleBrown", 632, 1830, 224, 128)], [new Platform(this.game, null, 630, 133, 162, 18), 
                    new Platform(this.game, null, 998, 134, 192, 18), new Platform(this.game, null, 774, 230, 114, 18), 
                    new Platform(this.game, null, 632, 294, 160, 18), new Platform(this.game, null, 632, 390, 352, 18), 
                    new Platform(this.game, null, 408, 518, 96, 18), new Platform(this.game, null, 550, 582, 96, 18), 
                    new Platform(this.game, null, 408, 678, 96, 18), new Platform(this.game, null, 326, 358, 64, 18), 
                    new Platform(this.game, null, 294, 486, 96, 18), new Platform(this.game, null, 216, 582, 96, 18), 
                    new Platform(this.game, null, 230, 710, 160, 18), new Platform(this.game, null, 646, 998, 338, 18), 
                    new Platform(this.game, null, 134, 998, 210, 18), new Platform(this.game, null, 24, 806, 160, 18), 
                    new Platform(this.game, null, 24, 1126, 192, 18), new Platform(this.game, null, 1030, 1126, 160, 18), 
                    new Platform(this.game, null, 24, 1254, 704, 18), new Platform(this.game, null, 774, 1382, 210, 18), 
                    new Platform(this.game, null, 614, 1574, 146, 18), new Platform(this.game, null, 1030, 1542, 160, 18), 
                    new Platform(this.game, null, 1030, 1798, 160, 18)], 
                    [new Slime(this.game, 304, 417, false, 'Red'), new Slime(this.game, 688, 224, false,'Green'),
                    new Slime(this.game, 816, 1312, false,'Green'), new Slime(this.game, 656, 448, false,'Green'),
                    new Slime(this.game, 272, 1504, false,'Green'), new Slime(this.game, 272, 640, false,'Green'),
                    new Slime(this.game, 496, 1632, false,'Green'), new Slime(this.game, 208, 929, false,'Green'),
                    new Slime(this.game, 719, 1760, false,'Green'), new Slime(this.game, 77, 1056, false,'Green'),
                    new Slime(this.game, 1039, 1472, false,'Green'), new Slime(this.game, 912, 927, false,'Green'),
                    new Slime(this.game, 976, 448, false,'Green'), new Bunny(this.game, 721, 64, false),
                    new Bunny(this.game, 1008, 64, false), new Bunny(this.game, 656, 321, false),
                    new Bunny(this.game, 1136, 1888, false), new Bunny(this.game, 336, 287, false),
                    new Bunny(this.game, 1073, 1728, false), new Bunny(this.game, 125, 320, false),
                    new Bunny(this.game, 656, 1503, false), new Bunny(this.game, 400, 448, false),
                    new Bunny(this.game, 592, 1184, false), new Bunny(this.game, 48, 735, false),
                    new Bunny(this.game, 304, 1119, false), new Bunny(this.game, 656, 928, false)],
                    [new Door(this.game, 25, 1384, 0, 1), new Door(this.game, 25, 328, 2, 0)], [],
                    [new Position(32, 1378, 32, 1378, 1, 1), new Position(32, 323, 32, 323, 1, 1)]);
    } else if (theStageNum === 2) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/lv3.png"), 24, 2310, 24, 1318, 2336, 1344),
                    [new Wall(this.game, "SaddleBrown", 262, 678, 18, 242), new Wall(this.game, "SaddleBrown", 358, 134, 18, 562), 
                    new Wall(this.game, "SaddleBrown", 376, 230, 1454, 242), new Wall(this.game, "SaddleBrown", 646, 902, 82, 192), 
                    new Wall(this.game, "SaddleBrown", 422, 1094, 626, 224), new Wall(this.game, "SaddleBrown", 1062, 774, 370, 178), 
                    new Wall(this.game, "SaddleBrown", 1606, 902, 82, 192), new Wall(this.game, "SaddleBrown", 1446, 1094, 562, 224), 
                    new Wall(this.game, "SaddleBrown", 1830, 134, 18, 786)], [new Platform(this.game, null, 24, 134, 224, 18), 
                    new Platform(this.game, null, 166, 230, 82, 18), new Platform(this.game, null, 134, 454, 114, 18), 
                    new Platform(this.game, null, 262, 550, 96, 18), new Platform(this.game, null, 230, 326, 128, 18), 
                    new Platform(this.game, null, 24, 678, 96, 18), new Platform(this.game, null, 134, 902, 128, 18), 
                    new Platform(this.game, null, 280, 902, 192, 18), new Platform(this.game, null, 280, 678, 78, 18), 
                    new Platform(this.game, null, 24, 1094, 192, 18), new Platform(this.game, null, 1670, 646, 160, 18), 
                    new Platform(this.game, null, 486, 646, 338, 18), new Platform(this.game, null, 1848, 134, 96, 18), 
                    new Platform(this.game, null, 2150, 390, 160, 18), new Platform(this.game, null, 1062, 614, 370, 18), 
                    new Platform(this.game, null, 1990, 518, 146, 18), new Platform(this.game, null, 1848, 646, 160, 18), 
                    new Platform(this.game, null, 2182, 742, 128, 18), new Platform(this.game, null, 2054, 806, 82, 18), 
                    new Platform(this.game, null, 1848, 902, 160, 18), new Platform(this.game, null, 2182, 1030, 128, 18)],
                    [new Slime(this.game, 2032, 447, false, 'Red'), new Slime(this.game, 1007, 158, false,'Green'),
                    new Slime(this.game, 1104, 160, false,'Green'), new Slime(this.game, 944, 161, false,'Green'),
                    new Slime(this.game, 1232, 161, false,'Green'), new Slime(this.game, 176, 1249, false,'Green'),
                    new Slime(this.game, 1198, 544, false,'Green'), new Slime(this.game, 753, 1024, false,'Green'),
                    new Slime(this.game, 1072, 1248, false,'Green'), new Slime(this.game, 497, 1024, false,'Green'),
                    new Slime(this.game, 1201, 1246, false,'Green'), new Slime(this.game, 752, 575, false,'Green'),
                    new Slime(this.game, 1361, 1248, false,'Green'), new Slime(this.game, 172, 384, false,'Green'),
                    new Slime(this.game, 1937, 1024, false,'Green'), new Slime(this.game, 848, 159, false,'Green'),
                    new Slime(this.game, 2129, 1248, false,'Green'), new Bunny(this.game, 15, 64, false),
                    new Bunny(this.game, 1040, 704, false), new Bunny(this.game, 304, 257, false),
                    new Bunny(this.game, 1392, 704, false), new Bunny(this.game, 528, 160, false),
                    new Bunny(this.game, 1008, 1024, false), new Bunny(this.game, 16, 608, false),
                    new Bunny(this.game, 1425, 1024, false), new Bunny(this.game, 305, 609, false),
                    new Bunny(this.game, 1712, 1024, false), new Bunny(this.game, 463, 576, false),
                    new Bunny(this.game, 2224, 960, false), new Bunny(this.game, 337, 831, false),
                    new Bunny(this.game, 1711, 1025, false), new Bunny(this.game, 47, 1025, false),
                    new Bunny(this.game, 1872, 832, false), new Bunny(this.game, 15, 1249, false),
                    new Bunny(this.game, 2064, 736, false), new Bunny(this.game, 1648, 575, false)],
                    [new Door(this.game, 2304, 328, 1, 1)], [this.key2, this.power2, new Heart(this.game, 45, 1279),
                    new Heart(this.game, 1237, 1271), new Heart(this.game, 2257, 1273)], [new Position(2305, 323, 2305, 323, 1, 1)]);
    } else if (theStageNum === 3) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/lv4.png"), 186, 812, 119, 479, 1000, 600),
                    [], [new Platform(this.game, null, 186, 259, 64, 17), new Platform(this.game, null, 425, 258, 148, 18), 
                    new Platform(this.game, null, 264, 353, 115, 18), new Platform(this.game, null, 748, 258, 65, 18),
                    new Platform(this.game, null, 619, 353, 115, 18)], [], [new Door(this.game, 195, 420, 0, 2, true), 
                    new Door(this.game, 800, 420, 4, 0, true)], [], [new Position(25, 319, 25, 319, 1, 1), new Position(617, 319, 617, 319, 1, 1)]);
    } else if (theStageNum === 4) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/FP1.png"), 25, 933, 25, 1925, 1000, 1952),
                    [new Wall(this.game, null, 101, 1893, 436, 32), new Wall(this.game, null, 133, 1861, 64, 32),
                    new Wall(this.game, null, 165, 1829, 32, 32), new Wall(this.game, null, 197, 1637, 244, 256),
                    new Wall(this.game, null, 229, 1381, 180, 256), new Wall(this.game, null, 261, 1125, 116, 256),
                    new Wall(this.game, null, 293, 869, 52, 256), new Wall(this.game, null, 165, 677, 20, 192),
                    new Wall(this.game, null, 24, 869, 161, 244), new Wall(this.game, null, 24, 1113, 129, 256),
                    new Wall(this.game, null, 25, 1369, 96, 256), new Wall(this.game, null, 25, 1625, 64, 160),
                    new Wall(this.game, null, 645, 1861, 52, 64), new Wall(this.game, null, 549, 1625, 20, 160),
                    new Wall(this.game, null, 569, 1381, 32, 404), new Wall(this.game, null, 517, 1369, 20, 256),
                    new Wall(this.game, null, 537, 1125 ,32, 500), new Wall(this.game, null, 453, 869, 32, 244),
                    new Wall(this.game, null, 485, 869, 52, 500), new Wall(this.game, null, 805, 869, 84, 244),
                    new Wall(this.game, null, 677, 933, 52, 116), new Wall(this.game, null, 805, 1113, 52, 12),
                    new Wall(this.game, null, 645, 1189, 52, 148), new Wall(this.game, null, 773, 1125, 84, 244),
                    new Wall(this.game, null, 773, 1369, 52, 18), new Wall(this.game, null, 741, 1381, 84, 244),
                    new Wall(this.game, null, 709, 1573, 52, 212), new Wall(this.game, null, 901, 1765, 32, 32),
                    new Wall(this.game, null, 869, 1797, 64, 32), new Wall(this.game, null, 837, 1829, 96, 32),
                    new Wall(this.game, null, 805, 1861, 128, 32), new Wall(this.game, null, 773, 1893, 160, 32),
                    new Wall(this.game, null, 25, 133, 64, 51), new Wall(this.game, null, 25, 293, 64, 51),
                    new Wall(this.game, null, 25, 453, 64, 52), new Wall(this.game, null, 805, 133, 128, 84),
                    new Wall(this.game, null, 741, 197, 84, 84), new Wall(this.game, null, 677, 261, 84, 84),
                    new Wall(this.game, null, 613, 325, 84, 84), new Wall(this.game, null, 869, 325, 64, 128),
                    new Wall(this.game, null, 805, 389, 64, 64), new Wall(this.game, null, 741, 453, 191, 116),
                    new Wall(this.game, null, 613, 485, 20, 32), new Wall(this.game, null, 613, 517, 148, 84)],
                    [new Platform(this.game, null, 89, 1733, 32, 20), new Platform(this.game, null, 517, 1765, 32, 20), 
                    new Platform(this.game, null, 121, 1509, 32, 20), new Platform(this.game, null, 485, 1541, 32, 20), 
                    new Platform(this.game, null, 153, 1285, 32, 20), new Platform(this.game, null, 453, 1285, 32, 20), 
                    new Platform(this.game, null, 185, 1029, 32, 20), new Platform(this.game, null, 421, 1029, 32, 20), 
                    new Platform(this.game, null, 261, 869, 32, 20), new Platform(this.game, null, 421, 869, 32, 20), 
                    new Platform(this.game, null, 25, 773, 64, 20), new Platform(this.game, null, 101, 677, 64, 20), 
                    new Platform(this.game, null, 293, 709, 244, 20), new Platform(this.game, null, 229, 549, 84, 20), 
                    new Platform(this.game, null, 389, 549, 52, 20), new Platform(this.game, null, 517, 549, 20, 20), 
                    new Platform(this.game, null, 229, 389, 20, 20), new Platform(this.game, null, 325, 389, 52, 20), 
                    new Platform(this.game, null, 453, 389, 84, 20), new Platform(this.game, null, 229, 229, 84, 20), 
                    new Platform(this.game, null, 389, 229, 52, 20), new Platform(this.game, null, 517, 229, 20, 20), 
                    new Platform(this.game, null, 837, 677, 96, 20), new Platform(this.game, null, 677, 773, 116, 20), 
                    new Platform(this.game, null, 537, 869, 96, 20), new Platform(this.game, null, 537, 933, 32, 20), 
                    new Platform(this.game, null, 645, 933, 32, 20), new Platform(this.game, null, 729, 933, 32, 20), 
                    new Platform(this.game, null, 537, 1029, 32, 20), new Platform(this.game, null, 645, 1029, 32, 20), 
                    new Platform(this.game, null, 729, 1029, 32, 20), new Platform(this.game, null, 569, 1125, 32, 20), 
                    new Platform(this.game, null, 741, 1125, 32, 20), new Platform(this.game, null, 569, 1253, 32, 20), 
                    new Platform(this.game, null, 741, 1253, 32, 20), new Platform(this.game, null, 601, 1381, 32, 20), 
                    new Platform(this.game, null, 709, 1381, 32, 20), new Platform(this.game, null, 601, 1573, 32, 20), 
                    new Platform(this.game, null, 677, 1573, 32, 20), new Platform(this.game, null, 601, 1669, 32, 20), 
                    new Platform(this.game, null, 677, 1669, 32, 20), new Platform(this.game, null, 601, 1765, 32, 20), 
                    new Platform(this.game, null, 677, 1765, 32, 20), new Platform(this.game, null, 601, 1477, 32, 20), 
                    new Platform(this.game, null, 709, 1477, 32, 20)],
                    [new Slime(this.game, 480, 1824, false,'Green'), new Slime(this.game, 576, 1312, false,'Green'), 
                    new Slime(this.game, 724, 1312, false,'Green'), new Slime(this.game, 96, 800, false,'Green'),
                    new Bunny(this.game, 650, 1792, false), new Bunny(this.game, 704, 1504, false), 
                    new Bunny(this.game, 643, 1120, false), new Bunny(this.game, 832, 800, false), 
                    new Bunny(this.game, 704, 704, false), new Bunny(this.game, 32, 224, false), 
                    new Bunny(this.game, 32, 64, false), new Bunny(this.game, 32, 384, false), 
                    new Licky(this.game, 224, 768, true), new Licky(this.game, 544, 1056, true),
                    new Licky(this.game, 224, 448, true), new Licky(this.game, 338, 288, true),
                    new Licky(this.game, 530, 128, true), 
                    new Jaws(this.game, 352, 640, false), new Jaws(this.game, 877, 256, false),
                    new Jaws(this.game, 812, 320, false), new Jaws(this.game, 757, 384, false),
                    new Mummy(this.game, 460, 768, false)],
                    [new Door(this.game, 30, 1856, 3, 1, false), new Door(this.game, 928, 1696, 5, 0, false), 
                    new Door(this.game, 928, 608, 7, 0, false), new Door(this.game, 928, 64, 8, 0, false)], 
                    [/*items*/], 
                    [new Position(31, 1851, 31, 1851, 1, 1), new Position(886, 1687, 886, 1687, 1, 1), 
                    new Position(886, 599, 886, 599, 1, 1), new Position(886, 55, 886, 55, 1, 1)]);
    } else if (theStageNum === 5) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/FP2.png"), 25, 1893, 25, 613, 1920, 640),
                    [new Wall(this.game, null, 101, 25, 84, 32), new Wall(this.game, null, 325, 25, 20, 32), 
                    new Wall(this.game, null, 325, 133, 948, 52), new Wall(this.game, null, 485, 101, 20, 32),
                    new Wall(this.game, null, 197, 229, 20, 308), new Wall(this.game, null, 421, 185, 52, 268),
                    new Wall(this.game, null, 357, 453, 148, 52), new Wall(this.game, null, 549, 549, 84, 64),
                    new Wall(this.game, null, 677, 453, 212, 52), new Wall(this.game, null, 933, 549, 86, 64),
                    new Wall(this.game, null, 1061, 453, 148, 52), new Wall(this.game, null, 1093, 185, 52, 268),
                    new Wall(this.game, null, 645, 25, 20, 32), new Wall(this.game, null, 773, 101, 20, 32),
                    new Wall(this.game, null, 933, 25, 20, 32), new Wall(this.game, null, 1061, 101, 20, 32),
                    new Wall(this.game, null, 741, 185, 84, 268), new Wall(this.game, null, 1145, 293, 96, 52),
                    new Wall(this.game, null, 1253, 25, 20, 32), new Wall(this.game, null, 1477, 133, 148, 52),
                    new Wall(this.game, null, 1797, 101, 20, 224), new Wall(this.game, null, 1349, 325, 116, 180),
                    new Wall(this.game, null, 1541, 325, 20, 52), new Wall(this.game, null, 1605, 261, 52, 148),
                    new Wall(this.game, null, 1701, 325, 20, 52), new Wall(this.game, null, 1797, 325, 96, 180),
                    new Wall(this.game, null, 1605, 549, 52, 64)], 
                    [new Platform(this.game, null, 25, 101, 32, 20), new Platform(this.game, null, 101, 133, 84, 20), 
                    new Platform(this.game, null, 25, 229, 172, 20), new Platform(this.game, null, 25, 325, 64, 20), 
                    new Platform(this.game, null, 165, 325, 32, 20), new Platform(this.game, null, 217, 325, 64, 20), 
                    new Platform(this.game, null, 69, 421, 52, 20), new Platform(this.game, null, 165, 421, 52, 20), 
                    new Platform(this.game, null, 69, 517, 52, 20), new Platform(this.game, null, 165, 517, 32, 20), 
                    new Platform(this.game, null, 473, 325, 64, 20), new Platform(this.game, null, 677, 325, 64, 20), 
                    new Platform(this.game, null, 825, 261, 32, 20), new Platform(this.game, null, 1061, 261, 32, 20), 
                    new Platform(this.game, null, 901, 325, 116, 20), new Platform(this.game, null, 1561, 357, 44, 20), 
                    new Platform(this.game, null, 1657, 357, 44, 20), new Platform(this.game, null, 1733, 453, 64, 20), 
                    new Platform(this.game, null, 1817, 101, 32, 20), new Platform(this.game, null, 1861, 197, 32, 20)], 
                    [new Slime(this.game, 416, 64, false,'Green'), new Slime(this.game, 1120, 64, false,'Green'),
                    new Slime(this.game, 1152, 384, false,'Green'), new Slime(this.game, 1536, 64, false,'Green'),
                    new Bunny(this.game, 32, 256, true), new Bunny(this.game, 128, 64, false),
                    new Bunny(this.game, 480, 256, true), new Bunny(this.game, 704, 256, false),
                    new Bunny(this.game, 1152, 224, true), new Bunny(this.game, 1798, 32, false),
                    new Licky(this.game, 100, 352, true), new Licky(this.game, 100, 448, true),
                    new Licky(this.game, 480, 505, true), new Licky(this.game, 512, 384, true),
                    new Licky(this.game, 1312, 192, true), new Licky(this.game, 1264, 57, true), 
                    new Jaws(this.game, 825, 202, false), new Jaws(this.game, 1056, 202, false),
                    new Jaws(this.game, 1120, 544, false), new Jaws(this.game, 1440, 544, false),
                    new Jaws(this.game, 1600, 200, false), new Jaws(this.game, 1632, 200, false),
                    new Mummy(this.game, 576, 32, false), new Mummy(this.game, 864, 32, false),
                    new Mummy(this.game, 352, 512, false), new Mummy(this.game, 736, 512, false),
                    new Mummy(this.game, 928, 224, false)], 
                    [new Door(this.game, 32, 160, 4, 1, false), new Door(this.game, 1888, 544, 9, 0, false)], 
                    [/* Items */], 
                    [new Position(32, 155, 32, 155, 1, 1), new Position(1846, 544, 1846, 544, 1, 1)]);
    } else if (theStageNum === 6) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/FP3.png"), 25, 1893, 25, 613, 1920, 640),
                    [new Wall(this.game, null, 229, 133, 20, 116), new Wall(this.game, null, 25, 357, 492, 84),
                    new Wall(this.game, null, 517, 261, 20, 276), new Wall(this.game, null, 537, 261, 32, 244),
                    new Wall(this.game, null, 569, 261, 32, 212), new Wall(this.game, null, 601, 261, 32, 180),
                    new Wall(this.game, null, 633, 261, 32, 148), new Wall(this.game, null, 665, 261, 32, 116),
                    new Wall(this.game, null, 697, 261, 32, 84), new Wall(this.game, null, 729, 261, 32, 52),
                    new Wall(this.game, null, 677, 101, 244, 84), new Wall(this.game, null, 761, 261, 364, 20),
                    new Wall(this.game, null, 1093, 165, 52, 96), new Wall(this.game, null, 1317, 25, 308, 64),
                    new Wall(this.game, null, 1477, 89, 20, 128), new Wall(this.game, null, 1125, 261, 32, 52),
                    new Wall(this.game, null, 1157, 261, 32, 84), new Wall(this.game, null, 1189, 261, 32, 116),
                    new Wall(this.game, null, 1221, 261, 32, 148), new Wall(this.game, null, 1253, 261, 32, 180),
                    new Wall(this.game, null, 1285, 261, 32, 212), new Wall(this.game, null, 1317, 261, 52, 244),
                    new Wall(this.game, null, 1349, 485, 180, 52), new Wall(this.game, null, 1669, 549, 84, 64)],
                    [new Platform(this.game, null, 1733, 133, 160, 20), new Platform(this.game, null, 1797, 421, 96, 20), 
                    new Platform(this.game, null, 1541, 325, 211, 20), new Platform(this.game, null, 1497, 197, 96, 20), 
                    new Platform(this.game, null, 1413, 197, 64, 20), new Platform(this.game, null, 1145, 165, 64, 20), 
                    new Platform(this.game, null, 921, 133, 32, 20), new Platform(this.game, null, 645, 133, 32, 20), 
                    new Platform(this.game, null, 389, 133, 84, 20), new Platform(this.game, null, 101, 101, 52, 20), 
                    new Platform(this.game, null, 25, 229, 204, 20)],
                    [new Slime(this.game, 416, 288, false,'Green'), new Slime(this.game, 1632, 256, false,'Green'),
                    new Bunny(this.game, 101, 32, true), new Bunny(this.game, 640, 64, false),
                    new Bunny(this.game, 920, 64, true), new Bunny(this.game, 1152, 96, true),
                    new Bunny(this.game, 1440, 128, false), new Bunny(this.game, 1504, 128, true),
                    new Bunny(this.game, 1440, 416, true),
                    new Licky(this.game, 512, 178, true), new Licky(this.game, 64, 270, true),
                    new Jaws(this.game, 32, 160, false), new Jaws(this.game, 160, 160, false),
                    new Jaws(this.game, 1856, 352, false),
                    new Mummy(this.game, 1824, 32, false), new Mummy(this.game, 1280, 160, false),
                    new Mummy(this.game, 640, 160, false), new Mummy(this.game, 160, 256, false)],
                    [new Door(this.game, 1888, 544, 9, 1, false)], 
                    [/* Items */], 
                    [new Position(1848, 544, 1848, 544, 1, 1)]);
    } else if (theStageNum === 7) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/FP4.png"), 25, 1893, 25, 613, 1920, 640),
                    [new Wall(this.game, null, 25, 25, 224, 320), new Wall(this.game, null, 165, 549, 116, 64), 
                    new Wall(this.game, null, 389, 485, 84, 128), new Wall(this.game, null, 473, 549, 76, 64),
                    new Wall(this.game, null, 1093, 517, 32, 96), new Wall(this.game, null, 549, 261, 148, 352),
                    new Wall(this.game, null, 805, 229, 20, 116), new Wall(this.game, null, 965, 229, 20, 116),
                    new Wall(this.game, null, 1125, 261, 148, 352), new Wall(this.game, null, 1413, 101, 116, 52),
                    new Wall(this.game, null, 1381, 293, 116, 84), new Wall(this.game, null, 1605, 165, 20, 372),
                    new Wall(this.game, null, 1625, 261, 32, 84), new Wall(this.game, null, 1861, 261, 32, 84)],
                    [new Platform(this.game, null, 249, 101, 128, 20), new Platform(this.game, null, 249, 229, 64, 20),
                    new Platform(this.game, null, 485, 293, 64, 20), new Platform(this.game, null, 25, 453, 224, 20),
                    new Platform(this.game, null, 357, 389, 84, 20), new Platform(this.game, null, 697, 517, 64, 20),
                    new Platform(this.game, null, 837, 453, 116, 20), new Platform(this.game, null, 581, 133, 52, 20),
                    new Platform(this.game, null, 805, 133, 212, 20), new Platform(this.game, null, 773, 229, 33, 20),
                    new Platform(this.game, null, 825, 229, 32, 20), new Platform(this.game, null, 933, 229, 32, 20),
                    new Platform(this.game, null, 985, 229, 32, 20), new Platform(this.game, null, 1189, 133, 52, 20),
                    new Platform(this.game, null, 1061, 357, 64, 20), new Platform(this.game, null, 1273, 485, 64, 20),
                    new Platform(this.game, null, 1701, 293, 116, 20), new Platform(this.game, null, 1413, 549, 116, 20),
                    new Platform(this.game, null, 1541, 421, 64, 20), new Platform(this.game, null, 1625, 421, 64, 20),
                    new Platform(this.game, null, 1829, 421, 64, 20), new Platform(this.game, null, 1733, 517, 52, 20),
                    new Platform(this.game, null, 1625, 165, 268, 20)],
                    [new Slime(this.game, 800, 160, false,'Green'), new Slime(this.game, 960, 160, false,'Green'),
                    new Bunny(this.game, 289, 32, true), new Bunny(this.game, 500, 224, false),
                    new Bunny(this.game, 257, 160, true), new Bunny(this.game, 705, 448, true),
                    new Bunny(this.game, 1073, 288, false), new Bunny(this.game, 1280, 416, true),
                    new Bunny(this.game, 1568, 352, false), 
                    new Licky(this.game, 64, 480, true), new Licky(this.game, 352, 288, true),
                    new Licky(this.game, 768, 384, true), new Licky(this.game, 1408, 224, true),
                    new Licky(this.game, 1696, 192, true), new Licky(this.game, 1728, 352, true),
                    new Jaws(this.game, 480, 480, false), new Jaws(this.game, 864, 64, false),
                    new Jaws(this.game, 1733, 448, false),
                    new Mummy(this.game, 864, 512, false)],
                    [new Door(this.game, 32, 384, 4, 2, false), new Door(this.game, 1888, 96, 9, 2, false)], 
                    [/* Items */], 
                    [new Position(32, 384, 32, 384, 1, 1), new Position(1848, 96, 1846, 96, 1, 1)]);
    } else if (theStageNum === 8) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/FP5.png"), 25, 1893, 25, 613, 1920, 640),
                    [new Wall(this.game, null, 25, 165, 352, 244), new Wall(this.game, null, 357, 101, 20, 64),
                    new Wall(this.game, null, 25, 517, 224, 96), new Wall(this.game, null, 1797, 133, 96, 480)],
                    [new Platform(this.game, null, 377, 229, 96, 20), new Platform(this.game, null, 517, 165, 84, 20),
                    new Platform(this.game, null, 677, 133, 84, 20), new Platform(this.game, null, 837, 101, 84, 20),
                    new Platform(this.game, null, 997, 133, 90, 20), new Platform(this.game, null, 1157, 165, 90, 20),
                    new Platform(this.game, null, 1317, 229, 84, 20), new Platform(this.game, null, 1477, 261, 84, 20),
                    new Platform(this.game, null, 1701, 133, 96, 20), new Platform(this.game, null, 1637, 293, 84, 20),
                    new Platform(this.game, null, 1477, 325, 84, 20), new Platform(this.game, null, 1317, 357, 84, 20),
                    new Platform(this.game, null, 1157, 389, 84, 20), new Platform(this.game, null, 997, 421, 84, 20),
                    new Platform(this.game, null, 837, 453, 84, 20), new Platform(this.game, null, 677, 485, 84, 20),
                    new Platform(this.game, null, 517, 517, 84, 20), new Platform(this.game, null, 357, 549, 84, 20)],
                    [new Licky(this.game, 384, 256, true), new Licky(this.game, 384, 320, true),
                    new Licky(this.game, 384, 384, true), new Licky(this.game, 1664, 160, true),
                    new Licky(this.game, 192, 33, true), 
                    new Jaws(this.game, 704, 544, false), new Jaws(this.game, 1184, 544, false),
                    new Jaws(this.game, 1664, 544, false)],
                    [new Door(this.game, 32, 448, 4, 3, false), new Door(this.game, 1888, 64, 10, 0, false)], 
                    [/* Items */], 
                    [new Position(32, 448, 32, 448, 1, 1), new Position(1848, 64, 1846, 64, 1, 1)]);
    } else if (theStageNum === 9) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/FP6.png"), 25, 933, 25, 1925, 1000, 1952),
                    [new Wall(this.game, null, 197, 101, 84, 52), new Wall(this.game, null, 197, 261, 84, 52),
                    new Wall(this.game, null, 197, 421, 84, 52), new Wall(this.game, null, 389, 165, 20, 244),
                    new Wall(this.game, null, 549, 197, 20, 276), new Wall(this.game, null, 677, 101, 84, 52),
                    new Wall(this.game, null, 677, 261, 84, 52), new Wall(this.game, null, 677, 421, 84, 52),
                    new Wall(this.game, null, 901, 133, 32, 84), new Wall(this.game, null, 901, 325, 32, 84),
                    new Wall(this.game, null, 25, 613, 192, 52), new Wall(this.game, null, 165, 665, 52, 96),
                    new Wall(this.game, null, 325, 613, 84, 148), new Wall(this.game, null, 409, 613, 140, 52),
                    new Wall(this.game, null, 549, 613, 84, 148), new Wall(this.game, null, 741, 613, 52, 148),
                    new Wall(this.game, null, 901, 517, 32, 148), new Wall(this.game, null, 793, 613, 108, 52),
                    new Wall(this.game, null, 133, 869, 52, 52), new Wall(this.game, null, 325, 869, 20, 52),
                    new Wall(this.game, null, 453, 869, 52, 52), new Wall(this.game, null, 613, 869, 20, 52),
                    new Wall(this.game, null, 773, 869, 52, 52), new Wall(this.game, null, 25, 1029, 64, 116),
                    new Wall(this.game, null, 196, 1029, 53, 116), new Wall(this.game, null, 325, 1029, 52, 116),
                    new Wall(this.game, null, 453, 1029, 52, 116), new Wall(this.game, null, 581, 1029, 52, 116),
                    new Wall(this.game, null, 709, 1029, 52, 116), new Wall(this.game, null, 869, 1029, 64, 116),
                    new Wall(this.game, null, 25, 1349, 32, 52), new Wall(this.game, null, 165, 1349, 116, 52),
                    new Wall(this.game, null, 421, 1349, 116, 52), new Wall(this.game, null, 677, 1349, 116, 52),
                    new Wall(this.game, null, 901, 1349, 32, 52), new Wall(this.game, null, 24, 1477, 129, 52),
                    new Wall(this.game, null, 293, 1477, 116, 52), new Wall(this.game, null, 549, 1477, 116, 52),
                    new Wall(this.game, null, 805, 1477, 128, 52), new Wall(this.game, null, 165, 1605, 116, 52),
                    new Wall(this.game, null, 421, 1605, 116, 52), new Wall(this.game, null, 677, 1605, 116, 52),
                    new Wall(this.game, null, 293, 1733, 116, 52), new Wall(this.game, null, 549, 1733, 116, 52),
                    new Wall(this.game, null, 421, 1861, 116, 64)],
                    [new Platform(this.game, null, 25, 165, 96, 20), new Platform(this.game, null, 409, 165, 32, 20), 
                    new Platform(this.game, null, 485, 261, 20, 20), new Platform(this.game, null, 453, 389, 20, 20),
                    new Platform(this.game, null, 421, 517, 20, 20), new Platform(this.game, null, 517, 453, 32 ,20),
                    new Platform(this.game, null, 25, 741, 96, 20), new Platform(this.game, null, 453, 741, 52, 20),
                    new Platform(this.game, null, 837, 741, 96, 20), new Platform(this.game, null, 89, 1029, 32, 20),
                    new Platform(this.game, null, 165, 1125, 32, 20), new Platform(this.game, null, 761, 1125, 32, 20),
                    new Platform(this.game, null, 837, 1029, 32, 20), new Platform(this.game, null, 25, 1253, 128, 20),
                    new Platform(this.game, null, 549, 1253, 116, 20), new Platform(this.game, null, 805, 1253, 128, 20),
                    new Platform(this.game, null, 293, 1253, 116, 20)],
                    [new Slime(this.game, 48, 672, false,'Green'), new Slime(this.game, 461 ,672, false,'Green'),
                    new Slime(this.game, 864, 671, false,'Green'), new Slime(this.game, 205, 1536, false,'Green'),
                    new Slime(this.game, 326, 1408, false,'Green'), new Slime(this.game, 331, 1664, false,'Green'),
                    new Slime(this.game, 461, 1536, false,'Green'), new Slime(this.game, 593, 1407, false,'Green'),
                    new Slime(this.game, 589, 1664, false,'Green'), new Slime(this.game, 716, 1536, false,'Green'),
                    new Bunny(this.game, 393, 96, false), new Bunny(this.game, 896, 64, false),
                    new Bunny(this.game, 896, 257, false), new Bunny(this.game, 897, 448, false),
                    new Bunny(this.game, 33, 1409, true), new Bunny(this.game, 886, 1408, false),
                    new Licky(this.game, 161, 192, true), new Licky(this.game, 289, 320, true),
                    new Licky(this.game, 160, 782, true), new Licky(this.game, 737, 940, true),
                    new Jaws(this.game, 608, 1857, false), new Jaws(this.game, 832, 1857, false),
                    new Mummy(this.game, 64, 512, false), new Mummy(this.game, 512, 512, false),
                    new Mummy(this.game, 800, 512, false)],
                    [new Door(this.game, 32, 1856, 5, 1, false), new Door(this.game, 32, 1184, 6, 0, false), 
                    new Door(this.game, 32, 96, 7, 1, false)], 
                    [/* Items */], 
                    [new Position(32, 1856, 32, 1856, 1, 1), new Position(32, 1184, 32, 1184, 1, 1),
                    new Position(32, 96, 32, 96, 1, 1)]);
    } else if (theStageNum === 10) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/FP7.png"), 25, 1893, 25, 613, 1024, 640),
                    [new Wall(this.game, null, 25, 389, 172, 224), new Wall(this.game, null, 197, 357, 128, 256),
                    new Wall(this.game, null, 325, 325, 128, 288), new Wall(this.game, null, 453, 293, 148, 320)],
                    [new Platform(this.game, null, 133, 229, 148, 20), new Platform(this.game, null, 389, 165, 148, 20),
                    new Platform(this.game, null, 601, 357, 64, 20), new Platform(this.game, null, 601, 485, 128, 20)],
                    [/* Enemies */],
                    [], 
                    [/* Items */],
                    [new Position(32, 64, 32, 64, 1, 1)]);
    }
    return newStage;
}

// Start of actual game
var AM = new AssetManager();

// background images
AM.queueDownload("./img/sprites/backgrounds/Start.png");

AM.queueDownload("./img/sprites/backgrounds/level1.png");
AM.queueDownload("./img/sprites/backgrounds/level2.png");

AM.queueDownload("./img/sprites/backgrounds/lv1.png");
AM.queueDownload("./img/sprites/backgrounds/lv2.png");
AM.queueDownload("./img/sprites/backgrounds/lv3.png");
AM.queueDownload("./img/sprites/backgrounds/lv4.png");

AM.queueDownload("./img/sprites/backgrounds/FP1.png");
AM.queueDownload("./img/sprites/backgrounds/FP2.png");
AM.queueDownload("./img/sprites/backgrounds/FP3.png");
AM.queueDownload("./img/sprites/backgrounds/FP4.png");
AM.queueDownload("./img/sprites/backgrounds/FP5.png");
AM.queueDownload("./img/sprites/backgrounds/FP6.png");
AM.queueDownload("./img/sprites/backgrounds/FP7.png");

AM.queueDownload("./img/sprites/backgrounds/Win.png");
AM.queueDownload("./img/sprites/backgrounds/game_over.png");

// HUD image
AM.queueDownload("./img/sprites/items/key_idle.png");
AM.queueDownload("./img/sprites/items/bosskey_idle.png");
AM.queueDownload("./img/sprites/items/full_heart.png");
AM.queueDownload("./img/sprites/items/empty_heart.png");

// Platform image
AM.queueDownload("./img/sprites/platforms/small_grass_tile.png");

// BlackMage images
AM.queueDownload("./img/sprites/heroes/black_mage/idle_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/walk_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/idle_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/walk_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/jump_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/jump_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/fireball_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/fireball_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/frostbolt_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/frostbolt_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/dmg_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/dmg_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/death_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/death_right.png");
AM.queueDownload("./img/ice_cube.png");

// Monk images
AM.queueDownload("./img/sprites/heroes/monk/idle_left.png");
AM.queueDownload("./img/sprites/heroes/monk/idle_right.png");
AM.queueDownload("./img/sprites/heroes/monk/walk_left.png");
AM.queueDownload("./img/sprites/heroes/monk/walk_right.png");
AM.queueDownload("./img/sprites/heroes/monk/jump_left.png");
AM.queueDownload("./img/sprites/heroes/monk/jump_right.png");
AM.queueDownload("./img/sprites/heroes/monk/death_l.png");
AM.queueDownload("./img/sprites/heroes/monk/death_r.png");
AM.queueDownload("./img/sprites/heroes/monk/dmg_l.png");
AM.queueDownload("./img/sprites/heroes/monk/dmg_r.png");
AM.queueDownload("./img/sprites/heroes/monk/punch_l.png");
AM.queueDownload("./img/sprites/heroes/monk/punch_r.png");
AM.queueDownload("./img/sprites/heroes/monk/jump-kick_l.png");
AM.queueDownload("./img/sprites/heroes/monk/jump-kick_r.png");

// Slime Sprites
AM.queueDownload("./img/sprites/enemies/red_slime/death_left.png");
AM.queueDownload("./img/sprites/enemies/red_slime/death_right.png");
AM.queueDownload("./img/sprites/enemies/red_slime/dmg_left.png");
AM.queueDownload("./img/sprites/enemies/red_slime/dmg_right.png");
AM.queueDownload("./img/sprites/enemies/red_slime/idle_left.png");
AM.queueDownload("./img/sprites/enemies/red_slime/idle_right.png");
AM.queueDownload("./img/sprites/enemies/red_slime/rolling_left.png");
AM.queueDownload("./img/sprites/enemies/red_slime/rolling_right.png");

AM.queueDownload("./img/sprites/enemies/green_slime/death_left.png");
AM.queueDownload("./img/sprites/enemies/green_slime/death_right.png");
AM.queueDownload("./img/sprites/enemies/green_slime/dmg_left.png");
AM.queueDownload("./img/sprites/enemies/green_slime/dmg_right.png");
AM.queueDownload("./img/sprites/enemies/green_slime/idle_left.png");
AM.queueDownload("./img/sprites/enemies/green_slime/idle_right.png");
AM.queueDownload("./img/sprites/enemies/green_slime/rolling_left.png");
AM.queueDownload("./img/sprites/enemies/green_slime/rolling_right.png");

AM.queueDownload("./img/sprites/enemies/blue_slime/death_left.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/death_right.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/dmg_left.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/dmg_right.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/idle_left.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/idle_right.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/rolling_left.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/rolling_right.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/jump_left.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/jump_right.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/spit_left.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/spit_right.png");

// Bunny Sprites
AM.queueDownload("./img/sprites/enemies/bunny/death_l.png");
AM.queueDownload("./img/sprites/enemies/bunny/death_r.png");
AM.queueDownload("./img/sprites/enemies/bunny/idle_l.png");
AM.queueDownload("./img/sprites/enemies/bunny/idle_r.png");
AM.queueDownload("./img/sprites/enemies/bunny/atk_l.png");
AM.queueDownload("./img/sprites/enemies/bunny/atk_r.png");
AM.queueDownload("./img/sprites/enemies/bunny/medium_rock.png");
AM.queueDownload("./img/bunny_ice.png");

// Jaws Sprites
AM.queueDownload("./img/sprites/enemies/jaws/death_left.png");
AM.queueDownload("./img/sprites/enemies/jaws/death_right.png");
AM.queueDownload("./img/sprites/enemies/jaws/idle_left.png");
AM.queueDownload("./img/sprites/enemies/jaws/idle_right.png");
AM.queueDownload("./img/sprites/enemies/jaws/walk_left.png");
AM.queueDownload("./img/sprites/enemies/jaws/walk_right.png");

// Licky Sprites
AM.queueDownload("./img/sprites/enemies/licky/attack_left.png");
AM.queueDownload("./img/sprites/enemies/licky/attack_right.png");
AM.queueDownload("./img/sprites/enemies/licky/death_left.png");
AM.queueDownload("./img/sprites/enemies/licky/death_right.png");
AM.queueDownload("./img/sprites/enemies/licky/dmg_left.png");
AM.queueDownload("./img/sprites/enemies/licky/dmg_right.png");
AM.queueDownload("./img/sprites/enemies/licky/idle_left.png");
AM.queueDownload("./img/sprites/enemies/licky/idle_right.png");

// Mummy Sprites
AM.queueDownload("./img/sprites/enemies/mummy/idle_left.png");
AM.queueDownload("./img/sprites/enemies/mummy/idle_right.png");
AM.queueDownload("./img/sprites/enemies/mummy/walk_left.png");
AM.queueDownload("./img/sprites/enemies/mummy/walk_right.png");
AM.queueDownload("./img/sprites/enemies/mummy/dmg_left.png");
AM.queueDownload("./img/sprites/enemies/mummy/dmg_right.png");
AM.queueDownload("./img/sprites/enemies/mummy/death_left.png");
AM.queueDownload("./img/sprites/enemies/mummy/death_right.png");

// Item Sprites
AM.queueDownload("./img/sprites/items/key_idle_spin.png");
AM.queueDownload("./img/sprites/items/bosskey_idle_spin.png");
AM.queueDownload("./img/sprites/items/heart_idle_spin.png");
AM.queueDownload("./img/sprites/power-ups/blink.png");
AM.queueDownload("./img/sprites/power-ups/double-jump.png");

AM.downloadAll(function () {
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");

    var gameEngine = new GameEngine();
    gameEngine.init(ctx);

    var startScreen = new Background(gameEngine, AM.getAsset("./img/sprites/backgrounds/Start.png"), 0, 1000, 0, 600, 1000, 600);
    startScreen.gameStart = true;
    gameEngine.background = startScreen;

    gameEngine.player = new Player(gameEngine);
    gameEngine.camera = new Camera(gameEngine);
    gameEngine.addEntity(gameEngine.player);
    gameEngine.addEntity(startScreen);
    gameEngine.sceneManager = new SceneManager(gameEngine);
    gameEngine.sceneManager.update();
    gameEngine.start();
})