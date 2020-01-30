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

function Background(game, spritesheet) {
    this.x = 0;
    this.y = 0;
    this.spritesheet = spritesheet;
    this.game = game;
    this.ctx = game.ctx;
    // this.ground = 412; not used, placed into gameEngine temporarily
};

Background.prototype.draw = function () {
    this.ctx.drawImage(this.spritesheet, this.x, this.y);
}

Background.prototype.update = function () {
}

// Platform Prototype
function Platform(game, spritesheet, theX, theY, theWidth, theHeight) {
    this.type = 'Platform';
    this.x = theX;
    this.y = theY;
    this.spritesheet = spritesheet;
    this.width = theWidth;
    this.height = theHeight;
    this.game = game;
    this.ctx = game.ctx;
}

Platform.prototype.draw = function () {
    this.ctx.save();
    this.ctx.strokeStyle = 'Red';   
    this.ctx.strokeRect(this.x, this.y, this.width, this.height);
    this.ctx.drawImage(this.spritesheet, this.x, this.y, this.width, this.height);
    this.ctx.restore();
}

Platform.prototype.update = function () {
};

// Slime test enemy
function RedSlime(game, theX, theY, isMobile) {
    this.type = 'Enemy';
    this.xDraw = theX;
    this.yDraw = theY;
    this.xBound = theX + 20;
    this.yBound = theY + 45;
    this.width = 24;
    this.height = 20;
    this.game = game;
    this.ctx = game.ctx;
    this.faceRight = false;
    this.mobile = isMobile;
    this.velocityX = 0;
    this.velocityY = 0;
    this.idle_left_animation = new Animation(AM.getAsset("./img/sprites/enemies/red_slime/idle.png"), 0, 0, 32, 32, 0.2, 10, true, false);
}

RedSlime.prototype.draw = function (ctx) {
    this.ctx.save();
    this.ctx.strokeStyle = 'Red';
    this.ctx.strokeRect(this.xBound, this.yBound, this.width, this.height);
    this.idle_left_animation.drawFrame(this.game.clockTick, ctx, this.xDraw, this.yDraw, 2);
    this.ctx.restore();
}

RedSlime.prototype.update = function () {

    // Check which platform entity will hit first
    var highGround = this.game.ground;
    var leftBound = 0;
    var rightBound = 900;
    var that = this;
    this.game.entities.forEach(function(entity) {
        if (entity.type === 'Platform' && entity.y >= that.yBound + that.height) {
            if ((that.xBound > entity.x && that.xBound + that.width < entity.x + entity.width) || 
                    (that.xBound < entity.x && that.xBound + that.width > entity.x) ||
                    (that.xBound + that.width > entity.x + entity.width && that.xBound < entity.x + entity.width)) {
                if (entity.y <= highGround) {
                    highGround = entity.y;
                    leftBound = entity.x;
                    rightBound = entity.x + entity.width;
                } 
            }
        }
    })

    // Falling checks
    if (this.yBound + this.height >= highGround) {
        this.velocityY = 0;
    } else if (this.yBound + this.height + this.velocityY + this.game.gravity >= highGround) {
        this.yBound = highGround - this.height;
        this.yDraw = this.yBound - 45;
        this.velocityY = 0;
    } else {
        if (this.velocityY + this.game.gravity >= this.game.terminalVelocity) {
            this.velocityY = this.game.terminalVelocity;
        } else {
            this.velocityY += this.game.gravity;
        }
    }

    if(this.mobile) {
        if (this.faceRight && this.xBound + this.width < rightBound) {
            this.velocityX = 0.75;
        } else {
            this.faceRight = false;
        }
        if (!this.faceRight && this.xBound > leftBound) {
            this.velocityX = -0.75;
        } else {
            this.faceRight = true;
        }
    }

    this.xDraw += this.velocityX;
    this.xBound += this.velocityX;
    this.yDraw += this.velocityY;
    this.yBound += this.velocityY;
};

// The initial prototype character:
// Created some boolean variables associated to movement that will change depending on the key pressed
//      a good example of this can be seen with the "jump" that Marriott has in his code,
//      I've put it in BlackMage as a placeholder/reference for now.
function BlackMage(game) {
    this.idle_right_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/idle_right.png"), 0, 0, 64,  64, .2, 1, true, false);
    this.walk_right_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/walk_right.png"), 0, 0, 64, 64, .2, 2, true, false);
    this.idle_left_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/idle_left.png"), 0, 0, 64, 64, .2, 1, true, false);
    this.walk_left_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/walk_left.png"), 0, 0, 64, 64, .2, 2, true, false);
    this.jump_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/jump.png"), 200, 325, 64, 64, .2, 6, false, true);
    this.faceRight = true;
    this.walking = false;
    this.jumping = false;

    this.velocityX = 0;
    this.velocityY = 0;
    
    // Bounding Box parameters
    this.width = 24;
    this.height = 40;
    // End BB

    this.ground = 325;
    Entity.call(this, game, 0, 325);
}

