var socket;

var w = 87, a = 65, d = 68, s = 83;
var posX = 0, posY = 0;
var linha = 0;
var temp = true;
var bolas = [];
var places = [];
var paredes = []
var bases = [];
var torres = [];
var fontes = {};
var adversarios = {};
var zoom = 1;
var carregar = true;
var mapaIncrease = 2;
var times = [
	{cor: '#3F51B5'},
	{cor: '#F44336'}
];
var player = {id: null};
var placar;
var parado = false;
var jogando = false;
var centro = {pos: null};
var lv = [50, 150, 300, 600, 1500];
var meuTime = null;
var nickname = "";
var velocidadeCentro = null;
var sentido = "baixo";

function setup() {
	if (parado) return false;
	createCanvas(windowWidth, windowHeight);

	criarCenario2();
	zoom = height/672;

	socket = io.connect("http://localhost:3000");

	socket.on('time', function(data) {
		meuTime = data.time;
	});

	// eventos do socket
	socket.on('inicio', function(data) {
		player.id = socket.id;

		for (var key in data.jogadores) {
			adv = data.jogadores[key];
			
			adversarios[adv.id] = new Adversario(adv.x, adv.y, adv.time, adv.life, adv.angle, adv.id, adv.nome);
		}

		for (var key in data.bases) {
			for (var i = 0; i < bases.length; i++) {
				letra = bases[i].letra;
				bases[i].times = data.bases[letra].times;
				bases[i].possuido = data.bases[letra].possuido;
			}
		}

		for (var key in data.torres) {
			for (var i = 0; i < torres.length; i++) {
				t = torres[i];
				// console.log(data.torres[i]);
				if ('player' in data.torres[i] && data.torres[i].player!=null && data.torres[i].player in adversarios) t.perseguir(data.torres[i].player, adversarios[data.torres[i].player].pos);
				t.life = data.torres[i].life;
				t.estado = data.torres[i].estado;
				t.time = data.torres[i].time;
			}
		}
		console.log(data);
		placar = data.placar
	});

	socket.on('heartbeat', function(data) {
		for (var key in data.jogadores) {
			adv = data.jogadores[key];
			if (adv.id!=undefined && !(adv.id in adversarios))
				adversarios[adv.id] = new Adversario(adv.x, adv.y, adv.time, adv.life, adv.angle, adv.id, adv.nome);

			adversarios[key].pos.x = adv.x;
			adversarios[key].pos.y = adv.y;
			adversarios[key].angle = adv.angle;
			adversarios[key].life = adv.life;
			// adversarios[key].atualizarUpgrades(adv.upgrades);

			// if (key==player.id) player.life = adv.life;
		}
		// if (carregar) console.log(data.jogadores);
		for (var key in data.bases) {
			for (var i = 0; i < bases.length; i++) {
				letra = bases[i].letra;
				bases[i].times = data.bases[letra].times;
				// if (carregar) 
				// 	bases[i].possuido = data.bases[letra].possuido;
			}
		}

		carregar = false;
	});

	socket.on('saiu', function(data) {
		console.log(data);
		delete adversarios[data.id];

		for (var key in torres) {
			t = torres[key];

			if (t.playerId==data.id) t.player=null;
		}
	});

	socket.on('atirou', function(data) {
		adversarios[data.dono].balas.push(new Bala(data.dono, data.x, data.y, data.angle, data.vidaBala, data.danoBala));
		// console.log(data);
	});

	socket.on('torreTiro', function(data) {
		if (!(torres[data.id].playerId in adversarios)) return;
		pers = new Perseguidor(torres[data.id].pos.x, torres[data.id].pos.y, torres[data.id], torres[data.id].tiroCor);
		torres[data.id].pers.push(pers);
	});

	socket.on('torreUpdate', function(data) {
		console.log(data);
		if ('player' in data) torres[data.torre].perseguir(data.player, adversarios[data.player].pos);
		else if ('estado' in data) {
			torres[data.torre].estado = data.estado;
			if (data.estado==0) torres[data.torre].time = -1;
			if ('time' in data) {
				torres[data.torre].reviver(data.time);
			}
		}
	});

	socket.on('verJogadores', function(data) {		
		console.log(data);
	});

	socket.on('morreu', function(data) {
		console.log(data);		
		delete adversarios[data.id];

		for (var key in torres) {
			t = torres[key];

			if (t.playerId==data.id) t.player=null;
		}
	});

	socket.on('feed', function(data) {	
		console.log(data);	
		adicionarFeed(data);
	});
}

function play() {
	player = new Player(5*ladrilho*mapaIncrease, 5*ladrilho*mapaIncrease);
	centro.pos = player.pos;
	jogando = true;

	data = {
		x: player.pos.x,
		y: player.pos.y,
		angle: player.angle,
		life: player.life,
		time: player.time,
		nome: player.nome,
	};

	socket.emit('start', data);

	mapa = new Mapa(width*10/100, height*10/100);
}

