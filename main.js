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
}

Camera.prototype.draw = function (ctx) {
    // Head-up display elements here
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
};

Background.prototype.draw = function (ctx) {
    ctx.drawImage(this.spritesheet, 
        this.game.camera.x, this.game.camera.y, ctx.canvas.width, ctx.canvas.height, // Only display the canvas size with camera in top left correr
        this.left, this.top, ctx.canvas.width, ctx.canvas.height); // Draw into top left corner of canvas, at canvas size
}

Background.prototype.update = function () {
    // Empty
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
function Wall(game, spritesheet, theX, theY, theWidth, theHeight) {
    this.type = 'Wall';
    this.position = new Position(theX, theY, theX, theY, theWidth, theHeight);
    this.spritesheet = spritesheet;
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

    ctx.fillStyle = 'SaddleBrown';
    ctx.fillRect(cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
    ctx.restore();
}

Wall.prototype.update = function () {
    // Empty
};

function Door(game, theX, theY, theLevel, theDoor) {
    this.type = 'Door';
    this.game = game;
    this.position = new Position(theX, theY, theX, theY, 5, 60);
    this.destination = {level: theLevel, door: theDoor};
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
                entity.HP -= 2;
                entity.state = 'damaged';
                if (that.velocityX > 0) entity.isHitRight = true;
            } else {
                collision = true;
                entity.state = 'frozen';
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

// function Punch(game, goingRight, position, player) {
//     this.type = "Projectile";
//     this.game = game;
//     this.position = position;
//     this.player = player;
//     this.animation = null;
//     if (!goingRight) {
//         //this.animation = new Animation(AM.getAsset("./img/sprites/heroes/monk/.png"));
//     } else {
//         //this.animation = new Animation(AM.getAsset("./img/sprites/heroes/monk/.png"));
//     }
// }

// Punch.prototype.draw = function (ctx) {
//     var boxOffsetX = this.position.left - this.game.camera.x;
//     var boxOffsetY = this.position.top - this.game.camera.y;
//     var drawOffsetX = this.position.drawX - this.game.camera.x;
//     var drawOffsetY = this.position.drawY - this.game.camera.y;

//     if (this.game.showOutlines) {
//         ctx.save();
//         ctx.strokeStyle = 'Red';
//         ctx.strokeRect(boxOffsetX, boxOffsetY, this.position.width, this.position.height);
//         ctx.restore();
//     }

//     this.animation.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
// }

// Punch.prototype.update = function () {
//     var collision = false;
//     var that = this;
//     this.game.enemies.forEach(function(entity) {
//         if (collisionDetector(that.position, entity.position)) {
//             collision = true;
//             entity.isHit = true;
//             entity.HP -= 1;
//             // if (that.velocityX > 0) entity.isHitRight = true;
//         }
//     });
// }


// Slime test enemy
function Slime(game, theX, theY, faceRight, theColor) {
    this.type = "Enemy";
    this.color = theColor;
    this.HP = 4;
    this.state = 'idle';
    this.position = new Position(theX, theY, theX + 20, theY + 45, 24, 20);
    this.faceRight = faceRight;
    this.velocityX = 0;
    this.velocityY = 0;
    this.animations = {};
    if (theColor === 'Red') {
        this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/idle_left.png"), 0, 0, 32, 32.2, 0.2, 10, true, false),
                            idleRight: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/idle_right.png"), 0, 0, 32, 32.2, 0.2, 10, true, false),
                            walkLeft: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/rolling_left.png"), 0, 0, 32, 32.2, 0.2, 8, true, false),
                            walkRight: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/rolling_right.png"), 0, 0, 32, 32.2, 0.2, 8, true, false),
                            deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/death_left.png"), 0, 0, 32, 32.2, 0.125, 12, false, false),
                            deathRight: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/death_right.png"), 0, 0, 32, 32.2, 0.125, 12, false, false),
                            dmgLeft: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/dmg_left.png"), 0, 0, 32, 32.2, 0.125, 8, false, false),
                            dmgRight: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/dmg_right.png"), 0, 0, 32, 32.2, 0.125, 8, false, false),
                            frozen: new Animation(AM.getAsset("./img/ice_cube.png"), 0, 0, 32, 32, 2, 1, false, false)};
    } else if (theColor === 'Green') {
        this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/idle_left.png"), 0, 0, 32, 32.2, 0.2, 10, true, false),
                            idleRight: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/idle_right.png"), 0, 0, 32, 32.2, 0.2, 10, true, false),
                            walkLeft: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/rolling_left.png"), 0, 0, 32, 32.2, 0.2, 8, true, false),
                            walkRight: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/rolling_right.png"), 0, 0, 32, 32.2, 0.2, 8, true, false),
                            deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/death_left.png"), 0, 0, 32, 32.2, 0.125, 12, false, false),
                            deathRight: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/death_right.png"), 0, 0, 32, 32.2, 0.125, 12, false, false),
                            dmgLeft: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/dmg_left.png"), 0, 0, 32, 32.2, 0.125, 8, false, false),
                            dmgRight: new Animation(AM.getAsset("./img/sprites/enemies/green_slime/dmg_right.png"), 0, 0, 32, 32.2, 0.125, 8, false, false),
                            frozen: new Animation(AM.getAsset("./img/ice_cube.png"), 0, 0, 32, 32, 2, 1, false, false)};
    } else {
        this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/idle_left.png"), 0, 0, 32, 32.2, 0.2, 10, true, false),
                            idleRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/idle_right.png"), 0, 0, 32, 32.2, 0.2, 10, true, false),
                            walkLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/rolling_left.png"), 0, 0, 32, 32.2, 0.2, 8, true, false),
                            walkRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/rolling_right.png"), 0, 0, 32, 32.2, 0.2, 8, true, false),
                            deathLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/death_left.png"), 0, 0, 32, 32.2, 0.125, 12, false, false),
                            deathRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/death_right.png"), 0, 0, 32, 32.2, 0.125, 12, false, false),
                            dmgLeft: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/dmg_left.png"), 0, 0, 32, 32.2, 0.125, 8, false, false),
                            dmgRight: new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/dmg_right.png"), 0, 0, 32, 32.2, 0.125, 8, false, false),
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
    if ((playerDistance > -200 && playerDistance < 0) || (playerDistance < 200 && playerDistance > 0)) {
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
};

function Bunny(game, theX, theY, faceRight) {
    this.game = game;
    this.type = "Enemy";
    this.HP = 4;
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

function Player(game) {
    this.game = game;
    this.HP = [2,6];
    this.maxHP = [2,6];
    this.activeHero = 0;
    this.walking = false;
    this.attacking = false;
    this.damaged = false;
    this.jumping = false;
    this.falling = false;
    this.blinkEnabled = false;
    this.blinking = false;
    //this.punching = false;
    this.jumpsLeft = [1, 1];
    this.jumpsMax = [1, 1];
    this.invulnerable = false;
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
                        dmgLeft: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/dmg_left.png"), 0, 0, 64, 64, .2, 5, false, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/dmg_l.png"), 0, 0, 36, 36, .2, 5, false, false)],
                        dmgRight: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/dmg_right.png"), 0, 0, 64, 64, .2, 5, false, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/dmg_r.png"), 0, 0, 36, 36, .2, 5, false, false)],
                        deathLeft: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/death_left.png"), 0, 0, 64, 64, .2, 6, false, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/death_l.png"), 0, 0, 36, 36, .2, 10, false, false)], 
                        deathRight: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/death_right.png"), 0, 0, 64, 64, .2, 6, false, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/death_r.png"), 0, 0, 36, 36, .2, 10, false, false)],
                        blinkLeft: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/blink_left.png"), 0, 0, 32, 32, .2, 14, false, false)],
                        blinkRight: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/blink_right.png"), 0, 0, 32, 32, .2, 14, false, false)],
                        gameOver: [new Animation(AM.getAsset("./img/sprites/heroes/black_mage/death_right.png"), 64, 128, 64, 64, 1, 1, true, false),
                                    new Animation(AM.getAsset("./img/sprites/heroes/monk/death_r.png"), 72, 72, 36, 36, 1, 1, true, false)]};                      
}

