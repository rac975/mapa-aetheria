import {
  VOLUMES_VERSO,
  ehClasseVirtuoso,
  ehClasseComandante,
  ehClasseDancarino,
  calcularLimiteMagicanto,
  validarSelecaoMagicanto,
  calcularCustoVerso,
  calcularValoresVerso,
  processarCantoVerso,
  calcularCustoOrdemComandante,
  processarOrdemComandante,
  extrairBeneficioInicialDancarino,
  gerarTextoBeneficioDancarino,
  calcularLimiteDancasAprendidas,
  calcularCustoDanca,
  resolverValoresDanca,
  processarApresentacaoDanca,
  ehClasseSimbolista,
  calcularLimiteSimbolosAprendidos,
  calcularLimiteSimbolosAtivos,
  calcularLimitePmSimbolosMagicos,
  calcularValorSimboloProibicao,
  calcularCustoCriacaoSimbolo,
  processarCriacaoSimbolo,
  extrairEfeitosSimbolosAtivos,
  calcularSinergiasCombateEMagia
} from '../highFantasyRules.js';
import { validarSlotEquipamento, SLOTS_EQUIPAMENTO } from '../equipmentRules.js';
import { validarElegibilidadePoderHeroico } from '../heroicAndQuirksRules.js';
import { detectarDisciplinasPersonagem, calcularCustoRitual } from '../ritualRules.js';
import { calcularCuraEfetivaEmConflito, calcularIniciativaEOpostosCombate } from '../combatRules.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`PASSED: ${message}`);
}

console.log('--- Testando Identificadores e Benefícios Iniciais ---');
assert(ehClasseVirtuoso('Virtuoso') && ehClasseVirtuoso('Cantor'), 'Identifica Virtuoso e alias Cantor');
assert(ehClasseComandante('Comandante'), 'Identifica Comandante');
assert(ehClasseDancarino('Dançarino'), 'Identifica Dançarino com acento');

const benPadrao = extrairBeneficioInicialDancarino({
  nome_classe: 'Dançarino',
  beneficios: 'Aumente permanentemente seus PV ou PM máximos em 5 (à sua escolha).'
});
assert(benPadrao.bonusPv === 5 && benPadrao.bonusPm === 0 && !benPadrao.confirmado, 'Dançarino padrão inicia com +5 PV pendente de confirmação');

const benPm = extrairBeneficioInicialDancarino({
  nome_classe: 'Dançarino',
  beneficios: gerarTextoBeneficioDancarino('pm'),
  dados_dancarino: { beneficioInicial: 'pm' }
});
assert(benPm.escolha === 'pm' && benPm.bonusPm === 5 && benPm.bonusPv === 0 && benPm.confirmado, 'Dançarino com escolha PM concede +5 PM');

console.log('--- Testando Proficiências Marciais do Comandante ---');
const classesComandante = [
  {
    nome_classe: 'Comandante',
    nivel: 1,
    beneficios: 'Aumente permanentemente seus PV máximos em 5. Você pode equipar armas corpo a corpo e armas à distância marciais.'
  }
];

assert(
  validarSlotEquipamento({
    item: { nome: 'Montante', tipo: 'Arma Marcial Corpo a Corpo' },
    slotAlvo: SLOTS_EQUIPAMENTO.MAO_DOMINANTE,
    classes: classesComandante
  }).permitido === true,
  'Comandante pode equipar arma corpo a corpo marcial'
);

assert(
  validarSlotEquipamento({
    item: { nome: 'Mosquete', tipo: 'Arma de Fogo Marcial', stats_personalizados: { alcance: 'distancia' } },
    slotAlvo: SLOTS_EQUIPAMENTO.MAO_DOMINANTE,
    classes: classesComandante
  }).permitido === true,
  'Comandante pode equipar arma à distância marcial'
);

assert(
  validarSlotEquipamento({
    item: { nome: 'Armadura de Placas', tipo: 'Armadura Marcial' },
    slotAlvo: SLOTS_EQUIPAMENTO.ARMADURA,
    classes: classesComandante
  }).permitido === false,
  'Comandante NÃO pode equipar armadura marcial sem outra classe'
);

