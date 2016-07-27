var CONFIG = {
  "width": 320,
  "height": 568,
  "bg": {
    "width": 960,
    "height": 568,
    "scale": 1,
    "scroll": -50
  },
  "button": {
    "offset": 100,
    "scale": 1
  },
  "flappy": {
      "x": 60,
      "width": 46,
      "height": 64,
      "scale": 1,
      "gravity": 1200,
      "outkill": true,
      "flap": {
        "velocity": -420,
        "frame": 0,
        "rotate": -40,
        "norotate": true
      },
      "end": {
        "offset": 100,
        "duration": 700,
        "scale": 1
      },
      "animation": {
        "rate": 0
      }
  },
  "sign": {
      "width": 46,
      "height": 64,
      "scale": 1,
      "offset": -200,
      "speed": 474,
      "twoframe": true,
      "animation": {
        "rate": 0 
      }
  },
  "pipe": {
    "width": 90,
    "height": 500,
    "space": 180,
    "offset": 150,
    "speed": 170,
    "interval": 1700 
  },
  "score": {
    "y": 55,
    "style": {
      "font": "80px sans-serif",
      "fill": "#fdf6e3"
    }
  },
  "highscore": {
    "text": "High Score: ",
    "offset": 250,
    "key": "skilstak-flappy-highscore",
    "style": {
      "font": "25px sans-serif", 
      "fill": "#657b83",
      "align": "center"
    } 
  },
  "gameover": {
    "text": "Game\nOver",
    "offset": -150,
    "style": {
      "font": "100px sans-serif", 
      "fill": "#b58900",
      "align": "center"
    }, 
    "score": {
      "style": {
        "font": "100px sans-serif", 
        "fill": "#fdf6e3",
        "align": "center"
      }
    } 
  }
};

// Sprite: Flapper

var Flapper = function(game) {
  this.config = CONFIG; 
  Phaser.Sprite.call(this, game, this.config.flappy.x, game.world.centerY, 'flappy',1);
  this.smoothed = false;
  this.checkWorldBounds = true;
  this.outOfBoundsKill = this.config.flappy.outkill;
  this.scale.set(this.config.flappy.scale || 1);
  this.anchor.set(0.5);
  game.physics.arcade.enable(this);
  this.body.gravity.y = this.config.flappy.gravity || 1200;
  game.input.onDown.add(this.flap, this);
  game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(this.flap, this);
  this.flapSound = this.game.add.audio('flap');
  if (this.config.flappy.animation) {
    var anim = this.animations.add('main');
    this.animations.play('main',this.config.flappy.animation.rate,true)
  }
  game.add.existing(this);
};


Flapper.prototype = Object.create(Phaser.Sprite.prototype);
Flapper.prototype.constructor = Flapper;

Flapper.prototype.flap = function () {
  this.flapSound.play();
  this.body.velocity.y = this.config.flappy.flap.velocity || -420;
  this.frame = this.config.flappy.flap.frame || 0;
  if (! this.config.flappy.flap.norotate ) {
    var rotate = this.config.flappy.flap.rotate || -40;
    this.game.add.tween(this).to({angle: rotate}, 100).start();
  }
};

Flapper.prototype.update = function () {
  if (! this.config.flappy.flap.norotate ) {
    if (this.angle < 90) {
      this.angle += 2.5;
    }
  }
  if (! this.config.flappy.animation ||
      ! this.config.flappy.animation.rate) {
    if (this.deltaY < 0) {
      this.frame = this.config.flappy.flap.frame || 0;
    } else {
      this.frame = 1;
    }
  }
};
// Pipe


var Pipe = function (game, x, y, parent, offset, space) {
  this.config = CONFIG;
  Phaser.Group.call(this, game, parent);

  this.speed = this.config.pipe.speed || 120;

  this.offset = offset || this.config.pipe.offset || 120;
  this.space = space || this.config.pipe.space || 175;

  this.topimg = game.cache.getImage('pipetop');
  this.botimg = game.cache.getImage('pipebot');
  
  this.dieAt = -game.world.width - (this.topimg.width*2);

  this.top = game.add.sprite(0,0,'pipetop');
  this.bot = game.add.sprite(0,0,'pipebot');

  game.physics.arcade.enableBody(this.top);
  game.physics.arcade.enableBody(this.bot);

  this.add(this.top);
  this.add(this.bot);

  this.reset();
};

Pipe.prototype = Object.create(Phaser.Group.prototype);
Pipe.prototype.constructor = Pipe;

Pipe.prototype.randomY = function () {
  var offset = game.rnd.integerInRange(-this.offset, this.offset);
  return game.world.height/2 + offset;
};

Pipe.prototype.update = function () {
  if (this.top.x <= this.dieAt) {
    this.exists = false;
  }
};

