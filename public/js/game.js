// console.clear();

// document.getElementById('version')
//   .textContent = 'Phaser v' + Phaser.VERSION;

var config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 720,
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

var teleport = true;

function preload() {
  this.load.image('ship', '../assets/player.png')
  this.load.image('bullet', '../assets/bullet.png')
  this.load.image('ammo', '../assets/ammo.png')
  this.load.image('largerAmmo', '../assets/ammo_larger.png')
  this.load.image('wall', '../assets/walls.png')
  this.load.image('background', '../assets/background.png')
  this.load.image('train', '../assets/train.png')
  this.load.image('squareCollision', '../assets/square.png')
  this.load.image('wallCollision', '../assets/wall_collision.png')
  this.load.image('wallCollision2', '../assets/wall_collision2.png')
  this.load.image('wallCollision3', '../assets/wall_collision3.png')
  this.load.image('wallCollision4', '../assets/wall_collision4.png')
  this.load.image('wallCollision5', '../assets/wall_collision5.png')
  this.load.image('wallCollision6', '../assets/wall_collision6.png')
  this.load.image('wallCollision7', '../assets/wall_collision7.png')
  this.load.image('wallCollision8', '../assets/wall_collision8.png')
  this.load.image('wallCollision9', '../assets/wall_collision9.png')
  this.load.image('wallCollision10', '../assets/wall_collision10.png')
  this.load.image('wallCollision11', '../assets/wall_collision11.png')
  this.load.image('wallCollision12', '../assets/wall_collision12.png')
  this.load.image('wallCollision13', '../assets/wall_collision13.png')
  this.load.image('wallCollision14', '../assets/wall_collision14.png')
  this.load.image('wallCollision15', '../assets/wall_collision15.png')
};


