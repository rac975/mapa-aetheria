import {
  CONDICOES_OFICIAIS,
  calcularModificadoresCondicoesOficiais,
  calcularPassivosCoreClasses,
  calcularBonusGolpeBaixo,
  calcularInvocacaoArcano,
  calcularResultadoRouboDeAlma,
  calcularDadosOrador,
  calcularCustoVismagus,
  verificarGatilhoContraAtaque,
  calcularCustoFogoCruzado
} from '../coreClassRules.js';
import {
  calcularPvMaximoCompanheiro,
  calcularBonusEscalaArcanista,
  processarGolpeDasSombras
} from '../classRules.js';
import {
  ACOES_CONFLITO_OFICIAIS,
  REACOES_COMBATE_OFICIAIS,
  MANOBRAS_TATICAS_OFICIAIS,
  AFINIDADES_DANO,
  calcularProgressoRelogioPorTeste,
  calcularDanoFinalComModificadores,
  extrairModificadoresCombatente,
  resolverAcaoCombate,
  extrairPerfilRolagemCombatente,
  rolarDadosCombate
} from '../combatRules.js';
import {
  calcularDefesasEIniciativa,
  extrairStatsArmadura,
  extrairStatsItemDefensivo,
  SLOTS_EQUIPAMENTO
} from '../equipmentRules.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`PASSED: ${message}`);
}

console.log('--- 1. Testando Condições Oficiais (Livro Básico) ---');
assert(Object.keys(CONDICOES_OFICIAIS).length === 6, 'Exatamente 6 condições oficiais mapeadas');
const modFraco = calcularModificadoresCondicoesOficiais(['fraco']);
assert(
  modFraco.vigor === -1 && modFraco.destreza === 0 && modFraco.astucia === 0 && modFraco.vontade === 0,
  'Condição Fraco reduz APENAS Vigor em 1 passo'
);
const modEnvenenadoEnfurecido = calcularModificadoresCondicoesOficiais(['envenenado', 'enfurecido']);
assert(
  modEnvenenadoEnfurecido.vigor === -1 &&
    modEnvenenadoEnfurecido.vontade === -1 &&
    modEnvenenadoEnfurecido.destreza === -1 &&
    modEnvenenadoEnfurecido.astucia === -1,
  'Envenenado (VIG/VON) + Enfurecido (DES/AST) reduzem corretamente os 4 atributos'
);
const modImune = calcularModificadoresCondicoesOficiais(['atordoado', 'abalado'], ['atordoado']);
assert(modImune.astucia === 0 && modImune.vontade === -1, 'Imunidade bloqueia penalidade de Atordoado');

console.log('--- 2. Testando Passivos e Interações das 15 Classes Core ---');
const classesMock = [
  {
    nome_classe: 'Guardião',
    nivel: 5,
    habilidades: [
      { nome: 'Fortaleza', nivel: 3 },
      { nome: 'Maestria Defensiva', nivel: 2 },
      { nome: 'Guarda-Costas', nivel: 1 }
    ]
  },
  {
    nome_classe: 'Ladino',
    nivel: 4,
    habilidades: [
      { nome: 'Esquiva', nivel: 3 },
      { nome: 'Golpe Baixo', nivel: 2 },
      { nome: 'Roubo de Alma', nivel: 2 }
    ]
  },
  {
    nome_classe: 'Furioso',
    nivel: 3,
    habilidades: [{ nome: 'Adrenalina', nivel: 4 }]
  },
  {
    nome_classe: 'Guerreiro Sombrio',
    nivel: 3,
    habilidades: [
      { nome: 'Sangue das Trevas', nivel: 1 },
      { nome: 'Golpe das Sombras', nivel: 3 }
    ]
  },
  {
    nome_classe: 'Erudito',
    nivel: 3,
    habilidades: [{ nome: 'Concentrado', nivel: 4 }]
  },
  {
    nome_classe: 'Elementalista',
    nivel: 4,
    habilidades: [{ nome: 'Artilharia Mágica', nivel: 3 }]
  },
  {
    nome_classe: 'Espiritualista',
    nivel: 2,
    habilidades: [{ nome: 'Poder Curativo', nivel: 2 }]
  },
  {
    nome_classe: 'Orador',
    nivel: 5,
    habilidades: [
      { nome: 'Condenar', nivel: 2 },
      { nome: 'Encorajar', nivel: 3 },
      { nome: 'Confio em Você', nivel: 2 }
    ]
  }
];

