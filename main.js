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
            this.elapsedTime = 0;
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

function getGround(rect, game) {
    var highGround = game.background.ground;
    var leftBound = game.background.left;
    var rightBound = game.background.right;

    game.platforms.forEach(function(entity) {
        if (entity.position.top >= rect.bottom) {
            if ((rect.left >= entity.position.left && rect.right <= entity.position.right) || 
                    (rect.left <= entity.position.left && rect.right >= entity.position.left) ||
                    (rect.right >= entity.position.right && rect.left <= entity.position.right)) {
                if (entity.position.top <= highGround) {
                    highGround = entity.position.top;
                    leftBound = entity.position.left;
                    rightBound = entity.position.right;
                } 
            }
        }
    })

    game.walls.forEach(function(entity) {
        if (entity.position.top >= rect.bottom) {
            if ((rect.left >= entity.position.left && rect.right <= entity.position.right) || 
                    (rect.left <= entity.position.left && rect.right >= entity.position.left) ||
                    (rect.right >= entity.position.right && rect.left <= entity.position.right)) {
                if (entity.position.top <= highGround) {
                    highGround = entity.position.top;
                    leftBound = entity.position.left;
                    rightBound = entity.position.right;
                } 
            }
        }
    })

    return {ground: highGround, theLeft: leftBound, theRight: rightBound};
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
        return -Math.sqrt(disX * disX + disY + disY);
    } else if (disX > 0) {
        return Math.sqrt(disX * disX + disY + disY);
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
    this.y = this.game.player.position.top - (this.game.ctx.canvas.height * 0.75) + 32;
}

