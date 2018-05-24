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
	this.life = 200;
	this.estado = 1;
	this.time = -1;
}

var express = require('express');

var app = express();

var server = app.listen(process.env.PORT || 3000, listen);

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

var io = require('socket.io')(server);

setInterval(heartbeat, 33);

function heartbeat() {
	data = {
		jogadores: jogadores, 
		bases: bases
	}
  	io.sockets.emit('heartbeat', data);
}

io.sockets.on('connection',
	function(socket) {

		qtd = [0, 0];
		for (var key in jogadores) {
			if (jogadores[key].time==null) continue
			qtd[jogadores[key].time]++;
		}

		io.to(socket.id).emit('time', {time: qtd[0]>=qtd[1]?0:1});

	    socket.on('start',
			function(data) {
				// console.log(socket.id + " " + data.x + " " + data.y);
				var jogador = new Player(socket.id, data.x, data.y, data.time, data.angle, data.life);
				jogadores[socket.id] = jogador;

				data = {
					jogadores: jogadores,
					bases: bases,
					torres: torres,
					placar: placar
				};

				io.to(socket.id).emit('inicio', data);

				// socket.broadcast.emit('inicio', data);
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
	    	// console.log('Olha o tiro berg');
	    	var j = jogadores[data.player];
	    	j.life -= data.dano;
	    });

	    socket.on('torreUpdate', function(data) {
	    	// console.log(data);
	    	
	    	if ('player' in data) {
	    		torres[data.torre].player = data.player;
	    		socket.broadcast.emit('torreUpdate', {torre: data.torre, player: data.player});
	    	}
	    	if ('life' in data) torres[data.torre].life = data.life;
	    	if ('estado' in data) {
	    		torres[data.torre].estado = data.estado;
	    		if ('time' in data) 
	    			torres[data.torre].time = data.time;
	    	
	    		socket.broadcast.emit('torreUpdate', data);
	    	}
	    });

	    socket.on('torreTiro', function(data) {
	    	socket.broadcast.emit('torreTiro', {id: data.id, player: data.player});
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

	    socket.on('feed', function() {

	    });
  	}
);