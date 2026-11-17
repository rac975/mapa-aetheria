import {
  ehClasseFloralista,
  ehClasseGourmet,
  ehClasseInvocador,
  ehClasseMercador,
  extrairBeneficioInicialFloralista,
  extrairBeneficioInicialInvocador,
  calcularLimiteMagiseedsAprendidas,
  calcularCuraArvoreDaVida,
  calcularLimitePmJardinagemMarcial,
  resolverEfeitoMagiseedNaSecao,
  processarPlantioMagiseed,
  processarAvancoRelogioGerminacao,
  calcularCapacidadeIngredientes,
  calcularGanhosIngredientes,
  extrairParesDeSabores,
  processarPreparoIguaria,
  verificarArmaExpandirManancial,
  filtrarInvocacoesDisponiveis,
  processarInvocacaoElemental,
  calcularLimitePontosComercio,
  calcularParametrosMercador,
  extrairEfeitosAtivosNaturalFantasy
} from '../naturalFantasyRules.js';
import { calcularCuraEfetivaEmConflito } from '../combatRules.js';
import { detectarDisciplinasPersonagem } from '../ritualRules.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`PASSED: ${message}`);
}

console.log('--- Executando Testes de Regras: Atlas Fantasia Natural ---');

// 1. Identificação das 4 Classes Oficiais
assert(ehClasseFloralista('Floralista') === true, 'Identifica classe Floralista');
assert(ehClasseGourmet('Gourmet') === true, 'Identifica classe Gourmet');
assert(ehClasseInvocador('Invocador') === true, 'Identifica classe Invocador');
assert(ehClasseMercador('Mercador') === true, 'Identifica classe Mercador');

// 2. Floralista — Cloromancia, Jardim e Relógio de Germinação
assert(calcularLimiteMagiseedsAprendidas(4) === 4, 'Cloromancia NP 4 permite 4 magissementes');
assert(calcularCuraArvoreDaVida(3) === 20, 'Árvore da Vida NP 3 cura 20 PV em Crise');
assert(calcularLimitePmJardinagemMarcial(2) === 15, 'Jardinagem Marcial NP 2 permite feitiço de até 15 PM');

const lotusMock = {
  key: 'lotus_oceanica',
  nome: 'Lótus-Oceânica',
  descricao: 'Um símbolo gracioso de serenidade e sabedoria.',
  efeito_secao_0: 'Você é imune às condições atordoado e lento.',
  efeito_secao_1: 'Você é imune às condições atordoado e lento.',
  efeito_secao_2: 'Você considera seus dados de Destreza e Astúcia como um passo maior (máximo de d12).',
  efeito_secao_3: 'Você e todos os aliados que você possa ver consideram seus dados de Destreza e Astúcia como um passo maior (máximo de d12).',
  efeitos_por_secao: {
    '0': { imunidadesCondicao: ['atordoado', 'lento'] },
    '1': { imunidadesCondicao: ['atordoado', 'lento'] },
    '2': { aumentosAtributo: { destreza: 1, astucia: 1 }, escopo: 'proprio' },
    '3': { aumentosAtributo: { destreza: 1, astucia: 1 }, escopo: 'aliados' }
  }
};

const plantio = processarPlantioMagiseed({
  magiseed: lotusMock,
  mpAtual: 30,
  magiseedAtualNoJardim: null,
  secaoRelogioAtual: 0,
  nvCloromancia: 2,
  nvJardinagemMarcial: 1
});
assert(plantio.sucesso === true && plantio.custoPm === 20, 'Plantar magissemente custa 20 PM');
assert(plantio.efeitoAtual.imunidadesCondicao.includes('atordoado'), 'Lótus-Oceânica seção 0 concede imunidade a atordoado');

const avanco2 = resolverEfeitoMagiseedNaSecao({
  magiseed: lotusMock,
  secaoAtual: 2,
  nvCloromancia: 2,
  nivelPersonagem: 10
});
assert(avanco2.aumentosAtributo.destreza === 1 && avanco2.aumentosAtributo.astucia === 1, 'Lótus-Oceânica seção 2 aumenta DES e AST em +1 passo');

