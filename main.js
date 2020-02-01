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
    var highGround = game.ground;

    // Grab these from the background later
    var leftBound = 0;
    var rightBound = 900;

    game.entities.forEach(function(entity) {
        if (entity.type === 'Platform' && entity.rect.y >= rect.y + rect.height) {
            if ((rect.x >= entity.rect.x && rect.x + rect.width <= entity.rect.x + entity.rect.width) || 
                    (rect.x <= entity.rect.x && rect.x + rect.width >= entity.rect.x) ||
                    (rect.x + rect.width >= entity.rect.x + entity.rect.width && rect.x <= entity.rect.x + entity.rect.width)) {
                if (entity.rect.y <= highGround) {
                    highGround = entity.rect.y;
                    leftBound = entity.rect.x;
                    rightBound = entity.rect.x + entity.rect.width;
                } 
            }
        }
    })
    return [highGround, leftBound, rightBound];
}

function collisionDetector(rect1, rect2) {
    if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y){
        return true;
    }
    return false;
}

function Background(game, spritesheet) {
    this.rect = {x: 0, y: 0, width: 900, height: 412};
    this.spritesheet = spritesheet;
    this.game = game;
    this.ctx = game.ctx;
};

Background.prototype.draw = function () {
    this.ctx.drawImage(this.spritesheet, this.rect.x, this.rect.y);
}

Background.prototype.update = function () {
}

// Platform Prototype
function Platform(game, spritesheet, theX, theY, theWidth, theHeight) {
    this.type = 'Platform';
    this.rect = {x: theX, y: theY, width: theWidth, height: theHeight};
    this.spritesheet = spritesheet;
    this.game = game;
    this.ctx = game.ctx;
}

Platform.prototype.draw = function () {
    this.ctx.save();
    this.ctx.strokeStyle = 'Red';   
    this.ctx.strokeRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
    this.ctx.drawImage(this.spritesheet, this.rect.x, this.rect.y, this.rect.width, this.rect.height);
    this.ctx.restore();
}

Platform.prototype.update = function () {
};

// Fireball Prototype
function Fireball(game, spritesheet, theX, theY, goingRight) {
    this.game = game;
    this.ctx = game.ctx;
    this.spritesheet = spritesheet;
    this.type = 'Projectile';
    this.rect = {x: theX - 6, y: theY - 6, width: 12, height: 12};
    this.velocityX = 10;
    if (!goingRight) this.velocityX *= -1;
    this.animation = new Animation(this.spritesheet, 0, 0, 32, 32, 0.1, 16, true, false);
}

Fireball.prototype.draw = function () {
    this.ctx.save();
    this.ctx.strokeStyle = 'Red';
    this.ctx.strokeRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
    this.animation.drawFrame(this.game.clockTick, this.ctx, this.rect.x - 10, this.rect.y - 10, 1);
    this.ctx.restore();
}

Fireball.prototype.update = function () {
    var collision = false;
    var that = this;
    this.game.entities.forEach(function(entity) {
        if (entity.type === 'Enemy') {
            if (collisionDetector(that.rect, entity.rect)) {
                collision = true;
                entity.isHit = true;
                if (that.rect.x < entity.rect.x) entity.isHitRight = true;
            } 
        } else if (entity.type === 'Platform') {
            if (collisionDetector(that.rect, entity.rect)) collision = true;
        }
    })
    if (collision || that.rect.x > 900 || that.rect.x < 0) {
        that.removeFromWorld = true;
    } else {
        that.rect.x += that.velocityX;
    }

}

// Slime test enemy
function RedSlime(game, theX, theY, isMobile) {
    this.type = 'Enemy';
    this.xDraw = theX;
    this.yDraw = theY;
    this.rect = {x: theX + 20, y: theY + 45, width: 24, height: 20};
    this.game = game;
    this.ctx = game.ctx;
    this.faceRight = true;
    this.mobile = isMobile;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isHit = false;
    this.isHitRight = false;
    this.idle_left_animation = new Animation(AM.getAsset("./img/sprites/enemies/red_slime/idle.png"), 0, 0, 32, 32, 0.2, 10, true, false);
}

RedSlime.prototype.draw = function (ctx) {
    this.ctx.save();
    this.ctx.strokeStyle = 'Red';
    this.ctx.strokeRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
    this.idle_left_animation.drawFrame(this.game.clockTick, ctx, this.xDraw, this.yDraw, 2);
    this.ctx.restore();
}

