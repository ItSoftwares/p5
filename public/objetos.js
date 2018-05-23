function Player(x, y) {
	this.pos = createVector(x, y);
	this.vel = createVector();
	this.velocity = 10;
	this.r = 20;
	this.b = 2;
	this.angle = 0;
	this.id = random(-10, 10);
	this.balas = [];
	this.cadenciaMin = 15;
	this.cadencia = 0;
	this.place = 0;
	this.time = floor(random(0,2));
	this.life = 100;

	this.draw = function() {
		for (var i = 0; i < this.balas.length; i++) {
			this.balas[i].draw();
		}

		push();
		noStroke();
		fill('#65656755');
		rect(this.pos.x - this.r, this.pos.y + this.r*1.5, this.r*2, this.r/3);
		fill(lerpColor(color('#8BC34A'), color('#ef070e'), 1-this.life/100));
		rect(this.pos.x - this.r, this.pos.y + this.r*1.5, this.r*2*this.life/100, this.r/3);

		translate(this.pos.x, this.pos.y);
		rotate(this.angle);
		noStroke();
		fill(times[this.time].cor);
		ellipse(0, 0, this.r*2, this.r*2);

		noFill();
		stroke("#00000060");
		strokeWeight(this.b);
		ellipse(0, 0, this.r*2-this.b, this.r*2-this.b);

		fill(times[this.time].cor);
		strokeWeight(2);
		noStroke();
		rotate(90/180*PI);
		translate(0, 0 - this.r*1.3);
		triangle(	this.r*0.2, this.r*0.2, 
					-this.r*0.2, this.r*0.2, 
					0, -this.r*0.7*0.2);
		pop();
	}

	this.update = function() {
		this.move();
		// vel = this.vel.copy();
		// if (this.torre!==false && this.repulse==false) vel.mult(-1);
		this.pos.add(this.vel);
		this.rotate();
		this.overlap();

		if (mouseIsPressed && this.cadencia<=0) {
			player.atirar();
			this.cadencia=this.cadenciaMin;
		}

		if (this.cadencia>0) this.cadencia--;

		for (var i = 0; i < this.balas.length; i++) {
			this.balas[i].update();

			teste = this.balas[i].overlap();
			teste2 = this.balas[i].atingiu();
			teste3 = this.balas[i].torre();

			if (this.balas[i].time<=0 || teste || teste2!=false || teste3!==false) this.balas.splice(i, 1);

			if (teste3!==false) {
			  	// console.log(teste3);
				var data = {
					torre: teste3,
					life: torres[teste3].life
				  };
			  	socket.emit('torreUpdate', data);
			}
		}

		var data = {
		    x: this.pos.x,
		    y: this.pos.y,
		    angle: player.angle,
		    life: player.life
		  };
		  socket.emit('update', data);
	}

	this.rotate = function() {
		this.angle = atan2(mouseY - height/2, mouseX - width/2);
	}

	this.move = function() {
		if (keyIsDown(w)) {
			this.vel.y = lerp(this.vel.y, -this.velocity, 0.1);
		}
		if (keyIsDown(s)) {
			this.vel.y = lerp(this.vel.y, this.velocity, 0.1);
		}
		if (keyIsDown(a)) {
			this.vel.x = lerp(this.vel.x, -this.velocity, 0.1);
		}
		if (keyIsDown(d)) {
			this.vel.x = lerp(this.vel.x, this.velocity, 0.1);
		}

		this.vel.x = lerp(this.vel.x, 0, 0.05);
		this.vel.y = lerp(this.vel.y, 0, 0.05);
	}

	this.atirar = function() {
		this.balas.push(new Bala(this.id, this.pos.x, this.pos. y, this.angle));

		data = {
			dono: this.id,
			x: this.pos.x,
			y: this.pos.y,
			angle: this.angle
		}

		socket.emit('atirou', data);
	}

	this.overlap = function() {
		for (var i = 0; i < paredes.length; i++) {
			p = paredes[i];
			if (p.tipo=='v' && this.pos.y >= p.pos.y && this.pos.y <= p.fim.y) {
				if (p.lado==-1) {
					if (this.pos.x < p.pos.x && this.pos.x + this.r > p.pos.x) 
						this.vel.x = lerp(this.vel.x, -this.velocity*2.5, 0.1);
				}
				else {
					if (this.pos.x > p.pos.x && this.pos.x - this.r < p.pos.x) 
						this.vel.x = lerp(this.vel.x, this.velocity*2.5, 0.1);
				}
			} 

			if (p.tipo=='h' && this.pos.x >= p.pos.x && this.pos.x <= p.fim.x) {
				if (p.lado==-1) {
					if (this.pos.y < p.pos.y && this.pos.y + this.r > p.pos.y)
						this.vel.y = lerp(this.vel.y, -this.velocity*2.5, 0.1);
				}
				else {
					if (this.pos.y > p.pos.y && this.pos.y - this.r < p.pos.y) {
						this.vel.y = lerp(this.vel.y, this.velocity*2.5, 0.1);
					}
				}
			}
		}

		for (var i = 0; i < torres.length; i++) {
			t = torres[i];

			distancia = dist(this.pos.x, this.pos.y, t.pos.x, t.pos.y);

			if (distancia<this.r+t.r) {
				// force = this.vel.copy();
				// force.mult(-2.25);
				// this.vel.add(force);
				this.vel.mult(-1.25)
				break;
			}
		}
	}
}

