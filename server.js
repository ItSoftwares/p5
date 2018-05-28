var jogadores = {};
var bases = {};
var torres = {};
var time = 0;
var placar = [0, 0];

var rooms = 10;

function Player(id, x, y, time, angle, life, nome) {
	this.id = id;
	this.x = x;
	this.y = y;
	this.velX;
	this.velY;
	this.time = time;
	this.angle = angle;
	this.life = life;
	this.nome = nome;
	this.upgrades = [1,1,1,1,1];
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
	bases['F'] = new Base("F", {0: [], 1: []}, {0: 0, 1: 0});
	bases['G'] = new Base("G", {0: [], 1: []}, {0: 0, 1: 0});
	bases['H'] = new Base("H", {0: [], 1: []}, {0: 0, 1: 0});
	bases['I'] = new Base("I", {0: [], 1: []}, {0: 0, 1: 0});

	for (var i = 0; i < 8; i++) {
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

function verificarSalas(numero) {
	sala = "";
	escolhido = false;

	sala = 'room'+numero;
	clientes = io.in(sala).clients(function(error, c) {
		if (error) console.log('error');
		else {
			clientes = c;

			qtd = clientes.length;

			if (qtd<40) {
				console.log(sala);
				return sala;
			} else {
				if (numero<rooms) verificarSalas(numero);
			}
		}
	});
}

io.sockets.on('connection',
	function(socket) {
		socket.join(verificarSalas(0));

		qtd = [0, 0];
		for (var key in jogadores) {
			if (jogadores[key].time==null) continue
			qtd[jogadores[key].time]++;
		}


		io.to(socket.id).emit('time', {time: qtd[0]>qtd[1]?1:0, sala: sala});

	    socket.on('start',
			function(data) {
				// console.log(socket.id + " " + data.x + " " + data.y);
				var jogador = new Player(socket.id, data.x, data.y, data.time, data.angle, data.life, data.nome);
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
		        // j.upgrades = data.upgrades;
	      	}
	    );

	    socket.on('morreu',
	      	function(data) {
	      		if (!(data.id in jogadores)) return;
	    		delete jogadores[data.id];

	    		socket.broadcast.to(socket.request.headers.referer).emit('morreu', data);
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
	    	socket.broadcast.to(socket.request.headers.referer).emit('atirou', data);
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
	    		socket.broadcast.to(socket.request.headers.referer).emit('torreUpdate', {torre: data.torre, player: data.player});
	    	}
	    	if ('life' in data) torres[data.torre].life = data.life;
	    	if ('estado' in data) {
	    		torres[data.torre].estado = data.estado;
	    		if ('time' in data) 
	    			torres[data.torre].time = data.time;
	    	
	    		socket.broadcast.to(socket.request.headers.referer).emit('torreUpdate', data);
	    	}
	    });

	    socket.on('torreTiro', function(data) {
	    	socket.broadcast.to(socket.request.headers.referer).emit('torreTiro', {id: data.id, player: data.player});
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
	      	socket.broadcast.to(socket.request.headers.referer).emit('saiu', {id: socket.id});
	    });

	    socket.on('feed', function(data) {
	    	console.log(data);
	    	socket.broadcast.to(socket.request.headers.referer).emit('feed', data);
	    });

	    socket.on('verJogadores', function(data) {
	    	console.log(jogadores);
	    	socket.broadcast.to(socket.request.headers.referer).emit('verJogadores', {j: jogadores});
	    })
  	}
);