assert(
  validarSlotEquipamento({
    item: { nome: 'Escudo Rúnico', tipo: 'Escudo' },
    slotAlvo: SLOTS_EQUIPAMENTO.MAO_SECUNDARIA,
    classes: classesComandante
  }).permitido === false,
  'Comandante NÃO pode equipar escudo sem outra classe'
);

console.log('--- Testando Virtuoso (Cantor) / Magicanto / Versos ---');
const lim1 = calcularLimiteMagicanto(1);
const lim3 = calcularLimiteMagicanto(3);
assert(lim1.totalItens === 2 && lim3.totalItens === 4, 'Magicanto NP 1 = 2 itens, NP 3 = 4 itens');
assert(validarSelecaoMagicanto(1, ['chama', 'geada'], []).valido === false, 'Magicanto Nv. 1 exige mínimo 1 Escala e 1 Tom');
assert(validarSelecaoMagicanto(2, ['chama'], ['calmo', 'solene']).valido === true, 'Magicanto Nv. 2 aceita 1 Escala + 2 Tons');

const escalaChama = { key: 'chama', nome: 'Chama', tipo_dano: 'fogo', condicao: 'abalado', atributo: 'Vigor', recuperacao: 'PV' };
const tomAgitado = { key: 'agitado', nome: 'Agitado', descricao: 'Cada alvo sofre dano de (tipo da escala) equivalente ao dobro de seu dado atual de Vontade.' };
const tomCalmo = { key: 'calmo', nome: 'Calmo', descricao: 'Cada alvo recupera (recuperação da escala) igual a (10 + o dobro de seu dado de Vontade).' };

const custoMT = calcularCustoVerso({
  volumeKey: VOLUMES_VERSO.medio.key,
  escalaKey: 'chama',
  musicaTemaAtiva: true,
  escalaMusicaTema: 'chama',
  temFocoCognitivoAlvo: true,
  nvHipercognicao: 2,
  unicoAlvoFoco: false
});
assert(custoMT.custoPm === 8, 'Volume Médio (20) ÷ 2 Música Tema (10) - 2 Hipercognição = 8 PM');

const valAgitadoNv20 = calcularValoresVerso({
  nivelPersonagem: 20,
  dadoVontade: 10,
  escala: escalaChama,
  tom: tomAgitado,
  musicaTemaAtivaMesmaEscala: true
});
assert(valAgitadoNv20.danoCalculado === 35, 'Agitado Nv. 20 (d10×2 + 10 + 5 Música Tema) = 35 dano fogo');

const valCalmoNv40 = calcularValoresVerso({
  nivelPersonagem: 40,
  dadoVontade: 12,
  escala: escalaChama,
  tom: tomCalmo
});
assert(valCalmoNv40.curaCalculada === 54, 'Calmo Nv. 40 (10 + d12×2 + 20) = 54 PV');

const resVerso = processarCantoVerso({
  volumeKey: 'medio',
  escala: escalaChama,
  tom: tomCalmo,
  mpAtual: 25,
  nvBarreiraSonora: 3,
  nvVibrato: 1
});
assert(resVerso.sucesso && resVerso.custoPm === 20 && resVerso.efeitosExtras.length === 2, 'Cantar Verso Médio dispara Barreira Sonora e Vibrato');

console.log('--- Testando Comandante ---');
assert(calcularCustoOrdemComandante({ poderKey: 'decreto_bispo', temBatalhaIncessante: true }) === 5, 'Batalha Incessante reduz custo para 5 PM');
const resDecreto = processarOrdemComandante({
  poderKey: 'decreto_bispo',
  nivelHabilidade: 4,
  opcaoEscolhida: 1,
  mpAtual: 20,
  temCarruagemDevastadora: true,
  temTabulaRasa: true,
  emCrise: true,
  nivelPersonagem: 25
});
assert(resDecreto.sucesso && resDecreto.bonusDano === 12 && resDecreto.danoTabulaRasa === 20, 'Decreto do Bispo NP 4 (+12 dano) + Tabula Rasa Nv. 25 (20 PV)');

