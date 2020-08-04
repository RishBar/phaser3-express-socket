// console.clear();

// document.getElementById('version')
//   .textContent = 'Phaser v' + Phaser.VERSION;

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
      debugShowBody: true
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

var SPEED = 100;
var ROTATION_SPEED = 10 * Math.PI; // 0.5 arc per sec, 2 sec per arc
var ROTATION_SPEED_DEGREES = Phaser.Math.RadToDeg(ROTATION_SPEED);
var TOLERANCE = 0.02 * ROTATION_SPEED;

var velocityFromRotation = Phaser.Physics.Arcade.ArcadePhysics.prototype.velocityFromRotation;
var ship;

function preload() {
  this.load.image('ship', '../assets/enemy3idle1.png')
  this.load.image('bullet', '../assets/bullet.png')
};


function create() {
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id])
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo)
  });
  this.socket.on('disconnect', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy()
      }
    });
  });
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
  this.input.on('pointerdown', addBullet, this)
  upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
}


function addBullet(pointer) {
  if (this.ship) {
    var bullet = this.physics.add.sprite(this.ship.x, this.ship.y, "bullet")
    bullet.setScale(0.3)
    // bullet.setVelocity(pointer.x, pointer.y)
    this.physics.moveTo(bullet, pointer.x,
      pointer.y, 500);
  }
}


function update() {
  if (this.ship) {
    var self = this;
    pointerMove(this.input.activePointer, self);
    if (upKey.isDown) {
      velocityFromRotation(this.ship.rotation, SPEED, this.ship.body.velocity);
    } else {
      this.ship.setVelocity(0)
    }
    this.ship.body.debugBodyColor = (this.ship.body.angularVelocity === 0) ? 0xff0000 : 0xffff00;
    // emit player movement
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
    }
    
    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation
    };
  }
}

function pointerMove (pointer, self) {
  // if (!pointer.manager.isOver) return;
  
  // Also see alternative method in
  // <https://codepen.io/samme/pen/gOpPLLx>
  
  var angleToPointer = Phaser.Math.Angle.Between(self.ship.x, self.ship.y, pointer.worldX, pointer.worldY);
  var angleDelta = Phaser.Math.Angle.Wrap(angleToPointer - self.ship.rotation);
    
  if (Phaser.Math.Within(angleDelta, 0, TOLERANCE)) {
    self.ship.rotation = angleToPointer;
    self.ship.setAngularVelocity(0);
  } else {
    self.ship.setAngularVelocity(Math.sign(angleDelta) * ROTATION_SPEED_DEGREES);
  }
}


function addPlayer(self, playerInfo) {
  console.log("ADD PLAYER being called");
  self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship')
  .setVelocity(SPEED, 0);
}


function addOtherPlayers(self, playerInfo) {
  console.log("OTHER PLAYER FUNCTION IS BEING CALLLLELDDDDDD");
  const otherPlayer = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship');
  otherPlayer.setTint(0xff0000);
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}