
const WebSocket = require("ws");

const server = new WebSocket.Server({
    port: 8080
});

let proximoID = 1;
const jogadores = new Map();

console.log("Servidor iniciado na porta 8080");

function enviar(socket, mensagem) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(mensagem);
    }
}

function enviarOutros(remetente, mensagem) {
    server.clients.forEach((client) => {
        if (client !== remetente) {
            enviar(client, mensagem);
        }
    });
}

server.on("connection", (socket) => {
    const id = proximoID++;

    console.log("Jogador conectado:", id);

    // ID do próprio jogador
    enviar(socket, "id," + id);

    // Apresenta os jogadores antigos ao novo
    for (const [outroID, jogador] of jogadores) {
        enviar(socket,
            "novo," + outroID + "," +
            jogador.x + "," + jogador.y
        );

        enviar(socket,
            "pos," + outroID + "," +
            jogador.x + "," + jogador.y + "," +
            jogador.animacao + "," +
            jogador.frame + "," +
            jogador.direcao
        );
    }

    // Registra o jogador novo
    jogadores.set(id, {
        socket: socket,
        x: 193,
        y: 412.875,
        animacao: "Default",
        frame: 0,
        direcao: "normal"
    });

    // Avisa os jogadores antigos
    enviarOutros(socket,
        "novo," + id + ",193,412.875"
    );

    socket.on("message", (message) => {
        const texto = message.toString();
        const partes = texto.split(",");

        if (partes[0] === "pos") {
            const jogador = jogadores.get(id);

            if (!jogador || partes.length < 6) return;

            const x = Number(partes[1]);
            const y = Number(partes[2]);

            if (!Number.isFinite(x) ||
                !Number.isFinite(y)) return;

            jogador.x = x;
            jogador.y = y;
            jogador.animacao = partes[3];
            jogador.frame = Number(partes[4]) || 0;
            jogador.direcao = partes[5];

            enviarOutros(socket,
                "pos," + id + "," +
                jogador.x + "," + jogador.y + "," +
                jogador.animacao + "," +
                jogador.frame + "," +
                jogador.direcao
            );
        }

        if (partes[0] === "ki") {
            enviarOutros(socket, "ki," + id);
        }
    });

    socket.on("close", () => {
        jogadores.delete(id);
        enviarOutros(socket, "saiu," + id);
        console.log("Jogador saiu:", id);
    });
});