RedSlime.prototype.update = function () {

    // Check which platform entity will hit first
    var currentPlatform = getGround(this.rect, this.game);

    // Falling checks
    if (this.rect.y + this.rect.height >= currentPlatform[0]) {
        this.velocityY = 0;
    } else if (this.rect.y + this.rect.height + this.velocityY + this.game.gravity >= currentPlatform[0]) {
        this.rect.y = currentPlatform[0] - this.rect.height;
        this.yDraw = this.rect.y - 45;
        this.velocityY = 0;
    } else {
        if (this.velocityY + this.game.gravity >= this.game.terminalVelocity) {
            this.velocityY = this.game.terminalVelocity;
        } else {
            this.velocityY += this.game.gravity;
        }
    }

    if(this.mobile) {
        if (this.faceRight && this.rect.x + this.rect.width < currentPlatform[2]) {
            this.velocityX = 0.75;
        } else {
            this.faceRight = false;
        }
        if (!this.faceRight && this.rect.x > currentPlatform[1]) {
            this.velocityX = -0.75;
        } else {
            this.faceRight = true;
        }
    }

    this.xDraw += this.velocityX;
    this.rect.x += this.velocityX;
    this.yDraw += this.velocityY;
    this.rect.y += this.velocityY;

    if (this.isHit) {
        if (this.isHitRight) {
            this.xDraw += 5;
            this.rect.x += 5;
            this.isHitRight = false;
        } else {
            this.xDraw -= 5;
            this.rect.x -= 5;
        }
        this.isHit = false;
    }
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
    this.type = 'Player';
    this.faceRight = true;
    this.walking = false;
    this.jumping = false;
    this.falling = false;
    this.game = game;

    this.velocityX = 0;
    this.velocityY = 0;
    
    Entity.call(this, game, 0, 320);
    this.rect = {x: this.x + 52, y: this.y + 47, width: 24, height: 40};
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

    if (this.game.xKey) {
        var isFireball = false;
        var that = this;
        this.game.entities.forEach(function(entity) {
            if (entity.type === 'Projectile') isFireball = true;
        })
        if (!isFireball) this.game.addEntity(new Fireball(this.game, AM.getAsset("./img/sprites/heroes/black_mage/growing_fireball.png"), this.rect.x + this.rect.width / 2, this.rect.y + this.rect.height / 2, this.faceRight));
    }

    // if spacebar blackmage is jumping
    if (this.game.space && !this.falling) this.jumping = true;

    // Walking
    if (this.walking) {
        // walking and facing right 
        if (this.faceRight) {
            this.velocityX = 3;
        // walking and facing left
        } else {
            this.velocityX = -3;
        }
    }

    // Activate jump
    if (this.jumping && !this.falling) {
        this.y--;
        this.rect.y--;
        this.velocityY = -11;
        this.jumping = false;
        this.falling = true;
    }

    // Check which platform entity will hit first
    var currentPlatform = getGround(this.rect, this.game);

    // Falling checks
    if (this.rect.y + this.rect.height >= currentPlatform[0]) {
        this.velocityY = 0;
        this.falling = false;
    } else if (this.rect.y + this.rect.height + this.velocityY + this.game.gravity >= currentPlatform[0]) {
        this.rect.y = currentPlatform[0] - this.rect.height;
        this.y = this.rect.y - 47;
        this.velocityY = 0;
        this.falling = false;
    } else {
        if (this.velocityY + this.game.gravity >= this.game.terminalVelocity) {
            this.velocityY = this.game.terminalVelocity;
            this.falling = true;
        } else {
            this.velocityY += this.game.gravity;
            this.falling = true;
        }
    }

    Entity.prototype.update.call(this);

    // Update position
    this.x += this.velocityX;
    this.rect.x += this.velocityX;
    this.y += this.velocityY;
    this.rect.y += this.velocityY;

    if (this.rect.x < 0) {
        this.rect.x = 0;
        this.x = -52;
    }

    if (this.rect.x + this.rect.width > 900) {
        this.rect.x = 900 - this.rect.width;
        this.x = 824;
    }

    var collision = false;
    var that = this;
    this.game.entities.forEach(function(entity) {
        if (entity.type === 'Enemy') {
            if (collisionDetector(that.rect, entity.rect)) {
                collision = true;
                entity.isHit = true;
                if (that.rect.x < entity.rect.x) {
                    entity.isHitRight = true;
                    entity.faceRight = true;
                    that.x -= 5;
                    that.rect.x -= 5;
                } else {
                    that.x += 5;
                    that.rect.x += 5;
                    entity.faceRight = false;
                }
            } 
        }
    })
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
    ctx.strokeRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
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
    this.ctx.fillText("Example Animations:", 5, 20);
    this.ctx.restore();
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
AM.queueDownload("./img/sprites/heroes/black_mage/growing_fireball.png");
// example animations for prototype
AM.queueDownload("./img/sprites/heroes/black_mage/damage.png");
AM.queueDownload("./img/sprites/heroes/black_mage/death.png");
AM.queueDownload("./img/sprites/enemies/red_slime/damage.png");
AM.queueDownload("./img/sprites/enemies/green_slime/idle.png");
AM.queueDownload("./img/sprites/enemies/red_slime/idle.png");
AM.queueDownload("./img/sprites/enemies/blue_slime/rolling.png");

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
    gameEngine.addEntity(new ControlsText(gameEngine));
    gameEngine.addEntity(new EnemyDamage(gameEngine));
    gameEngine.addEntity(new EnemyIdle(gameEngine));
    gameEngine.addEntity(new EnemyRoll(gameEngine));

    // collision temporaries
    gameEngine.addEntity(new Platform(gameEngine, AM.getAsset("./img/grass_platform.png"), 450, 310, 200, 25));
    gameEngine.addEntity(new RedSlime(gameEngine, 450, 220, true));
    gameEngine.addEntity(new RedSlime(gameEngine, 800, 200, false));
});