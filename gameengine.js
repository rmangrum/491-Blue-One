// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();


function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

function GameEngine() {
    this.entities = [];
    this.sceneManager = null;
    this.player = null;
    this.background = null;
    this.camera = null;
    this.enemies = [];
    this.platforms = [];
    this.walls = [];
    this.projectiles = [];
    this.items = [];

    this.showOutlines = true;
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
    this.gravity = 80;
    this.terminalVelocity = 400;
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();
    this.timer = new Timer();
    console.log('game initialized');
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

// This is where key input will be implemented
GameEngine.prototype.startInput = function () {
    console.log('Starting input');
    var that = this;

    this.ctx.canvas.addEventListener("keydown", function (e) {
        if (e.keyCode === 32) { // spacebar
            // jump
            that.space = true;
        }
        if (e.keyCode === 38) { // up arrow
            that.upKey = true;
        }
        if (e.keyCode === 37) { // left arrow
            // walk left
            that.leftKey = true;
        }
        if (e.keyCode === 40) { // down arrow
            that.downKey = true;
        }
        if (e.keyCode === 39) { // right arrow
            // walk right
            that.rightKey = true;
        }
        if (e.keyCode === 90) { // z key
            // character swap
            that.zKey = true;
        }
        if (e.keyCode === 88) { // x key
            // attack
            that.xKey = true;
        }
        if (e.keyCode === 67) { // c key
            // interact/action
            that.cKey = true;
        }
        e.preventDefault();
    }, false);

    this.ctx.canvas.addEventListener("keyup", function (e) {
        if (e.keyCode === 32) { // spacebar
            // jump
            that.space = false;
        }
        if (e.keyCode === 38) { // up arrow
            that.upKey = false;
        }
        if (e.keyCode === 37) { // left arrow
            // walk left
            that.leftKey = false;
        }
        if (e.keyCode === 40) { // down arrow
            that.downKey = false;
        }
        if (e.keyCode === 39) { // right arrow
            // walk right
            that.rightKey = false;
        }
        if (e.keyCode === 90) { // z key
            // character swap
            that.zKey = false;
        }
        if (e.keyCode === 88) { // x key
            // attack
            that.xKey = false;
        }
        if (e.keyCode === 67) { // c key
            // interact/action
            that.cKey = false;
        }
        if (e.keyCode === 68) { // d key
            // interact2/action2
            that.dKey = false;
        }
        e.preventDefault();
    }, false);  
    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    console.log('added entity');
    this.entities.push(entity);
    if (entity.type === 'Enemy') this.enemies.push(entity);
    if (entity.type === 'Platform') this.platforms.push(entity);
    if (entity.type === 'Wall') this.walls.push(entity);
    if (entity.type === 'Projectile') this.projectiles.push(entity);
    if (entity.type === 'Item') this.items.push(entity);
}

GameEngine.prototype.draw = function () {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }

    for (var i = this.enemies.length - 1; i >= 0; --i) {
        if (this.enemies[i].removeFromWorld) {
            this.enemies.splice(i, 1);
        }
    }

    for (var i = this.projectiles.length - 1; i >= 0; --i) {
        if (this.projectiles[i].removeFromWorld) {
            this.projectiles.splice(i, 1);
        }
    }

    for (var i = this.items.length - 1; i >= 0; --i) {
        if (this.items[i].removeFromWorld) {
            this.items.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    // keys
    this.space = null;
    this.xKey = null;
    /*
    this.upKey = null;
    this.leftKey = null;
    this.downKey = null;
    this.rightKey = null;
    this.zKey = null;
    this.cKey = null; 
    this.dKey = null; 
    */
}

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        this.game.ctx.beginPath();
        this.game.ctx.strokeStyle = "green";
        this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.game.ctx.stroke();
        this.game.ctx.closePath();
    }
}

Entity.prototype.rotateAndCache = function (image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}