Pipe.prototype.reset = function (x,y) {
  var _x = -(this.topimg.width/2);
  var _y = -(this.topimg.height);
  this.top.reset(_x, _y - (this.space/2));
  this.bot.reset(_x, this.space/2);
  this.x = x || game.world.width + this.width;
  this.y = y || this.randomY();
  this.setAll('body.velocity.x', -this.speed);
  this.exists = true;
  this.scored = false;
};
// State: Flappy.boot



var Flappy = {
  score: 0
};

Flappy.Boot = function () {};

Flappy.Boot.prototype = {

  init: function () {
    console.log("%c~~~ Booting the Flap ~~~\n Compliments of SkilStak", "color:#fdf6e3; background:#073642");
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
  },

  preload: function () {
    this.game.load.spritesheet('skilstak','assets/skilstak.png', 46,64);
  },

  create: function () {
    this.game.stage.backgroundColor = "#073642";
    this.game.state.start('preload');
  }

};

// State: Flappy.Preload


Flappy.Preload = function () {};

Flappy.Preload.prototype = {

  preload: function () {
    this.config = CONFIG;

    this.skilstak = this.add.sprite(
        this.game.world.centerX, this.game.world.centerY, 'skilstak');
    this.skilstak.anchor.set(0.5);
    this.skilstak.animations.add('blink');
    this.skilstak.play('blink',2,true);
    
    var style = {
      font: "30px sans-serif",
      fill: "#fdf6e3",
      align: "center"
    }; 
    this.loading = this.game.add.text(this.game.world.centerX,
                                      this.game.world.centerY + 70,
                                      "Loading...", style);
    this.loading.anchor.set(0.5,0.5);

    // customizable from assets and config
    this.load.spritesheet('background','assets/background.png',
                          this.config.bg.width,this.config.bg.height);
    this.load.spritesheet('flappy','assets/flappy.png',
                          this.config.flappy.width,
                          this.config.flappy.height);
    this.load.spritesheet('sign','assets/sign.png',
                          this.config.sign.width,
                          this.config.sign.height);

    this.load.image('button','assets/button.png');
    this.load.image('pipetop','assets/pipetop.png');
    this.load.image('pipebot','assets/pipebot.png');

    this.load.audio('start','assets/start.mp3');
    this.load.audio('flap', 'assets/flap.wav');
    this.load.audio('point', 'assets/point.wav');
    this.load.audio('crash', 'assets/crash.wav');
    this.load.audio('play', 'assets/play.mp3');
    this.load.audio('gameover', 'assets/gameover.wav');
  },

  create: function () {
    // even though we don't play these in this state we need
    // them to ensure they've been decoded
    this.loading.text = "Decoding...";
    var start = this.game.add.audio('start',null,true);
    var flap = this.game.add.audio('flap');
    var play = this.game.add.audio('play',null,true);
    var point = this.game.add.audio('point');
    var crash = this.game.add.audio('crash');
    var gameover = this.game.add.audio('gameover');
    var sounds = [start,flap,play,point,crash,gameover];
    game.sound.setDecodedCallback(sounds, this.start, this);
  },

  start: function () {
    this.game.state.start('start');
  }

};

// State: Flappy.Start


Flappy.Start = function () {};

Flappy.drawHighScore = function (state) {
  var highScoreKey = state.config.highscore.key || 'skilstak-flappy-highscore';
  var highScore = localStorage.getItem(highScoreKey) || Flappy.highScore;
  var highScoreText = state.config.highscore.text || 'High Score: ';
    if (highScore) {
    state.high = state.game.add.text(state.game.world.centerX,
                                    state.game.world.centerY + 
                                    state.config.highscore.offset, 
                                    highScoreText + highScore,
                                    state.config.highscore.style ||
                                    state.config.score.style);
    state.high.anchor.set(0.5);
  }
}

Flappy.Start.prototype = {

  init: function () {
    this.config = CONFIG;
    this.background = null;
    this.flappy = null;
    this.button = null;
  },

  create: function () {
    Flappy.highScore = localStorage.getItem(this.config.highscore.key);
    this.startSound = this.game.add.audio('start',1,true);
    this.startSound.play();

    this.background = this.add.tileSprite(0,0,
                        this.config.width,this.config.height,"background");
    this.background.autoScroll(this.config.bg.scroll || -50,0);
    this.background.scale.set(this.config.bg.scale || 1);

    this.button = this.game.add.button(this.game.world.centerX,
                                       this.game.world.centerY +
                                         this.config.button.offset,
                                       "button", this.start, this);
    this.button.anchor.set(0.5,0.5);
    this.button.scale.set(this.config.button.scale || 1);

    this.sign = this.game.add.sprite(this.game.world.centerX,
                                     this.game.world.centerY +
                                     this.config.sign.offset,'sign');
    this.sign.anchor.set(0.5);
    this.sign.scale.set(this.config.sign.scale || 1);

    this.game.add.tween(this.sign).to({y:this.sign.y+50},
                                      this.config.sign.speed,
                                      Phaser.Easing.Linear.NONE,
                                      true,0,2000,true);
    if (this.config.sign.animation) {
      var anim = this.sign.animations.add('main');
      this.sign.animations.play('main',this.config.sign.animation.rate,true)
    }

    Flappy.drawHighScore(this);

  },

  start: function () {
    this.startSound.stop();
    this.game.state.start('play');
  },

  update: function () {
    if (this.config.sign.twoframe) {
      if (this.sign.deltaY < 0) {
        this.sign.frame = 0;
      } else {
        this.sign.frame = 1;
      }
    }
  }

};

