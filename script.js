
// ==============================================
// LENDAS DO BRASIL - JOGO DA MEMORIA
// Desenvolvido por: Estefanny - 2º ano EMTI
// ==============================================

// Personagens do folclore brasileiro
const personagensBrasil = [
    { nome: 'Saci', arquivo: 'saci.png' },
    { nome: 'Cuca', arquivo: 'cuca.png' },
    { nome: 'Curupira', arquivo: 'curupira.png' },
    { nome: 'Iara', arquivo: 'iara.png' },
    { nome: 'Boitatá', arquivo: 'boitata.png' },
    { nome: 'Boto-cor-de-rosa', arquivo: 'boto-cor-de-rosa.png' },
    { nome: 'Caipora', arquivo: 'caipora.png' },
    { nome: 'Mula sem cabeça', arquivo: 'mula-sem-cabeca.png' },
    { nome: 'Lobisomem', arquivo: 'lobisomem.png' },
    { nome: 'Negrinho do Pastoreio', arquivo: 'negrinho-do-pastoreio.png' },
    { nome: 'Corpo-seco', arquivo: 'corpo-seco.png' },
    { nome: 'Mapinguari', arquivo: 'mapinguari.png' }
];

// Personagens das lendas americanas
const personagensEUA = [
    { nome: 'Pé Grande', arquivo: 'pe-grande.png' },
    { nome: 'Mothman', arquivo: 'mothman.png' },
    { nome: 'Chupa-cabra', arquivo: 'chupa-cabra.png' },
    { nome: 'Cavaleiro sem Cabeça', arquivo: 'cavaleiro-sem-cabeca.png' },
    { nome: 'Bloody Mary', arquivo: 'bloody-mary.png' },
    { nome: 'Wendigo', arquivo: 'wendigo.png' },
    { nome: 'Kraken', arquivo: 'kraken.png' },
    { nome: 'Jersey Devil', arquivo: 'jersey-devil.png' },
    { nome: 'Jackalope', arquivo: 'jackalope.png' },
    { nome: 'Banshee', arquivo: 'banshee.png' },
    { nome: 'Fantasma de Amityville', arquivo: 'fantasma-amityville.png' },
    { nome: 'Paul Bunyan', arquivo: 'paul-bunyan.png' }
];

let faseAtual = 'brasil';
const listasFases = {
    brasil: personagensBrasil,
    eua: personagensEUA
};

// Configurações dos níveis
const niveis = {
    facil: {
        nome: 'Fácil',
        pares: 6,
        tempo: 120,
        bombas: 2
    },
    medio: {
        nome: 'Médio',
        pares: 10,
        tempo: 90,
        bombas: 3
    },
    dificil: {
        nome: 'Difícil',
        pares: 11,
        tempo: 60,
        bombas: 4
    }
};

const $ = id => document.getElementById(id);

let boasVindas;
let jogo;
let tabuleiro;
let resultado;

let cartasViradas = [];
let pares = 0;
let pontos = 0;
let tempo = 0;
let vidas = 2;
let timer = null;
let bloqueado = false;
let ativo = false;
let partida = 0;
let nivelAtual = 'medio';

// Inicializa os eventos depois que o HTML foi carregado
document.addEventListener('DOMContentLoaded', configurarJogo);

function configurarJogo() {
    boasVindas = $('boas-vindas');
    jogo = $('jogo');
    tabuleiro = $('tabuleiro');
    resultado = $('resultado');

    const elementosObrigatorios = [
        ['boas-vindas', boasVindas],
        ['jogo', jogo],
        ['tabuleiro', tabuleiro],
        ['resultado', resultado],
        ['trocar-nivel', $('trocar-nivel')]
    ];

    const ausentes = elementosObrigatorios
        .filter(([id, elemento]) => !elemento)
        .map(([id]) => id);

    if (ausentes.length) {
        console.error('Faltam elementos no HTML:', ausentes.join(', '));
        return;
    }

    // Seleção de fase
    document.querySelectorAll('.fase').forEach(btn => {
        btn.addEventListener('click', () => {
            const fase = btn.dataset.fase;

            if (!listasFases[fase]) return;

            faseAtual = fase;

            document.querySelectorAll('.fase').forEach(faseBtn => {
                faseBtn.classList.toggle(
                    'selecionada',
                    faseBtn === btn
                );
            });

            const titulo = document.querySelector('.logo');
            const intro = document.querySelector('.intro');

            if (titulo) {
                titulo.innerHTML = faseAtual === 'brasil'
                    ? '🌿 FOLCLORE<br>BRASILEIRO 🔥'
                    : '🇺🇸 LENDAS<br>AMERICANAS 🌙';
            }

            if (intro) {
                intro.textContent = faseAtual === 'brasil'
                    ? 'Encontre os pares e descubra as lendas do folclore brasileiro!'
                    : 'Descubra criaturas misteriosas e lendas dos Estados Unidos!';
            }
        });
    });

    // Seleção de dificuldade
    document.querySelectorAll('.nivel').forEach(btn => {
        btn.addEventListener('click', () => {
            iniciar(btn.dataset.nivel);
        });
    });

    // Voltar ao menu
    $('trocar-nivel').addEventListener('click', () => {
        parar();
        partida++;
        jogo.hidden = true;
        boasVindas.hidden = false;
    });
}

