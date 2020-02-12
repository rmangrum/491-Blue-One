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
    return {ground: highGround, theLeft: leftBound, theRight: rightBound};
}

function collisionDetector(position1, position2) {
    if (position1.left < position2.right && position1.right > position2.left && position1.top < position2.bottom && position1.bottom > position2.top) {
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

function Background(game, spritesheet, width, ground, height) {
    this.top = 0;
    this.ground = ground;
    this.bottom = height;
    this.left = 0;
    this.right = width;
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
    this.ctx = game.ctx;
}

Platform.prototype.draw = function (ctx) {
    var cameraOffsetX = this.position.left - this.game.camera.x;
    var cameraOffsetY = this.position.top - this.game.camera.y;

    if (this.game.showOutlines) {
        ctx.save();
        ctx.strokeStyle = 'Red';   
        ctx.strokeRect(cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
        ctx.restore();
    }
    ctx.drawImage(this.spritesheet, cameraOffsetX, cameraOffsetY, this.position.width, this.position.height);
}

Platform.prototype.update = function () {
    // Empty
};

// STOPPING POINT - DEBUGGING FIREBALL COLLISION/HIT BOX
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
    
    if (collision || this.position.right > this.game.background.right || this.position.left < this.game.background.left || this.position.right > this.game.camera.x + this.game.ctx.width * 1.5 || this.position.left < this.game.camera.x - this.game.ctx.width * 0.5) {
        this.removeFromWorld = true;
    } else {
        this.position.moveBy(this.velocityX * this.game.clockTick, 0);
    }
}

// Frostbolt
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
            entity.isHit = true;
            if (that.velocityX > 0) entity.isHitRight = true;
        }
    });

    this.game.platforms.forEach(function(entity) {
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
    this.animations = {idleLeft: new Animation(AM.getAsset("./img/sprites/enemies/red_slime/idle.png"), 0, 0, 32, 32, 0.2, 10, true, false)};
    this.game = game;
    
    this.isHit = false;
    this.isHitRight = false;
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
}

RedSlime.prototype.update = function () {

    var currentPlatform = getGround(this.position, this.game);

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

    if(this.state === 'walk') {
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

    // Stay on background
    if (this.position.left < this.game.background.left) this.position.moveTo(this.game.background.left, this.position.top);
    if (this.position.right > this.game.background.right) this.position.moveTo(this.game.background.right - this.position.width, this.position.top);
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
                                new Position(this.position.left + this.position.width * 0.5 - 16, this.position.top + this.position.height * 0.5 - 16,
                                this.position.left + this.position.width * 0.5 - 6, this.position.top + this.position.height * 0.5 - 6, 12, 12), true));
        }
    }

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
                                new Position(this.position.left + this.position.width * 0.5 - 32, this.position.top + this.position.height * 0.5 - 32,
                                this.position.left + this.position.width * 0.5 - 6, this.position.top + this.position.height * 0.5 - 6, 12, 12), true));
        }
    }

    // Spacebar pressed
    if (this.game.space && !this.falling) this.jumping = true;

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
    if (this.jumping && !this.falling) {
        this.velocityY = -1200;
        this.position.moveBy(0, -1);
        this.jumping = false;
    }

    // Falling
    var currentPlatform = getGround(this.position, this.game);

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

    // Final position update
    this.position.moveBy(this.velocityX * this.game.clockTick, this.velocityY * this.game.clockTick);

    // Collision checks
    // ****************
    // Left background bound
    if (this.position.left < this.game.background.left) {
        this.position.moveTo(this.game.background.left, this.position.top);
    }

    // Right background bound
    if (this.position.right > this.game.background.right) {
        this.position.moveTo(this.game.background.right - this.position.width, this.position.top);
    }

    var collision = false;
    var that = this;
    this.game.enemies.forEach(function(entity) {
        if (collisionDetector(that.position, entity.position)) {
            collision = true;
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
        ctx.strokeRect(this.position.left - this.game.camera.x, this.position.top - this.game.camera.y, this.position.width, this.position.height);
        ctx.restore();
    }
}

// example entity to show the damage animation
function BMDamage(game) {
    this.damage_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/dmg_right.png"), 0, 0, 64, 64, .3, 5, true, false);
    this.takingDmg = true;
    Entity.call(this, game, 0, 0);
}

BMDamage.prototype = new Entity();
BMDamage.prototype.constructor = BMDamage;

BMDamage.prototype.update = function () {
}

BMDamage.prototype.draw = function (ctx) {
    if (this.takingDmg) {
        this.damage_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
    }
    Entity.prototype.draw.call(this);
}

// example entity to show the death animation
function BMDeath(game) {
    this.death_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/death_left.png"), 0, 0, 64, 64, .3, 6, true, false);
    this.dead = true;
    Entity.call(this, game, 100, 0);
}

BMDeath.prototype = new Entity();
BMDeath.prototype.constructor = BMDeath;

BMDeath.prototype.update = function () {
}

BMDeath.prototype.draw = function (ctx) {
    if (this.dead) {
        this.death_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
    }
    Entity.prototype.draw.call(this);
}

// example entity for the jump animation if we cant get it working on BlackMage
function BMJump(game) {
    this.jump_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/jump.png"), 0, 0, 64, 64, .3, 7, true, false);
    this.jumping = true;
    Entity.call(this, game, 200, 0);
}

BMJump.prototype = new Entity();
BMJump.prototype.constructor = BMJump;

BMJump.prototype.update = function () {
}

BMJump.prototype.draw = function (ctx) {
    if (this.jumping) {
        this.jump_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
    }
    Entity.prototype.draw.call(this);
}

BMDeath.prototype.draw = function (ctx) {
    if (this.dead) {
        this.death_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
    }
    Entity.prototype.draw.call(this);
}

// example entity for the jump animation if we cant get it working on BlackMage
function BMJump(game) {
    this.jump_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/jump.png"), 0, 0, 64, 64, .3, 7, true, false);
    this.jumping = true;
    Entity.call(this, game, 200, 0);
}

BMJump.prototype = new Entity();
BMJump.prototype.constructor = BMJump;

BMJump.prototype.update = function () {
}

BMJump.prototype.draw = function (ctx) {
    if (this.jumping) {
        this.jump_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
    }
    Entity.prototype.draw.call(this);
}

// example entity for the enemy damage animation
function EnemyDamage(game) {
    this.enemy_damage_animation = new Animation(AM.getAsset("./img/sprites/enemies/red_slime/damage.png"), 0, 0, 32, 32, .3, 8, true, false);
    this.damage = true;
    Entity.call(this, game, 300, 0);
}

EnemyDamage.prototype = new Entity();
EnemyDamage.prototype.constructor = EnemyDamage;

EnemyDamage.prototype.update = function () {
}

EnemyDamage.prototype.draw = function (ctx) {
    if (this.damage) {
        this.enemy_damage_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2.5);
    }
    Entity.prototype.draw.call(this);
}