// State: Flappy.Play


Flappy.Play = function () {};

Flappy.Play.prototype = {

  init: function () {
    this.config = CONFIG;
    this.background = null;
    this.flappy = null;
    this.pipes = null;
    this.timer = null;
    this.score = -1; 
    this.scoreText = null;
  },

  create: function () {
    this.background = this.add.tileSprite(0,0,
                        this.config.width,this.config.height,
                        "background");
    this.background.scale.set(this.config.bg.scale || 1);
    this.background.autoScroll(this.config.bg.scroll,0);
    this.playMusic = this.game.add.audio('play',1,true);
    this.pointSound = this.game.add.audio('point');
    this.crashSound = this.game.add.audio('crash');
    this.playMusic.play();
    this.flappy = new Flapper(this.game);
    this.timer = this.game.time.events.loop(this.config.pipe.interval,
                                            this.addPipe, this);           
    var scoreTextStyle = this.config.score.style;
    this.scoreText = this.game.add.text(this.game.world.centerX,
                                        this.config.score.y, "0", scoreTextStyle);
    this.scoreText.anchor.set(0.5);
    this.pipes = this.game.add.group();
  },

  addPipe: function () {
    var pipe;
    if (this.pipes.length < 3) {
      pipe = new Pipe(this.game);
      this.pipes.add(pipe);
      this.scoreText.bringToTop();
    } else {
      pipe = this.pipes.getFirstExists(false);
      pipe.reset();
    }
    this.score += 1;
    this.scoreText.text = this.score;
    if (this.score > 0) this.pointSound.play();
  },

  update: function () {
    this.pipes.forEach(function (pipe) {
      this.game.physics.arcade.collide(this.flappy, pipe, this.end, null, this);  
    }, this);
    if (!this.flappy.alive) this.end();
  },

  end: function () {
    this.crashSound.play();
    this.playMusic.stop();
    this.game.state.start('end');
  }

};

// State: Flappy.End

Flappy.End = function () {};

Flappy.End.prototype = {

  create: function () {
    this.config = CONFIG;
    var fy = this.game.world.centerY + this.config.flappy.end.offset;
    this.flappy = this.add.sprite(this.game.world.centerX,fy,'flappy');
    this.flappy.anchor.set(0.5);
    this.flappy.frame = 1;
    this.flappy.scale.set(this.config.flappy.end.scale || 1);

    this.game.add.tween(this.flappy).to({y: this.game.world.height+
            this.flappy.width/2}, this.config.flappy.end.duration).start();
    this.game.add.tween(this.flappy).to({angle:90},
                        this.config.flappy.end.duration).start();

    var gameoverStyle = this.config.gameover.style;
    this.gameover = this.game.add.text(this.game.world.centerX,
                                       this.game.world.centerY +
                                       this.config.gameover.offset,
                                       this.config.gameover.text,
                                       gameoverStyle);
    this.gameover.anchor.set(0.5,0.5);

    var score = this.game.state.states.play.score;
    if (score > Flappy.highScore) {
      localStorage.setItem(this.config.highscore.key, score);
    }
    if (score < 0) {score = 0};
    this.scoretext = this.game.add.text(this.game.world.centerX,
                                        this.game.world.centerY + 70,
                                        score,
                                        this.config.gameover.score.style);
    this.scoretext.anchor.set(0.5,0.5);

    Flappy.drawHighScore(this);

    game.input.onDown.add(this.start, this);
    game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(this.start, this);
    this.gameoverSound = this.game.add.audio('gameover');
    this.gameoverSound.play();
  },

  start: function () {
    this.gameoverSound.stop();
    this.game.state.start('start');
  }

};

//-------------------------------------------------------------------

var game = new Phaser.Game(320,568);
game.state.add('boot',Flappy.Boot);
game.state.add('preload',Flappy.Preload);
game.state.add('start',Flappy.Start);
game.state.add('play',Flappy.Play);
game.state.add('end',Flappy.End);
game.state.start('boot');