function create() {
  game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
  this.cameras.main.setBounds(0, 0, 1506, 1506);
  const background = this.add.image(750, 750, 'background')
  background.depth = 0;
  const wall = this.physics.add.image(750, 750, 'wall')
  const train = this.physics.add.image(80, 120, 'train')
  const desk1 = this.physics.add.image(1026, 1436, 'squareCollision')
  const desk2 = this.physics.add.image(896, 1276, 'squareCollision')
  const desk3 = this.physics.add.image(1026, 1050, 'squareCollision')
  const table1 = this.physics.add.image(926, 705, 'squareCollision')
  const table2 = this.physics.add.image(926, 475, 'squareCollision')
  const table3 = this.physics.add.image(1340, 155, 'squareCollision')
  const wall1 = this.physics.add.image(560, 75, 'wallCollision')
  const wall2 = this.physics.add.image(685, 75, 'wallCollision')
  const wall3 = this.physics.add.image(525, 575, 'wallCollision2')
  const wall4 = this.physics.add.image(685, 475, 'wallCollision3')
  const wall5 = this.physics.add.image(349, 815, 'wallCollision4')
  const wall6 = this.physics.add.image(685, 785, 'wallCollision5')
  const wall7 = this.physics.add.image(815, 525, 'wallCollision6')
  const wall8 = this.physics.add.image(974, 815, 'wallCollision7')
  const wall9 = this.physics.add.image(944, 591, 'wallCollision8')
  const wall10 = this.physics.add.image(944, 365, 'wallCollision8')
  const wall11 = this.physics.add.image(1040, 50, 'wallCollision5')
  const wall12 = this.physics.add.image(1040, 300, 'wallCollision5')
  const wall13 = this.physics.add.image(1390, 590, 'wallCollision9')
  const wall14 = this.physics.add.image(1390, 1135, 'wallCollision10')
  const wall15 = this.physics.add.image(1100, 1055, 'wallCollision11')
  const wall16 = this.physics.add.image(1100, 1405, 'wallCollision11')
  const wall17 = this.physics.add.image(1005, 975, 'wallCollision12')
  const wall18 = this.physics.add.image(540, 1490, 'wallCollision13')
  const wall19 = this.physics.add.image(815, 1215, 'wallCollision14')
  const wall20 = this.physics.add.image(300, 1375, 'wallCollision11')
  const wall21 = this.physics.add.image(300, 1040, 'wallCollision11')
  const wall22 = this.physics.add.image(445, 975, 'wallCollision15')
  const wall23 = this.physics.add.image(65, 975, 'wallCollision15')
  const wall24 = this.physics.add.image(15, 1230, 'wallCollision11')
  var self = this;
  this.active = true;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.bullets = this.physics.add.group();
  this.ammoGroup = this.physics.add.group();
  this.playerGroup = this.physics.add.group();
  this.obstacleGroup = this.physics.add.group();
  this.obstacleGroup.add(train)
  this.obstacleGroup.add(desk1)
  this.obstacleGroup.add(desk2)
  this.obstacleGroup.add(desk3)
  this.obstacleGroup.add(table1)
  this.obstacleGroup.add(table2)
  this.obstacleGroup.add(table3)
  this.obstacleGroup.add(wall1)
  this.obstacleGroup.add(wall2)
  this.obstacleGroup.add(wall3)
  this.obstacleGroup.add(wall4)
  this.obstacleGroup.add(wall5)
  this.obstacleGroup.add(wall6)
  this.obstacleGroup.add(wall7)
  this.obstacleGroup.add(wall8)
  this.obstacleGroup.add(wall9)
  this.obstacleGroup.add(wall10)
  this.obstacleGroup.add(wall11)
  this.obstacleGroup.add(wall12)
  this.obstacleGroup.add(wall13)
  this.obstacleGroup.add(wall14)
  this.obstacleGroup.add(wall15)
  this.obstacleGroup.add(wall16)
  this.obstacleGroup.add(wall17)
  this.obstacleGroup.add(wall18)
  this.obstacleGroup.add(wall19)
  this.obstacleGroup.add(wall20)
  this.obstacleGroup.add(wall21)
  this.obstacleGroup.add(wall22)
  this.obstacleGroup.add(wall23)
  this.obstacleGroup.add(wall24)
  desk1.setScale(0.6);
  desk1.setImmovable();
  desk2.setScale(0.6);
  desk2.setImmovable();
  desk3.setScale(0.6);
  desk3.setImmovable();
  table1.setScale(0.8);
  table1.setImmovable();
  table2.setScale(0.8);
  table2.setImmovable();
  table3.setScale(0.8);
  table3.setImmovable();
  wall1.setImmovable();
  wall2.setImmovable();
  wall3.setImmovable();
  wall4.setImmovable();
  wall5.setImmovable();
  wall6.setImmovable();
  wall7.setImmovable();
  wall8.setImmovable();
  wall9.setImmovable();
  wall10.setImmovable();
  wall11.setImmovable();
  wall12.setImmovable();
  wall13.setImmovable();
  wall14.setImmovable();
  wall15.setImmovable();
  wall16.setImmovable();
  wall17.setImmovable();
  wall18.setImmovable();
  wall19.setImmovable();
  wall20.setImmovable();
  wall21.setImmovable();
  wall21.displayHeight = 150;
  wall22.setImmovable();
  wall23.setImmovable();
  wall23.displayWidth = 120;
  wall24.setImmovable();
  wall24.displayHeight = 480;
  train.setImmovable();
  train.setVisible(false);
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
  gameOverText = this.add.text(190, 310, '', { fontSize: '100px', fill: '#FFFFFF' })
  healthScore = this.add.text(10, 10, 'Health: 100', { fontSize: '32px', fill: '#FFFFFF' })
  ammoText = this.add.text(860, 10, "Ammo: 20", {fontSize: "32px", fill: "#FFFFFF"});
  scoreText = this.add.text(460, 10, "Score: 0", {fontSize: "32px", fill: "#FFFFFF"});
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
  this.physics.add.collider(this.ammoGroup, this.obstacleGroup, pickDifferentLocation, null, this);
  this.physics.add.overlap(this.playerGroup, this.obstacleGroup, resetPlayerLocation, null, this);
}