// Embaralhar cartas
function embaralhar(lista) {
    for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
    }

    return lista;
}

// Iniciar jogo
function iniciar(nivel) {
    const cfg = niveis[nivel];

    if (!cfg) {
        console.error('Nível inválido:', nivel);
        return;
    }

    if (!tabuleiro || !boasVindas || !jogo || !resultado) {
        console.error('O HTML ainda não foi inicializado corretamente.');
        return;
    }

    parar();
    partida++;

    nivelAtual = nivel;
    pares = 0;
    pontos = 0;
    tempo = cfg.tempo;
    vidas = 2;

    cartasViradas = [];
    bloqueado = false;
    ativo = true;

    boasVindas.hidden = true;
    jogo.hidden = false;
    resultado.hidden = true;
    resultado.innerHTML = '';

    atualizarTexto('nivel-atual', cfg.nome);
    atualizarTexto('pontos', pontos);
    atualizarTexto('pares', `0 / ${cfg.pares}`);
    atualizarTexto('vidas', '❤️❤️');
    atualizarTempo();

    tabuleiro.innerHTML = '';
    tabuleiro.dataset.nivel = nivel;

    const personagens = listasFases[faseAtual];

    const escolhidos = embaralhar([...personagens])
        .slice(0, cfg.pares);

    // Cada personagem aparece duas vezes
    const baralho = escolhidos.flatMap((personagem, indice) => [
        { ...personagem, id: indice },
        { ...personagem, id: indice }
    ]);

    // Quantidade de bombas de acordo com o nível
    const quantidadeBombas = cfg.bombas;

    for (let i = 0; i < quantidadeBombas; i++) {
        baralho.push({
            bomba: true,
            id: `bomba-${i}`
        });
    }

    embaralhar(baralho);

    baralho.forEach((personagem, indice) => {
        tabuleiro.appendChild(
            criarCarta(personagem, indice)
        );
    });

    const idPartida = partida;

    timer = setInterval(() => {
        if (!ativo || idPartida !== partida) return;

        tempo--;
        atualizarTempo();

        if (tempo <= 0) {
            finalizar(false, 'O tempo acabou!');
        }
    }, 1000);
}

// Atualizar textos da tela
function atualizarTexto(id, valor) {
    const elemento = $(id);

    if (elemento) {
        elemento.textContent = valor;
    }
}

// Criar cartas
function criarCarta(personagem, indice) {
    const carta = document.createElement('button');

    carta.type = 'button';
    carta.className = 'carta';
    carta.setAttribute('aria-label', 'Carta fechada');

    // Carta de bomba
    if (personagem.bomba) {
        carta.classList.add('bomba');
        carta.dataset.bomba = 'true';

        carta.innerHTML = `
            <span class="lado-frente">
                <span>✦</span>
                <small>FOLCLORE</small>
            </span>

            <span class="lado-verso">
                <span class="icone-bomba">💣</span>
            </span>
        `;
    } else {
        // Carta de personagem
        carta.dataset.par = personagem.id;

        carta.innerHTML = `
            <span class="lado-frente">
                <span>✦</span>
                <small>FOLCLORE</small>
            </span>

            <span class="lado-verso">
                <img
                    src="img/${personagem.arquivo}"
                    alt="Ilustração de ${personagem.nome}"
                >

                <span class="nome-personagem">
                    ${personagem.nome}
                </span>
            </span>
        `;

        const imagem = carta.querySelector('img');

        imagem.addEventListener('error', () => {
            imagem.alt = `Imagem não encontrada: ${personagem.arquivo}`;
            imagem.classList.add('imagem-erro');

            console.error(
                `Não foi possível carregar img/${personagem.arquivo}`
            );
        });
    }

    carta.addEventListener('click', () => virar(carta));

    return carta;
}

