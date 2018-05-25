var labels = ['Guest', 'Login', 'Sign Up'];
var alturas = ['290px', '370px', '450px'];
var atual = labels[1];
var idPopup = 0;

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
	chamarPopupInfo('Ainda estamos trablhando nisso!');
	return;
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

$("#sem-login form").submit(function(e) {
	e.preventDefault();

	$("#feed,#xp").show();

	nickname = $(this).find('[name=guest]').val();

	$("#inicio").hide();
	play();
})

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

function chamarPopupInfo(mensagem, tempo) {
    tempo = tempo || 10000;
    popupInfo = $("<div class='popup popup-info'>").appendTo("body");
    popupInfo.html(mensagem).attr("data-id", idPopup);
    organizarPopups();
    
    popupInfo.delay(tempo).fadeOut(function() {
        $(this).remove();
        // console.log($('.popup-info').length);
        organizarPopups();
    });
    
    idPopup++;
}

function chamarPopupErro(mensagem, tempo) {
    tempo = tempo || 10000;
    popupInfo = $("<div class='popup popup-erro'>").appendTo("body");
    popupInfo.html(mensagem).attr("data-id", idPopup);
    organizarPopups();
    
    popupInfo.delay(tempo).fadeOut(function() {
        $(this).remove();
        // console.log($('.popup-erro').length);
        organizarPopups();
    });
    
    idPopup++;
}

function chamarPopupConf(mensagem, tempo) {
    tempo = tempo || 10000;
    popupInfo = $("<div class='popup popup-conf'>").appendTo("body");
    popupInfo.html(mensagem).attr("data-id", idPopup);
    organizarPopups();
    
    popupInfo.delay(tempo).fadeOut(function() {
        $(this).remove();
        // console.log($('.popup-conf').length);
        organizarPopups();
    });
    
    idPopup++;
}

function chamarPopupLoading(mensagem) {
    popupInfo = $("<div class='popup popup-loading'>").appendTo("body");
    popupInfo.html("<div class='img-loading'></div>"+mensagem).attr("data-id", idPopup);
    organizarPopups();
    idPopup++;
}

function removerLoading() {
    $(".popup-loading").fadeOut(function() {
        $(this).remove();
        // console.log($('.popup-loading').length);
        organizarPopups();
    });
}

function organizarPopups() {
    qtdPopups = $(".popup").length;
   // console.log(qtdPopups);
    altura = 10;
    
    $(".popup").each(function(i, elem) {
        $(elem).css({bottom: altura});
        altura+= $(elem).outerHeight()+10;
    });
}