const fichaMock = {
  hp_atual: 20,
  hp_max: 60,
  lacos: [{ nome: 'A', forca: 2 }, { nome: 'B', forca: 3 }]
};
const itensSemEscudo = [{ nome: 'Cajado Arcano', tipo: 'arma arcana', stats_personalizados: { slot: 'mao_dominante', categoria: 'arcana' } }];
const itensComEscudo = [{ nome: 'Escudo Torre', tipo: 'escudo', stats_personalizados: { slot: 'mao_secundaria', escudo: true } }];

const passivosSemEscudo = calcularPassivosCoreClasses({ classes: classesMock, ficha: fichaMock, itensEquipados: itensSemEscudo, emCrise: true });
assert(passivosSemEscudo.bonusPvFortaleza === 9, 'Fortaleza Nv 3 = +9 PV');
assert(passivosSemEscudo.bonusPmConcentrado === 12, 'Concentrado Nv 4 = +12 PM');
assert(passivosSemEscudo.bonusDefesaEsquiva === 3, 'Esquiva Nv 3 ativa sem escudo/armadura marcial (+3 DEF)');
assert(passivosSemEscudo.reducaoDanoMaestriaDefensiva === 0, 'Maestria Defensiva inativa sem escudo/armadura marcial');
assert(passivosSemEscudo.bonusDanoAdrenalinaCrise === 8, 'Adrenalina Nv 4 em Crise = +8 dano');
assert(passivosSemEscudo.resistenciasCrise.length === 2, 'Sangue das Trevas em Crise concede resistência a trevas e veneno');
assert(passivosSemEscudo.bonusTesteArtilhariaMagica === 6, 'Artilharia Mágica Nv 3 com arma arcana = +6 Magia');
assert(passivosSemEscudo.bonusCuraPoderCurativo === 7, 'Poder Curativo Nv 2 + 2 Laços = +7 PV');

const passivosComEscudo = calcularPassivosCoreClasses({ classes: classesMock, ficha: fichaMock, itensEquipados: itensComEscudo, emCrise: false });
assert(passivosComEscudo.bonusDefesaEsquiva === 0 && passivosComEscudo.reducaoDanoMaestriaDefensiva === 2, 'Escudo desativa Esquiva e ativa Maestria Defensiva (-2 dano)');

console.log('--- 3. Testando Regras Específicas de Habilidades Core ---');
assert(calcularBonusGolpeBaixo(3, ['lento', 'atordoado'], true) === 5, 'Golpe Baixo Nv 3 vs alvo único com 2 condições = +5 dano');
assert(calcularBonusGolpeBaixo(3, ['lento'], false) === 0, 'Golpe Baixo não ativa em ataque multi-alvo');
assert(calcularInvocacaoArcano({ nvArcanoEmergencial: 3, nvRegeneracaoArcana: 2, emCrise: true }).custoPm === 25, 'Arcano Emergencial Nv 3 em Crise reduz invocação para 25 PM');
assert(calcularInvocacaoArcano({ nvArcanoEmergencial: 3, nvRegeneracaoArcana: 2, emCrise: false }).curaRegeneracao === 10, 'Regeneração Arcana Nv 2 cura 10 PV');

const dadosOrador = calcularDadosOrador(classesMock);
assert(dadosOrador.perdaPmCondenar === 20 && dadosOrador.curaPvEncorajar === 15 && dadosOrador.curaPmConfioComLaco === 20, 'Orador usa NP individual de Condenar (20 PM), Encorajar (15 PV) e Confio em Você (20 PM)');

