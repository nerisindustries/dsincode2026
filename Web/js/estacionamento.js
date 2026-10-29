
const CHAVE_DADOS = "neris_estacionamento_dados";

const CUSTO_ENTRADA = 10;
const CUSTO_MINUTO = 10;
const DURACAO_MINUTO = 60 * 1000;

const veiculosIniciais = {
    "002": {
        codigo: "002",
        proprietario: "Richard Praz De Almeida",
        modelo: "Mercedes-AMG GT",
        cor: "Amarela",
        ano: "2018",
        foto: "../img/2018-mercedes-amg-gt-c-coupe-detroit-2017.jpg",
        fotoProprietario: "../img/m.jpeg",
        pontos: 20,
        estacionado: false,
        inicioEstacionamento: null,
        minutosMultados: 0
    },

    "022": {
        codigo: "022",
        proprietario: "Miguel da Silva Junior",
        modelo: "Honda Civic Type R",
        cor: "Azul",
        ano: "2016",
        foto: "../img/download.jpg",
        fotoProprietario: "../img/civic.jpeg",
        pontos: 20,
        estacionado: false,
        inicioEstacionamento: null,
        minutosMultados: 0
    },

    "027": {
        codigo: "027",
        proprietario: "João Pedro Matos",
        modelo: "Lamborghini Huracán STO",
        cor: "Branca",
        ano: "2016",
        foto: "../img/lambo.jpg",
        fotoProprietario: "../img/lambo.jpeg",
        pontos: 20,
        estacionado: false,
        inicioEstacionamento: null,
        minutosMultados: 0
    }
};

const formPesquisa = document.getElementById("formPesquisa");
const codigoPesquisa = document.getElementById("codigoPesquisa");
const cartaoVeiculo = document.getElementById("cartaoVeiculo");
const mensagem = document.getElementById("mensagem");

const formRecarga = document.getElementById("formRecarga");
const codigoRecarga = document.getElementById("codigoRecarga");
const quantidadeRecarga = document.getElementById("quantidadeRecarga");

let codigoAtual = null;

function carregarDados() {
    try {
        const dadosSalvos = localStorage.getItem(CHAVE_DADOS);

        if (!dadosSalvos) {
            return JSON.parse(JSON.stringify(veiculosIniciais));
        }

        const dados = JSON.parse(dadosSalvos);

        for (const codigo in veiculosIniciais) {
            const inicial = veiculosIniciais[codigo];
            const salvo = dados[codigo] || {};

            dados[codigo] = {
                ...inicial,
                ...salvo,

                codigo: inicial.codigo,
                proprietario: inicial.proprietario,
                modelo: inicial.modelo,
                cor: inicial.cor,
                ano: inicial.ano,
                foto: inicial.foto,
                fotoProprietario: inicial.fotoProprietario,

                pontos: salvo.pontos ?? inicial.pontos,
                estacionado: salvo.estacionado ?? inicial.estacionado,
                inicioEstacionamento:
                    salvo.inicioEstacionamento ?? inicial.inicioEstacionamento,
                minutosMultados: salvo.minutosMultados ?? 0
            };
        }

        return dados;
    } catch (erro) {
        return JSON.parse(JSON.stringify(veiculosIniciais));
    }
}

let veiculos = carregarDados();

function salvarDados() {
    localStorage.setItem(CHAVE_DADOS, JSON.stringify(veiculos));
}

function buscarVeiculo(codigo) {
    return veiculos[codigo];
}

function mostrarMensagem(texto, tipo = "") {
    mensagem.textContent = texto;
    mensagem.className = "mensagem";

    if (tipo) {
        mensagem.classList.add(tipo);
    }
}

function criarElemento(tag, classe, texto = "") {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    elemento.textContent = texto;

    return elemento;
}

function criarFoto(caminho, descricao) {
    const bloco = document.createElement("div");

    bloco.className = descricao === "PROPRIETÁRIO"
        ? "foto-proprietario"
        : "foto-veiculo";

    const imagem = document.createElement("img");
    imagem.src = caminho;
    imagem.alt = descricao;
    imagem.loading = "lazy";

    imagem.addEventListener("error", function () {
        const aviso = criarElemento(
            "div",
            "foto-indisponivel",
            "Imagem não encontrada"
        );

        imagem.replaceWith(aviso);
    }, { once: true });

    bloco.appendChild(imagem);
    bloco.appendChild(
        criarElemento("span", "rotulo-foto", descricao)
    );

    return bloco;
}

