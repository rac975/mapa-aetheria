import {
  calcularPvMaxNpc,
  calcularPmMaxNpc,
  calcularIniciativaNpc,
  calcularDefesaNpc,
  calcularDefesaMagicaNpc,
  extrairBonusPoderes,
  calcularPoderesPermitidos,
  recalcularEstatisticasNpc,
  clampRecursoNpc,
  ajustarRecursoNpc,
  extrairHpMax,
  extrairMpMax,
  isNpcCombatente,
  calcularPontosVilaoPadrao,
  calcularAcoesPorTurnoNpc,
  criarFaseChefaoPadrao,
  verificarGatilhoTransicaoFase,
  executarTransicaoFaseChefao,
  consumirPontoVilaoNpc,
  isVilaoOuChefe
} from '../npcRules.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`PASSED: ${message}`);
}

console.log('--- 1. Testando Cálculos Básicos de NPC (Fabula Ultima) ---');
const pvSoldado = calcularPvMaxNpc({ nivel: 10, vigNum: 10, rank: 'soldado' });
assert(pvSoldado === (2 * 10) + (5 * 10), 'PV Soldado Nv 10 Vig 10 = 70');

const pvElite = calcularPvMaxNpc({ nivel: 10, vigNum: 10, rank: 'elite' });
assert(pvElite === 70 * 2, 'PV Elite Nv 10 Vig 10 = 140 (dobro)');

const pvCampeao = calcularPvMaxNpc({ nivel: 10, vigNum: 10, rank: 'campeao', quantidadeSoldados: 3 });
assert(pvCampeao === 70 * 3, 'PV Campeão (3x) = 210');

const pmSoldado = calcularPmMaxNpc({ nivel: 10, vonNum: 8, rank: 'soldado' });
assert(pmSoldado === 10 + (5 * 8), 'PM Soldado Nv 10 Von 8 = 50');

const pmCampeao = calcularPmMaxNpc({ nivel: 10, vonNum: 8, rank: 'campeao' });
assert(pmCampeao === 50 * 2, 'PM Campeão = 100 (dobro)');

const iniSoldado = calcularIniciativaNpc({ desNum: 8, astNum: 10, rank: 'soldado' });
assert(iniSoldado === Math.floor((8 + 10) / 2), 'Iniciativa Soldado = 9');

const def = calcularDefesaNpc(10);
assert(def === 10, 'Defesa básica = 10');

const defMag = calcularDefesaMagicaNpc(8);
assert(defMag === 8, 'Defesa mágica básica = 8');

const bonus = extrairBonusPoderes([
  { tipo_mecanica: 'stat_bonus', config_mecanica: { pv_max: 10, iniciativa: 2 } }
]);
assert(bonus.bonusPv === 10 && bonus.bonusIniciativa === 2, 'Extrai bônus de poderes corretamente');

const poderes = calcularPoderesPermitidos(
  { fisico: 'vul', raio: 'vul' },
  { fisico: 'vul', raio: '' },
  2
);
assert(poderes.extrasPorVulnerabilidade === 2, 'Calcula poderes extras por vulnerabilidade');

console.log('--- 2. Testando Clamping Restritivo de Recursos (clampRecursoNpc e ajustarRecursoNpc) ---');
// Limite superior
assert(clampRecursoNpc(100, 70) === 70, 'clampRecursoNpc corta valor 100 para o teto 70');
assert(clampRecursoNpc(70, 70) === 70, 'clampRecursoNpc mantém valor igual ao teto');
assert(clampRecursoNpc(50, 70) === 50, 'clampRecursoNpc mantém valor dentro do intervalo');

// Limite inferior
assert(clampRecursoNpc(-10, 70) === 0, 'clampRecursoNpc impede que valor fique negativo (-10 -> 0)');
assert(clampRecursoNpc(0, 70) === 0, 'clampRecursoNpc permite 0 (derrotado)');

// 3 argumentos (min, max flexível)
assert(clampRecursoNpc(999, 0, 70) === 70, 'clampRecursoNpc com min=0 e max=70 corta teto');
assert(clampRecursoNpc(-50, 0, 70) === 0, 'clampRecursoNpc com min=0 e max=70 corta piso');