const roubo = calcularResultadoRouboDeAlma({ nvRouboAlma: 3, dadoDes: 10, dadoVon: 8, rolagem1: 7, rolagem2: 6, tipoAlvo: 'vilao', nivelAlvo: 12 });
assert(roubo.total === 16 && roubo.valorZenites === 600, 'Roubo de Alma usa DES+VON+NP (16) e calcula Tesouro de Vilão (600z)');

assert(calcularCustoVismagus(15, 25).permitido === false, 'Vismagus bloqueia sacrifício se PV <= 10 + PM (25 <= 25)');
assert(calcularCustoVismagus(10, 25).custoPv === 20, 'Vismagus calcula custo 10 + 10 = 20 PV');
assert(verificarGatilhoContraAtaque(1, 14, true) === true && verificarGatilhoContraAtaque(1, 13, true) === false, 'Contra-Ataque dispara apenas em Precisão par corpo a corpo');
assert(calcularCustoFogoCruzado(1, 16, false).custoPm === 21 && !calcularCustoFogoCruzado(1, 16, true).permitido, 'Fogo Cruzado custa 5 + Precisão alvo e falha em Sucesso Crítico');
assert(calcularPvMaximoCompanheiro(3, 'd8', 9) === 28, 'Companheiro Fiel PV = (3*8) + floor(9/2) = 28');
assert(calcularBonusEscalaArcanista(20) === 10 && calcularBonusEscalaArcanista(40) === 20, 'Escala do Arcanista Nv 20 (+10) e Nv 40 (+20)');
assert(!processarGolpeDasSombras({ hp_atual: 1 }, classesMock, 8).sucesso, 'Golpe das Sombras lê hp_atual real e bloqueia suicídio com 1 PV');

console.log('--- 4. Testando Ações de Combate, Reações, Relógios e Guarda ---');
assert(Object.keys(ACOES_CONFLITO_OFICIAIS).length === 10, '10 ações de conflito oficiais mapeadas');
assert(Object.keys(REACOES_COMBATE_OFICIAIS).length >= 7, 'Reações oficiais mapeadas');
assert(Object.keys(MANOBRAS_TATICAS_OFICIAIS).length >= 4, 'Manobras táticas mapeadas');

const progObj = calcularProgressoRelogioPorTeste({ resultadoTeste: 16, nivelDificuldade: 10, isCritico: true, secoesExtrasPersuasivo: 1 });
assert(progObj.sucesso && progObj.secoesAvancadas === 6, 'Objetivo ND 10 com 16 (+2 margem) + Crítico (+2) + Persuasivo (+1) = +6 seções');

const danoGuardaVul = calcularDanoFinalComModificadores({
  danoBruto: 22,
  reducaoDanoFixa: 2,
  estaGuardando: true,
  afinidade: AFINIDADES_DANO.VULNERAVEL
});
assert(danoGuardaVul.danoFinal === 20, 'Guarda anula Vulnerabilidade (22 - 2 = 20 dano, x1)');

const danoAbsorve = calcularDanoFinalComModificadores({ danoBruto: 18, afinidade: AFINIDADES_DANO.ABSORVE });
assert(danoAbsorve.danoFinal === 0 && danoAbsorve.curaAbsorvida === 18, 'Afinidade Absorve converte dano em cura');

const heroi = { id: 1, nome: 'Vesper', tipo: 'heroi', hp_atual: 40, hp_max: 40, mp_atual: 30, mp_max: 30, ip: 6, pontos_fabula: 3, guardando: false, condicoes: [] };
const inimigo = { id: 2, nome: 'Golem de Éter', tipo: 'inimigo', hp_atual: 50, hp_max: 50, mp_atual: 20, mp_max: 20, ip: 0, pontos_fabula: 0, guardando: true, condicoes: [] };

const resGuarda = resolverAcaoCombate({ acaoCodigo: 'GUARDAR', ator: heroi, alvo: inimigo });
assert(resGuarda.valido && resGuarda.updatesAtor.guardando === true && resGuarda.updatesAtor.protegendo_id === 2 && resGuarda.updatesAtor.agiu === true, 'Ação GUARDAR ativa defesa, cobertura e marca turno');

