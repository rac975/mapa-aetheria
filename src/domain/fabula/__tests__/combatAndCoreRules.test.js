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
  rolarDadosCombate,
  clampRecursoNpc,
  ajustarRecursoNpc,
  isNpcCombatente,
  extrairHpMax,
  extrairMpMax,
  construirCombatente,
  sanitizarPayloadIniciativa
} from '../combatRules.js';
import {
  calcularDefesasEIniciativa,
  extrairStatsArmadura,
  extrairStatsItemDefensivo,
  SLOTS_EQUIPAMENTO,
  armaAtingeVoadores,
  CARACTERISTICA_ATINGIR_VOADOR,
  isEscudo,
  ESCUDOS_BASE_COMUNS,
  isArmaDuasMaos,
  ARMAS_BASE_COMUNS
} from '../equipmentRules.js';
import { isNpcVoador } from '../npcRules.js';
import { construirStatsArmaPersonalizada } from '../weaponForge.js';

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
  'Rolagem de arma calcula Precisão (7+7+3=17), RA (7), Dano (7+7=14) e Sucesso Crítico'
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

// 6.8 Escudos Base Comuns (Bronze, Pesado e Rúnico) e isEscudo
assert(ESCUDOS_BASE_COMUNS.length === 3, 'ESCUDOS_BASE_COMUNS contém exatamente 3 escudos canônicos');
const [escBronze, escPesado, escRunico] = ESCUDOS_BASE_COMUNS;

assert(escBronze.nome === 'Escudo de Bronze' && escBronze.custo === 100 && escBronze.stats.defesa === 2 && escBronze.stats.marcial === false, 'Escudo de Bronze: 100z, +2 DEF, Simples');
assert(escPesado.nome === 'Escudo Pesado' && escPesado.custo === 150 && escPesado.stats.defesa === 2 && escPesado.stats.iniciativa === -2 && escPesado.stats.marcial === true, 'Escudo Pesado: 150z, +2 DEF, -2 Ini, Marcial');
assert(escRunico.nome === 'Escudo Rúnico' && escRunico.custo === 150 && escRunico.stats.defesa === 1 && escRunico.stats.defesa_magica === 1 && escRunico.stats.marcial === false, 'Escudo Rúnico: 150z, +1 DEF, +1 M.DEF, Simples');

assert(isEscudo(escBronze) === true, 'isEscudo identifica Escudo de Bronze');
assert(isEscudo(escPesado) === true, 'isEscudo identifica Escudo Pesado');
assert(isEscudo(escRunico) === true, 'isEscudo identifica Escudo Rúnico');
assert(isEscudo(itemArmaduraMarcial) === false, 'isEscudo retorna false para Armadura Marcial');

// 6.9 Cálculos de Combate com Escudo Pesado e Escudo Rúnico
const itemEscPesadoEquipado = {
  nome: escPesado.nome,
  tipo: escPesado.tipo,
  stats_personalizados: { ...escPesado.stats }
};
const itemEscRunicoEquipado = {
  nome: escRunico.nome,
  tipo: escRunico.tipo,
  stats_personalizados: { ...escRunico.stats }
};

const defComPesadoEMarcial = calcularDefesasEIniciativa({
  atributos: attrsPadrao,
  itensEquipados: [itemArmaduraMarcial, itemEscPesadoEquipado],
  classes: []
});
assert(
  defComPesadoEMarcial.defesaTotal === 13 &&
  defComPesadoEMarcial.mdefTotal === 8 &&
  defComPesadoEMarcial.iniciativaTotal === -5 &&
  defComPesadoEMarcial.temEscudoEquipado === true,
  'Armadura Marcial (11 DEF, -3 Ini) + Escudo Pesado (+2 DEF, -2 Ini) = 13 DEF e -5 Iniciativa'
);

const defComRunicoELeve = calcularDefesasEIniciativa({
  atributos: attrsPadrao,
  itensEquipados: [itemArmaduraLeve, itemEscRunicoEquipado],
  classes: []
});
assert(
  defComRunicoELeve.defesaTotal === 10 &&
  defComRunicoELeve.mdefTotal === 10 &&
  defComRunicoELeve.iniciativaTotal === -1 &&
  defComRunicoELeve.temEscudoEquipado === true,
  'Armadura Leve (+1 DEF, +1 M.DEF, -1 Ini) + Escudo Rúnico (+1 DEF, +1 M.DEF) + Attrs (DES 8, AST 8) = 10 DEF, 10 M.DEF e -1 Ini'
);

console.log('--- 7. Testando Gestão de Recursos (PV e PM) e Clamping Restritivo de NPCs ---');