function draw() {
	if (parado) noLoop();
	if (centro.pos==null) centro.pos = createVector(12.5*ladrilho*mapaIncrease, 12.5*ladrilho*mapaIncrease);
	background(250);

	translate(width/2, height/2);
	scale(zoom);

	translate(-centro.pos.x, -centro.pos.y);

	// lugares
	for (var i = places.length - 1; i >= 0; i--) {
		places[i].draw();
	}

	// paredes
	for (var i = paredes.length - 1; i >= 0; i--) {
		paredes[i].draw();
	}

	// bases
	for (var i = bases.length - 1; i >= 0; i--) {
		bases[i].draw();
		bases[i].update();
	}

	// bolas
	for (var i = bolas.length - 1; i >= 0; i--) {
		bolas[i].draw();
	}

	// adversarios
	for (var key in adversarios) {
		if (key!=player.id && adversarios[key].time!=undefined) {
			adversarios[key].draw();
			adversarios[key].update();
		}
		else if (key!=player.id) player.time = adversarios[key].time;
	}

	// TORRES
	for (var key in torres) {
		torres[key].draw();
		torres[key].update();
	}

	// player
	if (jogando) {
		player.draw();
		player.update();
		//MAP
		mapa.draw();
	} else {
		if (velocidadeCentro==null) velocidadeCentro=createVector(0, 3);

		if (centro.pos.y>96.5*ladrilho*mapaIncrease) { 
			centro.pos.y = 96.5*ladrilho*mapaIncrease
			sentido="direita";
			velocidadeCentro.set(3, 0);
		}
		if (centro.pos.x>96.5*ladrilho*mapaIncrease) {
			sentido="cima";
			velocidadeCentro.set(0, -3);
		}
		if (centro.pos.y<12.5*ladrilho*mapaIncrease) {
			sentido="esquerda";
			velocidadeCentro.set(-3, 0);
		}
		if (centro.pos.x<12.5*ladrilho*mapaIncrease) {
			sentido="baixo";
			velocidadeCentro.set(0, 3);
		}

		centro.pos.add(velocidadeCentro);
	}

	temp = false;
}

function mouseMoved() {
	if (parado || !jogando) return;
	player.rotate();
}

// function windowResized() {
// 	resizeCanvas(windowWidth, windowHeight);
// }

function criarCenario1() {
	// chão
	places.push(new Lugar(0, 0, 25*ladrilho, 25*ladrilho)); // A
	places.push(new Lugar(8*ladrilho, 25*ladrilho, 9*ladrilho, 25*ladrilho));
	places.push(new Lugar(8*ladrilho, 50*ladrilho, 9*ladrilho, 9*ladrilho)); //Pequeno LEFT
	places.push(new Lugar(8*ladrilho, 59*ladrilho, 9*ladrilho, 25*ladrilho));
	places.push(new Lugar(0, 84*ladrilho, 25*ladrilho, 25*ladrilho)); // B
	places.push(new Lugar(25*ladrilho, 92*ladrilho, 25*ladrilho, 9*ladrilho));
	places.push(new Lugar(50*ladrilho, 92*ladrilho, 9*ladrilho, 9*ladrilho)); //Pequeno BOTTOM
	places.push(new Lugar(59*ladrilho, 92*ladrilho, 25*ladrilho, 9*ladrilho));
	places.push(new Lugar(84*ladrilho, 84*ladrilho, 25*ladrilho, 25*ladrilho)); // C
	places.push(new Lugar(92*ladrilho, 59*ladrilho, 9*ladrilho, 25*ladrilho));
	places.push(new Lugar(92*ladrilho, 50*ladrilho, 9*ladrilho, 9*ladrilho)); //Pequeno RIGHT
	places.push(new Lugar(92*ladrilho, 25*ladrilho, 9*ladrilho, 25*ladrilho));
	places.push(new Lugar(84*ladrilho, 0, 25*ladrilho, 25*ladrilho)); // D
	places.push(new Lugar(25*ladrilho, 8*ladrilho, 25*ladrilho, 9*ladrilho));
	places.push(new Lugar(50*ladrilho, 8*ladrilho, 9*ladrilho, 9*ladrilho)); //Pequeno TOP
	places.push(new Lugar(59*ladrilho, 8*ladrilho, 25*ladrilho, 9*ladrilho));
	places.push(new Lugar(42*ladrilho, 42*ladrilho, 25*ladrilho, 25*ladrilho)); // E
	places.push(new Lugar(17*ladrilho, 50*ladrilho, 25*ladrilho, 9*ladrilho)); //Central LEFT
	places.push(new Lugar(50*ladrilho, 67*ladrilho, 9*ladrilho, 25*ladrilho)); //Central BOTTOM
	places.push(new Lugar(67*ladrilho, 50*ladrilho, 25*ladrilho, 9*ladrilho)); //Central RIGHT
	places.push(new Lugar(50*ladrilho, 17*ladrilho, 9*ladrilho, 25*ladrilho)); //Central TOP

	// paredes
	for (var i = 0; i < cenario1.length; i++) {
		for (var j = 0; j < cenario1[i].length-1; j++) {
			index = paredes.push(new Parede(
				cenario1[i][j][0], 
				cenario1[i][j][1], 
				cenario1[i][j+1][0], 
				cenario1[i][j+1][1]));

			paredes[index-1].calcTipo();
		}
	}

	// bases
	bases.push(new Base(12.5*ladrilho, 12.5*ladrilho, 'A'));
	bases.push(new Base(12.5*ladrilho, 96.5*ladrilho, 'B'));
	bases.push(new Base(96.5*ladrilho, 12.5*ladrilho, 'C'));
	bases.push(new Base(96.5*ladrilho, 96.5*ladrilho, 'D'));
	bases.push(new Base(54.5*ladrilho, 54.5*ladrilho, 'E'));

	torres.push(new Torre(0, 54.5*ladrilho, 42*ladrilho));
	torres.push(new Torre(1, 42*ladrilho, 54.5*ladrilho));
	torres.push(new Torre(2, 67*ladrilho, 54.5*ladrilho));
	torres.push(new Torre(3, 54.5*ladrilho, 67*ladrilho));

	ajustarTam();
}

