var jogadores = {};
var bases = {};
var torres = {};
var time = 0;
var placar = [0, 0];

function Player(id, x, y, time, angle, life) {
	this.id = id;
	this.x = x;
	this.y = y;
	this.velX;
	this.velY;
	this.time = time;
	this.angle = angle;
	this.life = life;
}

function Base(letra, times, possuido) {
	this.letra = letra;
	this.times = times;
	this.possuido = possuido;
}

function Torre(id, player) {
	this.id = id;
	this.player = player;
}

// Using express: http://expressjs.com/
var express = require('express');
// Create the app
var app = express();

// Set up the server
// process.env.PORT is related to deploying on heroku
var server = app.listen(process.env.PORT || 3000, listen);

// This call back just tells us that the server has started
function listen() {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Jogo iniciado em http://' + host + ':' + port);

	bases['A'] = new Base("A", {0: [], 1: []}, {0: 0, 1: 0});
	bases['B'] = new Base("B", {0: [], 1: []}, {0: 0, 1: 0});
	bases['C'] = new Base("C", {0: [], 1: []}, {0: 0, 1: 0});
	bases['D'] = new Base("D", {0: [], 1: []}, {0: 0, 1: 0});
	bases['E'] = new Base("E", {0: [], 1: []}, {0: 0, 1: 0});

	for (var i = 0; i < 4; i++) {
		torres[i] = new Torre(i, null);
	}
}

app.use(express.static('public'));

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io')(server);

setInterval(heartbeat, 33);

function heartbeat() {
	data = {
		jogadores: jogadores, 
		bases: bases
	}
  	io.sockets.emit('heartbeat', data);
}

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
	// We are given a websocket object in our function
	function(socket) {

		console.log("We have a new client: " + socket.id);

	    socket.on('start',
			function(data) {
				console.log(socket.id + " " + data.x + " " + data.y);
				var jogador = new Player(socket.id, data.x, data.y, data.time, data.angle, data.life);
				jogadores[socket.id] = jogador;

				time = time==0?1:0;
			}
	    );

	    socket.on('update',
	      	function(data) {
	      		if (!(socket.id in jogadores)) return;
	    		var j = jogadores[socket.id];
		        j.x = data.x;
		        j.y = data.y;
		        j.angle = data.angle;
		        j.life = data.life;
	      	}
	    );

	    socket.on('baseUpdate', function(data) {
			bases[data.letra].times = JSON.parse(data.times);

			// console.log(bases['A']);
	    });

	    socket.on('basePossuido', function(data) {
			bases[data.letra].possuido = JSON.parse(data.possuido);
	    });

	    socket.on('atirou', function(data) {
	    	// console.log('olha o tiro berg');
	    	socket.broadcast.emit('atirou', data);
	    });

	    socket.on('atingiu', function(data) {
	    	var j = jogadores[data.player];
	    	j.life -= data.dano;
	    });

	    socket.on('torreUpdate', function(data) {
	    	// console.log(torres);
	    	torres[data.torre].player = data.player;

	    	socket.broadcast.emit('torreUpdate', {id: data.id, player: data.player});
	    });

	    socket.on('disconnect', function() {
	    	console.log('Alguem saiu: ' + socket.id);

	    	for(var key in bases) {
	    		index = bases[key].times[0].indexOf(socket.id);
				if (index!=-1) bases[key].times[0].splice(index, 1);

				index = bases[key].times[1].indexOf(socket.id);
				if (index!=-1) bases[key].times[1].splice(index, 1);
	    	}

	    	delete jogadores[socket.id];
	      	socket.broadcast.emit('saiu', {id: socket.id});
	    });
  	}
);