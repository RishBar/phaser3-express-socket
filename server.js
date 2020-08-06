var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};
bullet = {};
hit = {};

app.use(express.static(__dirname + '/public'));
 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected');
// create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  socket.emit('bulletLocation', bullet)
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected');
    // remove this player from our players object
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });
  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });
  socket.on('playerShoot', function (bulletData) {
    bullet[socket.id] = {bulletId: bulletData.bulletId, playerId: socket.id, bulletX: bulletData.bulletX, bulletY: bulletData.bulletY, shipX: bulletData.shipX, shipY: bulletData.shipY}
    socket.broadcast.emit('playerShot', bullet[socket.id]);
  });
  socket.on('bulletHit', function (hitData) {
    hit[socket.id] = {playerId: hitData.playerId, player: hitData.player, bullet: hitData.bullet, bulletId: hitData.bulletId}
    // emit a message to all players about the bullet
    socket.broadcast.emit('bulletCollided', hit[socket.id]);
  });
  socket.on('playerDied', function (deadPlayerData) {
    socket.broadcast.emit('PlayerIsDead', deadPlayerData.playerId)
  })
});
socket.on('playerDied', function (deadPlayerData) {
  socket.broadcast.emit('PlayerIsDead', deadPlayerData.playerId)
})
 
server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});