// 7.1 Identificação de NPC e extração de tetos máximos
assert(isNpcCombatente({ tipo: 'inimigo' }) === true, 'isNpcCombatente identifica tipo inimigo');
assert(isNpcCombatente({ tipo: 'npc' }) === true, 'isNpcCombatente identifica tipo npc');
assert(isNpcCombatente({ tipo: 'heroi' }) === false, 'isNpcCombatente não marca heroi como npc');
assert(extrairHpMax({ hp_max: 50 }) === 50, 'extrairHpMax lê hp_max');
assert(extrairHpMax({ maxHp: 65 }) === 65, 'extrairHpMax lê maxHp');
assert(extrairHpMax({ pv_max: 80 }) === 80, 'extrairHpMax lê pv_max');
assert(extrairMpMax({ mp_max: 30 }) === 30, 'extrairMpMax lê mp_max');
assert(extrairMpMax({ maxMp: 45 }) === 45, 'extrairMpMax lê maxMp');
assert(extrairMpMax({ pm_max: 60 }) === 60, 'extrairMpMax lê pm_max');

// 7.2 Função clampRecursoNpc
assert(clampRecursoNpc(70, 50) === 50, 'clampRecursoNpc restringe valor acima do teto para maxHp');
assert(clampRecursoNpc(-15, 50) === 0, 'clampRecursoNpc restringe valor abaixo de 0 para 0');
assert(clampRecursoNpc(35, 50) === 35, 'clampRecursoNpc mantém valor dentro dos limites');
assert(clampRecursoNpc(0, 50) === 0, 'clampRecursoNpc permite 0 (combatente caído)');
assert(clampRecursoNpc(50, 50) === 50, 'clampRecursoNpc permite valor igual ao teto máximo');
assert(clampRecursoNpc(75, 0, 50) === 50, 'clampRecursoNpc com 3 argumentos [0, max] restringe teto');
assert(clampRecursoNpc(-20, 0, 50) === 0, 'clampRecursoNpc com 3 argumentos [0, max] restringe piso');

// 7.3 Função ajustarRecursoNpc com delta
assert(ajustarRecursoNpc(45, 10, 50) === 50, 'ajustarRecursoNpc não permite ultrapassar maxHp (45 + 10 -> 50)');
assert(ajustarRecursoNpc(10, -30, 50) === 0, 'ajustarRecursoNpc não permite ficar abaixo de 0 (10 - 30 -> 0)');
assert(ajustarRecursoNpc(20, -5, 50) === 15, 'ajustarRecursoNpc aplica dano normalmente (20 - 5 -> 15)');
assert(ajustarRecursoNpc(20, 15, 50) === 35, 'ajustarRecursoNpc aplica cura normalmente (20 + 15 -> 35)');

// 7.4 Clamping em rolagens de dano/cura via resolverAcaoCombate
const npcCombatente = {
  id: 10,
  nome: 'Dragão Carmesim',
  tipo: 'inimigo',
  hp_atual: 50,
  hp_max: 50,
  maxHp: 50,
  mp_atual: 20,
  mp_max: 30,
  maxMp: 30,
  guardando: false,
  condicoes: []
};

// Dano letal não deixa HP negativo
const resDanoMassivo = resolverAcaoCombate({
  acaoCodigo: 'ATAQUE',
  ator: { id: 1, nome: 'Vesper', tipo: 'heroi', hp_atual: 40, hp_max: 40, mp_atual: 30, mp_max: 30 },
  alvo: npcCombatente,
  danoAplicado: 100,
  afinidadeAlvo: 'normal'
});
assert(resDanoMassivo.updatesAlvo.hp_atual === 0, 'Dano massivo no NPC é restrito exatamente a 0 PV');
assert(resDanoMassivo.updatesAlvo.dano_acumulado === 50, 'Dano acumulado no NPC é 50 (máximo)');

// Cura além do teto não ultrapassa maxHp
const resCuraExcedente = resolverAcaoCombate({
  acaoCodigo: 'CONJURAR',
  ator: { id: 1, nome: 'Vesper', tipo: 'heroi', hp_atual: 40, hp_max: 40, mp_atual: 30, mp_max: 30 },
  alvo: { ...npcCombatente, hp_atual: 45 },
  curaAplicada: 30,
  recursoCura: 'pv'
});
assert(resCuraExcedente.updatesAlvo.hp_atual === 50, 'Cura excedente em PV no NPC é travada em maxHp (50)');
assert(resCuraExcedente.updatesAlvo.dano_acumulado === 0, 'Dano acumulado após cura total no NPC é 0');

// Cura de PM além do teto não ultrapassa maxMp
const resCuraPmExcedente = resolverAcaoCombate({
  acaoCodigo: 'INVENTARIO',
  ator: { id: 1, nome: 'Vesper', tipo: 'heroi', hp_atual: 40, hp_max: 40, mp_atual: 30, mp_max: 30 },
  alvo: { ...npcCombatente, mp_atual: 25 },
  curaAplicada: 20,
  recursoCura: 'pm'
});
assert(resCuraPmExcedente.updatesAlvo.mp_atual === 30, 'Cura de PM no NPC é travada em maxMp (30)');

