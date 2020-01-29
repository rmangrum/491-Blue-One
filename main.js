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
};

Background.prototype.draw = function () {
    this.ctx.drawImage(this.spritesheet, this.x, this.y);
};

Background.prototype.update = function () {
};


// The initial prototype character:
// Created some boolean variables associated to movement that will change depending on the key pressed
//      a good example of this can be seen with the "jump" that Marriott has in his code,
//      I've put it in BlackMage as a placeholder/reference for now.
function BlackMage(game) {
    this.idle_right_animation = new Animation(AM.getAsset("./img/sprites/black_mage/idle_right.png"), 0, 0, 64,  64, .2, 1, true, false);
    this.walk_right_animation = new Animation(AM.getAsset("./img/sprites/black_mage/walk_right.png"), 0, 0, 64, 64, .2, 2, true, false);
    this.idle_left_animation = new Animation(AM.getAsset("./img/sprites/black_mage/idle_left.png"), 0, 0, 64, 64, .2, 1, true, false);
    this.walk_left_animation = new Animation(AM.getAsset("./img/sprites/black_mage/walk_left.png"), 0, 0, 64, 64, .2, 2, true, false);
    this.jump_animation = new Animation(AM.getAsset("./img/sprites/black_mage/jump.png"), 200, 325, 64, 64, .2, 18, false, true);
    this.walkRight = false;
    this.walkLeft = false;
    this.jumping = false;
    this.radius = 100;
    this.ground = 325;
    Entity.call(this, game, 0, 325);
}

BlackMage.prototype = new Entity();
BlackMage.prototype.constructor = BlackMage;

BlackMage.prototype.update = function () {
    // What keys are being pressed
    if (this.game.space) this.jumping = true;
    if (this.game.aKey) this.walkLeft = true;  
    if (this.game.dKey) this.walkRight = true;

    if (this.jumping) {
        if (this.jump_animation.isDone()) {
            this.jump_animation.elapsedTime = 0;
            this.jumping = false;
        }
        var jumpDistance = this.jump_animation.elapsedTime / this.jump_animation.totalTime;
        var totalHeight = 25;

        if (jumpDistance > 0.5) jumpDistance = 1 - jumpDistance;

        var height = totalHeight*(-20 * (jumpDistance * jumpDistance - jumpDistance));
        this.y = this.ground - height;
    }
    if (this.walkLeft) {
        this.walkLeft = false;
        this.x -= 3.5;
    }
    if (this.walkRight) {
        this.walkRight = false;
        this.x += 3.5;
    }
    Entity.prototype.update.call(this);
}

// The draw function that checks what the entity is doing and drawing the appropriate animation
BlackMage.prototype.draw = function (ctx) {
    if (this.jumping) {
        this.jump_animation.drawFrame(this.game.clockTick, ctx, this.x + 17, this.y - 34, 2);
    }
    if (this.walkLeft) {
        this.walk_left_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
    }
    if (this.walkRight) {
        this.walk_right_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);;
    }
    this.idle_right_animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, 2);
    Entity.prototype.draw.call(this);
}


var AM = new AssetManager();

// background image
AM.queueDownload("./img/background.jpg");

// BlackMage images
AM.queueDownload("./img/sprites/black_mage/idle_right.png");
AM.queueDownload("./img/sprites/black_mage/walk_right.png");
AM.queueDownload("./img/sprites/black_mage/idle_left.png");
AM.queueDownload("./img/sprites/black_mage/walk_left.png");
AM.queueDownload("./img/sprites/black_mage/jump.png");


AM.downloadAll(function () {
    console.log("starting");
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");

    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
    gameEngine.start();

    gameEngine.addEntity(new Background(gameEngine, AM.getAsset("./img/background.jpg")));
    gameEngine.addEntity(new BlackMage(gameEngine));

    
});