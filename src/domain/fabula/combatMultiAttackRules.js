/**
 * Fabula Ultima - Regras de Ataque Multi (Múltiplos Alvos e Múltiplos Golpes no Mesmo Alvo)
 * e Checagem de Precisão vs Defesas (DEF / DEF.M)
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
  const tipoNorm = normalizarTextoCore(tipoDano || 'fisico');
  if (tipoNorm === 'sem_tipo' || tipoNorm === 'neutro') return AFINIDADES_DANO.NORMAL;

  const afs = alvo?.afinidades || alvo?.afinidades_elementais || {};
  if (!afs || typeof afs !== 'object') return AFINIDADES_DANO.NORMAL;

  const candidatos = SINONIMOS_ELEMENTAIS[tipoNorm] || [tipoNorm];
  let valorBruto = null;
  for (const [k, v] of Object.entries(afs)) {
    if (candidatos.includes(normalizarTextoCore(k))) {
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
  golpesEspecificos = null,
  tipoDefesa = 'def',
  condicao = '',
  ignoraResistencia = false,
  ignoraAfinidades = false,
  modificadoresCena = {}
} = {}) {
  const isFumble = d1 === 1 && d2 === 1;
  const isCritico = !isFumble && d1 === d2 && d1 >= 6;
  const statusCritico = isCritico ? 'Sucesso Crítico!' : (isFumble ? 'Falha Crítica (Fumble)!' : null);

  const alvosBrutos = Array.isArray(alvos) ? alvos.filter(Boolean) : [];
  const listaGolpes = Array.isArray(golpesEspecificos) && golpesEspecificos.length > 0
    ? golpesEspecificos.filter((g) => g && g.alvo)
    : alvosBrutos.map((alvo) => ({ alvo, danoBase, tipoDano }));

  const resultadosGolpes = [];
  const mapaConsolidado = new Map();
  let totalAtingidos = 0;

  for (let idx = 0; idx < listaGolpes.length; idx += 1) {
    const golpe = listaGolpes[idx];
    const alvo = golpe.alvo;
    const alvoKey = String(alvo.id ?? `alvo_${idx}`);
    const alvoNome = alvo.nome || 'Alvo';
    const danoGolpeBruto = Number(golpe.danoBase ?? danoBase) || 0;
    const tipoGolpe = golpe.tipoDano || tipoDano || 'fisico';
    const semTipo = ignoraAfinidades || tipoGolpe === 'sem_tipo';

    const defAlvo = tipoDefesa === 'mdef'
      ? Number(alvo.mdef ?? alvo.defesa_magica ?? 10)
      : Number(alvo.defesa ?? alvo.def ?? 10);

    const atingiu = isFumble ? false : (isCritico ? true : totalPrecisao >= defAlvo);

    if (!atingiu) {
      const itemErro = {
        alvoId: alvo.id, alvoNome, atingiu: false, defesaAlvo: defAlvo,
        danoFinal: 0, curaAbsorvida: 0, condicaoAplicada: null,
        tipoDano: tipoGolpe, afinidade: AFINIDADES_DANO.NORMAL,
        mensagem: `❌ ${alvoNome} (${tipoDefesa.toUpperCase()} ${defAlvo} vs ${totalPrecisao}): Errou`
      };
      resultadosGolpes.push(itemErro);
      if (!mapaConsolidado.has(alvoKey)) {
        mapaConsolidado.set(alvoKey, { ...itemErro, quantidadeGolpes: 1, golpesAtingidos: 0, parcelasDano: [] });
      } else {
        const atual = mapaConsolidado.get(alvoKey);
        atual.quantidadeGolpes += 1;
      }
      continue;
    }

    totalAtingidos += 1;
    let afinidadeEfetiva = semTipo ? AFINIDADES_DANO.NORMAL : obterAfinidadeAlvoPorTipoDano(alvo, tipoGolpe);
    if (ignoraResistencia && afinidadeEfetiva === AFINIDADES_DANO.RESISTENTE) {
      afinidadeEfetiva = AFINIDADES_DANO.NORMAL;
    }

    const estaGuardando = Boolean(alvo.guardando || alvo.modificadores?.guardando);
    const bonusCondenar = Number(alvo.modificadores?.bonusDanoSofridoCondenar || alvo.modificadores?.bonusDanoCondenar) || 0;

    const resDano = calcularDanoFinalComModificadores({
      danoBruto: danoGolpeBruto,
      reducaoDanoFixa: Number(alvo.reducaoDanoFixa) || 0,
      estaGuardando,
      afinidade: afinidadeEfetiva,
      bonusDanoCondenar: bonusCondenar,
      bonusDanoAdicional: modificadoresCena?.decretoDanoExtra || 0
    });

    const condAplicada = condicao ? condicao : null;
    const rotuloTipo = tipoGolpe === 'sem_tipo' ? 'sem tipo (Espada)' : tipoGolpe;
    const descDano = resDano.curaAbsorvida > 0
      ? `absorveu +${resDano.curaAbsorvida} PV (${rotuloTipo})`
      : `${resDano.danoFinal} de dano ${rotuloTipo}${resDano.detalhes?.length ? ` [${resDano.detalhes.join(', ')}]` : ''}`;

    const itemAcerto = {
      alvoId: alvo.id, alvoNome, atingiu: true, defesaAlvo: defAlvo,
      danoFinal: resDano.danoFinal, curaAbsorvida: resDano.curaAbsorvida,
      condicaoAplicada: condAplicada, tipoDano: tipoGolpe, afinidade: afinidadeEfetiva,
      mensagem: `🎯 ${alvoNome} (${tipoDefesa.toUpperCase()} ${defAlvo} vs ${totalPrecisao}): ${descDano}${condAplicada ? ` • Condição: ${condAplicada}` : ''}`
    };
    resultadosGolpes.push(itemAcerto);

    if (!mapaConsolidado.has(alvoKey)) {
      mapaConsolidado.set(alvoKey, {
        ...itemAcerto,
        quantidadeGolpes: 1,
        golpesAtingidos: 1,
        parcelasDano: [`${resDano.danoFinal} (${rotuloTipo})`]
      });
    } else {
      const atual = mapaConsolidado.get(alvoKey);
      atual.atingiu = true;
      atual.quantidadeGolpes += 1;
      atual.golpesAtingidos += 1;
      atual.danoFinal += resDano.danoFinal;
      atual.curaAbsorvida += resDano.curaAbsorvida;
      atual.condicaoAplicada = atual.condicaoAplicada || condAplicada;
      atual.parcelasDano.push(`${resDano.danoFinal} (${rotuloTipo})`);
      atual.mensagem = `🎯 ${alvoNome} (${atual.golpesAtingidos}× Golpes [${atual.parcelasDano.join(' + ')}] • ${tipoDefesa.toUpperCase()} ${defAlvo} vs ${totalPrecisao}): ${atual.danoFinal} de dano total${atual.condicaoAplicada ? ` • Condição: ${atual.condicaoAplicada}` : ''}`;
    }
  }

  const resultadosAlvos = Array.from(mapaConsolidado.values());

  return {
    isCritico,
    isFumble,
    statusCritico,
    oportunidadeHabilitada: isCritico || isFumble,
    totalPrecisao,
    totalAtingidos,
    totalAlvos: resultadosAlvos.length,
    totalGolpes: listaGolpes.length,
    resultadosGolpes,
    resultadosAlvos,
    resumoTexto: resultadosAlvos.map((r) => r.mensagem).join(' | ')
  };
}