// Virar carta
function virar(carta) {
    if (
        !ativo ||
        bloqueado ||
        carta.classList.contains('virada') ||
        carta.classList.contains('encontrada')
    ) {
        return;
    }

    carta.classList.add('virada');

    // Se for bomba
    if (carta.dataset.bomba === 'true') {
        carta.classList.add('encontrada');
        carta.disabled = true;

        mostrarExplosao();

        vidas = Math.max(0, vidas - 1);

        atualizarTexto(
            'vidas',
            '❤️'.repeat(vidas) + '🖤'.repeat(2 - vidas)
        );

        if (vidas <= 0) {
            bloqueado = true;

            const idPartida = partida;

            setTimeout(() => {
                if (idPartida === partida) {
                    finalizar(
                        false,
                        'Você encontrou bombas demais!'
                    );
                }
            }, 850);
        }

        return;
    }

    cartasViradas.push(carta);

    if (cartasViradas.length === 2) {
        verificar();
    }
}

// Verificar se as cartas formam um par
function verificar() {
    const [a, b] = cartasViradas;

    if (!a || !b) return;

    if (a.dataset.par === b.dataset.par) {
        a.classList.add('encontrada');
        b.classList.add('encontrada');

        a.disabled = true;
        b.disabled = true;

        pares++;
        pontos += 100;

        // Cada par encontrado adiciona 30 segundos
        tempo += 30;

        atualizarTexto('pontos', pontos);
        atualizarTexto(
            'pares',
            `${pares} / ${niveis[nivelAtual].pares}`
        );

        atualizarTempo();

        cartasViradas = [];

        if (pares === niveis[nivelAtual].pares) {
            finalizar(true);
        }
    } else {
        bloqueado = true;

        pontos = Math.max(0, pontos - 20);
        atualizarTexto('pontos', pontos);

        const idPartida = partida;

        setTimeout(() => {
            if (idPartida !== partida) return;

            a.classList.remove('virada');
            b.classList.remove('virada');

            cartasViradas = [];
            bloqueado = false;
        }, 850);
    }
}

// Atualizar cronômetro
function atualizarTempo() {
    const elemento = $('tempo');

    if (!elemento) return;

    const minutos = Math.floor(tempo / 60);
    const segundos = tempo % 60;

    elemento.textContent =
        `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    elemento.classList.toggle(
        'tempo-baixo',
        tempo <= 15
    );
}

// Parar cronômetro
function parar() {
    ativo = false;

    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }
}

// Finalizar partida
function finalizar(venceu, mensagem = '') {
    if (!ativo) return;

    parar();
    bloqueado = true;

    resultado.hidden = false;

    const titulo = document.createElement('h2');

    titulo.textContent = venceu
        ? '🏆 Você venceu!'
        : '💥 Fim de jogo!';

    const texto = document.createElement('p');

    texto.textContent = venceu
        ? `Parabéns! Você encontrou todas as lendas ${
            faseAtual === 'brasil'
                ? 'brasileiras!'
                : 'americanas!'
        }`
        : (mensagem || 'Tente novamente!');

    const pontuacao = document.createElement('p');

    pontuacao.textContent =
        `Pontuação final: ${pontos}`;

    const vidasRestantes = document.createElement('p');

    vidasRestantes.textContent =
        `Vidas restantes: ${vidas}`;

    const botao = document.createElement('button');

    botao.type = 'button';
    botao.className = 'trocar';
    botao.textContent = 'Jogar novamente';

    botao.addEventListener('click', () => {
        iniciar(nivelAtual);
    });

    resultado.replaceChildren(
        titulo,
        texto,
        pontuacao,
        vidasRestantes,
        botao
    );
}

// Efeito visual da bomba
function mostrarExplosao() {
    const explosao = $('explosao');

    if (!explosao) return;

    explosao.hidden = false;

    explosao.classList.remove('animar');

    void explosao.offsetWidth;

    explosao.classList.add('animar');

    setTimeout(() => {
        explosao.hidden = true;
    }, 850);
}