const resConjurarDecreto = resolverAcaoCombate({
  acaoCodigo: 'CONJURAR',
  ator: heroi,
  alvo: inimigo,
  custoPm: 10,
  danoAplicado: 20,
  tipoDano: 'raio',
  modificadoresCena: { decretoDobrarPm: true, decretoDanoExtra: 6 }
});
// Custo PM: 10*2 = 20 PM -> sobra 10 PM. Dano: 20 + 6 (Decreto) = 26; inimigo em Guarda -> floor(26/2) = 13 -> HP 50 - 13 = 37
assert(
  resConjurarDecreto.valido &&
    resConjurarDecreto.updatesAtor.mp_atual === 10 &&
    resConjurarDecreto.updatesAlvo.hp_atual === 37 &&
    resConjurarDecreto.updatesAlvo.dano_acumulado === 13,
  'CONJURAR com Decreto do Bispo dobra PM (20), soma +6 dano e aplica ÷2 da Guarda no alvo (13 dano)'
);

const resRendicao = resolverAcaoCombate({ acaoCodigo: 'RENDICAO', ator: { ...heroi, hp_atual: 0 } });
assert(resRendicao.valido && resRendicao.updatesAtor.pontos_fabula === 5, 'Rendição permitida com 0 PV concede +2 Pontos de Fábula');

const resObj = resolverAcaoCombate({ acaoCodigo: 'OBJETIVO', ator: heroi, avancoRelogio: 3, notaLivre: 'Desativou núcleo' });
assert(resObj.valido && resObj.deltaRelogio === 3, 'OBJETIVO propaga avanço de relógio corretamente');

assert(extrairModificadoresCombatente(heroi, { roqueBloquearCura: true }).roqueBloquearCura === true, 'Extrai modificadores ativos da cena');

console.log('--- 5. Testando Rolagem de Dados Direta Integrada à Ordem de Combate ---');
const fichaHeroiCompleta = {
  id: 101,
  nome_personagem: 'Vesper',
  destreza: 10,
  astucia: 8,
  vigor: 10,
  vontade: 8,
  defesa: 12,
  mdef: 9,
  classes: [
    {
      nome_classe: 'Mestre de Armas',
      nivel: 3,
      habilidades: [{ nome: 'Maestria com Armas Corpo a Corpo', nivel: 2 }]
    }
  ],
  itens: [
    {
      id: 1,
      nome: 'Espada Solar',
      tipo: 'arma',
      equipado: true,
      stats_personalizados: {
        slot: 'mao_dominante',
        precisao: '[DES + VIG] +1',
        dano_fixo: 7,
        tipo_dano: 'luz'
      }
    }
  ],
  magias: [
    { id: 10, nome: 'Lux', custo_mp: '10', descricao: 'Feitiço ofensivo de luz' }
  ]
};

const perfilHeroi = extrairPerfilRolagemCombatente({
  combatente: { ...heroi, condicoes: ['lento'], guardando: true },
  ficha: fichaHeroiCompleta
});
// DES base d10 com condição Lento (-1 passo) -> d8
assert(
  perfilHeroi.atributosBase.des === 10 && perfilHeroi.atributosAtuais.des === 8,
  'Condição Lento reduz Destreza de d10 para d8 no perfil de rolagem do combatente'
);
assert(
  perfilHeroi.armas[0].nome === 'Espada Solar' && perfilHeroi.armas[0].bonusPrecisao === 3,
  'Extrai arma equipada da ficha somando bônus da arma (+1) e Maestria Corpo a Corpo (+2 = +3)'
);