function Adversario(x, y, time, life, angle, id) {
	this.pos = createVector(x, y);
	this.vel = createVector(0, 0);
	this.r = 20;
	this.b = 2;
	this.angle = angle;
	this.novoAngle = angle;
	this.time = time;
	// this.cor = times[this.time].cor;
	this.life = life;
	this.balas = [];
	this.id = id;

	this.draw = function() {
		for (var i = 0; i < this.balas.length; i++) {
			this.balas[i].draw();
		}

		if (this.pos.x < player.pos.x-width || this.pos.x > player.pos.x+width) return;
		if (this.pos.y < player.pos.y-height || this.pos.y > player.pos.y+height) return;

		push();
		noStroke();
		fill('#65656755');
		rect(this.pos.x - this.r, this.pos.y + this.r*1.5, this.r*2, this.r/3);
		fill(lerpColor(color('#8BC34A'), color('#ef070e'), 1-this.life/100));
		rect(this.pos.x - this.r, this.pos.y + this.r*1.5, this.r*2*this.life/100, this.r/3);

		translate(this.pos.x, this.pos.y);

		rotate(this.angle);
		noStroke();
		fill(times[this.time].cor);
		ellipse(0, 0, this.r*2, this.r*2);

		noFill();
		stroke("#00000060");
		strokeWeight(this.b);
		ellipse(0, 0, this.r*2-this.b, this.r*2-this.b);

		fill(times[this.time].cor);
		strokeWeight(2);
		rotate(90/180*PI);
		translate(0, 0 - this.r*1.3);
		triangle(	this.r*0.2, this.r*0.2, 
					-this.r*0.2, this.r*0.2, 
					0, -this.r*0.7*0.2);
		pop();
	}

	this.update = function() {
		for (var i = 0; i < this.balas.length; i++) {
			this.balas[i].update();

			teste = this.balas[i].overlap();
			teste2 = this.balas[i].atingiu();
			teste3 = this.balas[i].torre();

			if (this.balas[i].time<=0 || teste || teste2!=false || teste3) this.balas.splice(i, 1);
		}
	}
}