// example entity for the enemy idle animation
function EnemyIdle(game) {
    this.enemy_idle_animation = new Animation(AM.getAsset("./img/sprites/enemies/green_slime/idle.png"), 0, 0, 32, 32, .3, 8, true, false);
    this.idle = true;
    Entity.call(this, game, 350, 0);
}

EnemyIdle.prototype = new Entity();
EnemyIdle.prototype.constructor = EnemyIdle;

EnemyIdle.prototype.update = function () {
}

EnemyIdle.prototype.draw = function (ctx) {
    if (this.idle) {
        this.enemy_idle_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2.5);
    }
    Entity.prototype.draw.call(this);
}

// example entity for the enemy roll animation
function EnemyRoll(game) {
    this.enemy_roll_animation = new Animation(AM.getAsset("./img/sprites/enemies/blue_slime/rolling.png"), 0, 0, 32, 32, .3, 8, true, false);
    this.roll = true;
    Entity.call(this, game, 400, 0);
}

EnemyRoll.prototype = new Entity();
EnemyRoll.prototype.constructor = EnemyRoll;

EnemyRoll.prototype.update = function () {
}

EnemyRoll.prototype.draw = function (ctx) {
    if (this.roll) {
        this.enemy_roll_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2.5);
    }
    Entity.prototype.draw.call(this);
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

// Start of actual game
var AM = new AssetManager();

// background image
AM.queueDownload("./img/background.jpg");
AM.queueDownload("./img/background_tiled.jpg");

// Platform image
AM.queueDownload("./img/grass_platform.png");

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
    
    gameEngine.background = new Background(gameEngine, AM.getAsset("./img/background_tiled.jpg"), 1797, 412, 468);
    gameEngine.player = new Player(gameEngine);
    gameEngine.camera = new Camera(gameEngine);

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
});