// Ajuste com delta
assert(ajustarRecursoNpc(65, 10, 70) === 70, 'ajustarRecursoNpc corta incremento além do teto (65 + 10 -> 70)');
assert(ajustarRecursoNpc(10, -25, 70) === 0, 'ajustarRecursoNpc impede valor negativo (10 - 25 -> 0)');
assert(ajustarRecursoNpc(30, 15, 70) === 45, 'ajustarRecursoNpc soma corretamente dentro do teto');
assert(ajustarRecursoNpc(30, -15, 70) === 15, 'ajustarRecursoNpc subtrai corretamente dentro do limite');

console.log('--- 3. Testando Extração de Tetos (extrairHpMax e extrairMpMax) ---');
assert(extrairHpMax({ pv_max: 80 }) === 80, 'extrairHpMax lê pv_max');
assert(extrairHpMax({ hp_max: 75 }) === 75, 'extrairHpMax lê hp_max');
assert(extrairHpMax({ maxHp: 90 }) === 90, 'extrairHpMax lê maxHp');
assert(extrairHpMax({}) === 0, 'extrairHpMax fallback para 0 se ausente');

assert(extrairMpMax({ pm_max: 60 }) === 60, 'extrairMpMax lê pm_max');
assert(extrairMpMax({ mp_max: 55 }) === 55, 'extrairMpMax lê mp_max');
assert(extrairMpMax({ maxMp: 65 }) === 65, 'extrairMpMax lê maxMp');
assert(extrairMpMax({}) === 0, 'extrairMpMax fallback para 0 se ausente');

console.log('--- 4. Testando Recalcular Estatísticas com Clamping de Recursos Atuais ---');
const npcBase = {
  nome: 'Quimera Real',
  nivel: 20,
  rank: 'elite',
  atributos: { des: 'd10', ast: 'd8', vig: 'd10', von: 'd8' },
  pv_atual: 200,
  pm_atual: 150
};
const npcRecalculado = recalcularEstatisticasNpc({ npc: npcBase, novoNivel: 5, novoRank: 'soldado' });
// Nv 5, Vig 10, Soldado: PV = (2*5) + (5*10) = 60
assert(npcRecalculado.pv_max === 60, 'Novo pv_max calculado é 60');
assert(npcRecalculado.pv_atual === 60, 'pv_atual de 200 foi clamped para o novo pv_max de 60');
// Nv 5, Von 8, Soldado: PM = 5 + (5*8) = 45
assert(npcRecalculado.pm_max === 45, 'Novo pm_max calculado é 45');
assert(npcRecalculado.pm_atual === 45, 'pm_atual de 150 foi clamped para o novo pm_max de 45');

console.log('--- 5. Testando Identificação de Combatente NPC ---');
assert(isNpcCombatente({ tipo: 'inimigo' }) === true, 'Inimigo é NPC');
assert(isNpcCombatente({ tipo: 'npc' }) === true, 'NPC é NPC');
assert(isNpcCombatente({ tipo: 'heroi' }) === false, 'Herói não é NPC');
assert(isNpcCombatente({ tipo: 'jogador' }) === false, 'Jogador não é NPC');
assert(isNpcCombatente(null) === false, 'Null retorna false');

console.log('--- 6. Testando Mecânicas de Vilão, Multi-Ações e Fases de Chefão ---');
assert(calcularPontosVilaoPadrao('padrao') === 0, 'Vilão Padrão = 0 PVilão');
assert(calcularPontosVilaoPadrao('elite') === 5, 'Vilão Elite = 5 PVilão');
assert(calcularPontosVilaoPadrao('campeao') === 10, 'Vilão Campeão = 10 PVilão');
assert(calcularPontosVilaoPadrao('soberano') === 15, 'Vilão Soberano = 15 PVilão');

