
document.addEventListener("DOMContentLoaded", () => {
    const btnRadares = document.getElementById("btnConectarRadares");
    const btnSemaforos = document.getElementById("btnConectarSemaforos");
    const btnCamera = document.getElementById("btnConectarCamera");
    const urlCamera = document.getElementById("urlCamera");
    const imagemCamera = document.getElementById("imagemCamera");
    const statusCamera = document.getElementById("statusCamera");
    const nomeOperador = document.getElementById("nomeOperador");

    const CHAVE_ESTADO = "neris_central_estado";
    const CHAVE_MULTAS = "neris_multas_radares";
    const CHAVE_OCORRENCIAS = "neris_ocorrencias";

    const operador = localStorage.getItem("FOGO_OPERADOR_LOGADO");

    if (operador && nomeOperador) {
        nomeOperador.textContent = operador.toUpperCase();
    }

    // Recupera os dados salvos da Central.
    function carregarEstado() {
        try {
            return JSON.parse(localStorage.getItem(CHAVE_ESTADO)) || {};
        } catch (erro) {
            return {};
        }
    }

    let estadoSalvo = carregarEstado();

    let multasR1 = Number(estadoSalvo.multasR1) || 0;
    let multasR2 = Number(estadoSalvo.multasR2) || 0;

    let cronometroSemaforo;
    let cronometroCamera;

    let semaforoOnline = false;
    let cameraOnline = false;

    const conexoes = {
        radares: null,
        semaforos: null,
        camera: null
    };

    const radarEmMulta = {
        1: false,
        2: false
    };

    const responsaveis = {
        "Radar 1": "Sr. Oscar",
        "Radar 2": "Sydney",
        "Semáforos": "Sr. Oscar",
        "Câmera IP": "Técnico de monitoramento"
    };

    function salvarEstado() {
        const estado = {
            multasR1,
            multasR2,
            urlCamera: urlCamera ? urlCamera.value : ""
        };

        localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
    }

    function lerLista(chave) {
        try {
            const dados = JSON.parse(localStorage.getItem(chave));
            return Array.isArray(dados) ? dados : [];
        } catch (erro) {
            return [];
        }
    }

    function salvarLista(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    }

    function emitirAlerta(mensagem, critico = false) {
        const painel = document.getElementById("painelAlertas");

        if (!painel) return;

        const linha = document.createElement("div");
        linha.className = critico ? "log-line text-danger" : "log-line";
        linha.textContent = `> [${new Date().toLocaleTimeString()}] ${mensagem}`;

        painel.prepend(linha);

        while (painel.children.length > 50) {
            painel.lastElementChild.remove();
        }
    }

    function atualizarAtivos() {
        const ativos = Object.values(conexoes)
            .filter(conexao => conexao && conexao.online).length;

        const kpiAtivos = document.getElementById("kpiAtivos");

        if (kpiAtivos) {
            kpiAtivos.textContent = `${ativos} / 3`;
        }
    }

    function atualizarTotalMultas() {
        const kpiMultas = document.getElementById("kpiMultas");

        if (kpiMultas) {
            kpiMultas.textContent = multasR1 + multasR2;
        }
    }

    function atualizarGrafico(idGrafico, idTexto, multas) {
        const grafico = document.getElementById(idGrafico);
        const texto = document.getElementById(idTexto);

        if (!grafico || !texto) return;

        const percentual = Math.min(multas * 33.3, 100);
        const graus = percentual * 3.6;
        const cor = multas >= 3 ? "#ff3366" : "#00c3ff";

        texto.textContent = `${Math.floor(percentual)}%`;

        grafico.style.background =
            `conic-gradient(${cor} 0deg ${graus}deg, rgba(255,255,255,0.1) ${graus}deg 360deg)`;
    }

    function restaurarPainel() {
        atualizarGrafico("chartR1", "txtChartR1", multasR1);
        atualizarGrafico("chartR2", "txtChartR2", multasR2);
        atualizarTotalMultas();

        if (urlCamera && estadoSalvo.urlCamera) {
            urlCamera.value = estadoSalvo.urlCamera;
        }

        // As conexões físicas precisam ser verificadas novamente
        // quando a página é aberta. Os dados e os gráficos permanecem salvos.
        atualizarAtivos();

        const statusSemaforo = document.getElementById("statusSemaforo");

        if (statusSemaforo) {
            statusSemaforo.textContent = "SEM RESPOSTA";
            statusSemaforo.className = "txt-neon-vermelho";
        }

        if (statusCamera) {
            statusCamera.textContent = "SEM RESPOSTA";
            statusCamera.className = "txt-neon-vermelho";
        }

        localStorage.setItem("FOGO_STATUS_SEMAFORO", "PANE");
    }

    function registrarMulta(radarGrafico) {
        if (radarGrafico === 1) {
            multasR1++;
            atualizarGrafico("chartR1", "txtChartR1", multasR1);
        } else {
            multasR2++;
            atualizarGrafico("chartR2", "txtChartR2", multasR2);
        }

        atualizarTotalMultas();
        salvarEstado();

        const via = radarGrafico === 1
            ? "Via Expressa Norte"
            : "Avenida Central Sul";

        const responsavel = responsaveis[`Radar ${radarGrafico}`];

        emitirAlerta(
            `Infração recebida para ${via}. Radar ${radarGrafico}; responsável: ${responsavel}.`,
            true
        );

        const quantidade = radarGrafico === 1 ? multasR1 : multasR2;

        if (quantidade === 3) {
            emitirAlerta(
                `${via} acumulou 3 infrações. Avaliar medidas preventivas.`,
                true
            );
        }

        const multa = {
            id: `${Date.now()}-${radarGrafico}-${Math.random().toString(16).slice(2)}`,
            tipo: "multa",
            equipamento: `Radar ${radarGrafico}`,
            via,
            responsavel,
            veiculo: radarGrafico === 1 ? "Camaro ZL1 2018" : "BMW M2 2016",
            placa: radarGrafico === 1 ? "Não identificada" : "BOA-1009",
            data: new Date().toLocaleString("pt-BR"),
            descricao: `Infração registrada pelo Radar ${radarGrafico}.`
        };

        const multas = lerLista(CHAVE_MULTAS);
        multas.push(multa);
        salvarLista(CHAVE_MULTAS, multas);

        const ocorrencias = lerLista(CHAVE_OCORRENCIAS);

        if (!ocorrencias.some(item => item && item.id === multa.id)) {
            ocorrencias.push(multa);
            salvarLista(CHAVE_OCORRENCIAS, ocorrencias);
        }

        // Avisa outras páginas abertas que os dados foram atualizados.
        window.dispatchEvent(new StorageEvent("storage", {
            key: CHAVE_MULTAS,
            newValue: localStorage.getItem(CHAVE_MULTAS)
        }));
    }

    function atualizarSemaforo(online) {
        const mudou = semaforoOnline !== online;
        semaforoOnline = online;

        const status = document.getElementById("statusSemaforo");

        if (status) {
            status.textContent = online ? "FUNCIONANDO" : "SEM RESPOSTA";
            status.className = online
                ? "txt-neon-verde"
                : "txt-neon-vermelho";
        }

        localStorage.setItem(
            "FOGO_STATUS_SEMAFORO",
            online ? "OK" : "PANE"
        );

        if (mudou && !online) {
            emitirAlerta(
                `TÉCNICO: RECONECTAR SEMÁFOROS. Responsável: ${responsaveis["Semáforos"]}.`,
                true
            );
        } else if (mudou && online) {
            emitirAlerta("Comunicação dos semáforos restabelecida.");
        }

        atualizarAtivos();
    }

    function receberDadosSemaforo() {
        atualizarSemaforo(true);

        clearTimeout(cronometroSemaforo);

        cronometroSemaforo = setTimeout(() => {
            atualizarSemaforo(false);
        }, 6000);
    }

    function atualizarCamera(online, mensagem = true) {
        const mudou = cameraOnline !== online;
        cameraOnline = online;

        if (statusCamera) {
            statusCamera.textContent = online
                ? "FUNCIONANDO"
                : "SEM RESPOSTA";

            statusCamera.className = online
                ? "txt-neon-verde"
                : "txt-neon-vermelho";
        }

        if (conexoes.camera) {
            conexoes.camera.online = online;
        }

        atualizarAtivos();

        if (mudou && !online && mensagem) {
            emitirAlerta(
                `TÉCNICO: VERIFICAR/RECONECTAR CÂMERA IP. Responsável: ${responsaveis["Câmera IP"]}.`,
                true
            );
        } else if (mudou && online && mensagem) {
            emitirAlerta("Transmissão da câmera IP iniciada.");
        }
    }

    function processarDados(linha, tipoArduino) {
        const comando = linha.trim();

        if (!comando) return;

        if (tipoArduino === "semaforos") {
            receberDadosSemaforo();
            return;
        }

        if (comando === "RADAR1_MULTA" && !radarEmMulta[1]) {
            radarEmMulta[1] = true;
            registrarMulta(1);
        } else if (comando === "RADAR2_MULTA" && !radarEmMulta[2]) {
            radarEmMulta[2] = true;
            registrarMulta(2);
        } else if (comando === "RADAR1_NORMAL") {
            radarEmMulta[1] = false;
        } else if (comando === "RADAR2_NORMAL") {
            radarEmMulta[2] = false;
        }
    }

    async function ouvirPorta(porta, tipoArduino, conexao) {
        let reader;

        try {
            const decoder = new TextDecoderStream();
            const pipePromise = porta.readable.pipeTo(decoder.writable);

            reader = decoder.readable.getReader();
            let buffer = "";

            try {
                while (true) {
                    const { value, done } = await reader.read();

                    if (done) break;
                    if (!value) continue;

                    buffer += value;

                    const linhas = buffer.split(/\r?\n/);
                    buffer = linhas.pop();

                    for (const linha of linhas) {
                        processarDados(linha, tipoArduino);
                    }
                }
            } finally {
                reader.releaseLock();
                await pipePromise.catch(() => {});
            }
        } catch (erro) {
            emitirAlerta(
                `Falha na comunicação com ${tipoArduino}: ${erro.message}.`,
                true
            );
        } finally {
            conexao.online = false;
            atualizarAtivos();

            if (tipoArduino === "semaforos") {
                clearTimeout(cronometroSemaforo);
                atualizarSemaforo(false);
            }

            const botao = tipoArduino === "radares"
                ? btnRadares
                : btnSemaforos;

            if (botao) {
                botao.disabled = false;
                botao.textContent = tipoArduino === "radares"
                    ? "CONECTAR RADARES"
                    : "CONECTAR SEMÁFOROS";
            }

            if (conexoes[tipoArduino] === conexao) {
                conexoes[tipoArduino] = null;
            }

            const nome = tipoArduino === "radares"
                ? "RADARES"
                : "SEMÁFOROS";

            emitirAlerta(
                `TÉCNICO: RECONECTAR ${nome}. Verifique o cabo USB e a porta do Arduino.`,
                true
            );
        }
    }

    async function conectarArduino(tipoArduino) {
        const botao = tipoArduino === "radares"
            ? btnRadares
            : btnSemaforos;

        const nome = tipoArduino === "radares"
            ? "radares"
            : "semáforos";

        if (!botao) return;

        if (!("serial" in navigator)) {
            emitirAlerta(
                "Web Serial indisponível. Use Chrome ou Edge em localhost ou HTTPS.",
                true
            );
            return;
        }

        if (conexoes[tipoArduino]) {
            emitirAlerta(`O Arduino dos ${nome} já está conectado.`);
            return;
        }

        botao.disabled = true;

        try {
            emitirAlerta(`Selecione a porta do Arduino dos ${nome}.`);

            const porta = await navigator.serial.requestPort();
            await porta.open({ baudRate: 9600 });

            const conexao = { porta, online: true };
            conexoes[tipoArduino] = conexao;

            atualizarAtivos();

            botao.textContent = tipoArduino === "radares"
                ? "RADARES CONECTADOS"
                : "SEMÁFOROS CONECTADOS";

            emitirAlerta(`Arduino dos ${nome} conectado com sucesso.`);

            if (tipoArduino === "semaforos") {
                atualizarSemaforo(false);
            }

            ouvirPorta(porta, tipoArduino, conexao);
        } catch (erro) {
            botao.disabled = false;

            if (erro.name === "NotFoundError") {
                emitirAlerta(
                    `Seleção da porta dos ${nome} cancelada. Nenhuma conexão foi feita.`
                );
            } else {
                emitirAlerta(
                    `Falha ao conectar os ${nome}: ${erro.message}.`,
                    true
                );
            }
        }
    }

    function conectarCamera() {
      
       
        clearTimeout(cronometroCamera);

        conexoes.camera = { online: true };

        if (btnCamera) {
            btnCamera.disabled = false;
            btnCamera.textContent = "CÂMERA ATIVA";
        }

        atualizarCamera(true, false);
        salvarEstado();

        emitirAlerta("Câmera ativada no sistema.");
    }

    if (btnRadares) {
        btnRadares.addEventListener("click", () => {
            conectarArduino("radares");
        });
    }

    if (btnSemaforos) {
        btnSemaforos.addEventListener("click", () => {
            conectarArduino("semaforos");
        });
    }

    if (btnCamera) {
        btnCamera.addEventListener("click", conectarCamera);
    }

    if (urlCamera) {
        urlCamera.addEventListener("input", salvarEstado);
    }

   
    restaurarPainel();

    emitirAlerta(
        "Central iniciada. Dados e gráficos anteriores foram restaurados. Reconecte os Arduinos se necessário."
    );
});
