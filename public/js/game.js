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
var ammoCrate;

var ammoText;
var healthScore;
var gameOverText;
var scoreText;

let strafeLeft = true;
let strafeRight = true;
let strafeRotation;

function preload() {
  this.load.image('ship', '../assets/enemy3idle1.png')
  this.load.image('bullet', '../assets/bullet.png')
  this.load.image('ammo', '../assets/ammo.png')
  this.load.image('wall', '../assets/wall.png')
};


function create() {
  game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
  this.cameras.main.setBounds(0, 0, 1000, 1000);
  let wall = this.physics.add.image(200, 300, 'wall')
  var self = this;
  this.active = true;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.bullets = this.physics.add.group();
  this.ammoGroup = this.physics.add.group();
  this.playerGroup = this.physics.add.group();
  this.obstacleGroup = this.physics.add.group();
  this.obstacleGroup.add(wall)
  wall.setImmovable();
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('addAmmo', function (ammoLocation) {
    addAmmo(self, ammoLocation, 10)
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
    self.bullets.getChildren().forEach(function (bullet) {
      if (bullet.bulletId === playerInfo.bulletId) {
        bullet.destroy();
        console.log(self.ship.playerId, playerInfo.playerId);
        if (playerInfo.playerId === self.ship.playerId) {
          if (self.ship.health - 10 <= 0) {
            self.ship.health -= 10;
            healthScore.setText(`Health: ${self.ship.health}`)
            gameOverText.setText("GAME OVER!!")
            self.active = false;
            self.ship.setVisible(false);
            // var ID = Math.floor(Math.random() * 100000)
            // replaceAmmo(self, {x: 500, y: 500, Id: ID});
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
  });
  this.socket.on('ammoIsCollected', function(playerInfo) {
    self.ammoGroup.getChildren().forEach(function (ammo) {
      console.log(ammo.ammoId)
      console.log(playerInfo)
      if (playerInfo.ammoId === ammo.ammoId) {
        ammo.destroy();
        if (ammo.ammoId === 1){
          setTimeout(function() { 
            replaceAmmo(self, playerInfo.ammoLocation, 10);
          }, 8000);
        }
      }
    })
  });
  this.socket.on('createNewAmmo', function(playerInfo) {
    replaceAmmo(self, {x: playerInfo.x, y: playerInfo.y, Id: playerInfo.Id}, playerInfo.count);
  });
  this.socket.on('newAmmoAdded', function(playerInfo) {
    replaceAmmo(self, {x: 500, y: 50, Id: newId});
  });
  this.socket.on('updateAmmoCount', function(playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.ammoCount = playerInfo.count;
      }
    })
  });
  gameOverText = this.add.text(70, 250, '', { fontSize: '100px', fill: '#FFFFFF' })
  healthScore = this.add.text(10, 10, 'Health: 100', { fontSize: '32px', fill: '#FFFFFF' })
  ammoText = this.add.text(630, 10, "Ammo: 20", {fontSize: "32px", fill: "#FFFFFF"});
  scoreText = this.add.text(330, 10, "Score: 0", {fontSize: "32px", fill: "#FFFFFF"});
  gameOverText.depth = 100;
  gameOverText.scrollFactorX = 0
  gameOverText.scrollFactorY = 0
  healthScore.scrollFactorX = 0
  healthScore.scrollFactorY = 0
  healthScore.depth = 100;
  ammoText.scrollFactorX = 0
  ammoText.scrollFactorY = 0
  ammoText.depth = 100;
  scoreText.scrollFactorX = 0
  scoreText.scrollFactorY = 0
  scoreText.depth = 100;
  
  this.input.on('pointerdown', addBullet, this)
  upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
  sprintKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
  leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
  rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
  backKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)

  this.physics.add.overlap(this.otherPlayers, this.bullets, hitPlayer, null, this);
  this.physics.add.overlap(this.playerGroup, this.ammoGroup, collectAmmo, null, this);
  this.physics.add.collider(this.playerGroup, this.obstacleGroup);
  this.physics.add.collider(this.bullets, this.obstacleGroup, hitWall, null, this);
}

function hitWall (bullet) {
  bullet.destroy();
}

function collectAmmo(player, ammo) {
  if (this.active === true) {
    var self = this;
    console.log(ammo.ammoId);
    console.log(ammo.count);
    this.ship.ammoCount += ammo.count;
    ammoText.setText(`Ammo: ${this.ship.ammoCount}`);
    var newX = Math.floor(Math.random() * 700) + 50;
    var newY = Math.floor(Math.random() * 700) + 50;
    this.socket.emit('ammoCollected', { x: newX, y: newY, ammoId: ammo.ammoId });
    ammo.destroy();
    if (ammo.ammoId === 1) {
      setTimeout(function() { 
        replaceAmmo(self, {x: newX, y: newY, Id: ammo.ammoId}, 10);
      }, 8000);
    }
  }
}

function hitPlayer(player, bullet) {
  if (bullet.playerId !== player.id) {
    this.socket.emit('bulletHit', { playerId: player.playerId, player: player, bullet: bullet, bulletId: bullet.bulletId });
    bullet.destroy();
    console.log(player.health);
    if (player.health - 10 <= 0) {
      this.ship.score += 50;
      scoreText.setText(`Score: ${this.ship.score}`)
      var newAmmoID = Math.floor(Math.random() * 100000)
      replaceAmmo(this, {x: player.x, y: player.y, Id: newAmmoID}, player.ammoCount);
      this.socket.emit('ammoDropped', {xPos: xPos, yPos: yPos, ammoId: newAmmoID, ammoCount: player.ammoCount})
      if (this.ship.health + 30 > 100) {
        this.ship.health = 100;
      } else {
        this.ship.health += 30;
      }
      healthScore.setText(`Health: ${this.ship.health}`)
      this.socket.emit('playerDied', { playerId: player.playerId });
      player.destroy();
    } else {
      player.health -= 10;
      this.ship.score += 10;
      scoreText.setText(`Score: ${this.ship.score}`)
    }
  }
}

function addBullet(pointer) {
  if (this.ship && this.active === true) {
    if (this.ship.ammoCount > 0) {
      const bullet = this.physics.add.sprite(this.ship.x, this.ship.y, "bullet")
      bullet.depth = 0;
      bullet.setScale(0.3)
      bullet.bulletId = Math.floor(Math.random() * 100000)
      bullet.playerId = this.ship.playerId
      this.bullets.add(bullet);
      this.physics.moveTo(bullet, pointer.worldX,
        pointer.worldY, 500);
      this.ship.ammoCount -= 1;
      this.socket.emit('countAmmo', {Id: this.ship.playerId, count: this.ship.ammoCount});
      ammoText.setText(`Ammo: ${this.ship.ammoCount}`)
      this.socket.emit('playerShoot', { bulletId: bullet.bulletId, bulletX: pointer.worldX, bulletY: pointer.worldY, shipX: this.ship.x, shipY: this.ship.y });
    }
  }
}


function update() {
  if (this.ship && this.active === true) {
    var self = this;
    pointerMove(this.input.activePointer, self);
    this.ship.setVelocity(0);
    if (upKey.isDown) {
      if (sprintKey.isDown) {
        velocityFromRotation(this.ship.rotation, SPEED+200, this.ship.body.velocity);
      } 
      else {
        velocityFromRotation(this.ship.rotation, SPEED, this.ship.body.velocity);
      }
    }
    if (leftKey.isDown){
      if (strafeLeft === true) {
        strafeLeft = false;
        if (this.ship.rotation < 0) {
          strafeRotation = this.ship.rotation-1.5708
        } else {
          strafeRotation = this.ship.rotation+1.5708
        }
      }
      if (sprintKey.isDown) {
        velocityFromRotation(strafeRotation, SPEED+250, this.ship.body.velocity);
      } 
      else {
        velocityFromRotation(strafeRotation, SPEED+50, this.ship.body.velocity);
      }
    }
    if (!leftKey.isDown) {
      strafeLeft = true;
    }
    if (rightKey.isDown){
      if (strafeRight === true) {
        strafeRight = false;
        if (this.ship.rotation < 0) {
          strafeRotation = this.ship.rotation+1.5708
        } else {
          strafeRotation = this.ship.rotation-1.5708
        }
      }
      if (sprintKey.isDown) {
        velocityFromRotation(strafeRotation, SPEED+250, this.ship.body.velocity);
      } 
      else {
        velocityFromRotation(strafeRotation, SPEED+50, this.ship.body.velocity);
      }
    }
    if (!rightKey.isDown) {
      strafeRight = true;
    }
    if (backKey.isDown){
      if (sprintKey.isDown) {
        if (this.ship.rotation < 0){
          velocityFromRotation(this.ship.rotation + Math.PI, SPEED+250, this.ship.body.velocity);
        } else {
          velocityFromRotation(this.ship.rotation - Math.PI, SPEED+250, this.ship.body.velocity); 
        }
      } 
      else {
        if (this.ship.rotation < 0){
          velocityFromRotation(this.ship.rotation + Math.PI, SPEED+50, this.ship.body.velocity);
        } else {
          velocityFromRotation(this.ship.rotation - Math.PI, SPEED+50, this.ship.body.velocity); 
        }
      }
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
  self.ship.depth = 50;
  self.ship.playerId = playerInfo.playerId;
  self.ship.health = 100;
  self.ship.ammoCount = 20;
  self.ship.score = 0;
  self.cameras.main.startFollow(self.ship);
  self.playerGroup.add(self.ship);
}


function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship');
  otherPlayer.health = 100;
  otherPlayer.ammoCount = playerInfo.count;
  otherPlayer.depth = 50;
  otherPlayer.setTint(0xff0000);
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

function replaceAmmo(self, playerInfo, ammoAmmount) {
  const ammoCrate = self.add.image(playerInfo.x, playerInfo.y, 'ammo')
  ammoCrate.depth = 30;
  ammoCrate.ammoId = playerInfo.Id
  ammoCrate.x = playerInfo.x
  ammoCrate.y = playerInfo.y
  ammoCrate.count = ammoAmmount;
  console.log(playerInfo.x)
  console.log(playerInfo.y)
  self.ammoGroup.add(ammoCrate)
  //self.socket.emit('addNewAmmo', { x: playerInfo.x, y: playerInfo.y, Id: playerInfo.Id });
}

function addAmmo(self, playerInfo, ammoAmmount) {
  const ammoCrate = self.add.image(playerInfo.x, playerInfo.y, 'ammo')
  ammoCrate.depth = 30;
  ammoCrate.ammoId = playerInfo.Id
  ammoCrate.x = playerInfo.x
  ammoCrate.y = playerInfo.y
  ammoCrate.count = ammoAmmount;
  self.ammoGroup.add(ammoCrate)
}