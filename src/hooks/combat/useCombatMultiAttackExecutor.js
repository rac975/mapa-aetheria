/**
 * Hook puro para orquestração e execução de Ataques (Único, Duas Armas, Múltiplos Alvos
 * e Múltiplos Golpes no Mesmo Alvo, além da integração com Fundir do Arcano da Espada/Forja/Geada).
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

    // Mapeia cada ocorrência em alvosIds permitindo múltiplos golpes no mesmo alvo ou múltiplos alvos distintos
    const alvosLista = multiAlvoAtivo && alvosIds.length > 0
      ? alvosIds.map((id) => participantes.find((p) => String(p.id) === String(id))).filter(Boolean)
      : (alvoId ? participantes.filter((p) => String(p.id) === String(alvoId)) : []);

    const alvosUnicosCount = new Set(alvosLista.map((a) => String(a.id))).size;
    const habGolpe = perfil?.dadosLadino?.habilidades?.golpeBaixo;
    const alvoUnico = alvosUnicosCount === 1 ? alvosLista[0] : null;
    const condicoesAlvo = Array.isArray(alvoUnico?.condicoes) ? alvoUnico.condicoes : [];

    const arcanoAtivo = combatente?.modificadores?.arcano_ativo || null;
    const fundidoEspada = Boolean(arma.isGolpeFundirEspada || arcanoAtivo?.chave === 'espada');
    const bonusFundirEspada = (fundidoEspada && !arma.jaIncluiBonusEspada) ? 5 : 0;
    const tipoDanoEfetivo = fundidoEspada ? 'sem_tipo' : (arma.tipoDano || 'fisico');
    const ignoraAfinidades = Boolean(fundidoEspada || arma.ignoraAfinidades);
    const ignoraResistencia = Boolean(
      arma.ignoraResistencia ||
      (arcanoAtivo?.chave === 'forja' && tipoDanoEfetivo === 'fogo') ||
      (arcanoAtivo?.chave === 'geada' && tipoDanoEfetivo === 'gelo')
    );

    const isMultiEfetivo = Boolean(
      !arma.isDuasArmas && (multiAlvoAtivo || arma.propriedadeMulti || arma.isMulti || alvosLista.length > 1)
    );

    const bonusGolpe = (!isMultiEfetivo && !arma.isDuasArmas && habGolpe?.ativo && condicoesAlvo.length > 0)
      ? calcularDanoGolpeBaixo({ nivelGolpeBaixo: habGolpe.nivel, condicoesAlvo, isAlvoUnico: true })
      : 0;
    const tagGolpe = bonusGolpe > 0 ? ` • 🗡️ Golpe Baixo (+${bonusGolpe} dano)` : '';
    const tagEspada = fundidoEspada ? ' • ⚔️ Arcano da Espada (+5 Sem Tipo)' : '';

    const bonusDanoTotal = (Number(arma.bonusDano) || 0) + bonusGolpe + bonusFundirEspada;

    const res = await onRolarDados({
      combatente,
      perfil,
      arma,
      categoria: 'arma',
      titulo: `Ataque: ${arma.nome}`,
      attr1: arma.attr1,
      attr2: arma.attr2,
      bonusTeste: Number(arma.bonusPrecisao) || 0,
      bonusDano: bonusDanoTotal,
      calcularDano: true,
      tipoDano: tipoDanoEfetivo,
      isMulti: isMultiEfetivo
    });

    if (!res) return null;

    if (tipoDanoEfetivo) setTipoDano?.(tipoDanoEfetivo);

    const danoBaseAtaque = isMultiEfetivo ? bonusDanoTotal : (res.danoTotal || 0);

    if (alvosLista.length > 0) {
      const golpesEspecificos = arma.isDuasArmas
        ? [
            { alvo: alvosLista[0], danoBase: (res.danoGolpe1 || 0) + bonusFundirEspada, tipoDano: fundidoEspada ? 'sem_tipo' : (arma.tipoDano || 'fisico') },
            { alvo: alvosLista[1] || alvosLista[0], danoBase: (res.danoGolpe2 || 0) + bonusFundirEspada, tipoDano: fundidoEspada ? 'sem_tipo' : (arma.tipoDanoSecundario || 'fisico') }
          ]
        : null;

      const resolucao = resolverAtaqueMultiAlvos({
        totalPrecisao: res.total,
        d1: res.d1,
        d2: res.d2,
        danoBase: danoBaseAtaque,
        tipoDano: tipoDanoEfetivo,
        alvos: alvosLista,
        golpesEspecificos,
        tipoDefesa: arma.atacaContraMdef ? 'mdef' : 'def',
        condicao: arma.condicao || '',
        ignoraResistencia,
        ignoraAfinidades
      });

      setNotaLivre?.(`${arma.nome}${tagEspada} (Precisão ${res.total}): ${resolucao.resumoTexto}`);

      if (onExecutarAcao) {
        for (let i = 0; i < resolucao.resultadosAlvos.length; i += 1) {
          const item = resolucao.resultadosAlvos[i];
          const ehPrimeiro = i === 0;

          await onExecutarAcao({
            acaoCodigo: 'ATAQUE',
            atorId: combatente.id,
            alvoId: item.alvoId,
            danoAplicado: item.danoFinal,
            tipoDano: tipoDanoEfetivo,
            afinidadeAlvo: item.afinidade,
            condicaoAlvo: item.condicaoAplicada,
            notaLivre: item.mensagem,
            marcarTurnoConcluido: ehPrimeiro ? marcarTurnoConcluido : false
          });
        }
      }
      return res;
    }

    if (res.danoTotal !== null) setDanoAplicado?.(danoBaseAtaque);
    const tagVoador = arma.atingeVoadores ? ' • 🦅 Atinge Voadores' : '';
    const tagMulti = isMultiEfetivo ? ' (Multi)' : '';
    const tagCond = arma.condicao ? ` • Condição: ${arma.condicao}` : '';
    const tagEf = arma.efeito ? ` • ${arma.efeito}` : '';

    if (arma.isDuasArmas) {
      setNotaLivre?.(`Multiataque: Precisão ${res.total} ${res.formulaDados} • 1º: ${res.danoGolpe1} (${arma.tipoDano}) • 2º (RA=0): ${res.danoGolpe2} (${arma.tipoDanoSecundario})${tagEspada}${tagVoador}`);
    } else {
      setNotaLivre?.(`${arma.nome}: Precisão ${res.total} ${res.formulaDados} • RA ${res.hr}${tagMulti}${tagGolpe}${tagEspada}${res.statusCritico ? ` • ${res.statusCritico}` : ''}${tagVoador}${tagCond}${tagEf}`);
    }

    return res;
  };

  return { executarAtaqueArma };
}