function Bala(dono, x, y, angle) {
	this.dono = dono;
	this.pos = createVector(x, y)
	this.time = 25;
	this.dano = 10;
	this.angle = angle;
	this.vel = p5.Vector.fromAngle(angle);
	this.vel.mult(25);

	this.draw = function() {
		push();

		translate(this.pos.x, this.pos.y);
		rotate(this.angle);
		stroke(0); 
		strokeWeight(3);
		point(0, 0);

		pop();
	}

	this.update =function() {
		this.pos.add(this.vel);
		this.time--;
	}

	this.overlap = function(p) {
		qtd = 0;
		for (var i = 0; i < places.length; i++) {
			p = places[i];
			if (p.estaDentro(this.pos)) qtd += 1;
			if (qtd>0) break;
		}

		if (qtd==0) return true;
		else return false;
	}

	this.atingiu = function() {
		tocou = false;
		for (var key in adversarios) {
			adv = adversarios[key];
			// console.log(adversarios[this.dono].time==adv.time);
			if (this.dono==key || adversarios[this.dono].time==adv.time) continue;
			distancia = dist(this.pos.x, this.pos.y, adv.pos.x, adv.pos.y);
			if (distancia<adv.r) {
				adv.life -= this.dano;
				if (adv.id==player.id) player.life-=this.dano;
				return key;
				break;
			}
		}
		return tocou;
	}

	this.torre = function() {
		tocou = false;
		for (var key in torres) {
			t = torres[key];

			if (adversarios[this.dono].time==t.time) continue;
			distancia = dist(this.pos.x, this.pos.y, t.pos.x, t.pos.y);
			if (distancia<=t.r) {
				t.dano(this.dano);

				tocou = key;
				break;
			}
		}
		return tocou;
	}
}

function Lugar(x, y, w, h) {
	this.pos = createVector(x, y);
	this.w = x+w;
	this.h = y+h;
	this.c = 240;
	// this.c2 = color(random(0, 255), random(0, 255), random(0, 255));

	this.draw = function() {
		count = 0;
		push();
		inicioX = player.pos.x - width/1.5;
		inicioX = inicioX<this.pos.x?this.pos.x:floor(inicioX/ladrilho)*ladrilho;
		inicioY = player.pos.y - height/1.5;
		inicioY = inicioY<this.pos.y?this.pos.y:floor(inicioY/ladrilho)*ladrilho;

		fimX = this.w < player.pos.x + width/1.5 ? this.w : player.pos.x + width/1.5
		fimY = this.h < player.pos.y + height/1.5 ? this.h : player.pos.y + height/1.5
		
		stroke(this.c);
		strokeWeight(1);

		for(i=inicioX; i<=fimX; i+=ladrilho) {
			if (temp) count++;
			line(i, this.pos.y, i, this.h);
		}

		for(i=inicioY; i<=fimY; i+=ladrilho) {
			if (temp) count++;
			line(this.pos.x, i, this.w, i);
		}

		if (temp) {
			this.linha = count;
			linha += count;
		}
		pop();
	}

	this.estaDentro = function(ponto) {
		if (ponto.x > this.pos.x && ponto.x < this.w && ponto.y > this.pos.y && ponto.y < this.h) return true;
		else return false;
	}
}

function Parede(x, y, x2, y2) {
	if (x<x2 || y<y2) {
		this.pos = createVector(x, y);
		this.fim = createVector(x2, y2);
	} else {
		this.fim = createVector(x, y);
		this.pos = createVector(x2, y2);
	}
	this.pos = createVector(x<x2?x:x2, y<y2?y:y2);
	this.fim = createVector(x>x2?x:x2, y>y2?y:y2);
	this.tipo = 'h'; // h para horizonatal e v para vertical
	this.lado = 1;
	this.ponto = 0

	this.draw = function() {
		stroke(180);
		line(this.pos.x, this.pos.y, this.fim.x, this.fim.y);

		// point(this.ponto.x, this.ponto.y);
	}

	this.calcTipo = function() {
		if (this.pos.x == this.fim.x) this.tipo = 'v';

		for (var i = 0; i < places.length; i++) {
			p = places[i];

			if (this.tipo == 'v')
				this.ponto = createVector(this.pos.x + ladrilho/2, this.pos.y + (this.fim.y-this.pos.y) / 2);
			else
				this.ponto = createVector(this.pos.x + (this.fim.x-this.pos.x) / 2, this.pos.y + ladrilho/2);

			if (p.estaDentro(this.ponto)) {
				this.lado = 1;
				break;
			} else {
				if (this.tipo=='v') this.ponto.x -= 40 ;
				else this.ponto.y -= 40;
				this.lado = -1;
			}
		}
	}
}