const fimCiclo = processarAvancoRelogioGerminacao({
  magiseedAtiva: lotusMock,
  secaoAtual: 3,
  deltaSecoes: 1,
  nvCloromancia: 2,
  nvArvoreDaVida: 2
});
assert(fimCiclo.cicloConcluido === true && fimCiclo.novaMagiseed === null && fimCiclo.curaArvoreDaVidaDisponivel === 15, 'Relógio em 4/4 remove magissemente, zera relógio e engatilha Árvore da Vida (15 PV)');

// 3. Gourmet — Culinária, Sabores, Receitas e Iguarias
assert(calcularCapacidadeIngredientes(3) === 25, 'Culinária NP 3 permite carregar 25 ingredientes (10 + 3×5)');
const ganhos = calcularGanhosIngredientes(3, 2);
assert(ganhos.ganhoDescanso === 3 && ganhos.ganhoViagem === 4, 'Ganhos de ingredientes de Culinária (3) e Cozinheiro Viajante (4)');

const pares = extrairParesDeSabores(['salgado', 'amargo', 'amargo']);
assert(pares.includes('amargo+amargo') && pares.includes('amargo+salgado') && pares.length === 2, '1 salgado + 2 amargos gera 2 combinações únicas');

const preparo = processarPreparoIguaria({
  saboresEscolhidos: ['amargo', 'amargo', 'salgado'],
  estoqueSabores: { amargo: 2, salgado: 1, azedo: 0, doce: 0, umami: 0 },
  livroReceitas: {
    'amargo+amargo': {
      parKey: 'amargo+amargo',
      numero_dado: 4,
      nome: 'Recuperar 40 PM',
      escolha: null,
      descricao: 'Recupera 40 PM.'
    }
  },
  nvCulinaria: 2,
  nvFeitoComAmor: 1,
  alvosExtrasFeitoComAmor: 1,
  mpAtual: 30,
  piAtual: 6,
  nivelPersonagem: 10
});
assert(preparo.sucesso === true && preparo.custoPm === 10 && preparo.curaPmProprio === 40, 'Culinária consome ingredientes, cobra 10 PM de Feito com Amor e aplica 40 PM de cura');
assert(Object.keys(preparo.novoLivroReceitas).length === 2, 'Nova combinação amargo+salgado foi descoberta e registrada no livro');

// 4. Invocador — Mananciais, Invocações, Pragas e Cascata
const catalogoInvMock = [
  {
    key: 'aero_explosao',
    manancial_key: 'ar',
    manancial_nome: 'Manancial de Ar',
    tipo_dano_associado: 'ar',
    nome: 'Aero Explosão',
    categoria_invocacao: 'explosao',
    np_minimo: 1,
    atributo_cinco_mananciais: 'astucia',
    efeito_mecanico: { danoBase: 20, tipoDano: 'ar', escalonaDano: true },
    descricao: 'Você causa 20 pontos de dano de ar ao alvo.'
  },
  {
    key: 'aero_praga',
    manancial_key: 'ar',
    manancial_nome: 'Manancial de Ar',
    tipo_dano_associado: 'ar',
    nome: 'Aero Praga',
    categoria_invocacao: 'praga',
    np_minimo: 2,
    atributo_cinco_mananciais: 'astucia',
    efeito_mecanico: { pragaBonusDano: 5, elementosVulneraveis: ['raio', 'fogo'] },
    descricao: 'Até o início do seu próximo turno, o alvo sofre 5 pontos de dano adicional de raio e fogo.'
  }
];

assert(filtrarInvocacoesDisponiveis(catalogoInvMock, ['ar'], 1).length === 1, 'Invocação NP 1 libera apenas explosão');
assert(filtrarInvocacoesDisponiveis(catalogoInvMock, ['ar'], 2).length === 2, 'Invocação NP 2 libera explosão e praga');
assert(verificarArmaExpandirManancial([{ nome: 'Arco Curto', tipo: 'Arma (Arco)' }]) === true, 'Arco ativa Expandir Manancial');

