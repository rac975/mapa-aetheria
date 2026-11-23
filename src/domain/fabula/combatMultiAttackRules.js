/**
 * Fabula Ultima - Regras de Ataque Multi e Checagem de Precisão vs Defesas
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { AFINIDADES_DANO, calcularDanoFinalComModificadores } from './combatRules.js';

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

    let afinidadeEfetiva = AFINIDADES_DANO.NORMAL;
    const afs = alvo.afinidades || alvo.afinidades_elementais || {};
    const valAf = afs[tipoDano?.toLowerCase()];
    if (valAf) {
      const vNorm = String(valAf).toLowerCase();
      if (vNorm === 'vul' || vNorm === 'vulneravel') afinidadeEfetiva = AFINIDADES_DANO.VULNERAVEL;
      else if (vNorm === 'res' || vNorm === 'resistente') afinidadeEfetiva = AFINIDADES_DANO.RESISTENTE;
      else if (vNorm === 'imu' || vNorm === 'imune') afinidadeEfetiva = AFINIDADES_DANO.IMUNE;
      else if (vNorm === 'abs' || vNorm === 'absorve') afinidadeEfetiva = AFINIDADES_DANO.ABSORVE;
    }

    const estaGuardando = Boolean(alvo.guardando || alvo.modificadores?.guardando);
    const bonusCondenar = Number(alvo.modificadores?.bonusDanoSofridoCondenar) || 0;

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

  const resumoTexto = resultadosAlvos.map((r) => r.mensagem).join(' | ');

  return {
    isCritico,
    isFumble,
    statusCritico,
    oportunidadeHabilitada: isCritico || isFumble,
    totalPrecisao,
    totalAtingidos,
    totalAlvos: alvosLista.length,
    resultadosAlvos,
    resumoTexto
  };
}