// Absorção de dano convertida em cura não ultrapassa maxHp
const resAbsorcao = resolverAcaoCombate({
  acaoCodigo: 'ATAQUE',
  ator: { id: 1, nome: 'Vesper', tipo: 'heroi', hp_atual: 40, hp_max: 40, mp_atual: 30, mp_max: 30 },
  alvo: { ...npcCombatente, hp_atual: 40 },
  danoAplicado: 40,
  afinidadeAlvo: 'absorve'
});
assert(resAbsorcao.updatesAlvo.hp_atual === 50, 'Absorção de dano pelo NPC é travada em maxHp (50)');

// NPC conjurando magia gastando PM
const resNpcConjura = resolverAcaoCombate({
  acaoCodigo: 'CONJURAR',
  ator: { ...npcCombatente, mp_atual: 15 },
  custoPm: 10
});
assert(resNpcConjura.updatesAtor.mp_atual === 5, 'NPC gasta PM e novo valor é 5');

console.log('--- 8. Testando Padronização de Colunas do Banco (hp_max, mp_max) e Sanitização de Payload ---');
const combatenteCriado = construirCombatente({
  nome: 'Goblin Xamã',
  tipo: 'inimigo',
  hpMax: 45,
  mpMax: 35,
  npcId: 4
});
assert(combatenteCriado.hp_max === 45, 'construirCombatente define hp_max canônico');
assert(combatenteCriado.mp_max === 35, 'construirCombatente define mp_max canônico');
assert(combatenteCriado.maxHp === undefined, 'construirCombatente NÃO deve conter maxHp');
assert(combatenteCriado.maxMp === undefined, 'construirCombatente NÃO deve conter maxMp');

// Sanitização de payload vindo com chaves legadas ou heterogêneas
const payloadLegado = {
  nome: 'Monstro Antigo',
  maxHp: 60,
  maxMp: 40,
  pv_max: 60,
  pm_max: 40,
  pv_atual: 55,
  pm_atual: 35,
  dano_acumulado: 5
};
const payloadLimpo = sanitizarPayloadIniciativa(payloadLegado);
assert(payloadLimpo.hp_max === 60, 'sanitizarPayloadIniciativa mapeia maxHp para hp_max');
assert(payloadLimpo.mp_max === 40, 'sanitizarPayloadIniciativa mapeia maxMp para mp_max');
assert(payloadLimpo.maxHp === undefined, 'sanitizarPayloadIniciativa remove maxHp');
assert(payloadLimpo.maxMp === undefined, 'sanitizarPayloadIniciativa remove maxMp');
assert(payloadLimpo.pv_max === undefined, 'sanitizarPayloadIniciativa remove pv_max');
assert(payloadLimpo.pm_max === undefined, 'sanitizarPayloadIniciativa remove pm_max');
assert(payloadLimpo.pv_atual === undefined, 'sanitizarPayloadIniciativa remove pv_atual');
assert(payloadLimpo.pm_atual === undefined, 'sanitizarPayloadIniciativa remove pm_atual');
assert(payloadLimpo.dano_acumulado === 5, 'sanitizarPayloadIniciativa preserva colunas válidas');

console.log('--- 9. Testando Mecânicas de Voadores e Características Especiais ---');
// Teste armaAtingeVoadores
const espadaComum = { nome: 'Espada Longa', stats: { dano: 'RA + 6', tipo_dano: 'fisico' } };
assert(!armaAtingeVoadores(espadaComum), 'Espada comum não atinge voadores');

const lancaVoadora = {
  nome: 'Lança dos Céus',
  stats: { dano: 'RA + 8', atinge_voadores: true }
};
assert(armaAtingeVoadores(lancaVoadora), 'Arma com flag atinge_voadores: true é detectada');

const arcoComEfeito = {
  nome: 'Arco Espiritual',
  stats: { dano: 'RA + 4', efeitos: ['Atingir alvo voador'] }
};
assert(armaAtingeVoadores(arcoComEfeito), 'Arma com efeito textual de voador é detectada');

assert(CARACTERISTICA_ATINGIR_VOADOR.custo === 100, 'Característica de atingir voador custa 100z');
assert(CARACTERISTICA_ATINGIR_VOADOR.atinge_voadores === true, 'Característica possui flag atinge_voadores');