Camera.prototype.update = function () {
    // Update camera position
    this.x = this.game.player.position.left - (this.game.ctx.canvas.width * 0.5) + 32; // 32 offset for half of x2 scale player animation frame
    this.y = this.game.player.position.top - (this.game.ctx.canvas.height * 0.75) + 32; // 32 offset for half of x2 scale player animation frame
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
    this.ctx = game.ctx;
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
    
    //var pattern = ctx.createPattern(this.spritesheet, 'repeat');
    //ctx.fillStyle = pattern;
    //ctx.fillRect(cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
    

    ctx.fillStyle = 'Teal';
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

    ctx.fillStyle = 'LightSlateGrey';
    ctx.fillRect(cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
    ctx.restore();
}

Wall.prototype.update = function () {
    // Empty
};

// Projectile Entity
function Fireball(game, sprite, goingRight, position, player) {
    this.type = "Projectile";
    this.game = game;
    this.position = position;
    this.fireball = true;
    this.velocityX = 750;
    this.animation = new Animation(sprite, 0, 0, 32, 32, 0.125, 4, true, false);
    if (!goingRight) {
        this.velocityX *= -1;
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

    this.animation.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 1);
}

Fireball.prototype.update = function () {
    var collision = false;
    var that = this;
    this.game.enemies.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            collision = true;
            entity.isHit = true;
            if (that.velocityX > 0) entity.isHitRight = true;
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
    
    if (collision || this.position.right > this.game.background.right
                || this.position.left < this.game.background.left 
                || this.position.right > this.game.camera.x + this.game.ctx.width * 1.5 
                || this.position.left < this.game.camera.x - this.game.ctx.width * 0.5) {
        this.removeFromWorld = true;
    } else {
        this.position.moveBy(this.velocityX * this.game.clockTick, 0);
    }
}

// Frostbolt Entity
function Frostbolt(game, sprite, goingRight, position, player) {
    this.type = "Projectile";
    this.game = game;
    this.position = position;
    this.frostbolt = true;
    this.velocityX = 750;
    this.animation = new Animation(sprite, 0, 0, 32, 32, 0.125, 4, true, false);
    if (!goingRight) {
        this.velocityX *= -1;
    }
}

Frostbolt.prototype.draw = function (ctx) {
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

Frostbolt.prototype.update = function () {
    var collision = false;
    var that = this;
    this.game.enemies.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            collision = true;
            entity.state = 'frozen';
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
    
    if (collision || this.position.right > this.game.background.right 
                || this.position.left < this.game.background.left 
                || this.position.right > this.game.camera.x + this.game.ctx.width * 1.5 
                || this.position.left < this.game.camera.x - this.game.ctx.width * 0.5) {
        this.removeFromWorld = true;
    } else {
        this.position.moveBy(this.velocityX * this.game.clockTick, 0);
    }
}

// Slime test enemy
function RedSlime(game, theX, theY, faceRight) {
    this.type = "Enemy";
    this.HP = 4;
    this.state = 'walk';
    this.position = new Position(theX, theY, theX + 20, theY + 45, 24, 20);
    this.faceRight = faceRight;
    this.velocityX = 0;
    this.velocityY = 0;
    this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/idle.png"), 0, 0, 32, 32, 0.2, 10, true, false),
                       frozen: new Animation(AM.getAsset("./img/ice_cube.png"), 0, 0, 32, 32, 2, 1, false, false)};
    this.game = game;
    this.isHit = false;
    this.isHitRight = false;
    this.isChasing = false;
}

RedSlime.prototype.draw = function (ctx) {
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

    if (this.state === 'idle' && !this.faceRight) {
        this.animations.idleLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
    } else { // Placeholder
        this.animations.idleLeft.drawFrame(this.game.clockTick, ctx, drawOffsetX, drawOffsetY, 2);
    }
    if (this.state === 'frozen') {
       this.animations.frozen.drawFrame(this.game.clockTick, ctx, drawOffsetX + 16, drawOffsetY + 36, 1);
    }
}

RedSlime.prototype.update = function () {

    var currentPlatform = getGround(this.position, this.game);
    var that = this;

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
        if (this.faceRight && this.position.right < currentPlatform.theRight) {
            this.velocityX = 50;
        } else {
            this.faceRight = false;
        }
        if (!this.faceRight && this.position.left > currentPlatform.theLeft) {
            this.velocityX = -50;
        } else {
            this.faceRight = true;
        }
    }

    if (this.state === 'frozen') {
        this.velocityX = 0;
        this.velocityY = 0;
        if (this.animations.frozen.isDone()) {
            this.animations.frozen.elapsedTime = 0;
            this.state = 'walk';
        }
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

    if (this.isChasing) {
        // move right
        if (playerDistance > -200 && playerDistance < -32) {
            this.faceRight = true;
            this.velocityX = 60;
        } 
        // move left
        if (playerDistance < 200 && playerDistance > 32) {
            this.faceRight = false;
            this.velocityX = -60;
        }
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

function Player(game) {
    this.HP = 2;
    this.inactiveHP = 6;
    this.firstActive = true;
    this.walking = false;
    this.attacking = false;
    this.damaged = false;
    this.jumping = false;
    this.falling = false;
    this.jumpsLeft = 2;
    this.position = new Position(0, 320, 52, 367, 24, 40);
    this.faceRight = true;
    this.velocityX = 0;
    this.velocityY = 0;
    this.firstAnimations = {idleLeft: new Animation(AM.getAsset("./img/sprites/heroes/black_mage/idle_left.png"), 0, 0, 64, 64, .2, 1, true, false),
                            idleRight: new Animation(AM.getAsset("./img/sprites/heroes/black_mage/idle_right.png"), 0, 0, 64,  64, .2, 1, true, false),
                            walkLeft: new Animation(AM.getAsset("./img/sprites/heroes/black_mage/walk_left.png"), 0, 0, 64, 64, .2, 2, true, false),
                            walkRight: new Animation(AM.getAsset("./img/sprites/heroes/black_mage/walk_right.png"), 0, 0, 64, 64, .2, 2, true, false),
                            dmgLeft: new Animation(AM.getAsset("./img/sprites/heroes/black_mage/dmg_left.png"), 0, 0, 64, 64, .2, 5, false, false),
                            dmgRight: new Animation(AM.getAsset("./img/sprites/heroes/black_mage/dmg_right.png"), 0, 0, 64, 64, .2, 5, false, false),
                            deathLeft: new Animation(AM.getAsset("./img/sprites/heroes/black_mage/death_left.png"), 0, 0, 64, 64, .2, 6, false, false), 
                            deathRight: new Animation(AM.getAsset("./img/sprites/heroes/black_mage/walk_right.png"), 0, 0, 64, 64, .2, 6, false, false)};
    this.secondAnimations = {};
    this.game = game;
}

Player.prototype.update = function() {
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

    // Attack key 'X' pressed
    if (this.game.xKey) {
        var isFireball = false;
        this.game.projectiles.forEach(function(entity) {
            if (entity.fireball) isFireball = true;
        })
        if (!isFireball) {
            var sprite = AM.getAsset("./img/sprites/heroes/black_mage/fireball_right.png");
            if (!this.faceRight) {
                sprite = AM.getAsset("./img/sprites/heroes/black_mage/fireball_left.png");
            }
            this.game.addEntity(new Fireball(this.game, sprite, this.faceRight, 
                                new Position(this.position.left + this.position.width * 0.5 - 16,
                                             this.position.top + this.position.height * 0.5 - 16,
                                             this.position.left + this.position.width * 0.5 - 6, 
                                             this.position.top + this.position.height * 0.5 - 6,
                                             12, 12), true));
        }
    }

    // Attack key 'C' Pressed
    if (this.game.cKey) {
        var isFrostbolt = false;
        this.game.projectiles.forEach(function(entity) {
            if (entity.frostbolt) isFrostbolt = true;
        })
        if (!isFrostbolt) {
            var sprite = AM.getAsset("./img/sprites/heroes/black_mage/frostbolt_right.png");
            if (!this.faceRight) {
                sprite = AM.getAsset("./img/sprites/heroes/black_mage/frostbolt_left.png");
            }
            this.game.addEntity(new Frostbolt(this.game, sprite, this.faceRight,
                                new Position(this.position.left + this.position.width * 0.5 - 32,
                                             this.position.top + this.position.height * 0.5 - 32,
                                             this.position.left + this.position.width * 0.5 - 6,
                                             this.position.top + this.position.height * 0.5 - 6,
                                             12, 12), true));
        }
    }

    // Spacebar pressed
    if (this.game.space && this.jumpsLeft > 0) this.jumping = true;

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
    if (this.jumping && this.jumpsLeft > 0) {
        this.velocityY = -1200;
        this.position.moveBy(0, -1);
        this.jumping = false;
        this.jumpsLeft--;
    }

    // Falling
    var currentPlatform = getGround(this.position, this.game);

    // Falling checks
    if (this.position.bottom === currentPlatform.ground) {
        this.velocityY = 0;
        this.falling = false;
        this.jumpsLeft = 2;
    } else if (this.position.bottom + (this.velocityY + this.game.gravity) * this.game.clockTick >= currentPlatform.ground &&
                this.velocityY > 0) {
        this.position.moveTo(this.position.left, currentPlatform.ground - this.position.height);
        this.velocityY = 0;
        this.falling = false;
        this.jumpsLeft = 2;
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

    // Top background bound
    if (this.position.top < this.game.background.ceiling) {
        this.position.moveTo(this.position.left, this.game.background.ceiling);
        this.velocityY = 0;
    }

    var that = this;

    // Wall collision
    this.game.walls.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position) && that.position.bottom > entity.position.top) {
            if (that.position.left < entity.position.left) that.position.moveTo(entity.position.left - that.position.width, that.position.top);
            if (that.position.right > entity.position.right) that.position.moveTo(entity.position.right, that.position.top);
        } else if (collisionDetector(that.position, entity.position) && that.position.bottom > entity.position.bottom) {
            that.position.moveTo(that.position.left, entity.ceiling);
            that.velocityY = 0;
        }
    });

    this.game.enemies.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            entity.isHit = true;
            if (that.position.left < entity.position.left) {
                entity.isHitRight = true;
                that.position.moveBy(-5, 0);
            } else {
                that.position.moveBy(5, 0);
            }
        } 
    })

    Entity.prototype.update.call(this);
}