const rolagemAtaqueCrit = rolarDadosCombate({
  combatente: { ...heroi, guardando: true },
  perfil: perfilHeroi,
  categoria: 'arma',
  titulo: 'Ataque: Espada Solar',
  attr1: 'des',
  attr2: 'vig',
  bonusTeste: perfilHeroi.armas[0].bonusPrecisao,
  bonusDano: perfilHeroi.armas[0].bonusDano,
  calcularDano: true,
  tipoDano: 'luz',
  valoresFixos: { d1: 7, d2: 7 }
});
assert(
  rolagemAtaqueCrit.total === 17 &&
    rolagemAtaqueCrit.hr === 7 &&
    rolagemAtaqueCrit.danoTotal === 14 &&
    rolagemAtaqueCrit.isCritico === true,
  'Rolagem de arma calcula Precisão (7+7+3=17), HR (7), Dano (7+7=14) e Sucesso Crítico'
);

const rolagemOpostaGuarda = rolarDadosCombate({
  combatente: { ...heroi, guardando: true },
  perfil: perfilHeroi,
  categoria: 'resistencia',
  titulo: 'Disputa Oposta',
  attr1: 'vig',
  attr2: 'des',
  isOposto: true,
  valoresFixos: { d1: 5, d2: 4 }
});
assert(
  rolagemOpostaGuarda.bonusGuarda === 2 && rolagemOpostaGuarda.total === 11,
  'Teste Oposto em postura de Guarda aplica automaticamente +2 (5+4+2=11)'
);

console.log('--- 6. Testando Regras de Armaduras, Escudos e Cálculo de Defesas ---');
const attrsPadrao = { destreza: 'd8', astucia: 'd8', vigor: 'd8', vontade: 'd8' };

// 6.1 Sem Armadura
const defSemArmadura = calcularDefesasEIniciativa({ atributos: attrsPadrao, itensEquipados: [], classes: [] });
assert(defSemArmadura.defesaTotal === 8, 'Sem armadura: DEF = DES (8)');
assert(defSemArmadura.mdefTotal === 8, 'Sem armadura: M.DEF = AST (8)');
assert(defSemArmadura.iniciativaTotal === 0, 'Sem armadura: Iniciativa = 0');

// 6.2 Armadura Leve (+1 DEF, +1 MDEF, -1 Ini)
const itemArmaduraLeve = {
  nome: 'Traje de Viagem',
  tipo: 'Armadura Leve',
  stats_personalizados: { slot: SLOTS_EQUIPAMENTO.ARMADURA, defesa: '+1', 'defesa magica': '+1', iniciativa: -1 }
};
const statsExtLeve = extrairStatsArmadura(itemArmaduraLeve, 8);
assert(statsExtLeve.ehMarcial === false && statsExtLeve.defesaBase === 8 && statsExtLeve.bonusDefesaArmadura === 1, 'extrairStatsArmadura identifica armadura leve');

const defLeve = calcularDefesasEIniciativa({ atributos: attrsPadrao, itensEquipados: [itemArmaduraLeve], classes: [] });
assert(defLeve.defesaTotal === 9, 'Armadura Leve (+1): DEF = DES (8) + 1 = 9');
assert(defLeve.mdefTotal === 9, 'Armadura Leve (+1): M.DEF = AST (8) + 1 = 9');
assert(defLeve.iniciativaTotal === -1, 'Armadura Leve: penalidade de iniciativa -1');

// 6.3 Armadura Marcial (DEF Fixa 11, Ini -3) - Garante que NUNCA vire 19 (8 + 11)!
const itemArmaduraMarcial = {
  nome: 'Cota de Malha',
  tipo: 'Armadura Marcial',
  stats_personalizados: { slot: SLOTS_EQUIPAMENTO.ARMADURA, marcial: true, defesa: 11, iniciativa: -3 }
};
const statsExtMarcial = extrairStatsArmadura(itemArmaduraMarcial, 8);
assert(statsExtMarcial.ehMarcial === true && statsExtMarcial.defesaBase === 11 && statsExtMarcial.bonusDefesaArmadura === 0, 'extrairStatsArmadura identifica marcial com DEF Fixa');

