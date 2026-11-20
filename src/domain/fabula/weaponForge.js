/**
 * Fabula Ultima - Regras de Criação de Armas Personalizadas (Atlas de Alta Fantasia)
 * Funções puras sem dependências de UI (React) ou Banco (Supabase).
 */

export const CUSTO_BASE_ARMA_PERSONALIZADA = 300;
export const MAX_VAGAS_PERSONALIZACOES = 3;
export const DANO_BASE_ARMA_PERSONALIZADA = 5;

export const CATEGORIAS_ARMA = [
    'adaga', 'arcana', 'arco', 'arremessável', 'arma de fogo',
    'espada', 'lança', 'luta', 'malho', 'pesada'
];

export const ALCANCES_ARMA = ['Corpo a corpo', 'À distância'];
export const ATRIBUTOS_PRECISAO = ['(DES + AST)', '(DES + VIG)'];
export const ATRIBUTOS_UNICOS = ['Destreza', 'Astúcia', 'Vigor', 'Vontade'];
export const TIPOS_DANO_ELEMENTAL = ['Físico', 'Fogo', 'Gelo', 'Raio', 'Ar', 'Luz', 'Trevas', 'Terra', 'Veneno'];

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

export function calcularVagasOcupadas(personalizacoes = []) {
    return personalizacoes.reduce((acc, p) => acc + (p.vagas || 1), 0);
}

export function podeAdicionarPersonalizacao(personalizacoesAtuais = [], itemAdicionar) {
    const vagasOcupadas = calcularVagasOcupadas(personalizacoesAtuais);
    const vagasNecessarias = itemAdicionar.vagas || 1;
    return vagasOcupadas + vagasNecessarias <= MAX_VAGAS_PERSONALIZACOES;
}

export function calcularCustoTotal(personalizacoes = [], opcoesRaras = {}) {
    const custoExtra = personalizacoes.reduce((acc, p) => acc + (p.custoExtra || 0), 0);
    let custo = CUSTO_BASE_ARMA_PERSONALIZADA + custoExtra;
    const ehRara = Boolean(opcoesRaras.ehRara || opcoesRaras.raridade === 'personalizada_rara' || opcoesRaras.raridade === 'rara');
    if (ehRara) {
        custo += 200;
        if (opcoesRaras.bonusPrecisaoArma) custo += 100;
        if (opcoesRaras.bonusDanoExtraArma) custo += 200;
        if (opcoesRaras.atributoUnico) custo += 50;
        if (opcoesRaras.tipoDano && opcoesRaras.tipoDano.toLowerCase() !== 'físico' && !personalizacoes.some(p => p.id === 'elemental')) {
            custo += 100;
        }
        const custoCarac = Number(
            opcoesRaras.caracteristicaCusto ||
            opcoesRaras.caracResolvida?.custo ||
            opcoesRaras.caracResolvida?.caracteristicaMeta?.custo ||
            opcoesRaras.caracteristicaSelecionada?.custo || 0
        );
        custo += custoCarac;
    }
    return custo;
}

export function calcularBonusDano(categoria, personalizacoes = []) {
    let bonus = 0;
    if (personalizacoes.some(p => p.id === 'elemental')) bonus += 2;
    if (personalizacoes.some(p => p.id === 'poderosa')) bonus += (categoria === 'pesada' ? 7 : 5);
    return bonus;
}

export function calcularDanoFinal(categoria, personalizacoes = [], bonusDanoExtraArma = false) {
    return DANO_BASE_ARMA_PERSONALIZADA + calcularBonusDano(categoria, personalizacoes) + (bonusDanoExtraArma ? 4 : 0);
}

export function verificarEhMarcial(personalizacoes = [], danoFinalNumerico) {
    return personalizacoes.some(p => p.marcial) || danoFinalNumerico >= 10;
}

