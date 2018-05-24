var labels = ['Guest', 'Login', 'Sign Up'];
var alturas = ['290px', '370px', '450px'];
var atual = labels[1];

$(document).ready(function() {
	console.log('abriu');
});

$("#voltar").click(function() {
	console.log('voltar');
	if (atual==labels[1]) {
		$("#login").css({opacity: 0, left: '110%'});
		$("#sem-login").css({opacity: 1, left: '0%'});
		$("#entrar-container").height(alturas[0]).addClass('azul');

		$("#voltar").fadeOut();
		$("#proximo b").text(labels[1]);
		atual = labels[0];
	} else if (atual==labels[2]) {
		$("#cadastro").css({opacity: 0, left: '110%'});
		$("#login").css({opacity: 1, left: '0%'});
		$("#entrar-container").height(alturas[1]).removeClass('azul');

		$("#voltar b").text(labels[0]);
		$("#proximo").fadeIn().find('b').text(labels[2]);
		atual = labels[1];
	}
});

$("#proximo").click(function() {
	console.log('proximo');
	if (atual==labels[1]) {
		$("#login").css({opacity: 0, left: '-110%'});
		$("#cadastro").css({opacity: 1, left: '0%'});
		$("#entrar-container").height(alturas[2]).addClass('azul');

		$("#proximo").fadeOut();
		$("#voltar b").text(labels[1]);
		atual = labels[2];
	} else if (atual==labels[0]) {
		$("#login").css({opacity: 1, left: '0%'});
		$("#sem-login").css({opacity: 0, left: '-110%'});
		$("#entrar-container").height(alturas[1]).removeClass('azul');

		$("#proximo b").text(labels[2]);
		$("#voltar").fadeIn().find('b').text(labels[0]);
		atual = labels[1];
	}
});

function xp(xp) {
	// console.log(lv);
	i = 0;
	qtd = xp;
	while (true) {
		if (qtd>=lv[i]) {
			qtd-=lv[i];
			i++;
		}
		else {
			$("#xp .barra").width((qtd/lv[i]*100)+"%");
			$("#xp .qtd").text(qtd+"/"+lv[i]);
			break;
		}
	}

	$("#xp .label").text("Lv "+(i+1))

	return i+1;
}