function Bola(x, y) {
	this.pos = createVector(x, y);
	this.r = 10;
	this.b = 2;
	this.c = "#FFC107";

	this.draw = function() {
		noStroke();
		fill(this.c);
		ellipse(this.pos.x, this.pos.y, this.r*2, this.r*2);

		noFill();
		stroke("#00000060");
		strokeWeight(this.b);
		ellipse(this.pos.x, this.pos.y, this.r*2-this.b, this.r*2-this.b);
	}
}

function Base(x, y, letra) {
	this.pos = createVector(x, y);
	// this.possuido = 0;
	this.time = -1;
	this.times = {0: [], 1: []};
	this.possuido = {0: 0, 1: 0};
	this.r = 150;
	this.letra = letra;
	this.s = 16;
	this.qtd = 0;
	this.overlap = false;
	this.cor = 'rgba(255,255,255,0.3)';
	this.corMapa = 'rgba(0,0,0,0.3)';
	this.maximo = 1000;

	this.draw = function() {
		// noStroke();
		if (this.possuido[0]>0 || this.possuido[1]>0) {
			push();
			translate(this.pos.x, this.pos.y);
			rotate(-90/180*PI);
			noFill();

			this.cor = 'rgba(0,0,0,0.3)';
			this.corMapa = 'rgba(0,0,0,0.3)';
			if (this.possuido[0]>0) {
				this.cor = times[0].cor
				tempPossuido = this.possuido[0];
			} else if (this.possuido[1]>0) {
				this.cor = times[1].cor
				tempPossuido = this.possuido[1];
			}

			if (this.possuido[0]==this.maximo) {
				this.corMapa = times[0].cor
			} else if (this.possuido[1]==this.maximo) {
				this.corMapa = times[1].cor
			}
			stroke(this.cor);
			strokeWeight(this.s);
			arc(0, 0, this.r*2-15, this.r*2-15, 0/180*PI, 360*tempPossuido/1000/180*PI);
			pop();
		}

		push();
		stroke('rgba(0,0,0,.3)');
		strokeWeight(2);
		noFill();
		ellipse(this.pos.x, this.pos.y, this.r*2, this.r*2);
		ellipse(this.pos.x, this.pos.y, this.r*2-30, this.r*2-30);
		pop();

		noFill();
		stroke(this.corMapa);
		strokeWeight(3);
		// fill('rgba(0,0,0,.3)');
		textFont('quicksand');
		textSize(this.r);
		textAlign(CENTER);
		text(this.letra, this.pos.x, this.pos.y + this.r*2/7);
	}

	this.update = function() {
		di = dist(player.pos.x, player.pos.y, this.pos.x, this.pos.y);

		tamTime0 = this.times[0].length;
		tamTime1 = this.times[1].length;

		if (tamTime0<0) this.times[0] = [];
		if (tamTime1<0) this.times[1] = [];
		
		if (tamTime0>tamTime1) {
			this.qtd = tamTime0-tamTime1;
			this.qtd *= 2;

			if (this.possuido[1]>0) {
				// this.possuido[1] = lerp(this.possuido[1], 0, this.qtd);
				this.possuido[1] -= this.qtd;
			}
			else {
				// this.possuido[0] = lerp(this.possuido[0], this.maximo, this.qtd);
				this.possuido[0] += this.qtd
			}
		}
		else if (tamTime0<tamTime1) {
			this.qtd = tamTime1-tamTime0;
			this.qtd *= 2;

			if (this.possuido[0]>0) {
				// this.possuido[0] = lerp(this.possuido[0], 0, this.qtd);
				this.possuido[0] -= this.qtd;
			}
			else {
				// this.possuido[1] = lerp(this.possuido[1], this.maximo, this.qtd);
				this.possuido[1] += this.qtd;
			}
		}

		for(var key in this.possuido) {
			if (this.possuido[key]<0) {
				this.possuido[key] = 0; 
				// this.time=-1;
			} else if (this.possuido[key]>this.maximo) {
				this.possuido[key] = this.maximo; 
			}
		}

		if (di < player.r + this.r) {
			if (this.overlap==false) {
				this.times[player.time].push(player.id);
				this.overlap = true;

				data = {
					letra: this.letra,
					times: JSON.stringify(this.times)
				}
				socket.emit('baseUpdate', data);
				// console.log(this.possuido);
			}

			data = {
				letra: this.letra,
				possuido: JSON.stringify(this.possuido)
			}
			socket.emit('basePossuido', data);
		} else {
			if (this.overlap) {
				this.times[player.time].splice(this.times[player.time].indexOf(player.id), 1);
				this.overlap = false;

				data = {
					letra: this.letra,
					times: JSON.stringify(this.times)
				}
				socket.emit('baseUpdate', data);
				// console.log(this.possuido);
			}
		}
	}
}