const resPraga = processarInvocacaoElemental({
  invocacao: catalogoInvMock[1],
  mpAtual: 25,
  alvosExtras: 1,
  nvInvocacao: 2,
  nvInvocacoesConectadas: 2,
  nvExpandirManancial: 3,
  temArmaExpandir: true,
  nvCascata: 4,
  temPoderCincoMananciais: true,
  nivelPersonagem: 20
});
assert(resPraga.sucesso === true && resPraga.custoPm === 15, 'Invocação com 1 alvo extra custa 15 PM (5 + 10)');
assert(resPraga.pragaAtiva.bonusDano === 8 && resPraga.pragaAtiva.bonusPrecisaoCascata === 4, 'Aero Praga soma Expandir Manancial (+8 dano) e prepara Cascata (+4 Precisão)');
assert(resPraga.atributoCincoMananciais === 'astucia', 'Poder dos Cinco Mananciais (Ar) eleva Astúcia em +1 passo');

// 5. Mercador — Pontos de Comércio, Data de Validade e Prosperidade
const limitesComercio = calcularLimitePontosComercio(3);
assert(limitesComercio.maxPontos === 6 && limitesComercio.ganhoDescanso === 4, 'Ventos do Comércio NP 3 tem limite 6 PC e ganha 4 PC por descanso');

const paramsMercador = calcularParametrosMercador({
  nivelPersonagem: 10,
  nvDataDeValidade: 2,
  nvEstoquePessoal: 3,
  nvJaOuviFalar: 2,
  nvVentosDoComercio: 2,
  nvVerdadeiroTesouro: 1,
  prosperidadeAssentamento: 15
});
assert(paramsMercador.limitePiEstoquePessoal === 5, 'Estoque Pessoal NP 3 isenta até 5 PI');
assert(paramsMercador.bonusExaminarJaOuviFalar === 4, 'Já Ouvi Falar NP 2 concede +4 em testes de examinar');
assert(paramsMercador.orcamentoMaxItemRaroZenit === 300, 'Ventos do Comércio Nv. 10 cria item raro de até 300z');
assert(paramsMercador.danoDataValidadeUnico === 25 && paramsMercador.danoDataValidadeMulti === 12, 'Data de Validade NP 2 Nv. 10 causa 25 de dano (12 em múltiplos alvos)');
assert(paramsMercador.prosperidade.descontoZenit50 === true && paramsMercador.prosperidade.descansoGratuito === true, 'Prosperidade 15 desbloqueia desconto de 50% e descanso gratuito');

// 6. Sinergias Transversais
const curaHarmonia = calcularCuraEfetivaEmConflito({
  curaBase: 30,
  tipoRecurso: 'pv',
  bonusHarmoniaElementalPv: 10,
  temDosagemPrecisa: true
});
assert(curaHarmonia.valorFinal === 40 && curaHarmonia.limitePercentualMax === 150, 'Harmonia Elemental (+10 PV) e Dosagem Precisa (150% máx.) funcionam em conjunto');

const disciplinas = detectarDisciplinasPersonagem([
  { nome_classe: 'Floralista', habilidades: [{ nome: 'Influência Verdejante', nivel: 1 }] },
  { nome_classe: 'Invocador', dados_invocador: { manancialInteriorKey: 'fogo' }, habilidades: [] }
]);
const idsDisc = disciplinas.map((d) => d.id);
assert(idsDisc.includes('cloromancia') && idsDisc.includes('ritualismo') && idsDisc.includes('elementalismo'), 'Detecta Cloromancia, Ritualismo (Floralista) e Elementalismo (Manancial Interior)');

console.log('--- Todos os testes do Atlas Fantasia Natural passaram com 100% de sucesso! ---');