function criarCenario2() {
	places.push(new Lugar(0, 0, 109*ladrilho, 109*ladrilho)); // todo

	for (var i = 0; i < cenario2.length; i++) {
		for (var j = 0; j < cenario2[i].length-1; j++) {
			index = paredes.push(new Parede(
				cenario2[i][j][0], 
				cenario2[i][j][1], 
				cenario2[i][j+1][0], 
				cenario2[i][j+1][1]));

			paredes[index-1].calcTipo();
		}
	}

	// bases
	bases.push(new Base(12.5*ladrilho, 12.5*ladrilho, 'A'));
	bases.push(new Base(12.5*ladrilho, 96.5*ladrilho, 'B'));
	bases.push(new Base(96.5*ladrilho, 12.5*ladrilho, 'C'));
	bases.push(new Base(96.5*ladrilho, 96.5*ladrilho, 'D'));
	bases.push(new Base(54.5*ladrilho, 54.5*ladrilho, 'E'));
	bases.push(new Base(109/2*ladrilho, 109/4*ladrilho, 'F'));
	bases.push(new Base(109/4*ladrilho, 109/2*ladrilho, 'G'));
	bases.push(new Base(109/2*ladrilho, 109/4*3*ladrilho, 'H'));
	bases.push(new Base(109/4*3*ladrilho, 109/2*ladrilho, 'I'));

	torres.push(new Torre(0, 54.5*ladrilho, 42*ladrilho));
	torres.push(new Torre(1, 42*ladrilho, 54.5*ladrilho));
	torres.push(new Torre(2, 67*ladrilho, 54.5*ladrilho));
	torres.push(new Torre(3, 54.5*ladrilho, 67*ladrilho));
	torres.push(new Torre(4, 109/4*ladrilho, 109/4*ladrilho));
	torres.push(new Torre(5, 109/4*ladrilho, 109/4*3*ladrilho));
	torres.push(new Torre(6, 109/4*3*ladrilho, 109/4*3*ladrilho));
	torres.push(new Torre(7, 109/4*3*ladrilho, 109/4*ladrilho));

	ajustarTam();
}

function ajustarTam(tam) {
	tam = tam || mapaIncrease;

	for (var i = 0; i < places.length; i++) {
		places[i].pos.x *= mapaIncrease;
		places[i].pos.y *= mapaIncrease;
		places[i].w *= mapaIncrease;
		places[i].h *= mapaIncrease;
	}

	for (var i = 0; i < bases.length; i++) {
		bases[i].pos.x *= mapaIncrease;
		bases[i].pos.y *= mapaIncrease;
	}

	for (var i = 0; i < paredes.length; i++) {
		paredes[i].pos.x *= mapaIncrease;
		paredes[i].pos.y *= mapaIncrease;
		paredes[i].fim.x *= mapaIncrease;
		paredes[i].fim.y *= mapaIncrease;
	}

	for (var key in torres) {
		torres[key].pos.x *= 2;
		torres[key].pos.y *= 2;
	}
}

function preLoad() {
	// fontes['quicksand'] = loadFont('');
}

function calcularLinhas() {
	temp = true;
	ccc = 0; 
	for (var key in places) {
		ccc+=places[key].linha; 
		console.log(key+" - "+places[key].linha);
	} 
	console.log(ccc);
}

function verJogadores() {
	socket.emit('verJogadores', 'teste');
}