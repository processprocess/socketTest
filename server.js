var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
let users = {};

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

  socket.on('new user', function(data, callback) {
    if (data in users) {
      callback(false);
    } else {
      socket.nickname = data;
      users[socket.nickname] = socket;
      updateNicknames();
      callback(true);
    }
  });

  function updateNicknames() {
    io.emit('usernames', Object.keys(users));
  }

  socket.on('new message', function(data, callback) {
    let msg = data.trim();
    if (msg.substr(0, 3) === '/w ') {
      msg = msg.substr(3);
        let ind = msg.indexOf(' ');
        if (ind !== -1) {
          let name = msg.substr(0, ind);
          msg = msg.substr(ind + 1);
          if (name in users) {
            users[name].emit('whisper', { msg: msg, nick: socket.nickname });
          } else {
            callback('Error! Enter a valid user.')
          }
        } else {
          callback('Error! Please enter a message for your whisper.')
        }
    } else {
      io.emit('new message', { msg: msg, nick: socket.nickname });
    }
  });

  socket.on('disconnect', function(data) {
    if (!socket.nickname) return;
    delete users[socket.nickname];
    updateNicknames();
  });

});


http.listen(3000, function(){
  console.log('listening on *:3000');
});