console.log('--- Testando Dançarino ---');
assert(calcularLimiteDancasAprendidas(7) === 7, 'Limite de danças = NP em Dança');
const dancaAnjo = { key: 'danca_anjo', nome: 'Dança do Anjo', duracao: 'Até o início do seu próximo turno', tipo_duracao: 'turno', descricao: 'Escolha um: você se torna Resistente a dano de luz; ou todos os danos causados por seus ataques e magias se tornam dano de luz.' };
const dancaUnicornio = { key: 'danca_unicornio', nome: 'Dança do Unicórnio', duracao: 'Instantânea', tipo_duracao: 'instantanea', descricao: '...' };

const custoDesc = calcularCustoDanca({
  danca: dancaAnjo,
  ultimaDancaKey: 'danca_fenix',
  usarMeAcompanhe: true,
  temPasoDoble: true,
  emCrise: true,
  temArmaduraMarcial: false
});
assert(custoDesc.custoTotal === 5 && custoDesc.descontoConsecutivoAplicado && custoDesc.pasoDobleAplicado, 'Dança consecutiva diferente (-5 PM) + Paso Doble em Crise (0 PM Me Acompanhe) = 5 PM');

const bloqArmadura = processarApresentacaoDanca({ danca: dancaAnjo, mpAtual: 20, temArmaduraMarcial: true });
assert(bloqArmadura.sucesso === false, 'Armadura marcial bloqueia Dança');

const valUni = resolverValoresDanca({ danca: dancaUnicornio, dadoDestreza: 10, nivelPersonagem: 40 });
assert(valUni.curaUnicornio === 20, 'Dança do Unicórnio Nv. 40 com d10 DES = 20 PV');

console.log('--- Testando Sinergia Heroicos e Rituais ---');
const elegHeroico = validarElegibilidadePoderHeroico(
  { key: 'musica_tema', nome: 'Música Tema', classes_requeridas: ['Virtuoso'], habilidades_requeridas: [] },
  [{ nome_classe: 'Cantor', nivel: 10, habilidades: [] }],
  []
);
assert(elegHeroico.elegivel === true, 'Alias Cantor Nv. 10 habilita Poder Heróico de Virtuoso');

const discsVirtuoso = detectarDisciplinasPersonagem([
  { nome_classe: 'Virtuoso', nivel: 1, habilidades: [{ nome: 'Canto da Sereia', nivel: 1 }] }
]);
assert(discsVirtuoso.some((d) => d.id === 'ritualismo'), 'Canto da Sereia libera disciplina Ritualismo');

const discsNvZero = detectarDisciplinasPersonagem([
  {
    nome_classe: 'Simbolista',
    nivel: 1,
    habilidades: [{ nome: 'Miragem', nivel: 0 }, { nome: 'Simbolismo', nivel: 1 }]
  },
  {
    nome_classe: 'Virtuoso',
    nivel: 1,
    habilidades: [{ nome: 'Canto da Sereia', nivel: 0 }]
  }
]);
assert(!discsNvZero.some((d) => d.id === 'ritualismo'), 'Miragem e Canto da Sereia com nivel 0 NÃO liberam Ritualismo');

const ritualAgil = calcularCustoRitual('menor', 'pequena', {
  temRituaisAgeis: true,
  dobrarPmDecreto: true,
  reducaoPmExtra: 10
});
assert(ritualAgil.relogioSecoes === 4 && ritualAgil.custoTotal === 70, 'Rituais Ágeis (mín 4 seções) + Decreto x2 (80) - 10 = 70 PM');