function Mapa(w, h) {
	this.w = width/zoom*15/100;
	// console.log(zoom);
	this.s = this.w*0.025/109/mapaIncrease;
	this.h = h;
	this.x = player.pos.x + width/2/zoom - (this.w + 20);
	this.y = player.pos.y + height/2/zoom - (this.w + 20);

	this.draw= function() {
		push();
		translate(player.pos.x + width/2/zoom - (this.w + 20), player.pos.y + height/2/zoom - (this.w + 20));
		noStroke();
		fill('rgba(0,0,0,0.15)');
		rect(0, 0, this.w, this.w, 2);

		// LUGARES
		for (var i = 0; i < places.length; i++) {
			p = places[i];
			fill('rgba(255,255,255,0.3)');
			rect(p.pos.x*this.s, p.pos.y*this.s, (p.w-p.pos.x)*this.s, (p.h-p.pos.y)*this.s);
		}

		// BASES
		for (var i = 0; i < bases.length; i++) {
			b = bases[i];
			noStroke();
			if (b.possuido<200) fill('rgba(255,255,255,0.3)');
			else fill(b.corMapa);
			ellipse(b.pos.x*this.s, b.pos.y*this.s, 5, 5);
		}

		// AMIGOS
		for (var key in adversarios) {
			adv = adversarios[key];

			if (adv.time!=player.time) continue;

			stroke(times[player.time].cor);
			point(adv.pos.x*this.s, adv.pos.y*this.s);
		}

		stroke('rgba(0,0,0,1)');
		strokeWeight(4);
		point(player.pos.x*this.s, player.pos.y*this.s);
		stroke(times[player.time].cor);
		strokeWeight(2);
		point(player.pos.x*this.s, player.pos.y*this.s);
		pop();
	}
}