// Teste construirStatsArmaPersonalizada com atingir_voador
const armaAtlasVoadora = construirStatsArmaPersonalizada({
  categoria: 'espada',
  alcance: 'Corpo a corpo',
  precisaoTipo: '(DES + VIG)',
  personalizacoes: [
    { id: 'atingir_voador', nome: 'Atingir alvo voador', custoExtra: 100, atinge_voadores: true }
  ]
});
assert(armaAtlasVoadora.custo === 400, 'Arma personalizada com voador soma 300 base + 100 custoExtra');
assert(armaAtlasVoadora.atinge_voadores === true, 'Arma personalizada possui atinge_voadores: true');

// Teste NPC voador
const npcTerrestre = { nome: 'Lobo Cinzento', rank: 'soldado' };
assert(!isNpcVoador(npcTerrestre), 'NPC padrão sem flag não é voador');

const npcVoadorFlag = { nome: 'Harpia', rank: 'soldado', voador: true };
assert(isNpcVoador(npcVoadorFlag), 'NPC com flag voador: true é identificado como voador');

const npcVoadorPoder = { nome: 'Grifo', poderes: [{ nome: 'Voo Superior' }] };
assert(isNpcVoador(npcVoadorPoder), 'NPC com poder de voo é identificado como voador');

// Teste construirCombatente com voador
const combatenteVoador = construirCombatente({
  tipo: 'inimigo',
  nome: 'Gárgula',
  hpMax: 50,
  mpMax: 30,
  voador: true
});
assert(combatenteVoador.voador === true, 'construirCombatente define voador: true');
assert(combatenteVoador.modificadores?.voador === true, 'modificadores também guarda flag voador');

console.log('--- 10. Testando Auditoria de Forja e Armas Personalizadas ---');

// 10.1 Armas Base Comuns oficiais e detecção de duas mãos
assert(ARMAS_BASE_COMUNS.length >= 10, 'ARMAS_BASE_COMUNS contém catálogo canônico de armas');
const espadaCurta = ARMAS_BASE_COMUNS.find(a => a.id === 'espada_curta');
const espadaLonga = ARMAS_BASE_COMUNS.find(a => a.id === 'espada_longa');

assert(!isArmaDuasMaos(espadaCurta), 'Espada curta é de 1 mão');
assert(isArmaDuasMaos(espadaLonga), 'Espada longa é de 2 mãos');

const armaCustom2H = { nome: 'Montante Custom', stats: { maos: 'Duas mãos' } };
assert(isArmaDuasMaos(armaCustom2H), 'isArmaDuasMaos detecta string "Duas mãos" em stats');

// 10.2 Arma Personalizada do Atlas com Defesa e Defesa Mágica
const armaAtlasDefensiva = construirStatsArmaPersonalizada({
  categoria: 'espada',
  alcance: 'Corpo a corpo',
  precisaoTipo: '(DES + VIG)',
  personalizacoes: [
    { id: 'defesa', nome: 'Aumento na Defesa (+2 Defesa, conta como escudo)', custoExtra: 0, marcial: false },
    { id: 'defesa_magica', nome: 'Aumento na Defesa Mágica (+2 Def. Mágica)', custoExtra: 0, marcial: true }
  ]
});

assert(armaAtlasDefensiva.defesa === 2, 'Arma com aumento de defesa grava defesa: 2 no stats');
assert(armaAtlasDefensiva.escudo === true, 'Arma com aumento de defesa grava escudo: true no stats');
assert(armaAtlasDefensiva.defesa_magica === 2, 'Arma com aumento de defesa mágica grava defesa_magica: 2 no stats');
assert(armaAtlasDefensiva.slot === 'duas_maos' && armaAtlasDefensiva.duas_maos === true, 'Arma personalizada grava slot duas_maos');

// 10.3 Interação de combate: Arma com aumento de defesa conta como escudo
const itemArmaAtlasEquipada = {
  nome: 'Espada Guarda-Real',
  tipo: 'arma',
  stats_personalizados: {
    slot: SLOTS_EQUIPAMENTO.MAO_DOMINANTE,
    ...armaAtlasDefensiva
  }
};

const defComArmaDefensiva = calcularDefesasEIniciativa({
  atributos: attrsPadrao,
  itensEquipados: [itemArmaduraLeve, itemArmaAtlasEquipada],
  classes: []
});

assert(
  defComArmaDefensiva.defesaTotal === 11,
  'Armadura Leve (+1) + Arma Defensiva (+2) + DES 8 = 11 DEF'
);
assert(
  defComArmaDefensiva.mdefTotal === 11,
  'Armadura Leve (+1) + Arma Defensiva (+2 MDEF) + AST 8 = 11 M.DEF'
);
assert(
  defComArmaDefensiva.temEscudoEquipado === true,
  'Arma com personalização de defesa é identificada como escudo pelo motor de combate'
);

console.log('TODOS OS TESTES CORE BOOK E COMBATE PASSARAM COM SUCESSO!');
