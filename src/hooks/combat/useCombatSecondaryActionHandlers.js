import { useState } from 'react';
import { calcularProgressoRelogioPorTeste } from '../../domain/fabula/combatRules';

export function useCombatSecondaryActionHandlers({
  ator,
  perfil,
  alvoId,
  relogios = [],
  marcarTurnoConcluido = true,
  onExecutarAcao,
  onRolarDados,
  setNotaLivre,
  setAvancoRelogio
}) {
  const [menuInventarioAberto, setMenuInventarioAberto] = useState(false);

  const handleGuarda = async () => {
    await onExecutarAcao?.({
      acaoCodigo: 'GUARDAR',
      atorId: ator.id,
      alvoId: alvoId || null,
      marcarTurnoConcluido
    });
  };

  const handleInventarioPadrao = async () => {
    setMenuInventarioAberto(false);
    await onExecutarAcao?.({
      acaoCodigo: 'INVENTARIO',
      atorId: ator.id,
      alvoId: alvoId || null,
      custoPi: 1,
      notaLivre: 'Consumiu 1 Ponto de Inventário (PI)',
      marcarTurnoConcluido
    });
  };

  const handlePocaoCura = async () => {
    setMenuInventarioAberto(false);
    await onExecutarAcao?.({
      acaoCodigo: 'INVENTARIO',
      atorId: ator.id,
      alvoId: alvoId || ator.id,
      custoPi: 2,
      curaAplicada: 40,
      recursoCura: 'pv',
      notaLivre: 'Poção de Cura: Restaura 40 PV (2 PI)',
      marcarTurnoConcluido
    });
  };

  const handleElixirMana = async () => {
    setMenuInventarioAberto(false);
    await onExecutarAcao?.({
      acaoCodigo: 'INVENTARIO',
      atorId: ator.id,
      alvoId: alvoId || ator.id,
      custoPi: 2,
      curaAplicada: 30,
      recursoCura: 'pm',
      notaLivre: 'Elixir de Mana: Restaura 30 PM (2 PI)',
      marcarTurnoConcluido
    });
  };

  const handleTonicoRestaurador = async () => {
    setMenuInventarioAberto(false);
    await onExecutarAcao?.({
      acaoCodigo: 'INVENTARIO',
      atorId: ator.id,
      alvoId: alvoId || ator.id,
      custoPi: 1,
      limparCondicoes: true,
      notaLivre: 'Tônico Restaurador: Remove todas as condições (1 PI)',
      marcarTurnoConcluido
    });
  };

  const handleAtivarMagiesfera = async (m) => {
    setMenuInventarioAberto(false);
    await onExecutarAcao?.({
      acaoCodigo: 'INVENTARIO',
      atorId: ator.id,
      custoPi: 2,
      custoPm: m.custoPm,
      notaLivre: `Ativou Magiesfera [${m.nome}] via Inventário (2 PI + ${m.custoPm} PM)`,
      marcarTurnoConcluido
    });

    await onRolarDados?.({
      combatente: ator,
      perfil,
      categoria: 'magia',
      magia: m,
      attr1: m.attr1 || 'ast',
      attr2: m.attr2 || 'von',
      titulo: `Magiesfera: ${m.nome}`,
      custoPm: m.custoPm,
      custoPi: 2,
      calcularDano: Boolean(m.ofensivo)
    });
  };

  const handleEstudo = async () => {
    const bonusConcentrado = perfil?.bonusTesteAbertoAstAst || perfil?.dadosErudito?.habilidades?.concentrado?.bonusAstAst || 0;
    const res = await onRolarDados?.({
      combatente: ator,
      perfil,
      categoria: 'atributo',
      titulo: perfil?.dadosErudito?.temClasseErudito ? 'Estudo Especializado (Erudito)' : 'Estudo de Alvo',
      attr1: 'ast',
      attr2: 'ast',
      bonusTeste: bonusConcentrado,
      ndAlvo: 10,
      calcularDano: false
    });
    if (res) {
      const msg = res.infoEstudo?.resumoTexto || `Estudo: ${res.total} ${res.formulaDados} vs ND 10${res.isCritico ? ' (Crítico!)' : ''}`;
      setNotaLivre?.(msg);
      await onExecutarAcao?.({
        acaoCodigo: 'ESTUDO',
        atorId: ator.id,
        alvoId: alvoId || null,
        notaLivre: msg,
        marcarTurnoConcluido
      });
    }
  };

  const handleObjetivo = async () => {
    const relogioAtivo = relogios[0];
    const res = await onRolarDados?.({
      combatente: ator,
      perfil,
      categoria: 'atributo',
      titulo: 'Ação de Objetivo',
      attr1: 'ast',
      attr2: 'von',
      ndAlvo: 10,
      calcularDano: false
    });
    if (res) {
      const prog = calcularProgressoRelogioPorTeste({
        resultadoTeste: res.total,
        nivelDificuldade: 10,
        isCritico: res.isCritico,
        isFalhaCritica: res.isFumble
      });
      setAvancoRelogio?.(prog.secoesAvancadas);
      const msg = `Objetivo: ${res.total} ${res.formulaDados} • Avanço: +${prog.secoesAvancadas} seção(ões)`;
      setNotaLivre?.(msg);
      await onExecutarAcao?.({
        acaoCodigo: 'OBJETIVO',
        atorId: ator.id,
        relogioId: relogioAtivo?.id || null,
        avancoRelogio: prog.secoesAvancadas,
        notaLivre: msg,
        marcarTurnoConcluido
      });
    }
  };

  const handleImpedimento = async () => {
    const res = await onRolarDados?.({
      combatente: ator,
      perfil,
      categoria: 'atributo',
      titulo: 'Impedimento Tático',
      attr1: 'des',
      attr2: 'von',
      calcularDano: false
    });
    if (res) {
      const msg = `Impedimento: ${res.total} ${res.formulaDados}${res.statusCritico ? ` • ${res.statusCritico}` : ''}`;
      setNotaLivre?.(msg);
      await onExecutarAcao?.({
        acaoCodigo: 'IMPEDIMENTO',
        atorId: ator.id,
        alvoId: alvoId || null,
        notaLivre: msg,
        marcarTurnoConcluido
      });
    }
  };

  const handleRendicao = async () => {
    await onExecutarAcao?.({
      acaoCodigo: 'RENDICAO',
      atorId: ator.id,
      notaLivre: `${ator.nome} realizou Rendição oficial (+2 Pontos de Fábula).`,
      marcarTurnoConcluido: true
    });
  };

  return {
    menuInventarioAberto,
    setMenuInventarioAberto,
    handleGuarda,
    handleInventarioPadrao,
    handlePocaoCura,
    handleElixirMana,
    handleTonicoRestaurador,
    handleAtivarMagiesfera,
    handleEstudo,
    handleObjetivo,
    handleImpedimento,
    handleRendicao
  };
}