Player.prototype.swap = function() {
    if(this.activeHero === 1) {
        this.activeHero = 0;
        this.position = new Position(this.position.left + this.position.width * 0.5 - 64, this.position.bottom - 87,
            this.position.left + this.position.width * 0.5 - 12, this.position.bottom - 40, 24, 40);
    } else {
        this.activeHero = 1;
        this.position = new Position(this.position.left + this.position.width * 0.5 - 31, this.position.bottom - 64,
            this.position.left + this.position.width * 0.5 - 11, this.position.bottom - 62, 22, 62);
    }
}

Player.prototype.update = function() {
    var that = this;
    // ***********************************
    // Updates to state based on key input
    // ***********************************

    // Facing right when left key pressed
    if (this.game.leftKey && !this.game.rightKey && this.faceRight) {
        this.faceRight = false;
    }
    // Facing left when right key pressed
    if (this.game.rightKey && !this.game.leftKey && !this.faceRight) {
        this.faceRight = true;
    }
    // If left or right key pressed, set walking; else set idle
    (this.game.leftKey || this.game.rightKey) ? this.walking = true : this.walking = false;

    // Swap key 'Z' pressed
    if (this.game.zKey && this.damaged === false) {
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
    } 
    // else if (this.game.xKey && this.activeHero === 1) { // punch attack
    //     this.punching = true;
    // }

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
            if (collisionDetector(that.position, entity.position)) {
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
    if (this.game.space && this.jumpsLeft[this.activeHero] > 0) this.jumping = true;

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
        this.jumpsLeft[this.activeHero] = this.jumpsMax[this.activeHero];
    } else if (this.position.bottom + (this.velocityY + this.game.gravity) * this.game.clockTick >= currentPlatform.ground &&
                this.velocityY > 0) {
        this.position.moveTo(this.position.left, currentPlatform.ground - this.position.height);
        this.velocityY = 0;
        this.falling = false;
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
            if (!that.invulnerable) {
                that.HP[that.activeHero] -= 1;
                that.damaged = true;
                that.invulnerable = true;
            }
        } 
    })

    Entity.prototype.update.call(this);
}

