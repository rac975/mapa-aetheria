/**
 * Fabula Ultima - Regras de Criação de Armas Personalizadas (Atlas de Alta Fantasia)
 * 
 * Funções puras sem dependências de UI (React) ou Banco (Supabase).
 */

export const CUSTO_BASE_ARMA_PERSONALIZADA = 300;
export const MAX_VAGAS_PERSONALIZACOES = 3;
export const DANO_BASE_ARMA_PERSONALIZADA = 5;

export const CATEGORIAS_ARMA = [
    'adaga',
    'arcana',
    'arco',
    'arremessável',
    'arma de fogo',
    'espada',
    'lança',
    'luta',
    'malho',
    'pesada'
];

export const ALCANCES_ARMA = [
    'Corpo a corpo',
    'À distância'
];

export const ATRIBUTOS_PRECISAO = [
    '(DES + AST)',
    '(DES + VIG)'
];

export const PERSONALIZACOES_DISPONIVEIS = [
    { id: 'defesa', nome: 'Aumento na Defesa (+2 Defesa, conta como escudo)', custoExtra: 0, marcial: false },
    { id: 'defesa_magica', nome: 'Aumento na Defesa Mágica (+2 Def. Mágica)', custoExtra: 0, marcial: true },
    { id: 'certeira', nome: 'Certeira (+2 Precisão)', custoExtra: 0, marcial: false },
    { id: 'elemental', nome: 'Elemental (Dano Elemental + 2 dano extra)', custoExtra: 0, marcial: false },
    { id: 'mutavel', nome: 'Mutável (Adiciona uma 2ª forma alternativa)', custoExtra: 100, marcial: false, especial: 'mutavel' },
    { id: 'poderosa', nome: 'Poderosa (+5 ou +7 dano se Pesada)', custoExtra: 0, marcial: true },
    { id: 'rapida', nome: 'Rápida (Permite dois ataques - Conta por 2 vagas)', custoExtra: 0, marcial: true, vagas: 2 },
    { id: 'atingir_voador', nome: 'Atingir alvo voador (Atinge alvos no ar)', custoExtra: 100, marcial: false, atinge_voadores: true }
];

/**
 * Calcula total de vagas consumidas pelas personalizações selecionadas
 * @param {Array} personalizacoes 
 * @returns {number}
 */
export function calcularVagasOcupadas(personalizacoes = []) {
    return personalizacoes.reduce((acc, p) => acc + (p.vagas || 1), 0);
}

/**
 * Verifica se uma personalização pode ser adicionada respeitando o teto de vagas
 * @param {Array} personalizacoesAtuais 
 * @param {Object} itemAdicionar 
 * @returns {boolean}
 */
export function podeAdicionarPersonalizacao(personalizacoesAtuais = [], itemAdicionar) {
    const vagasOcupadas = calcularVagasOcupadas(personalizacoesAtuais);
    const vagasNecessarias = itemAdicionar.vagas || 1;
    return vagasOcupadas + vagasNecessarias <= MAX_VAGAS_PERSONALIZACOES;
}

/**
 * Calcula o custo total da arma personalizada
 * @param {Array} personalizacoes 
 * @returns {number}
 */
export function calcularCustoTotal(personalizacoes = []) {
    const custoExtra = personalizacoes.reduce((acc, p) => acc + (p.custoExtra || 0), 0);
    return CUSTO_BASE_ARMA_PERSONALIZADA + custoExtra;
}

/**
 * Calcula o dano bônus adicional fornecido pelas personalizações
 * @param {string} categoria 
 * @param {Array} personalizacoes 
 * @returns {number}
 */
export function calcularBonusDano(categoria, personalizacoes = []) {
    let bonus = 0;
    if (personalizacoes.some(p => p.id === 'elemental')) {
        bonus += 2;
    }
    if (personalizacoes.some(p => p.id === 'poderosa')) {
        bonus += (categoria === 'pesada' ? 7 : 5);
    }
    return bonus;
}

/**
 * Calcula o dano numérico final
 * @param {string} categoria 
 * @param {Array} personalizacoes 
 * @returns {number}
 */
export function calcularDanoFinal(categoria, personalizacoes = []) {
    return DANO_BASE_ARMA_PERSONALIZADA + calcularBonusDano(categoria, personalizacoes);
}

/**
 * Determina se a arma possui a propriedade Marcial
 * @param {Array} personalizacoes 
 * @param {number} danoFinalNumerico 
 * @returns {boolean}
 */
export function verificarEhMarcial(personalizacoes = [], danoFinalNumerico) {
    return personalizacoes.some(p => p.marcial) || danoFinalNumerico >= 10;
}