function Torre(id, x, y) {
	this.id = id;
	this.life = 200;
	this.pos = createVector(x, y);
	this.time = -1;
	this.angle = 0;
	this.cor = "#bbb";
	this.corTime = 245;
	this.r = 30;
	this.player = null;
	this.raioBusca = 8*ladrilho;
	this.mostrar = false;
	this.cadenciaMin = 60;
	this.cadencia = 0;
	this.pers = [];
	this.teste = false;
	this.tiroCor;
	this.lifeFinal = 200

	this.draw = function() {
		for (var i in this.pers) {
			this.pers[i].draw();
		}

		push();

		translate(this.pos.x, this.pos.y);
		rotate(this.angle-HALF_PI);
		this.tiroCor = this.time<0?this.cor:times[this.time].cor;
		fill(this.tiroCor);
		noStroke();
		beginShape();
		vertex(-this.r/1.75, 0);
		vertex(this.r/1.75, 0);
		vertex(this.r/3, this.r*1.5);
		vertex(-this.r/3, this.r*1.5);
		endShape(CLOSE);
		ellipse(0, 0, this.r*2);
		fill(this.corTime);
		ellipse(0, 0, this.r);

		noFill();
		strokeWeight(3);
		// stroke('rgba(0,0,0,.3)');
		// arc(0, 0, this.r*2, this.r*2, 0, TWO_PI);

		stroke(lerpColor(color('#8BC34A'), color('#ef070e'), 1-this.life/200));
		arc(0, 0, this.r*0.5, this.r*0.5, 0, TWO_PI*this.life/200);

		if (this.mostrar) {
			strokeWeight(1);
			stroke('#ef070e');
			noFill();
			ellipse(0, 0, this.raioBusca*2);
		}

		pop();
	}

	this.update = function() {
		this.life = lerp(this.life, this.lifeFinal, 0.05);

		for (var i in this.pers) {
			teste = this.pers[i].update();

			if (teste) {
				this.pers.splice(i, 1);
				break;
			}
		}

		if (this.player==null) {
			this.busca();
			this.angle+=PI/90;
		} else {
			// seguir e atirar
			this.seguir();
			if (this.cadencia>=this.cadenciaMin && !this.teste) {
				this.atirar();
				this.cadencia=0;
				// this.teste=true;
			} else this.cadencia++;
		}
	}

	this.seguir = function() {
		this.angle = atan2(this.player.y - this.pos.y, this.player.x - this.pos.x);

		if (dist(this.player.x, this.player.y, this.pos.x, this.pos.y)>this.raioBusca+adv.r) {
			// console.log('saiu');
			this.player = null;
		}
	}

	this.atirar = function() {
		if (player.id==this.playerId) {
			// console.log('teste');
			this.pers.push(new Perseguidor(this.pos.x, this.pos.y, this, this.tiroCor));
			data = {
				id: this.id,
				player: this.playerId
			}
			socket.emit('torreTiro', data);
		}
	}

	this.busca = function() {
		for (var i in adversarios) {
			adv = adversarios[i];

			if (dist(adv.pos.x, adv.pos.y, this.pos.x, this.pos.y)<this.raioBusca+adv.r && this.time!=adv.time) {
				this.player = adv.pos;
				this.playerId = adv.id;
				data = {
					torre: this.id,
					player: adv.id
				}
				socket.emit('torreUpdate', data);

				this.cadencia = 0;
				break;
			}
		}
	}

	this.perseguir = function(id, pos) {
		this.playerId = id;
		this.player = pos;
		this.cadencia = 0;
	}

	this.dano = function(dano) {
		this.lifeFinal -= dano;
	}
}

function Perseguidor(x, y, torre, cor) {
	this.pos = createVector(x, y);
	this.vel = 4.5;
	this.angle = torre.angle;
	this.r = 10;
	this.cor = cor;
	this.dano = 10;
	this.playerId = torre.playerId;
	this.player = adversarios[torre.playerId].pos;

	this.draw = function() {
		push();

		translate(this.pos.x, this.pos.y);
		rotate(this.angle+HALF_PI);
		fill(this.cor);
		noStroke();
		triangle(0, -this.r, this.r, this.r, -this.r, this.r);

		pop();
	}

	this.update = function() {
		if (!(this.playerId in adversarios)) return true;
		dif = this.player.copy();
		dif.sub(this.pos);

		this.angle = atan2(dif.y, dif.x);

		speedx = cos(this.angle) * this.vel;
  		speedy = sin(this.angle) * this.vel;

  		this.pos.x += speedx;
  		this.pos.y += speedy;

  		teste = this.overlap();
  		return teste;
	}

	this.overlap = function() {
		adv = adversarios[this.playerId];

		if (dist(this.pos.x, this.pos.y, adv.pos.x, adv.pos.y)<this.r+adv.r) {
			// console.log(player.id);
			if (this.playerId == player.id) {
				// console.log('teste2');
				player.life -= this.dano;
			}
			adversarios[this.playerId].life -= this.dano;
			// console.log(this.id);
			return true;
		}

		return false;
	}
}