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

var SPEED = 150;
var ROTATION_SPEED = 10 * Math.PI; // 0.5 arc per sec, 2 sec per arc
var ROTATION_SPEED_DEGREES = Phaser.Math.RadToDeg(ROTATION_SPEED);
var TOLERANCE = 0.02 * ROTATION_SPEED;

var velocityFromRotation = Phaser.Physics.Arcade.ArcadePhysics.prototype.velocityFromRotation;
var ship;
var ammoText;

var healthScore;
var gameOverText;

function preload() {
  this.load.image('ship', '../assets/enemy3idle1.png')
  this.load.image('bullet', '../assets/bullet.png')
};


function create() {
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.bullets = this.physics.add.group();
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
  this.socket.on('disconnect', function (playerId) {
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
  this.socket.on('bulletCollided', function (playerInfo) {
    var newBullet = playerInfo.bullet;
    self.bullets.getChildren().forEach(function (bullet) {
      if (bullet.bulletId === playerInfo.bulletId) {
        console.log(playerInfo.player);
        bullet.destroy();
        if (self.ship.playerId === playerInfo.player.playerId) {
          if (self.ship.health - 10 <= 0) {
            self.ship.health -= 10;
            gameOverText.setText("GAME OVER!!")
            // self.ship.destroy()
          } else {
            self.ship.health -= 10;
            healthScore.setText(`Health: ${self.ship.health}`)
          }
        }
      }
    })
  });
  this.socket.on('playerShot', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        var bullet = self.physics.add.sprite(playerInfo.shipX, playerInfo.shipY, "bullet")
        bullet.setScale(0.3)
        bullet.bulletId = playerInfo.bulletId
        self.bullets.add(bullet)
        self.physics.moveTo(bullet, playerInfo.bulletX,
          playerInfo.bulletY, 500);
      }
    });
  });
  this.socket.on('PlayerIsDead', function(playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    })
  })
  gameOverText = this.add.text(10, 200, '', { fontSize: '100px', fill: '#FFFFFF' })
  healthScore = this.add.text(10, 10, 'Health: 100', { fontSize: '32px', fill: '#FFFFFF' })
  ammoText = this.add.text(630, 10, "Ammo: 20", {fontSize: "32px", fill: "#FFFFFF"});
  
  this.input.on('pointerdown', addBullet, this)
  upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
  sprintKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)

  this.physics.add.overlap(this.otherPlayers, this.bullets, hitPlayer, null, this);

}

function hitPlayer(player, bullet) {
  if (bullet.playerId !== player.id) {
    this.socket.emit('bulletHit', { player: player, bullet: bullet, bulletId: bullet.bulletId });
    bullet.destroy();
    if (player.health - 10 <= 0) {
      player.health -= 10;
      this.socket.emit('playerDied', { playerId: player.playerId });
      player.destroy();
    } else {
      player.health -= 10;
      console.log(player.health);
    }
  }
}

function addBullet(pointer) {
  if (this.ship) {
    if (this.ship.ammoCount > 0) {
      const bullet = this.physics.add.sprite(this.ship.x, this.ship.y, "bullet")
      bullet.setScale(0.3)
      bullet.bulletId = Math.floor(Math.random() * 100000)
      bullet.playerId = this.ship.playerId
      this.bullets.add(bullet);
      this.physics.moveTo(bullet, pointer.x,
        pointer.y, 500);
      this.ship.ammoCount -= 1;
      ammoText.setText(`Ammo: ${this.ship.ammoCount}`)
      this.socket.emit('playerShoot', { bulletId: bullet.bulletId, bulletX: pointer.x, bulletY: pointer.y, shipX: this.ship.x, shipY: this.ship.y });
    }
  }
}


function update() {
  if (this.ship) {
    var self = this;
    pointerMove(this.input.activePointer, self);
    if (upKey.isDown) {
      if (sprintKey.isDown) {
        velocityFromRotation(this.ship.rotation, SPEED+200, this.ship.body.velocity);
      } else {
        velocityFromRotation(this.ship.rotation, SPEED, this.ship.body.velocity);
      }
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
  self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship')
  .setVelocity(SPEED, 0);
  self.ship.playerId = playerInfo.playerId
  self.ship.health = 100;
  self.ship.ammoCount = 20;
}


function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship');
  otherPlayer.setTint(0xff0000);
  otherPlayer.health = 100;
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}