function resetPlayerLocation () {
  if (teleport === true) {
    console.log("player collided");
    console.log(teleport)
    this.ship.x = Math.floor(Math.random() * 700) + 50;
    this.ship.y = Math.floor(Math.random() * 700) + 50;
  }
}

function pickDifferentLocation (ammo) {
  if (ammo.ammoId === 1) {
    console.log("ammo has been collided")
    console.log(ammo)
    ammo.destroy();
    var newX;
    var newY;
    if (ammo.x + 50 < 1500) {
      newX = ammo.x + 50
    } else {
      newX = ammo.x - 50
    }
    if (ammo.y + 50 < 1500) {
      newY = ammo.y + 50
    } else {
      newY = ammo.y - 50
    }
    replaceAmmo(this, {x: newX, y: newY, Id: 1}, 10)
    //this.socket.emit('addNewAmmo', {x: newX, y: newY, Id: 1, ammoCount: 10})
  }
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
      this.socket.emit('ammoDropped', {xPos: player.x, yPos: player.y, ammoId: newAmmoID, ammoCount: player.ammoCount})
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
      if (teleport === true) {
        teleport = false;
      }
      if (sprintKey.isDown) {
        velocityFromRotation(this.ship.rotation, SPEED+200, this.ship.body.velocity);
      } 
      else {
        velocityFromRotation(this.ship.rotation, SPEED, this.ship.body.velocity);
      }
    }
    if (leftKey.isDown){
      if (teleport === true) {
        teleport = false;
      }
      if (strafeLeft === true) {
        strafeLeft = false;
        if (this.ship.rotation < 0) {
          strafeRotation = this.ship.rotation-1.5708
        } else {
          strafeRotation = this.ship.rotation+1.5708
        }
      }
      if (sprintKey.isDown) {
        if (teleport === true) {
          teleport = false;
        }
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
      if (teleport === true) {
        teleport = false;
      }
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
      if (teleport === true) {
        teleport = false;
      }
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
  self.playerGroup.add(self.ship);
  self.ship.depth = 50;
  self.ship.playerId = playerInfo.playerId;
  self.ship.health = 100;
  self.ship.ammoCount = 20;
  self.ship.score = 0;
  self.cameras.main.startFollow(self.ship);
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
  let ammoString = 'ammo';
  if (ammoAmmount > 20) {
    ammoString = 'largerAmmo'
  }
  const ammoCrate = self.add.image(playerInfo.x, playerInfo.y, ammoString)
  ammoCrate.depth = 30;
  ammoCrate.ammoId = playerInfo.Id
  ammoCrate.x = playerInfo.x
  ammoCrate.y = playerInfo.y
  ammoCrate.count = ammoAmmount;
  console.log(playerInfo.x)
  console.log(playerInfo.y)
  self.ammoGroup.add(ammoCrate)
  if (ammoAmmount < 10) {
    ammoCrate.setScale(0.5);
  }
  //self.socket.emit('addNewAmmo', { x: playerInfo.x, y: playerInfo.y, Id: playerInfo.Id });
}

function addAmmo(self, playerInfo, ammoAmmount) {
  let ammoString = 'ammo';
  if (ammoAmmount > 20) {
    ammoString = 'largerAmmo'
  }
  const ammoCrate = self.add.image(playerInfo.x, playerInfo.y, ammoString)
  ammoCrate.depth = 30;
  ammoCrate.ammoId = playerInfo.Id
  ammoCrate.x = playerInfo.x
  ammoCrate.y = playerInfo.y
  ammoCrate.count = ammoAmmount;
  self.ammoGroup.add(ammoCrate)
  if (ammoAmmount < 10) {
    ammoCrate.setScale(0.5);
  }
}