console.log('--- Testando Simbolista (Sigilos, Limites e Efeitos) ---');
assert(ehClasseSimbolista('Simbolista'), 'Identifica classe Simbolista');
assert(calcularLimiteSimbolosAprendidos(3) === 6, 'Simbolismo NP 3 = 6 símbolos aprendidos');
assert(calcularLimiteSimbolosAtivos(3) === 4, 'Simbolismo NP 3 = 4 símbolos ativos');
assert(calcularLimitePmSimbolosMagicos(2) === 20, 'Símbolos Mágicos NP 2 = feitiços até 20 PM');
assert(
  calcularValorSimboloProibicao(5) === 5 &&
  calcularValorSimboloProibicao(20) === 15 &&
  calcularValorSimboloProibicao(40) === 25,
  'Símbolo da Proibição escala 5 / 15 / 25 por tier'
);
assert(calcularCustoCriacaoSimbolo({ reducaoCustoPi: 1 }) === 1, 'Bolsos Fundos reduz criação de símbolo de 2 PI para 1 PI');
assert(calcularCustoCriacaoSimbolo({ destruirSimboloCriacao: true }) === 0, 'Destruir Símbolo da Criação reduz criação para 0 PI');

const simMetamorfose = { key: 'simbolo_metamorfose', nome: 'Símbolo da Metamorfose', requer_escolha: false, descricao: '...' };
const simProtecao = { key: 'simbolo_protecao', nome: 'Símbolo da Proteção', requer_escolha: true, tipo_escolha: 'elemento', descricao: '...' };
const simAmarras = { key: 'simbolo_amarras', nome: 'Símbolo das Amarras', requer_escolha: false, descricao: '...' };

const resMetaPj = processarCriacaoSimbolo({
  simbolo: simMetamorfose,
  modoAplicacao: 'proprio',
  nvSimbolismo: 1,
  piAtual: 5
});
assert(resMetaPj.sucesso === false, 'Símbolo da Metamorfose bloqueado ao tentar aplicar em si mesmo');

const resProtSemEscolha = processarCriacaoSimbolo({
  simbolo: simProtecao,
  modoAplicacao: 'proprio',
  nvSimbolismo: 1,
  piAtual: 5
});
assert(resProtSemEscolha.sucesso === false, 'Símbolo com escolha obrigatória falha sem opção');

const resProtOk = processarCriacaoSimbolo({
  simbolo: simProtecao,
  escolhaOpcao: 'Fogo',
  modoAplicacao: 'proprio',
  nvSimbolismo: 1,
  piAtual: 4,
  reducaoCustoPi: 1
});
assert(resProtOk.sucesso === true && resProtOk.custoPi === 1 && resProtOk.simbolosAtivos.length === 1, 'Símbolo da Proteção [Fogo] criado com Bolsos Fundos (-1 PI)');

const resAmarrasOk = processarCriacaoSimbolo({
  simbolo: simAmarras,
  modoAplicacao: 'proprio',
  simbolosAtivos: resProtOk.simbolosAtivos,
  nvSimbolismo: 1,
  piAtual: 4
});
assert(
  resAmarrasOk.sucesso === true &&
  resAmarrasOk.simbolosAtivos.length === 1 &&
  resAmarrasOk.simbolosAtivos[0].key === 'simbolo_amarras',
  'Aplicar novo símbolo em si mesmo substitui o símbolo próprio anterior'
);

const resLimite = processarCriacaoSimbolo({
  simbolo: { key: 'simbolo_verdade', nome: 'Símbolo da Verdade', requer_escolha: false, descricao: '...' },
  modoAplicacao: 'aliado',
  nomeAlvo: 'Kael',
  simbolosAtivos: [
    { id: '1', key: 'simbolo_amarras', alvoTipo: 'proprio' },
    { id: '2', key: 'simbolo_desespero', alvoTipo: 'ataque_livre' }
  ],
  nvSimbolismo: 1,
  piAtual: 4
});
assert(resLimite.sucesso === false && resLimite.requerSubstituicao === true, 'Exceder (NP + 1) exige destruir/substituir símbolo ativo');