const defMarcial = calcularDefesasEIniciativa({ atributos: attrsPadrao, itensEquipados: [itemArmaduraMarcial], classes: [] });
assert(defMarcial.defesaTotal === 11, 'Armadura Marcial (11): DEF Fixa = 11 (NUNCA salta para 19)');
assert(defMarcial.defesaBase === 11, 'Armadura Marcial substitui DES por 11 na defesa base');
assert(defMarcial.iniciativaTotal === -3, 'Armadura Marcial: penalidade de iniciativa -3');

// 6.4 Armadura Marcial com string "DES + 11" - Parser corrige automaticamente para DEF Fixa 11
const itemArmaduraMarcialString = {
  nome: 'Armadura de Placas',
  tipo: 'Armadura Marcial',
  stats_personalizados: { slot: SLOTS_EQUIPAMENTO.ARMADURA, marcial: true, defesa: 'DES + 11', iniciativa: -4 }
};
const defMarcialStr = calcularDefesasEIniciativa({ atributos: attrsPadrao, itensEquipados: [itemArmaduraMarcialString], classes: [] });
assert(defMarcialStr.defesaTotal === 11, 'Armadura Marcial com string DES + 11 é normalizada para DEF Fixa 11 (evita 19)');

// 6.5 Armadura Marcial + Escudo de Bronze (+2 DEF)
const itemEscudoBronze = {
  nome: 'Escudo de Bronze',
  tipo: 'Escudo',
  stats_personalizados: { slot: SLOTS_EQUIPAMENTO.MAO_SECUNDARIA, escudo: true, defesa: 2 }
};
const statsExtEscudo = extrairStatsItemDefensivo(itemEscudoBronze);
assert(statsExtEscudo.ehEscudo === true && statsExtEscudo.bonusDef === 2, 'extrairStatsItemDefensivo identifica escudo e bônus');
const defMarcialEscudo = calcularDefesasEIniciativa({
  atributos: attrsPadrao,
  itensEquipados: [itemArmaduraMarcial, itemEscudoBronze],
  classes: []
});
assert(defMarcialEscudo.defesaTotal === 13, 'Armadura Marcial (11) + Escudo (+2) = 13 DEF');
assert(defMarcialEscudo.temEscudoEquipado === true, 'Detecta escudo equipado');

// 6.6 Armadura Leve (+1 DEF) + Escudo de Bronze (+2 DEF)
const defLeveEscudo = calcularDefesasEIniciativa({
  atributos: attrsPadrao,
  itensEquipados: [itemArmaduraLeve, itemEscudoBronze],
  classes: []
});
assert(defLeveEscudo.defesaTotal === 11, 'Armadura Leve (+1) + Escudo (+2) + DES 8 = 11 DEF');

// 6.7 Interação com Habilidade Esquiva do Ladino
const classesLadino = [{ nome_classe: 'Ladino', nivel: 5, habilidades: [{ nome: 'Esquiva', nivel: 2 }] }];
const defLadinoSemNada = calcularDefesasEIniciativa({ atributos: attrsPadrao, itensEquipados: [itemArmaduraLeve], classes: classesLadino });
assert(defLadinoSemNada.defesaTotal === 11, 'Esquiva Nv 2 ativa com armadura leve e sem escudo (8 + 1 + 2 = 11)');

const defLadinoComEscudo = calcularDefesasEIniciativa({ atributos: attrsPadrao, itensEquipados: [itemArmaduraLeve, itemEscudoBronze], classes: classesLadino });
assert(defLadinoComEscudo.defesaTotal === 11, 'Esquiva Nv 2 desativa quando escudo é equipado (8 + 1 + 2 + 0 = 11)');

const defLadinoComMarcial = calcularDefesasEIniciativa({ atributos: attrsPadrao, itensEquipados: [itemArmaduraMarcial], classes: classesLadino });
assert(defLadinoComMarcial.defesaTotal === 11, 'Esquiva Nv 2 desativa quando armadura marcial é equipada (DEF Fixa 11)');

console.log('TODOS OS TESTES CORE BOOK E COMBATE PASSARAM COM SUCESSO!');