BlackMage.prototype = new Entity();
BlackMage.prototype.constructor = BlackMage;

BlackMage.prototype.update = function () {
    // if blackmage is facing right when the left key is pressed
    if (this.game.leftKey && !this.game.rightKey && this.faceRight) {
        this.faceRight = false;
    }
    // if blackmage is facing left when the right key is pressed
    if (this.game.rightKey && !this.game.leftKey && !this.faceRight) {
        this.faceRight = true;
    }
    // if left/right is pressed blackmage is walking
    if (this.game.leftKey || this.game.rightKey) {
        this.walking = true;
    }

    // test for idle
    if (!this.game.leftKey && !this.game.rightKey) {
        this.walking = false;
        this.velocityX = 0;
    }

    // if spacebar blackmage is jumping
    if (this.game.space) this.jumping = true;

    if (this.walking) {
        // walking and facing right 
        if (this.faceRight) {
            this.velocityX = 3;
        // walking and facing left
        } else {
            this.velocityX = -3;
        }
    }

    if (this.jumping) {
        if (this.jump_animation.isDone()) {
            this.jump_animation.elapsedTime = 0;
            this.jumping = false;
        }
        var jumpDistance = this.jump_animation.elapsedTime / this.jump_animation.totalTime;
        var totalHeight = 120;

        if (jumpDistance > 0.5) jumpDistance = 1 - jumpDistance;

        var height = totalHeight*(-4 * (jumpDistance * jumpDistance - jumpDistance));
        this.y = this.ground - height;
    }

    this.x += this.velocityX;
    this.y += this.velocityY;

    Entity.prototype.update.call(this);
}

// The draw function that checks what the entity is doing and drawing the appropriate animation
BlackMage.prototype.draw = function (ctx) {
    if (this.jumping) {
        this.jump_animation.drawFrame(this.game.clockTick, ctx, this.x + 17, this.y - 34, 2);
    }
    if (this.walking) {
        if (this.faceRight) {
            this.walk_right_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
        } else {
            this.walk_left_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
        }
    } else {
        if (this.faceRight) {
            this.idle_right_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
        } else {
            this.idle_left_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
        }
    }
    Entity.prototype.draw.call(this);

    // Bounding Box draw
    ctx.save();
    ctx.strokeStyle = 'Red';
    ctx.strokeRect(this.x + 52, this.y + 47, this.width, this.height);
    ctx.restore();
}

// example entity to show the damage animation
function BMDamage(game) {
    this.damage_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/damage.png"), 0, 0, 64, 64, .3, 5, true, false);
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
    this.death_animation = new Animation(AM.getAsset("./img/sprites/heroes/black_mage/death.png"), 0, 0, 64, 64, .3, 6, true, false);
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

// Start of actual game
var AM = new AssetManager();

// background image
AM.queueDownload("./img/background.jpg");

// Platform image
AM.queueDownload("./img/grass_platform.png");

// BlackMage images
AM.queueDownload("./img/sprites/heroes/black_mage/idle_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/walk_right.png");
AM.queueDownload("./img/sprites/heroes/black_mage/idle_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/walk_left.png");
AM.queueDownload("./img/sprites/heroes/black_mage/jump.png");

// Slime images
AM.queueDownload("./img/sprites/enemies/blue_slime/idle.png");
AM.queueDownload("./img/sprites/enemies/green_slime/idle.png");
AM.queueDownload("./img/sprites/enemies/red_slime/idle.png");

// example animations for prototype
AM.queueDownload("./img/sprites/heroes/black_mage/damage.png");
AM.queueDownload("./img/sprites/heroes/black_mage/death.png");


AM.downloadAll(function () {
    console.log("starting");
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");

    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
    gameEngine.start();

    gameEngine.addEntity(new Background(gameEngine, AM.getAsset("./img/background.jpg")));
    gameEngine.addEntity(new BlackMage(gameEngine));
    // example animation entities
    gameEngine.addEntity(new BMDamage(gameEngine));
    gameEngine.addEntity(new BMDeath(gameEngine));
    gameEngine.addEntity(new BMJump(gameEngine));
    // collision temporaries
    gameEngine.addEntity(new Platform(gameEngine, AM.getAsset("./img/grass_platform.png"), 450, 310, 200, 25));
    gameEngine.addEntity(new RedSlime(gameEngine, 450, 220, true));
    gameEngine.addEntity(new RedSlime(gameEngine, 800, 200, false));
});