assert(calcularAcoesPorTurnoNpc({ rank: 'soldado', tipoVilao: 'padrao' }) === 1, 'Soldado Padrão = 1 ação/turno');
assert(calcularAcoesPorTurnoNpc({ rank: 'elite', tipoVilao: 'elite' }) === 2, 'Elite = 2 ações/turno');
assert(calcularAcoesPorTurnoNpc({ rank: 'campeao', tipoVilao: 'campeao', quantidadeSoldados: 4 }) === 4, 'Campeão 4x = 4 ações/turno');
assert(calcularAcoesPorTurnoNpc({ rank: 'soldado', tipoVilao: 'soberano', quantidadeSoldados: 2 }) === 3, 'Soberano mínimo = 3 ações/turno');

const fase1 = criarFaseChefaoPadrao(1, { pv_max: 120, pm_max: 60, acoes_por_turno: 2 });
const fase2 = criarFaseChefaoPadrao(2, { pv_max: 180, pm_max: 80, acoes_por_turno: 3 });

const checkSemGatilho = verificarGatilhoTransicaoFase({
  hpAtual: 50,
  hpMax: 120,
  faseAtual: 1,
  fasesChefao: [fase1, fase2]
});
assert(checkSemGatilho.gatilhoAtivo === false, 'Com 50 PV na Fase 1, gatilho hp_zero ainda não está ativo');

const checkGatilhoZero = verificarGatilhoTransicaoFase({
  hpAtual: 0,
  hpMax: 120,
  faseAtual: 1,
  fasesChefao: [fase1, fase2]
});
assert(checkGatilhoZero.gatilhoAtivo === true, 'Com 0 PV na Fase 1, gatilho de transição para Fase 2 ativa!');
assert(checkGatilhoZero.proximaFaseObj.numero === 2, 'Próxima fase identificada é a Fase 2');

const chefeEmCombate = {
  nome: 'Malos, Égide Sombrio',
  tipo: 'inimigo',
  tipo_vilao: 'soberano',
  pontos_vilao: 15,
  pontos_ultima: 15,
  fase_atual: 1,
  acoes_por_turno: 2,
  fases_chefao: [fase1, fase2],
  hp_atual: 0,
  hp_max: 120,
  mp_atual: 10,
  mp_max: 60,
  condicoes: ['lento', 'abalado'],
  modificadores: { acoes_realizadas_rodada: 2 }
};

assert(isVilaoOuChefe(chefeEmCombate) === true, 'Identifica Soberano como Vilão/Chefe');

const resTransicao = executarTransicaoFaseChefao(chefeEmCombate);
assert(resTransicao.valido === true, 'Transição de Fase 1 para Fase 2 válida');
assert(resTransicao.entidadeAtualizada.fase_atual === 2, 'Fase atual atualizada para 2');
assert(resTransicao.entidadeAtualizada.hp_max === 180, 'HP Máximo atualizado para 180 da Fase 2');
assert(resTransicao.entidadeAtualizada.hp_atual === 180, 'HP Atual restaurado para 180 da Fase 2');
assert(resTransicao.entidadeAtualizada.mp_atual === 60, 'MP recuperou +50 (10 + 50 = 60)');
assert(resTransicao.entidadeAtualizada.acoes_por_turno === 3, 'Ações por turno escaladas para 3 na Fase 2');
assert(resTransicao.entidadeAtualizada.condicoes.length === 0, 'Condições negativas limpas na transição de fase');

const chefeComCondicoes = {
  ...resTransicao.entidadeAtualizada,
  mp_atual: 20,
  condicoes: ['envenenado']
};
const resGastoPv = consumirPontoVilaoNpc(chefeComCondicoes, { codigoAcao: 'RECUPERACAO_EPICA' });
assert(resGastoPv.valido === true, 'Gasto de Ponto de Vilão válido');
assert(resGastoPv.entidadeAtualizada.pontos_vilao === 14, 'Pontos de Vilão reduzidos de 15 para 14');
assert(resGastoPv.entidadeAtualizada.mp_atual === 70, 'Recuperação de Vilão somou +50 PM (20 -> 70)');
assert(resGastoPv.entidadeAtualizada.condicoes.length === 0, 'Recuperação de Vilão limpou condições negativas');

console.log('TODOS OS TESTES DE REGRAS DE NPC PASSARAM COM SUCESSO!');
