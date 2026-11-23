/**
 * Hook puro para orquestração e execução de Ataques (Único e Multi-Alvos)
 * Fabula Ultima - Clean Architecture: Separação estrita de regras e orquestração.
 */

import { resolverAtaqueMultiAlvos } from '../../domain/fabula/combatMultiAttackRules.js';
import { calcularDanoGolpeBaixo } from '../../domain/fabula/rogueRules.js';

export function useCombatMultiAttackExecutor({
  combatente,
  perfil,
  participantes = [],
  alvoId,
  alvosIds = [],
  multiAlvoAtivo = false,
  marcarTurnoConcluido = true,
  onExecutarAcao,
  onRolarDados,
  setDanoAplicado,
  setTipoDano,
  setNotaLivre
}) {
  const executarAtaqueArma = async (arma) => {
    if (!onRolarDados || !arma) return null;

    const alvosLista = multiAlvoAtivo && alvosIds.length > 0
      ? participantes.filter((p) => alvosIds.includes(String(p.id)))
      : (alvoId ? participantes.filter((p) => String(p.id) === String(alvoId)) : []);

    const habGolpe = perfil?.dadosLadino?.habilidades?.golpeBaixo;
    const alvoUnico = alvosLista.length === 1 ? alvosLista[0] : null;
    const condicoesAlvo = Array.isArray(alvoUnico?.condicoes) ? alvoUnico.condicoes : [];

    const isMultiEfetivo = Boolean(multiAlvoAtivo || arma.propriedadeMulti || arma.isMulti || alvosLista.length > 1);

    const bonusGolpe = (!isMultiEfetivo && !arma.isDuasArmas && habGolpe?.ativo && condicoesAlvo.length > 0)
      ? calcularDanoGolpeBaixo({ nivelGolpeBaixo: habGolpe.nivel, condicoesAlvo, isAlvoUnico: true })
      : 0;
    const tagGolpe = bonusGolpe > 0 ? ` • 🗡️ Golpe Baixo (+${bonusGolpe} dano)` : '';

    const res = await onRolarDados({
      combatente,
      perfil,
      arma,
      categoria: 'arma',
      titulo: `Ataque: ${arma.nome}`,
      attr1: arma.attr1,
      attr2: arma.attr2,
      bonusTeste: Number(arma.bonusPrecisao) || 0,
      bonusDano: (Number(arma.bonusDano) || 0) + bonusGolpe,
      calcularDano: true,
      tipoDano: arma.tipoDano || 'fisico',
      isMulti: isMultiEfetivo
    });

    if (!res) return null;

    if (arma.tipoDano) setTipoDano?.(arma.tipoDano);

    // Se temos alvos declarados no momento do clique, resolve imediatamente
    if (alvosLista.length > 0) {
      // Regra Multi: se isMultiEfetivo, dano base é bônus da arma sem somar RA (conforme regra Multi)
      const danoBaseAtaque = isMultiEfetivo ? ((Number(arma.bonusDano) || 0) + bonusGolpe) : (res.danoTotal || 0);

      const resolucao = resolverAtaqueMultiAlvos({
        totalPrecisao: res.total,
        d1: res.d1,
        d2: res.d2,
        danoBase: danoBaseAtaque,
        tipoDano: arma.tipoDano || 'fisico',
        alvos: alvosLista,
        tipoDefesa: arma.atacaContraMdef ? 'mdef' : 'def',
        condicao: arma.condicao || ''
      });

      setNotaLivre?.(`${arma.nome} (Precisão ${res.total}): ${resolucao.resumoTexto}`);

      if (onExecutarAcao) {
        for (let i = 0; i < resolucao.resultadosAlvos.length; i += 1) {
          const item = resolucao.resultadosAlvos[i];
          const ehPrimeiro = i === 0;

          await onExecutarAcao({
            acaoCodigo: 'ATAQUE',
            atorId: combatente.id,
            alvoId: item.alvoId,
            danoAplicado: item.danoFinal,
            tipoDano: arma.tipoDano || 'fisico',
            afinidadeAlvo: item.afinidade,
            condicaoAlvo: item.condicaoAplicada,
            notaLivre: item.mensagem,
            marcarTurnoConcluido: ehPrimeiro ? marcarTurnoConcluido : false
          });
        }
      }
      return res;
    }

    // Sem alvo declarado: preenche os campos na barra de ações para confirmação
    if (res.danoTotal !== null) setDanoAplicado?.(res.danoTotal);
    const tagVoador = arma.atingeVoadores ? ' • 🦅 Atinge Voadores' : '';
    const tagMulti = isMultiEfetivo ? ' (Multi: RA puro)' : '';
    setNotaLivre?.(`${arma.nome}: Precisão ${res.total} ${res.formulaDados} • RA ${res.hr}${tagMulti}${tagGolpe}${res.statusCritico ? ` • ${res.statusCritico}` : ''}${tagVoador}`);

    return res;
  };

  return { executarAtaqueArma };
}