/**
 * Monta o objeto completo de stats da arma personalizada
 * @param {Object} config
 * @returns {Object}
 */
export function construirStatsArmaPersonalizada({
    categoria,
    alcance,
    precisaoTipo,
    personalizacoes = [],
    temMutavel = false,
    segundaForma = null,
    raridade = 'personalizada'
}) {
    const danoFinalNumerico = calcularDanoFinal(categoria, personalizacoes);
    const temTagMarcial = verificarEhMarcial(personalizacoes, danoFinalNumerico);
    const custoTotal = calcularCustoTotal(personalizacoes);
    const efeitosList = personalizacoes.map(p => p.nome);

    const temCerteira = personalizacoes.some(p => p.id === 'certeira');
    const temAtingirVoador = personalizacoes.some(p => p.id === 'atingir_voador' || p.atinge_voadores);
    const temDefesa = personalizacoes.some(p => p.id === 'defesa');
    const temDefesaMagica = personalizacoes.some(p => p.id === 'defesa_magica');
    const precisaoFinal = `${precisaoTipo} ${temCerteira ? '+ 2' : ''}`.trim();
    const tipoDanoFinal = personalizacoes.some(p => p.id === 'elemental') ? 'elemental' : 'físico';

    const stats = {
        dano: `RA + ${danoFinalNumerico}`,
        maos: 'Duas mãos',
        duas_maos: true,
        alcance: alcance,
        marcial: temTagMarcial,
        precisao: precisaoFinal,
        raridade: raridade,
        categoria: categoria,
        tipo_dano: tipoDanoFinal,
        slot: 'duas_maos',
        custo: custoTotal,
        efeitos: efeitosList,
        atinge_voadores: Boolean(temAtingirVoador),
        ...(temDefesa ? { defesa: 2, escudo: true } : {}),
        ...(temDefesaMagica ? { defesa_magica: 2 } : {})
    };

    if (temMutavel && segundaForma) {
        const cat2 = segundaForma.categoria || categoria;
        const alc2 = segundaForma.alcance || alcance;
        const precTipo2 = segundaForma.precisaoTipo || segundaForma.precisao_tipo || precisaoTipo;
        const dano2Numerico = calcularDanoFinal(cat2, personalizacoes);
        const marcial2 = verificarEhMarcial(personalizacoes, dano2Numerico);
        const precisao2Final = `${precTipo2} ${temCerteira ? '+ 2' : ''}`.trim();
        const nome2 = (segundaForma.nome || '').trim() || '2ª Forma';

        if (marcial2) {
            stats.marcial = true;
        }

        stats.mutavel = true;
        stats.segunda_forma = {
            nome: nome2,
            categoria: cat2,
            alcance: alc2,
            precisao_tipo: precTipo2,
            precisao: precisao2Final,
            dano: `RA + ${dano2Numerico}`,
            tipo_dano: tipoDanoFinal,
            marcial: marcial2,
            atinge_voadores: Boolean(temAtingirVoador),
            maos: 'Duas mãos',
            duas_maos: true
        };
    }

    return stats;
}

/**
 * Retorna uma representação virtual da arma mutável na forma solicitada (1ª ou 2ª forma),
 * preservando todas as personalizações aplicadas à arma.
 * @param {Object} itemArma
 * @param {boolean} [usarSegundaForma=false]
 * @returns {Object}
 */
export function obterItemFormaAtivaArmaMutavel(itemArma, usarSegundaForma = false) {
    if (!itemArma || !usarSegundaForma) return itemArma;
    const stats = itemArma.stats_personalizados || itemArma.stats || {};
    const seg = stats.segunda_forma;
    if (!seg || typeof seg !== 'object') return itemArma;

    const nomeForma2 = seg.nome ? `${itemArma.nome} (${seg.nome})` : `${itemArma.nome} (2ª Forma)`;
    const novosStats = {
        ...stats,
        categoria: seg.categoria || stats.categoria,
        alcance: seg.alcance || stats.alcance,
        precisao: seg.precisao || seg.precisao_tipo || stats.precisao,
        dano: seg.dano || stats.dano,
        tipo_dano: seg.tipo_dano || stats.tipo_dano,
        marcial: seg.marcial !== undefined ? seg.marcial : stats.marcial,
        atinge_voadores: seg.atinge_voadores !== undefined ? seg.atinge_voadores : stats.atinge_voadores
    };

    return {
        ...itemArma,
        nome: nomeForma2,
        stats_personalizados: novosStats,
        stats: novosStats
    };
}