const efeitosSimb = extrairEfeitosSimbolosAtivos([
  {
    nome_classe: 'Simbolista',
    nivel: 3,
    habilidades: [
      { nome: 'Simbolismo', nivel: 2 },
      { nome: 'Toque Pessoal', nivel: 3 },
      { nome: 'Símbolos Mágicos', nivel: 2 }
    ],
    dados_simbolista: {
      simbolosAtivos: [
        { key: 'simbolo_protecao', escolha: 'Gelo', alvoTipo: 'proprio' },
        { key: 'simbolo_amarras', alvoTipo: 'proprio' },
        { key: 'simbolo_verdade', alvoTipo: 'ataque_livre' },
        { key: 'simbolo_feiticaria', alvoTipo: 'ataque_livre' }
      ]
    }
  }
]);
assert(
  efeitosSimb.travaAtributosBase === true &&
  efeitosSimb.resistencias.some((r) => r.tipo === 'gelo' && r.fonte === 'Símbolo da Proteção') &&
  efeitosSimb.qtdSimbolosVerdadeInimigos === 1 &&
  efeitosSimb.qtdSimbolosFeiticariaInimigos === 1 &&
  efeitosSimb.nvToquePessoal === 3,
  'extrairEfeitosSimbolosAtivos consolida Amarras, Proteção, Verdade e Feitiçaria'
);

console.log('--- Testando Integração Sinergias Transversais e Regras de Combate ---');
const sinergiasFull = calcularSinergiasCombateEMagia({
  classes: [
    { nome_classe: 'Esper', habilidades: [{ nome: 'Foco Cognitivo', nivel: 3 }, { nome: 'Hipercognição', nivel: 2 }], dados_esper: { focoAtivo: { nome: 'Inimigo' } } },
    { nome_classe: 'Elementalista', habilidades: [{ nome: 'Artilharia Mágica', nivel: 2 }, { nome: 'Cataclismo', nivel: 3 }] },
    { nome_classe: 'Espiritualista', habilidades: [{ nome: 'Poder Curativo', nivel: 2 }] },
    { nome_classe: 'Comandante', habilidades: [{ nome: 'Decreto do Bispo', nivel: 3 }], dados_comandante: { ordemAtiva: { poderKey: 'decreto_bispo', efeito: 'causam +9 dano adicional' } } },
    { nome_classe: 'Dançarino', habilidades: [{ nome: 'Dançarino de Guerra', nivel: 2 }, { nome: 'Sapateado Frenético', nivel: 2 }], dados_dancarino: { dancaAtivaTurno: { key: 'danca_anjo', nome: 'Dança do Anjo' }, ultimaDancaKey: 'danca_anjo' } }
  ],
  ficha: { lacos: [{ nome: 'A' }, { nome: 'B' }] },
  itensEquipados: [{ nome: 'Cajado Estelar', stats_personalizados: { categoria: 'arma arcana' } }],
  nivelTotal: 25,
  emCrise: false
});
assert(
  sinergiasFull.bonusFocoTeste === 3 &&
  sinergiasFull.bonusArtilharia === 4 &&
  sinergiasFull.bonusPoderCurativo === 7 &&
  sinergiasFull.bonusDanoDecreto === 9 &&
  sinergiasFull.bonusDanoDancarinoGuerra === 2 &&
  sinergiasFull.bonusSapateadoOpostos === 4,
  'calcularSinergiasCombateEMagia integra Esper, Elementalista, Espiritualista, Comandante e Dançarino'
);

const curaCombate = calcularCuraEfetivaEmConflito({
  curaBase: 20,
  tipoRecurso: 'pv',
  bonusToquePessoal: 3,
  bonusFocoCognitivo: 6,
  temSimboloDesespero: true
});
assert(curaCombate.valorFinal === 14, 'Cura efetiva com Desespero: floor((20 + 3 + 6) / 2) = 14');

const bloqRoque = calcularCuraEfetivaEmConflito({ curaBase: 30, bloqueadoPorRoqueDoRei: true });
assert(bloqRoque.valorFinal === 0, 'Roque do Rei bloqueia cura externa com 0');

const iniComSapateado = calcularIniciativaEOpostosCombate({ bonusIniciativaStatus: 3, bonusSapateadoFrenetico: 4 });
assert(iniComSapateado.iniciativa === 3 && iniComSapateado.bonusOpostosVelocidade === 4, 'Iniciativa e opostos consolidados corretamente');

console.log('TODOS OS TESTES HIGH FANTASY E SINERGIAS PASSARAM COM SUCESSO!');