function criarDado(rotulo, valor) {
    const bloco = criarElemento("div", "dado");

    bloco.appendChild(
        criarElemento("span", "", rotulo)
    );

    bloco.appendChild(
        criarElemento("strong", "", valor)
    );

    return bloco;
}

function formatarTempo(inicio) {
    if (!inicio) {
        return "0 minuto(s)";
    }

    const totalSegundos = Math.floor(
        (Date.now() - inicio) / 1000
    );

    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    if (horas > 0) {
        return `${horas}h ${minutos}min ${segundos}s`;
    }

    if (minutos > 0) {
        return `${minutos}min ${segundos}s`;
    }

    return `${segundos}s`;
}



function verificarMultas() {
    let houveAlteracao = false;

    for (const codigo in veiculos) {
        const veiculo = veiculos[codigo];

        if (
            !veiculo.estacionado ||
            !veiculo.inicioEstacionamento
        ) {
            continue;
        }

        const minutosDecorridos = Math.floor(
            (Date.now() - veiculo.inicioEstacionamento) /
            DURACAO_MINUTO
        );

        const minutosPendentes =
            minutosDecorridos - veiculo.minutosMultados;

        if (minutosPendentes > 0) {
            const multa = minutosPendentes * CUSTO_MINUTO;

            veiculo.pontos -= multa;
            veiculo.minutosMultados += minutosPendentes;

            houveAlteracao = true;

            if (codigoAtual === codigo) {
                mostrarMensagem(
                    `Multa aplicada! ${multa} pontos descontados por ${minutosPendentes} minuto(s) de estacionamento. Saldo atual: ${veiculo.pontos} pontos.`,
                    "erro"
                );
            }
        }
    }

    if (houveAlteracao) {
        salvarDados();
    }
}

function atualizarCartao() {
    if (!codigoAtual || !buscarVeiculo(codigoAtual)) {
        return;
    }

    const veiculo = buscarVeiculo(codigoAtual);

    cartaoVeiculo.className = "cartao-veiculo";
    cartaoVeiculo.replaceChildren();

    
    const cabecalho = criarElemento("div", "cabecalho-cartao");
    const identificacao = criarElemento("div", "identificacao");

    identificacao.appendChild(
        criarElemento("span", "codigo-veiculo", `CÓDIGO ${veiculo.codigo}`)
    );

    identificacao.appendChild(
        criarElemento("h4", "", veiculo.modelo)
    );

    identificacao.appendChild(
        criarElemento(
            "p",
            "proprietario",
            `Proprietário: ${veiculo.proprietario}`
        )
    );

    cabecalho.appendChild(identificacao);
    cabecalho.appendChild(
        criarFoto(veiculo.fotoProprietario, "PROPRIETÁRIO")
    );

    cartaoVeiculo.appendChild(cabecalho);

    
    const conteudo = criarElemento("div", "conteudo-veiculo");
    const dados = criarElemento("div", "dados-veiculo");

    dados.appendChild(criarDado("MODELO", veiculo.modelo));
    dados.appendChild(criarDado("COR", veiculo.cor));
    dados.appendChild(criarDado("ANO", veiculo.ano));

    conteudo.appendChild(dados);
    conteudo.appendChild(criarFoto(veiculo.foto, "VEÍCULO"));

    cartaoVeiculo.appendChild(conteudo);


    const areaPontos = criarElemento("div", "area-pontos");

    const blocoPontos = criarElemento("div", "info-ponto");
    blocoPontos.appendChild(
        criarElemento("span", "", "SALDO DE PONTOS")
    );
    blocoPontos.appendChild(
        criarElemento("strong", "", veiculo.pontos)
    );

    const blocoEntrada = criarElemento("div", "info-ponto");
    blocoEntrada.appendChild(
        criarElemento("span", "", "CUSTO DA ENTRADA")
    );
    blocoEntrada.appendChild(
        criarElemento("strong", "", `${CUSTO_ENTRADA} pontos`)
    );

    const blocoMulta = criarElemento("div", "info-ponto");
    blocoMulta.appendChild(
        criarElemento("span", "", "MULTA POR MINUTO")
    );
    blocoMulta.appendChild(
        criarElemento("strong", "", `${CUSTO_MINUTO} pontos`)
    );

    areaPontos.append(blocoPontos, blocoEntrada, blocoMulta);
    cartaoVeiculo.appendChild(areaPontos);

   
    const status = criarElemento(
        "div",
        veiculo.estacionado ? "status ativo" : "status",
        veiculo.estacionado
            ? `VEÍCULO ESTACIONADO — Tempo: ${formatarTempo(veiculo.inicioEstacionamento)}`
            : "VEÍCULO FORA DO ESTACIONAMENTO"
    );

    cartaoVeiculo.appendChild(status);

   
    const acoes = criarElemento("div", "acoes");

    const botaoEntrada = criarElemento(
        "button",
        "botao-estacionar",
        "Registrar entrada"
    );

    botaoEntrada.type = "button";
    botaoEntrada.disabled = veiculo.estacionado;
    botaoEntrada.addEventListener("click", registrarEntrada);

    const botaoSaida = criarElemento(
        "button",
        "botao-sair",
        "Registrar saída"
    );

    botaoSaida.type = "button";
    botaoSaida.disabled = !veiculo.estacionado;
    botaoSaida.addEventListener("click", registrarSaida);

    acoes.append(botaoEntrada, botaoSaida);
    cartaoVeiculo.appendChild(acoes);
}