Player.prototype.draw = function(ctx) {
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
        if (this.faceRight) {
            if(!this.animations.dmgRight[this.activeHero].isDone()) this.animations.dmgRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
            else {
                this.invulnerable = false;
                this.damaged = false;
                this.animations.dmgRight[this.activeHero].elapsedTime = 0;
            }
        } else {
            if(!this.animations.dmgLeft[this.activeHero].isDone()) this.animations.dmgLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
            else {
                this.invulnerable = false;
                this.damaged = false;
                this.animations.dmgLeft[this.activeHero].elapsedTime = 0;
            }
        }
    } else if (this.walking) {
        if (this.faceRight) {
            this.animations.walkRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        } else {
            this.animations.walkLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        }
    } else {
        if (this.faceRight) {
            this.animations.idleRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        } else {
            this.animations.idleLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        }
    }

    if (this.blinking) {
        if (this.faceRight) {
            this.animations.blinkRight[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        } else {
            this.animations.blinkLeft[this.activeHero].drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        }
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
        if (this.game.player.HP[this.game.player.activeHero] < this.game.player.maxHP[this.game.player.activeHero]) {
            this.game.player.HP[this.game.player.activeHero]++;
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
    this.newStage = true;
    this.currentStage = 0;
    this.startNum = 0;
    this.key1 = new Key(this.game, 551, 987, 0);
    this.key2 = new Key(this.game, 1880, 90, 1);
    this.power1 = new PowerUp(this.game, 55, 95);
    this.power2 = new PowerUp(this.game, 90, 90);
    this.power3 = new PowerUp(this.game, 32, 992);
    this.stages = [this.createStage(0), this.createStage(1), this.createStage(2)];
    
    this.game.player.position.moveTo(this.stages[this.currentStage].getPosition(this.startNum).left, this.stages[this.currentStage].getPosition(this.startNum).top);
}

SceneManager.prototype.gameOver = function() {
    this.game.background = new Background(this.game, AM.getAsset("./img/sprites/backgrounds/game_over.png"), 0, 1000, 0, 452, 1000, 452);
    this.game.entities[0] = this.game.background;
    this.game.entities.length = 3;
    this.game.player.position.moveTo(500 - this.game.player.position.width * 0.5, 452 - this.game.player.height);
    this.game.camera.update();
    this.game.platforms.length = 0;
    this.game.walls.length = 0;
    this.game.items.length = 0;
    this.game.doors.length = 0;
    this.game.enemies.length = 0;
    this.game.player.gameOver = true;
}

SceneManager.prototype.update = function() {
    if (this.newStage) {
        // Remove all entities from the gameManager
        /*
        var entityCount = this.game.entities.length;
        for (var i = 0; i < entityCount; i++) {
            if (this.game.entities[i] !== this && this.game.entities[i] !== this.game.player && this.game.entities[i] !== this.game.camera) this.game.entities[i].removeFromWorld = true;
        }
        */
        var updateStage = this.createStage(this.currentStage);
        this.game.background = this.stages[this.currentStage].background;

        this.game.entities = [this.game.background, this.game.player, this.game.camera];
        this.game.platforms.length = 0;
        this.game.walls.length = 0;
        this.game.items.length = 0;
        this.game.doors.length = 0;
        this.game.enemies.length = 0;

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
                    [new Wall(this.game, null, 262, 664, 338, 96), new Wall(this.game, null, 262, 760, 18, 224),
                    new Wall(this.game, null, 390, 390, 18, 256), new Wall(this.game, null,646, 870, 18, 160),
                    new Wall(this.game, null, 1030, 234, 18, 412), new Wall(this.game, null, 1030, 646, 1280, 18), 
                    new Wall(this.game, null, 1030, 934, 274, 96), new Wall(this.game, null, 1190, 664, 370, 128), 
                    new Wall(this.game, null, 1798, 774, 402, 256), new Wall(this.game, null, 2182, 664, 18, 32),
                    new Wall(this.game, null, 408, 390, 622, 18)],
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
                    new Bunny(this.game, 2128, 64, false)], [new Door(this.game, 2304, 72, 1, 0)], [this.key1, this.power1, this.power3],
                    [new Position(25, 575, 25, 575, 1, 1), new Position (2260, 72, 2260, 72, 1, 1), new Position(2281, 962, 2281, 962, 1, 1)]);
    } else if (theStageNum === 1) {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/lv2.png"), 24, 1190, 24, 1958, 1216, 1984),
                    [new Wall(this.game, null, 24, 24, 366, 160), new Wall(this.game, null, 390, 24, 242, 384), 
                    new Wall(this.game, null, 24, 390, 192, 242), new Wall(this.game, null, 390, 408, 18, 320), 
                    new Wall(this.game, null, 646, 518, 434, 274), new Wall(this.game, null, 486, 934, 18, 320), 
                    new Wall(this.game, null, 294, 1190, 82, 64), new Wall(this.game, null, 24, 1446, 192, 512), 
                    new Wall(this.game, null, 216, 1574, 224, 384), new Wall(this.game, null, 440, 1702, 192, 256), 
                    new Wall(this.game, null, 632, 1830, 224, 128)], [new Platform(this.game, null, 630, 133, 162, 18), 
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
                    new Bunny(this.game, 1073, 1728, false), new Bunny(this.game, 47, 320, false),
                    new Bunny(this.game, 656, 1503, false), new Bunny(this.game, 400, 448, false),
                    new Bunny(this.game, 592, 1184, false), new Bunny(this.game, 48, 735, false),
                    new Bunny(this.game, 304, 1119, false), new Bunny(this.game, 656, 928, false)],
                    [new Door(this.game, 25, 1384, 0, 1), new Door(this.game, 25, 328, 2, 0)], [],
                    [new Position(32, 1378, 32, 1378, 1, 1), new Position(32, 323, 32, 323, 1, 1)]);
    } else {
        newStage = new Stage(new Background(this.game, AM.getAsset("./img/sprites/backgrounds/lv3.png"), 24, 2310, 24, 1318, 2336, 1344),
                    [new Wall(this.game, null, 262, 678, 18, 242), new Wall(this.game, null, 358, 134, 18, 562), 
                    new Wall(this.game, null, 376, 230, 1454, 242), new Wall(this.game, null, 646, 902, 82, 192), 
                    new Wall(this.game, null, 422, 1094, 626, 224), new Wall(this.game, null, 1062, 774, 370, 178), 
                    new Wall(this.game, null, 1606, 902, 82, 192), new Wall(this.game, null, 1446, 1094, 562, 224), 
                    new Wall(this.game, null, 1830, 134, 18, 786)], [new Platform(this.game, null, 24, 134, 224, 18), 
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
                    [new Door(this.game, 2304, 328, 1, 1)], [this.key2, this.power2], [new Position(2305, 323, 2305, 323, 1, 1)]);
    }
    return newStage;
}

