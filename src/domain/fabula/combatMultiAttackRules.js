/**
 * Fabula Ultima - Regras de Ataque Multi e Checagem de Precisão vs Defesas
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { AFINIDADES_DANO, calcularDanoFinalComModificadores } from './combatRules.js';
import { normalizarTextoCore } from './coreClassRules.js';

const SINONIMOS_ELEMENTAIS = {
  trevas: ['trevas', 'sombrio', 'sombra', 'dark'],
  sombrio: ['trevas', 'sombrio', 'sombra', 'dark'],
  sombra: ['trevas', 'sombrio', 'sombra', 'dark'],
  ar: ['ar', 'vento', 'air', 'wind'],
  vento: ['ar', 'vento', 'air', 'wind'],
  raio: ['raio', 'trovao', 'eletrico', 'bolt'],
  trovao: ['raio', 'trovao', 'eletrico', 'bolt'],
  gelo: ['gelo', 'agua', 'ice'],
  agua: ['gelo', 'agua', 'ice'],
  fogo: ['fogo', 'chama', 'fire'],
  terra: ['terra', 'earth'],
  luz: ['luz', 'sagrado', 'light'],
  veneno: ['veneno', 'poison'],
  fisico: ['fisico', 'physical']
};

export function obterAfinidadeAlvoPorTipoDano(alvo = {}, tipoDano = 'fisico') {
  const afs = alvo?.afinidades || alvo?.afinidades_elementais || {};
  if (!afs || typeof afs !== 'object') return AFINIDADES_DANO.NORMAL;

  const tipoNorm = normalizarTextoCore(tipoDano || 'fisico');
  const candidatos = SINONIMOS_ELEMENTAIS[tipoNorm] || [tipoNorm];

  let valorBruto = null;
  for (const [k, v] of Object.entries(afs)) {
    const kNorm = normalizarTextoCore(k);
    if (candidatos.includes(kNorm)) {
      valorBruto = v;
      break;
    }
  }

  if (!valorBruto) return AFINIDADES_DANO.NORMAL;

  const vNorm = normalizarTextoCore(String(valorBruto));
  if (vNorm === 'vul' || vNorm === 'vu' || vNorm === 'vulneravel') return AFINIDADES_DANO.VULNERAVEL;
  if (vNorm === 'res' || vNorm === 'rs' || vNorm === 'resistente') return AFINIDADES_DANO.RESISTENTE;
  if (vNorm === 'imu' || vNorm === 'im' || vNorm === 'imune') return AFINIDADES_DANO.IMUNE;
  if (vNorm === 'abs' || vNorm === 'ab' || vNorm === 'absorve') return AFINIDADES_DANO.ABSORVE;
  return AFINIDADES_DANO.NORMAL;
}

export function resolverAtaqueMultiAlvos({
  totalPrecisao = 0,
  d1 = 1,
  d2 = 1,
  danoBase = 0,
  tipoDano = 'fisico',
  alvos = [],
  tipoDefesa = 'def',
  condicao = '',
  modificadoresCena = {}
} = {}) {
  const isFumble = d1 === 1 && d2 === 1;
  const isCritico = !isFumble && d1 === d2 && d1 >= 6;
  const statusCritico = isCritico ? 'Sucesso Crítico!' : (isFumble ? 'Falha Crítica (Fumble)!' : null);

  const alvosLista = Array.isArray(alvos) ? alvos.filter(Boolean) : [];
  const resultadosAlvos = [];
  let totalAtingidos = 0;

  for (const alvo of alvosLista) {
    const alvoNome = alvo.nome || 'Alvo';
    const defAlvo = tipoDefesa === 'mdef'
      ? Number(alvo.mdef ?? alvo.defesa_magica ?? 10)
      : Number(alvo.defesa ?? alvo.def ?? 10);

    const atingiu = isFumble ? false : (isCritico ? true : totalPrecisao >= defAlvo);

    if (!atingiu) {
      resultadosAlvos.push({
        alvoId: alvo.id,
        alvoNome,
        atingiu: false,
        defesaAlvo: defAlvo,
        danoFinal: 0,
        curaAbsorvida: 0,
        condicaoAplicada: null,
        afinidade: AFINIDADES_DANO.NORMAL,
        mensagem: `❌ ${alvoNome} (${tipoDefesa.toUpperCase()} ${defAlvo} vs ${totalPrecisao}): Errou`
      });
      continue;
    }

    totalAtingidos += 1;
    const afinidadeEfetiva = obterAfinidadeAlvoPorTipoDano(alvo, tipoDano);
    const estaGuardando = Boolean(alvo.guardando || alvo.modificadores?.guardando);
    const bonusCondenar = Number(alvo.modificadores?.bonusDanoSofridoCondenar || alvo.modificadores?.bonusDanoCondenar) || 0;

    const resDano = calcularDanoFinalComModificadores({
      danoBruto: Number(danoBase) || 0,
      reducaoDanoFixa: Number(alvo.reducaoDanoFixa) || 0,
      estaGuardando,
      afinidade: afinidadeEfetiva,
      bonusDanoCondenar: bonusCondenar,
      bonusDanoAdicional: modificadoresCena?.decretoDanoExtra || 0
    });

    const condAplicada = condicao ? condicao : null;
    const descDano = resDano.curaAbsorvida > 0
      ? `absorveu +${resDano.curaAbsorvida} PV (${tipoDano})`
      : `${resDano.danoFinal} de dano ${tipoDano}${resDano.detalhes?.length ? ` [${resDano.detalhes.join(', ')}]` : ''}`;

    resultadosAlvos.push({
      alvoId: alvo.id,
      alvoNome,
      atingiu: true,
      defesaAlvo: defAlvo,
      danoFinal: resDano.danoFinal,
      curaAbsorvida: resDano.curaAbsorvida,
      condicaoAplicada: condAplicada,
      afinidade: afinidadeEfetiva,
      mensagem: `🎯 ${alvoNome} (${tipoDefesa.toUpperCase()} ${defAlvo} vs ${totalPrecisao}): ${descDano}${condAplicada ? ` • Condição: ${condAplicada}` : ''}`
    });
  }

  return {
    isCritico,
    isFumble,
    statusCritico,
    oportunidadeHabilitada: isCritico || isFumble,
    totalPrecisao,
    totalAtingidos,
    totalAlvos: alvosLista.length,
    resultadosAlvos,
    resumoTexto: resultadosAlvos.map((r) => r.mensagem).join(' | ')
  };
}