export function construirStatsArmaPersonalizada({
    categoria,
    alcance,
    precisaoTipo,
    personalizacoes = [],
    temMutavel = false,
    segundaForma = null,
    raridade = 'personalizada',
    ehRara = false,
    bonusPrecisaoArma = false,
    bonusDanoExtraArma = false,
    atributoUnico = false,
    atributoEscolhido = 'Destreza',
    tipoDano = 'Físico',
    caracteristicaSelecionada = null,
    caracResolvida = null
}) {
    const ehArmaRara = raridade === 'personalizada_rara' || raridade === 'rara' || ehRara;
    const raridadeFinal = ehArmaRara ? 'personalizada_rara' : 'personalizada';

    const danoFinalNumerico = calcularDanoFinal(categoria, personalizacoes, ehArmaRara && bonusDanoExtraArma);
    let temTagMarcial = verificarEhMarcial(personalizacoes, danoFinalNumerico);
    const custoCarac = caracteristicaSelecionada?.custo || caracResolvida?.custo || caracResolvida?.caracteristicaMeta?.custo || 0;
    const custoTotal = calcularCustoTotal(personalizacoes, {
        ehRara: ehArmaRara,
        bonusPrecisaoArma,
        bonusDanoExtraArma,
        atributoUnico,
        tipoDano,
        caracteristicaCusto: custoCarac
    });

    const efeitosList = personalizacoes.map(p => p.nome);
    if (ehArmaRara && caracResolvida?.efeitoFormatado) {
        efeitosList.push(caracResolvida.efeitoFormatado);
    }

    const temCerteira = personalizacoes.some(p => p.id === 'certeira');
    const bonusPrecisaoNumerico = (temCerteira ? 2 : 0) + ((ehArmaRara && bonusPrecisaoArma) ? 1 : 0);

    let precAtributos1 = precisaoTipo || '(DES + AST)';
    if (ehArmaRara && atributoUnico && atributoEscolhido) {
        const sigla = atributoEscolhido.substring(0, 3).toUpperCase();
        precAtributos1 = `(${sigla} + ${sigla})`;
    }
    const precisaoFinal = bonusPrecisaoNumerico > 0 ? `${precAtributos1} + ${bonusPrecisaoNumerico}` : precAtributos1;

    const temAtingirVoador = personalizacoes.some(p => p.id === 'atingir_voador' || p.atinge_voadores) ||
        Boolean(caracteristicaSelecionada?.atinge_voadores || caracteristicaSelecionada?.id === 'atingir_voador' || caracResolvida?.atingeVoadores);

    const temDefesa = personalizacoes.some(p => p.id === 'defesa');
    const temDefesaMagica = personalizacoes.some(p => p.id === 'defesa_magica');
    const bonusDefCarac = (ehArmaRara && caracResolvida?.bonusDefesa) ? caracResolvida.bonusDefesa : 0;
    const bonusDefMagCarac = (ehArmaRara && caracResolvida?.bonusDefMagica) ? caracResolvida.bonusDefMagica : 0;
    const bonusIniCarac = (ehArmaRara && caracResolvida?.bonusIniciativa) ? caracResolvida.bonusIniciativa : 0;

    const temPersonalizacaoElemental = personalizacoes.some(p => p.id === 'elemental');
    let tipoDanoFinal = 'físico';
    if (temPersonalizacaoElemental) {
        tipoDanoFinal = (tipoDano && tipoDano.toLowerCase() !== 'físico') ? tipoDano.toLowerCase() : 'elemental';
    } else if (ehArmaRara && tipoDano && tipoDano.toLowerCase() !== 'físico') {
        tipoDanoFinal = tipoDano.toLowerCase();
    }

    const especiesCacadora = (ehArmaRara && Array.isArray(caracResolvida?.especiesAlvo)) ? caracResolvida.especiesAlvo : [];
    const resistencias = (ehArmaRara && Array.isArray(caracResolvida?.resistencias)) ? caracResolvida.resistencias.map(r => r.toLowerCase()) : [];
    const caracteristicaMeta = (ehArmaRara && caracResolvida?.caracteristicaMeta) ? caracResolvida.caracteristicaMeta : null;

    const stats = {
        dano: `RA + ${danoFinalNumerico}`,
        maos: 'Duas mãos',
        duas_maos: true,
        alcance: alcance,
        marcial: temTagMarcial,
        precisao: precisaoFinal,
        raridade: raridadeFinal,
        categoria: categoria,
        tipo_dano: tipoDanoFinal,
        slot: 'duas_maos',
        custo: custoTotal,
        efeitos: efeitosList,
        atinge_voadores: Boolean(temAtingirVoador),
        ...((temDefesa || bonusDefCarac !== 0) ? { defesa: (temDefesa ? 2 : 0) + bonusDefCarac, ...(temDefesa ? { escudo: true } : {}) } : {}),
        ...((temDefesaMagica || bonusDefMagCarac !== 0) ? { defesa_magica: (temDefesaMagica ? 2 : 0) + bonusDefMagCarac } : {}),
        ...(bonusIniCarac !== 0 ? { iniciativa: bonusIniCarac } : {}),
        ...(especiesCacadora.length > 0 ? { especies_cacadora: especiesCacadora } : {}),
        ...(resistencias.length > 0 ? { resistencias } : {}),
        ...(caracteristicaMeta ? { caracteristica_especial: caracteristicaMeta } : {})
    };

    if (temMutavel && segundaForma) {
        const cat2 = segundaForma.categoria || categoria;
        const alc2 = segundaForma.alcance || alcance;
        const dano2Numerico = calcularDanoFinal(cat2, personalizacoes, ehArmaRara && bonusDanoExtraArma);
        const marcial2 = verificarEhMarcial(personalizacoes, dano2Numerico);

        let precAtributos2 = segundaForma.precisaoTipo || segundaForma.precisao_tipo || precisaoTipo;
        if (ehArmaRara && atributoUnico && atributoEscolhido) {
            const sigla = atributoEscolhido.substring(0, 3).toUpperCase();
            precAtributos2 = `(${sigla} + ${sigla})`;
        }
        const precisao2Final = bonusPrecisaoNumerico > 0 ? `${precAtributos2} + ${bonusPrecisaoNumerico}` : precAtributos2;
        const nome2 = (segundaForma.nome || '').trim() || '2ª Forma';

        if (marcial2) {
            stats.marcial = true;
        }

        stats.mutavel = true;
        stats.segunda_forma = {
            nome: nome2,
            categoria: cat2,
            alcance: alc2,
            precisao_tipo: precAtributos2,
            precisao: precisao2Final,
            dano: `RA + ${dano2Numerico}`,
            tipo_dano: tipoDanoFinal,
            marcial: marcial2,
            atinge_voadores: Boolean(temAtingirVoador),
            maos: 'Duas mãos',
            duas_maos: true,
            ...(especiesCacadora.length > 0 ? { especies_cacadora: especiesCacadora } : {}),
            ...(resistencias.length > 0 ? { resistencias } : {}),
            ...(caracteristicaMeta ? { caracteristica_especial: caracteristicaMeta } : {})
        };
    }

    return stats;
}

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
        atinge_voadores: seg.atinge_voadores !== undefined ? seg.atinge_voadores : stats.atinge_voadores,
        ...(seg.especies_cacadora || stats.especies_cacadora ? { especies_cacadora: seg.especies_cacadora || stats.especies_cacadora } : {}),
        ...(seg.resistencias || stats.resistencias ? { resistencias: seg.resistencias || stats.resistencias } : {}),
        ...(seg.caracteristica_especial || stats.caracteristica_especial ? { caracteristica_especial: seg.caracteristica_especial || stats.caracteristica_especial } : {})
    };

    return {
        ...itemArma,
        nome: nomeForma2,
        stats_personalizados: novosStats,
        stats: novosStats
    };
}