// Start of actual game
var AM = new AssetManager();

// background image
AM.queueDownload("./img/sprites/backgrounds/lv1.png");
AM.queueDownload("./img/sprites/backgrounds/lv2.png");
AM.queueDownload("./img/sprites/backgrounds/lv3.png");
AM.queueDownload("./img/sprites/backgrounds/game_over.png");

// Platform image
AM.queueDownload("./img/sprites/platforms/small_grass_tile.png");

// BlackMage images
AM.queueDownload("./img/sprites/heroes/black_mage/idle_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/walk_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/idle_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/walk_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/jump.png");
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

// Bunny Sprites
AM.queueDownload("./img/sprites/enemies/bunny/death_l.png");
AM.queueDownload("./img/sprites/enemies/bunny/death_r.png");
AM.queueDownload("./img/sprites/enemies/bunny/idle_l.png");
AM.queueDownload("./img/sprites/enemies/bunny/idle_r.png");
AM.queueDownload("./img/sprites/enemies/bunny/atk_l.png");
AM.queueDownload("./img/sprites/enemies/bunny/atk_r.png");
AM.queueDownload("./img/sprites/enemies/bunny/medium_rock.png");
AM.queueDownload("./img/bunny_ice.png");

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
    gameEngine.player = new Player(gameEngine);
    gameEngine.camera = new Camera(gameEngine);
    gameEngine.addEntity(gameEngine.player);
    gameEngine.addEntity(gameEngine.camera);

    gameEngine.sceneManager = new SceneManager(gameEngine);
    gameEngine.sceneManager.update();
    gameEngine.start();
    

    /*
    gameEngine.addEntity(gameEngine.background);
    gameEngine.addEntity(gameEngine.player);
    gameEngine.addEntity(gameEngine.camera);

    // example animation entities
    gameEngine.addEntity(new BMDamage(gameEngine));
    gameEngine.addEntity(new BMDeath(gameEngine));
    gameEngine.addEntity(new BMJump(gameEngine));
    gameEngine.addEntity(new ControlsText(gameEngine));
    gameEngine.addEntity(new EnemyDamage(gameEngine));
    gameEngine.addEntity(new EnemyIdle(gameEngine));
    gameEngine.addEntity(new EnemyRoll(gameEngine));

    // collision temporaries
    gameEngine.addEntity(new Platform(gameEngine, AM.getAsset("./img/grass_platform.png"), 450, 310, 200, 25));
    gameEngine.addEntity(new RedSlime(gameEngine, 450, 100, false));
    gameEngine.addEntity(new RedSlime(gameEngine, 800, 100, false));
    */
})