Player.prototype.draw = function(ctx) {
    var cameraOffsetX = this.position.drawX - this.game.camera.x;
    var cameraOffsetY = this.position.drawY - this.game.camera.y;

    if (this.walking) {
        if (this.faceRight) {
            this.firstAnimations.walkRight.drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        } else {
            this.firstAnimations.walkLeft.drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        }
    } else {
        if (this.faceRight) {
            this.firstAnimations.idleRight.drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
        } else {
            this.firstAnimations.idleLeft.drawFrame(this.game.clockTick, ctx, cameraOffsetX, cameraOffsetY, 2);
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
    this.stages = [];
    this.currentStage = 0;
    this.startNum = 2;
}

SceneManager.prototype.getScene = function() {
    // ****************************
    // Load entities for new stage
    // ****************************

    // Background
    this.game.background = this.stages[this.currentStage].background;
    this.game.addEntity(this.game.background);

    // Player
    this.game.addEntity(this.game.player);
    this.game.player.position.moveTo(this.stages[this.currentStage].getPosition(this.startNum).left, 
                                    this.stages[this.currentStage].getPosition(this.startNum).top);

    // Camera
    this.game.addEntity(this.game.camera);

    // Walls
    for (var i = 0; i < this.stages[this.currentStage].walls.length; i++) {
        this.game.addEntity(this.stages[this.currentStage].walls[i]);
    }

    // Platforms
    for (var i = 0; i < this.stages[this.currentStage].platforms.length; i++) {
        this.game.addEntity(this.stages[this.currentStage].platforms[i]);
    }

    // Enemies
    for (var i = 0; i < this.stages[this.currentStage].enemies.length; i++) {
        this.game.addEntity(this.stages[this.currentStage].enemies[i]);
    }

    // Doors
    for (var i = 0; i < this.stages[this.currentStage].doors.length; i++) {
        this.game.addEntity(this.stages[this.currentStage].doors[i]);
    }

    // Items
    for (var i = 0; i < this.stages[this.currentStage].items.length; i++) {
        this.game.addEntity(this.stages[this.currentStage].items[i]);
    }
}

SceneManager.prototype.update = function() {
    if (this.newStage) {
        // Remove all entities from the gameManager
        var entityCount = this.game.entities.length;
        for (var i = 0; i < entityCount; i++) {
            if (this.game.entities[i] !== this) this.game.entities[i].removeFromWorld = true;
        }
        this.game.platforms = [];
        this.game.walls = [];
        this.game.items = [];

        // Load new entities
        this.getScene();
        this.newStage = false;
    }
}

SceneManager.prototype.draw = function(ctx) {
    // Loading Screen?
}

// Start of actual game
var AM = new AssetManager();

// background image
AM.queueDownload("./img/background.jpg");
AM.queueDownload("./img/background_tiled.jpg");
AM.queueDownload("./img/levels/st1lv1.png");
AM.queueDownload("./img/levels/st1lv2.png");
AM.queueDownload("./img/levels/st1lv3.png");

// Platform image
AM.queueDownload("./img/platforms/grass_platform.png");

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
AM.queueDownload("./img/ice_cube.png");

// example animations for prototype
AM.queueDownload("./img/sprites/heroes/black_mage/dmg_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/death_left.png");
AM.queueDownload("./img/sprites/enemies/red_slime/damage.png");
AM.queueDownload("./img/sprites/enemies/green_slime/idle.png");
AM.queueDownload("./img/sprites/enemies/red_slime/idle.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/rolling.png");

AM.downloadAll(function () {
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");

    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
    gameEngine.start();
    
    gameEngine.sceneManager = new SceneManager(gameEngine);
    gameEngine.player = new Player(gameEngine);
    gameEngine.camera = new Camera(gameEngine);
    //gameEngine.background = new Background(gameEngine, AM.getAsset("./img/background_tiled.jpg"), 1797, 412, 468);

    var grass = AM.getAsset("./img/platforms/grass_platform.png");

    gameEngine.sceneManager.stages.push(new Stage(new Background(gameEngine, AM.getAsset("./img/levels/st1lv1.png"), 24, 2310, 24, 1030, 2336, 1056),
                                        [new Wall(gameEngine, null, 262, 664, 338, 96), new Wall(gameEngine, null, 262, 760, 18, 224),
                                            new Wall(gameEngine, null, 390, 390, 18, 256), new Wall(gameEngine, null,646, 870, 18, 160),
                                            new Wall(gameEngine, null, 1030, 234, 18, 412), new Wall(gameEngine, null, 1030, 646, 1280, 18), 
                                            new Wall(gameEngine, null, 1030, 934, 274, 96), new Wall(gameEngine, null, 1190, 664, 370, 128), 
                                            new Wall(gameEngine, null, 1798, 774, 402, 256), new Wall(gameEngine, null, 2182, 664, 18, 32)],
                                        [new Platform(gameEngine, grass, 24, 646, 832, 18), new Platform(gameEngine, grass, 24, 134, 160, 18),
                                            new Platform(gameEngine, grass, 134, 262, 242, 18), new Platform(gameEngine, grass, 134, 518, 178, 18),
                                            new Platform(gameEngine, grass, 230, 422, 114, 18), new Platform(gameEngine, grass, 390, 870, 256, 18),
                                            new Platform(gameEngine, grass, 408, 390, 622, 18), new Platform(gameEngine, grass, 518, 582, 146, 18),
                                            new Platform(gameEngine, grass, 646, 518, 146, 18), new Platform(gameEngine, grass, 742, 902, 82, 18),
                                            new Platform(gameEngine, grass, 774, 454, 146, 18), new Platform(gameEngine, grass, 806, 774, 274, 18),
                                            new Platform(gameEngine, grass, 1158, 454, 274, 18), new Platform(gameEngine, grass, 1286, 262, 402, 18),
                                            new Platform(gameEngine, grass, 1414, 134, 146, 18), new Platform(gameEngine, grass, 1510, 902, 146, 18),
                                            new Platform(gameEngine, grass, 1798, 390, 274, 18), new Platform(gameEngine, grass, 2086, 134, 224, 18)],
                                        [new RedSlime(gameEngine, 1510, 800, false)], [], [], [new Position(-27, 553, 25, 600, 24, 40), new Position (2230, 39, 2282, 86, 24, 40),
                                        new Position(2229, 937, 2281, 984, 24, 40)]));
    
    gameEngine.sceneManager.stages.push(new Stage(new Background(gameEngine, AM.getAsset("./img/levels/st1lv2.png"), 24, 1190, 24, 1958, 1216, 1984),
                                        [new Wall(gameEngine, null, 24, 24, 366, 160), new Wall(gameEngine, null, 390, 24, 242, 384), 
                                        new Wall(gameEngine, null, 24, 390, 192, 242), new Wall(gameEngine, null, 390, 408, 18, 320), 
                                        new Wall(gameEngine, null, 646, 518, 434, 274), new Wall(gameEngine, null, 486, 934, 18, 320), 
                                        new Wall(gameEngine, null, 294, 1190, 82, 64), new Wall(gameEngine, null, 24, 1446, 192, 512), 
                                        new Wall(gameEngine, null, 216, 1574, 224, 384), new Wall(gameEngine, null, 440, 1702, 192, 256), 
                                        new Wall(gameEngine, null, 632, 1830, 224, 128)], [new Platform(gameEngine, null, 630, 133, 162, 18), 
                                        new Platform(gameEngine, null, 998, 134, 192, 18), new Platform(gameEngine, null, 774, 230, 114, 18), 
                                        new Platform(gameEngine, null, 632, 294, 160, 18), new Platform(gameEngine, null, 632, 390, 352, 18), 
                                        new Platform(gameEngine, null, 408, 518, 96, 18), new Platform(gameEngine, null, 550, 582, 96, 18), 
                                        new Platform(gameEngine, null, 408, 678, 96, 18), new Platform(gameEngine, null, 326, 358, 64, 18), 
                                        new Platform(gameEngine, null, 294, 486, 96, 18), new Platform(gameEngine, null, 216, 582, 96, 18), 
                                        new Platform(gameEngine, null, 230, 710, 160, 18), new Platform(gameEngine, null, 646, 998, 338, 18), 
                                        new Platform(gameEngine, null, 134, 998, 210, 18), new Platform(gameEngine, null, 24, 806, 160, 18), 
                                        new Platform(gameEngine, null, 24, 1126, 192, 18), new Platform(gameEngine, null, 1030, 1126, 160, 18), 
                                        new Platform(gameEngine, null, 24, 1254, 704, 18), new Platform(gameEngine, null, 774, 1382, 210, 18), 
                                        new Platform(gameEngine, null, 614, 1574, 146, 18), new Platform(gameEngine, null, 1030, 1542, 160, 18), 
                                        new Platform(gameEngine, null, 1030, 1798, 160, 18)], [], [], [],
                                        [new Position(-20, 1353, 32, 1400, 24, 40), new Position(-20, 298, 32, 345, 24, 40)]));

        gameEngine.sceneManager.stages.push(new Stage(new Background(gameEngine, AM.getAsset("./img/levels/st1lv3.png"), 24, 2310, 24, 1318, 2336, 1344),
                                        [new Wall(gameEngine, null, 262, 678, 18, 242), new Wall(gameEngine, null, 358, 134, 18, 562), 
                                        new Wall(gameEngine, null, 376, 230, 1454, 242), new Wall(gameEngine, null, 646, 902, 82, 192), 
                                        new Wall(gameEngine, null, 422, 1094, 626, 224), new Wall(gameEngine, null, 1062, 774, 370, 178), 
                                        new Wall(gameEngine, null, 1606, 902, 82, 192), new Wall(gameEngine, null, 1446, 1094, 562, 224), 
                                        new Wall(gameEngine, null, 1830, 134, 18, 786)], [new Platform(gameEngine, null, 24, 134, 224, 18), 
                                        new Platform(gameEngine, null, 166, 230, 82, 18), new Platform(gameEngine, null, 134, 454, 114, 18), 
                                        new Platform(gameEngine, null, 262, 550, 96, 18), new Platform(gameEngine, null, 230, 326, 128, 18), 
                                        new Platform(gameEngine, null, 24, 678, 96, 18), new Platform(gameEngine, null, 134, 902, 128, 18), 
                                        new Platform(gameEngine, null, 280, 902, 192, 18), new Platform(gameEngine, null, 280, 678, 78, 18), 
                                        new Platform(gameEngine, null, 24, 1094, 192, 18), new Platform(gameEngine, null, 1670, 646, 160, 18), 
                                        new Platform(gameEngine, null, 486, 646, 338, 18), new Platform(gameEngine, null, 1848, 134, 96, 18), 
                                        new Platform(gameEngine, null, 2150, 390, 160, 18), new Platform(gameEngine, null, 1062, 614, 370, 18), 
                                        new Platform(gameEngine, null, 1990, 518, 146, 18), new Platform(gameEngine, null, 1848, 646, 160, 18), 
                                        new Platform(gameEngine, null, 2182, 742, 128, 18), new Platform(gameEngine, null, 2054, 806, 82, 18), 
                                        new Platform(gameEngine, null, 1848, 902, 160, 18), new Platform(gameEngine, null, 2182, 1030, 128, 18)],
                                        [], [], [], [new Position(2253, 298, 2305, 345, 24, 40)]));

    gameEngine.addEntity(gameEngine.sceneManager);

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
});