function consultarVeiculo(codigo) {
    const veiculo = buscarVeiculo(codigo);

    if (!veiculo) {
        codigoAtual = null;
        cartaoVeiculo.className = "cartao-vazio";

        cartaoVeiculo.replaceChildren(
            criarElemento(
                "p",
                "",
                "Código não encontrado. Verifique se digitou 002, 022 ou 027."
            )
        );

        mostrarMensagem(
            "Não foi possível encontrar esse veículo.",
            "erro"
        );

        return;
    }

    codigoAtual = codigo;

    verificarMultas();
    atualizarCartao();

    mostrarMensagem(
        "Veículo localizado com sucesso.",
        "sucesso"
    );
}

formPesquisa.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const codigo = codigoPesquisa.value.trim();
    consultarVeiculo(codigo);
});

function registrarEntrada() {
    const veiculo = buscarVeiculo(codigoAtual);

    if (!veiculo || veiculo.estacionado) {
        return;
    }

    if (veiculo.pontos < CUSTO_ENTRADA) {
        mostrarMensagem(
            `Saldo insuficiente! São necessários ${CUSTO_ENTRADA} pontos para registrar a entrada. Faça uma recarga para continuar.`,
            "erro"
        );

        return;
    }

    veiculo.pontos -= CUSTO_ENTRADA;
    veiculo.estacionado = true;
    veiculo.inicioEstacionamento = Date.now();
    veiculo.minutosMultados = 0;

    salvarDados();
    atualizarCartao();

    mostrarMensagem(
        `Entrada registrada. Foram descontados ${CUSTO_ENTRADA} pontos.`,
        "sucesso"
    );
}

function registrarSaida() {
    const veiculo = buscarVeiculo(codigoAtual);

    if (!veiculo || !veiculo.estacionado) {
        return;
    }

    
    verificarMultas();

    veiculo.estacionado = false;
    veiculo.inicioEstacionamento = null;
    veiculo.minutosMultados = 0;

    salvarDados();
    atualizarCartao();

    mostrarMensagem(
        "Saída registrada com sucesso.",
        "sucesso"
    );
}

formRecarga.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const codigo = codigoRecarga.value.trim();
    const quantidade = Number(quantidadeRecarga.value);
    const veiculo = buscarVeiculo(codigo);

    if (!veiculo) {
        mostrarMensagem(
            "Código não encontrado. Confira o código do veículo.",
            "erro"
        );

        return;
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        mostrarMensagem(
            "Digite uma quantidade de pontos inteira e maior que zero.",
            "erro"
        );

        return;
    }

    veiculo.pontos += quantidade;

    salvarDados();
    formRecarga.reset();

    if (codigoAtual === codigo) {
        atualizarCartao();
    }

    mostrarMensagem(
        `Recarga realizada: ${quantidade} pontos adicionados ao veículo ${codigo}.`,
        "sucesso"
    );
});


setInterval(function () {
    verificarMultas();

    if (codigoAtual && buscarVeiculo(codigoAtual)?.estacionado) {
        atualizarCartao();
    }
}, 1000);

verificarMultas();
salvarDados();
