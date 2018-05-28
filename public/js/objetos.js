function Player(x, y) {
	this.pos = createVector(x, y);
	this.vel = createVector();
	this.upgrades = [1,1,1,1,1];
	this.cadenciaMin = 15/this.upgrades[0]; // + .1 por upgrade
	this.vidaBala = 25*this.upgrades[1]; // + .2 por vez
	this.velocity = 10*this.upgrades[2]; // + .1 por vez
	this.recuperacao = 0.02*this.upgrades[3]; // + .2 por vez
	this.danoBala = 10*this.upgrades[4]; // + .1 por vez
	this.r = 20;
	this.b = 2;
	this.angle = 0;
	this.id = random(-10, 10);
	this.balas = [];
	this.cadencia = 0;
	this.place = 0;
	this.time = meuTime;
	this.life = 100;
	this.xp = 0;
	this.level = 1;
	this.ultimoLv = 1;
	this.nome = nickname;
	this.pontos = 0;
	this.ultimoTiro;

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

		if (mouseIsPressed && this.cadencia>=this.cadenciaMin) {
			player.atirar();
			this.cadencia=0;
		}

		this.cadencia++;

		for (var i = 0; i < this.balas.length; i++) {
			semDono = this.balas[i].update();

			teste = this.balas[i].overlap();
			teste2 = this.balas[i].atingiu();
			teste3 = this.balas[i].torre();
			teste4 = this.balas[i].perseguidor();

			if (teste2!=false && adversarios[teste2].life<=0) {
				this.exp(50);
				// adversarios[teste2].morreu();
			}
			if (teste3!==false && torres[teste3].lifeFinal<=0) this.exp(50);
			if (teste4!=false) this.exp(2);

			if (this.balas[i].time<=0 || teste || teste2!=false || teste3!==false || teste4 || semDono) this.balas.splice(i, 1);

			if (teste3!==false) {
			  	// console.log(teste3);
				var data = {
					torre: teste3,
					life: torres[teste3].life
				  };
			  	socket.emit('torreUpdate', data);
			}
		}

		this.morreu();

		if (this.life<100) {
			this.life+=this.recuperacao;
		}

		var data = {
		    x: this.pos.x,
		    y: this.pos.y,
		    angle: this.angle,
		    life: this.life,
		    xp: this.xp,
		    // upgrades: this.upgrades
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
		this.balas.push(new Bala(this.id, this.pos.x, this.pos. y, this.angle, this.vidaBala, this.danoBala));

		data = {
			dono: this.id,
			x: this.pos.x,
			y: this.pos.y,
			angle: this.angle,
			vidaBala: this.vidaBala,
			danoBala: this.danoBala
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

			if (t.estado==0) continue;

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

	this.exp = function(x) {
		player.xp += x;


		this.level = xp(player.xp);

		pontos = this.level - this.ultimoLv;
		this.pontos += pontos*2>0?pontos:0;

		if (this.pontos>0) chamarUpgrades();

		if (this.level>this.ultimoLv) this.ultimoLv = this.level;
	}

	this.morreu = function() {
		morreu = this.life<=0?true:false;

		if (morreu) {
			// console.log(this.ultimoTiro);
			if (this.ultimoTiro!==false) socket.emit('feed', "<li><span class='time"+(this.ultimoTiro.time+1)+"'>"+this.ultimoTiro.nome+"</span> kills <span class='time"+(this.time+1)+"'>"+this.nome+"</span></li>");
			jogando=false;
			centro.pos = this.pos.copy();
			mostrarInicio();

			socket.emit('morreu', {id: this.id});
		}

		return morreu;
	}

	this.up = function(index) {
		if (this.pontos==0) return true;
		console.log(index);

		if (index==0) valor = 0.1;
		if (index==1) valor = 0.2;
		if (index==2) valor = 0.1;
		if (index==3) valor = 0.02;
		if (index==4) valor = 0.1;

		this.upgrades[index] += valor;

		this.pontos--;
		this.atualizarUpgrades();

		if (this.pontos<=0) {
			this.pontos=0;
			return true;
		} else return (this.upgrades[index]-1/valor)+1;
	}

	this.atualizarUpgrades = function() {
		this.cadenciaMin = 15/this.upgrades[0];
		this.vidaBala = 25*this.upgrades[1];
		this.velocity = 10*this.upgrades[2];
		this.recuperacao = 0.01*this.upgrades[3];
		this.danoBala = 10*this.upgrades[4];
	}
}

function Adversario(x, y, time, life, angle, id, nome) {
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
	this.nome = nome;

	this.draw = function() {
		for (var i = 0; i < this.balas.length; i++) {
			this.balas[i].draw();
		}

		if (this.pos.x < centro.pos.x-width || this.pos.x > centro.pos.x+width) return;
		if (this.pos.y < centro.pos.y-height || this.pos.y > centro.pos.y+height) return;

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
			teste4 = this.balas[i].perseguidor();

			if (this.balas[i].time<=0 || teste || teste2!=false || teste3!=false || teste4) this.balas.splice(i, 1);
		}
	}

	this.morreu = function() {
		if (this.life>0) return;

		delete adversarios[this.id];

		socket.emit('morreu', {player: this.id});
	}
}

function Bala(dono, x, y, angle, vida, dano) {
	this.dono = dono;
	this.pos = createVector(x, y)
	this.time = vida; // 25
	this.dano = dano; // 10
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

		if (!(this.dono in adversarios)) return true;
		else return false;
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
				if (adv.id==player.id) {
					player.life-=this.dano;
					player.ultimoTiro = {time: adversarios[this.dono].time, nome: adversarios[this.dono].nome};
				}
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

			if (adversarios[this.dono].time==t.time || t.estado==0) continue;
			distancia = dist(this.pos.x, this.pos.y, t.pos.x, t.pos.y);
			if (distancia<=t.r) {
				t.dano(this.dano);

				tocou = key;
				break;
			}
		}
		return tocou;
	}

	this.perseguidor = function() {
		tocou = false;
		for (var key in torres) {
			t = torres[key];

			for (var i in t.pers) {
				p = t.pers[i];
				if (adversarios[this.dono].time==t.time) continue;
				distancia = dist(this.pos.x, this.pos.y, p.pos.x, p.pos.y);
				if (distancia<=p.r) {
					t.pers.splice(i, 1);

					tocou = true;
					break;
				}
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
		inicioX = centro.pos.x - width/1.5;
		inicioX = inicioX<this.pos.x?this.pos.x:floor(inicioX/ladrilho)*ladrilho;
		inicioY = centro.pos.y - height/1.5;
		inicioY = inicioY<this.pos.y?this.pos.y:floor(inicioY/ladrilho)*ladrilho;

		fimX = this.w < centro.pos.x + width/1.5 ? this.w : centro.pos.x + width/1.5
		fimY = this.h < centro.pos.y + height/1.5 ? this.h : centro.pos.y + height/1.5
		
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
	this.tomado = false;

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
			arc(0, 0, this.r*2-15, this.r*2-15, 0, 360*tempPossuido/1000/180*PI);
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
		for(var key in this.possuido) {
			if (this.possuido[key]<0) {
				this.possuido[key] = 0; 
				// this.time=-1;
			} else if (this.possuido[key]>this.maximo) {
				this.possuido[key] = this.maximo; 
			}
		}

		if (!jogando) return;

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
			if (this.possuido[key]<=0) {
				this.possuido[key] = 0;
			} else if (this.possuido[key]>this.maximo) {
				this.possuido[key] = this.maximo; 
			}
		}

		e = this.possuido[0]>this.possuido[1]?0:1;

		if (this.tomado===false && this.possuido[e]>=this.maximo) {
			console.log(this.tomado);
			if (this.times[e].indexOf(player.id) != -1) player.exp(200/this.times[e].length);

			adicionarFeed("<li><span class='time"+(Number(e)+1)+"'>Team "+(Number(e)+1)+"</span> has taken point <span class='time"+(Number(e)+1)+"'>"+this.letra+"</span></li>");
			this.tomado = e;
		} else if (this.tomado!==false && this.possuido[0]==0 && this.possuido[1]==0) {
			adicionarFeed("<li><span class='time"+(Number(this.tomado)+1)+"'>Team "+(Number(this.tomado)+1)+"</span> has lost point "+this.letra+"</li>");
			this.tomado = false;
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
	this.cadenciaMin = 30;
	this.cadencia = 0;
	this.pers = [];
	this.teste = false;
	this.tiroCor;
	this.lifeFinal = 200;
	this.estado = 1; //0 = sem funcionar ___ 1 = funcionando 
	this.text = "SPACE TO BUY";

	this.draw = function() {
		for (var i in this.pers) {
			this.pers[i].draw();
		}

		push();

		translate(this.pos.x, this.pos.y);

		if (this.estado==0 && jogando) {
			distancia = dist(player.pos.x, player.pos.y, this.pos.x, this.pos.y);

			if (distancia+player.r <= this.raioBusca) {
				noStroke();
				fill('rgba(0,0,0,.3)');
				rect(-this.r*2, this.r*1.5, this.r*4, this.r/1.5, 5);
				fill('white');
				textAlign(CENTER);
				textSize(15);
				textFont('quicksand');
				textStyle(BOLD);
				text(this.text, 0, this.r*1.5+this.r/2);

				if (keyIsPressed === true && keyCode==32) {
					qtd = player.xp;
					i=0;
					while (true) {
						if (qtd>lv[i]) {
							qtd-=lv[i];
							i++;
						} else break;
					}

					if (qtd>=200) {
						console.log(qtd);
						player.exp(-200);
						this.reviver(player.time);

						socket.emit('torreUpdate', {torre: this.id, time: player.time, estado: 1});
					}
				}
			}
		}

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

		if (this.estado==1) {
			stroke(lerpColor(color('#8BC34A'), color('#ef070e'), 1-this.life/200));
			arc(0, 0, this.r*0.5, this.r*0.5, 0, TWO_PI*this.life/200);
		}

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

		if ('playerId' in this && this.playerId!=null) {
			if (this.playerId in adversarios && adversarios[this.playerId].time==this.time) {
				this.playerId = null;
				this.player = null;
			}
		}

		for (var i in this.pers) {
			teste = this.pers[i].update();

			if (teste) {
				this.pers.splice(i, 1);
				break;
			}
		}

		if (this.estado==1) {
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

		if (this.life<0 && this.estado==1) {
			this.estado = 0;
			this.life = 0;
			this.time = -1;
			socket.emit('torreUpdate', {torre: this.id, estado: this.estado});
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
			if (!jogando) return;
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

	this.reviver = function(time) {
		this.life = 200;
		this.lifeFinal = 200;
		this.time = time;
		this.estado = 1;
		this.player = null;
	}
}

function Perseguidor(x, y, torre, cor) {
	this.pos = createVector(x, y);
	this.vel = 4.5;
	this.angle = torre.angle;
	this.r = 25;
	this.cor = cor;
	this.dano = 10;
	this.playerId = torre.playerId;
	this.player = adversarios[torre.playerId].pos;
	this.h = this.r * (Math.sqrt(3)/2);
	this.pontos = [[0, -this.h/2], [-this.r/2, this.h/2], [this.r/2, this.h/2]];


	this.draw = function() {
		push();

		translate(this.pos.x, this.pos.y);
		rotate(this.angle+HALF_PI);
		fill(this.cor);
		// noStroke();
		strokeWeight(4);
		stroke('rgba(0,0,0,.3)');
		triangle(this.pontos[0][0], this.pontos[0][1], this.pontos[1][0], this.pontos[1][1], this.pontos[2][0], this.pontos[2][1]);
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
				player.ultimoTiro = false;
			}
			adversarios[this.playerId].life -= this.dano;
			if (adversarios[this.playerId].life<=0) {
				adversarios[this.playerId].morreu();
			}
			// console.log(this.id);
			return true;
		}

		return false;
	}
}

function Numero(x, y, tipo) {
	this.pos = createVector(x, y);
	this.tipo = tipo;

	this.draw = function() {
		
	}

	this.update = function() {
		
	}
}