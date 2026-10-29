
const CHAVE = "neris_ocorrencias";
const CHAVE_MULTAS = "neris_multas_radares";
const CHAVE_DEMO = "neris_multas_demo_criadas";
const CHAVE_ALERTAS = "neris_alertas_quebra_molas";

function lerChave(chave) {
    try {
        return JSON.parse(localStorage.getItem(chave) || "[]");
    } catch {
        return [];
    }
}

function salvarOcorrencias(ocorrencias) {
    localStorage.setItem(CHAVE, JSON.stringify(ocorrencias));
}

function criarExemplos() {
    if (localStorage.getItem(CHAVE_DEMO)) return;

    const agora = new Date().toLocaleString("pt-BR");

    const exemplos = [
        {
            id: "demo-radar-2",
            equipamento: "Radar 2",
            tipo: "multa",
            titulo: "Registro de velocidade",
            mensagem: "BMW M2, ano 2016, cor vermelha.",
            placa: "BOA-1009",
            data: agora,
            resolvida: false,
            demonstracao: true
        },
        {
            id: "demo-radar-1",
            equipamento: "Radar 1",
            tipo: "multa",
            titulo: "Registro de velocidade",
            mensagem: "Chevrolet Camaro ZL1, ano 2018, cor vermelha.",
            placa: "PLACA NÃO INFORMADA",
            data: agora,
            resolvida: false,
            demonstracao: true
        }
    ];

    const ocorrencias = lerChave(CHAVE);
    const ids = new Set(ocorrencias.map(item => String(item.id)));

    exemplos.forEach(item => {
        if (!ids.has(String(item.id))) {
            ocorrencias.push(item);
        }
    });

    salvarOcorrencias(ocorrencias);
    localStorage.setItem(CHAVE_DEMO, "true");
}

function importarMultasDaCentral() {
    const ocorrencias = lerChave(CHAVE);
    const multas = lerChave(CHAVE_MULTAS);
    const ids = new Set(ocorrencias.map(item => String(item.id)));
    let alterou = false;

    multas.forEach(multa => {
        const id = String(multa.id);

        if (ids.has(id)) return;

        ocorrencias.push({
            id: multa.id,
            equipamento: multa.radar || multa.equipamento || "Radar",
            tipo: "multa",
            titulo: "Infração registrada pela Central",
            mensagem: multa.veiculo || multa.mensagem ||
                "Veículo não informado.",
            placa: multa.placa || "PLACA NÃO INFORMADA",
            data: multa.data || new Date().toLocaleString("pt-BR"),
            resolvida: false,
            demonstracao: false
        });

        ids.add(id);
        alterou = true;
    });

    if (alterou) salvarOcorrencias(ocorrencias);
}

function verificarQuebraMolas() {
    const ocorrencias = lerChave(CHAVE);
    const alertas = JSON.parse(
        localStorage.getItem(CHAVE_ALERTAS) || "{}"
    );

    ["Radar 1", "Radar 2"].forEach(radar => {
        const quantidade = ocorrencias.filter(item =>
            item.tipo === "multa" &&
            item.equipamento === radar
        ).length;

        if (quantidade >= 4 && !alertas[radar]) {
            const alerta = {
                id: `quebra-molas-${radar.replace(" ", "-")}-${Date.now()}`,
                equipamento: radar,
                tipo: "critica",
                titulo: `Sugestão de quebra-molas — ${radar}`,
                mensagem: `${radar} registrou ${quantidade} multas. Recomenda-se avaliar a instalação de quebra-molas e outras medidas de segurança viária nesse trecho.`,
                data: new Date().toLocaleString("pt-BR"),
                resolvida: false,
                demonstracao: true
            };

            ocorrencias.unshift(alerta);
            alertas[radar] = true;
        }

       
        if (quantidade < 4) {
            alertas[radar] = false;
        }
    });

    localStorage.setItem(CHAVE_ALERTAS, JSON.stringify(alertas));
    salvarOcorrencias(ocorrencias);
}

function renderizarOcorrencias(ocorrencias) {
    const lista = document.getElementById("listaOcorrencias");
    if (!lista) return;

    lista.innerHTML = "";

    ocorrencias.forEach(item => {
        const tipo = item.tipo ||
            (String(item.equipamento || "").toLowerCase().includes("radar")
                ? "multa"
                : "alerta");

        const card = document.createElement("article");
        card.className = "notificacao " +
            (tipo === "multa" ? "multa" :
             tipo === "critica" ? "critica" : "");

        const icone = document.createElement("div");
        icone.className = "icone-notificacao";
        icone.textContent =
            tipo === "multa" ? "🚘" :
            tipo === "critica" ? "⚠️" : "🔔";

        const detalhes = document.createElement("div");
        detalhes.className = "detalhes";

        const etiqueta = document.createElement("span");
        etiqueta.className = "etiqueta";
        etiqueta.textContent =
            tipo === "multa"
                ? (item.demonstracao
                    ? "MULTA  REGISTRADA"
                    : "INFRAÇÃO REGISTRADA")
                : tipo === "critica"
                    ? "ALERTA CRÍTICO"
                    : "NOTIFICAÇÃO";

        const titulo = document.createElement("h3");
        titulo.textContent = item.titulo || "Ocorrência registrada";

        const descricao = document.createElement("p");
        descricao.textContent = item.mensagem || "";

        detalhes.append(etiqueta, titulo, descricao);

        if (item.equipamento) {
            const origem = document.createElement("p");
            origem.textContent = "Origem: " + item.equipamento;
            detalhes.appendChild(origem);
        }

        if (item.placa) {
            const placa = document.createElement("p");
            placa.textContent = "Placa: " + item.placa;
            detalhes.appendChild(placa);
        }

        const data = document.createElement("div");
        data.className = "data";
        data.textContent = "Registro: " +
            (item.data || "Data não informada");

        detalhes.appendChild(data);
        card.append(icone, detalhes);
        lista.appendChild(card);
    });

    if (ocorrencias.length === 0) {
        lista.innerHTML =
            '<div class="vazio">Nenhuma ocorrência registrada.</div>';
    }

    const total = document.getElementById("total");
    const multas = document.getElementById("multas");
    const criticos = document.getElementById("criticos");

    if (total) total.textContent = ocorrencias.length;

    if (multas) {
        multas.textContent = ocorrencias.filter(item =>
            item.tipo === "multa" ||
            (!item.tipo &&
             String(item.equipamento || "").toLowerCase().includes("radar"))
        ).length;
    }

    if (criticos) {
        criticos.textContent =
            ocorrencias.filter(item => item.tipo === "critica").length;
    }
}

function carregarOcorrencias() {
    criarExemplos();
    importarMultasDaCentral();
    verificarQuebraMolas();

    renderizarOcorrencias(lerChave(CHAVE));
}

const btnLimpar = document.getElementById("limpar");

if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
        if (!confirm("Deseja apagar todas as notificações salvas?")) return;

        localStorage.removeItem(CHAVE);
        localStorage.removeItem(CHAVE_MULTAS);
        localStorage.removeItem(CHAVE_DEMO);
        localStorage.removeItem(CHAVE_ALERTAS);

        carregarOcorrencias();
    });
}

window.addEventListener("storage", evento => {
    if (
        evento.key === CHAVE ||
        evento.key === CHAVE_MULTAS
    ) {
        carregarOcorrencias();
    }
});

carregarOcorrencias();
setInterval(carregarOcorrencias, 2000);
