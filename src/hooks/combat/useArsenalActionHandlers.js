import { calcularDanoGolpeBaixo, calcularResolucaoRouboDeAlma } from '../../domain/fabula/rogueRules';

/**
 * Hook para centralizar os handlers de ações do arsenal do combatente (armas, magias, arcanos, companheiro e habilidades).
 * Segue Clean Architecture (GEMINI.md) separando a orquestração de ações da apresentação JSX.
 */
export function useArsenalActionHandlers({
  combatente,
  perfil,
  alvoId,
  alvo = null,
  multiAlvoAtivo = false,
  marcarTurnoConcluido = true,
  onExecutarAcao,
  onRolarDados,
  setDanoAplicado,
  setCuraAplicada,
  setTipoDano,
  setCustoPm,
  setNotaLivre,
  onHabilidadeSelecionada
}) {
  const handleRolarArma = async (arma) => {
    if (!onRolarDados) return;
    const habGolpe = perfil.dadosLadino?.habilidades?.golpeBaixo;
    const condicoesAlvo = Array.isArray(alvo?.condicoes) ? alvo.condicoes : [];
    const bonusGolpe = (!multiAlvoAtivo && !arma.isDuasArmas && habGolpe?.ativo && condicoesAlvo.length > 0)
      ? calcularDanoGolpeBaixo({ nivelGolpeBaixo: habGolpe.nivel, condicoesAlvo, isAlvoUnico: true })
      : 0;
    const tagGolpe = bonusGolpe > 0 ? ` • 🗡️ Golpe Baixo (+${bonusGolpe} dano)` : '';
    const isMultiEfetivo = Boolean(multiAlvoAtivo || arma.propriedadeMulti || arma.isMulti);

    const res = await onRolarDados({
      combatente, perfil, arma, categoria: 'arma', titulo: `Ataque: ${arma.nome}`,
      attr1: arma.attr1, attr2: arma.attr2,
      bonusTeste: Number(arma.bonusPrecisao) || 0,
      bonusDano: (Number(arma.bonusDano) || 0) + bonusGolpe,
      calcularDano: true, tipoDano: arma.tipoDano || 'fisico',
      isMulti: isMultiEfetivo
    });

    if (res) {
      if (res.danoTotal !== null) setDanoAplicado?.(res.danoTotal);
      if (arma.tipoDano) setTipoDano?.(arma.tipoDano);
      const tagVoador = arma.atingeVoadores ? ' • 🦅 Atinge Voadores' : '';
      const tagMulti = isMultiEfetivo ? ' (Multi: RA puro)' : '';
      const tagCond = arma.condicao ? ` • Condição: ${arma.condicao}` : '';
      const tagEf = arma.efeito ? ` • ${arma.efeito}` : '';
      if (arma.isDuasArmas) {
        setNotaLivre?.(`Multiataque: Precisão ${res.total} ${res.formulaDados} • 1º: ${res.danoGolpe1} (${arma.tipoDano}) • 2º (RA=0): ${res.danoGolpe2} (${arma.tipoDanoSecundario})${tagVoador}`);
      } else {
        setNotaLivre?.(`${arma.nome}: Precisão ${res.total} ${res.formulaDados} • RA ${res.hr}${tagMulti}${tagGolpe}${res.statusCritico ? ` • ${res.statusCritico}` : ''}${tagVoador}${tagCond}${tagEf}`);
      }
    }
  };

  const handleInvocarArcano = async (magia) => {
    const custo = Number(magia.custoPm) || 40, curaReg = Number(magia.curaRegeneracao) || 0;
    setCustoPm?.(custo);
    if (curaReg > 0) setCuraAplicada?.(curaReg);
    const nota = `Invocar Arcano: ${magia.nomeArcano || magia.nome} (${custo} PM) • Sem Teste • ${magia.efeitoInvocacao || magia.descricao || ''}${curaReg > 0 ? ` (Regeneração: +${curaReg} PV)` : ''}`;
    setNotaLivre?.(nota);
    await onExecutarAcao?.({
      acaoCodigo: 'INVOCAR_ARCANO', atorId: combatente.id, alvoId: alvoId || null,
      custoPm: custo, curaAplicada: curaReg, recursoCura: 'pv', notaLivre: nota, marcarTurnoConcluido
    });
  };

  const handleDispensarArcano = async (magia) => {
    const dano = Number(magia.danoTotal) || 0, tipo = magia.tipoDano || 'luz';
    if (dano > 0) { setDanoAplicado?.(dano); setTipoDano?.(tipo); }
    const nota = `Dispensar Arcano: ${magia.nomeArcano || magia.nome} • ${magia.descricao || ''}${magia.circuloArcanoTexto ? ` • ${magia.circuloArcanoTexto}` : ''}`;
    setNotaLivre?.(nota);
    await onExecutarAcao?.({
      acaoCodigo: 'DISPENSAR_ARCANO', atorId: combatente.id, alvoId: alvoId || null,
      danoAplicado: dano, tipoDano: tipo, notaLivre: nota, marcarTurnoConcluido
    });
  };

  const handleRolarMagia = async (magia) => {
    if (magia.isArcano) return handleInvocarArcano(magia);
    if (!onRolarDados) return;
    const custo = Number(magia.custoPm) || 0;
    const res = await onRolarDados({
      combatente, perfil, categoria: 'magia', titulo: `Conjurar: ${magia.nome}`,
      attr1: magia.attr1 || 'ast', attr2: magia.attr2 || 'von',
      bonusTeste: Number(magia.bonusPrecisao) || 0, bonusDano: Number(magia.bonusDano) || 0,
      calcularDano: Boolean(magia.ofensiva), tipoDano: magia.tipoDano || 'magico', custoPm: custo
    });
    if (res) {
      setCustoPm?.(custo);
      if (res.danoTotal !== null) setDanoAplicado?.(res.danoTotal);
      setNotaLivre?.(`${magia.nome}: ${res.total} ${res.formulaDados} • RA ${res.hr}`);
    }
  };

  const handleExecutarRouboDeAlma = async (hab) => {
    if (!alvo) {
      setNotaLivre?.('⚠️ Selecione um alvo para executar Roubo de Alma.');
      return;
    }
    if (alvo.modificadores?.alma_roubada) {
      setNotaLivre?.(`⚠️ A alma de ${alvo.nome} já foi roubada nesta cena!`);
      return;
    }
    const mdefAlvo = Number(alvo.mdef || alvo.defesa_magica) || 10;
    const res = await onRolarDados({
      combatente, perfil, categoria: 'atributo', titulo: `Roubo de Alma (ND ${mdefAlvo})`,
      attr1: 'des', attr2: 'von', bonusTeste: Number(hab.bonusTeste || hab.nivel) || 1, ndAlvo: mdefAlvo
    });
    if (res) {
      const isVilao = Boolean(alvo.tipo_vilao && alvo.tipo_vilao !== 'padrao');
      const tipoAlvo = isVilao ? 'vilao' : (alvo.rank || alvo.patente || alvo.tipo_inimigo || (alvo.acoes_por_turno > 1 ? 'elite' : 'soldado'));
      const resolucao = calcularResolucaoRouboDeAlma({
        nivelHabilidade: hab.nivel || 1, totalRolado: res.total, mdefAlvo, tipoAlvo,
        nivelAlvo: Number(alvo.nivel) || 5, isVilao, jaRoubado: Boolean(alvo.modificadores?.alma_roubada)
      });
      setNotaLivre?.(`👻 ${resolucao.mensagem}`);
      await onExecutarAcao?.({
        acaoCodigo: 'ROUBO_DE_ALMA', atorId: combatente.id, alvoId: alvoId || null,
        piRecuperados: resolucao.piRecuperados, notaLivre: resolucao.mensagem, marcarTurnoConcluido
      });
    }
  };

  const handleAtivarHabilidadeDireta = async (hab) => {
    if (hab.codigo === 'ROUBO_DE_ALMA' && onRolarDados) return handleExecutarRouboDeAlma(hab);
    const custo = Number(hab.custoPm) || 0, custoPi = Number(hab.custoPi) || 0, custoPf = Number(hab.custoPf) || 0;
    setCustoPm?.(custo);
    const tagCusto = [custo > 0 ? `${custo} PM` : null, custoPi > 0 ? `${custoPi} PI` : null, custoPf > 0 ? `${custoPf} PF` : null].filter(Boolean).join(' • ');
    const nota = `Habilidade: ${hab.nome}${hab.nivel ? ` (Nv ${hab.nivel})` : ''}${tagCusto ? ` [${tagCusto}]` : ''} • ${hab.efeito || hab.descricao || ''}`;
    setNotaLivre?.(nota);

    await onExecutarAcao?.({
      acaoCodigo: hab.codigo || 'HABILIDADE', atorId: combatente.id, alvoId: alvoId || null,
      custoPm: custo, custoPi, custoPf,
      curaAplicada: hab.curaAplicada || hab.valorCura || 0,
      danoAplicado: hab.danoAplicado || 0, tipoDano: hab.tipoDano || 'fisico',
      recursoCura: hab.recursoCura || 'pv', perdaPmAlvo: hab.perdaPmAlvo || 0,
      limparCondicoes: Boolean(hab.limparCondicoes), notaLivre: nota,
      marcarTurnoConcluido: hab.isAcaoExtra ? false : (hab.encerraTurno ?? marcarTurnoConcluido)
    });
  };

  const handleSelecionarHabilidade = (hab) => {
    onHabilidadeSelecionada?.(hab);
    const custo = Number(hab.custoPm) || 0;
    if (custo > 0) setCustoPm?.(custo);
    if (hab.curaAplicada || hab.valorCura || hab.perdaPmAlvo) setDanoAplicado?.(0);
    const cod = hab.codigo || '';
    if (cod === 'GOLPE_BAIXO') {
      const conds = Array.isArray(alvo?.condicoes) ? alvo.condicoes : [];
      const bonus = (!multiAlvoAtivo && conds.length > 0)
        ? calcularDanoGolpeBaixo({ nivelGolpeBaixo: hab.nivel, condicoesAlvo: conds, isAlvoUnico: true }) : 0;
      if (bonus > 0) {
        setDanoAplicado?.(bonus);
        setNotaLivre?.(`🗡️ Golpe Baixo (+${bonus} dano contra ${alvo?.nome || 'o alvo'} com ${conds.length} condições)`);
      } else {
        setNotaLivre?.(`🗡️ Golpe Baixo (+${hab.nivel} + Condições): selecione um alvo único com condições ativas.`);
      }
      return;
    }
    if (cod === 'QUEBRA_OSSOS') {
      setDanoAplicado?.(0); setNotaLivre?.(`🦴 Quebra-Ossos (Nv ${hab.nivel}): Dano 0 para aplicar Atordoado, Fraco ou drenar até ${hab.nivel * 10} PM.`); return;
    }
    if (cod === 'TIRO_DE_AVISO') {
      setDanoAplicado?.(0); setNotaLivre?.(`⚠️ Tiro de Aviso (Nv ${hab.nivel || 1}): Dano 0 para aplicar Abalado, Lento ou drenar até ${(hab.nivel || 1) * 10} PM.`); return;
    }
    if (cod === 'BARRAGEM') {
      setCustoPm?.(10); setNotaLivre?.('🎯 Barragem (10 PM): Ataque à distância recebe Multi(2) ou +1 em Multi (máx 3).'); return;
    }
    if (cod === 'OLHOS_DE_AGUIA_DANO' || cod === 'OLHOS_DE_AGUIA') {
      const bonus = hab.bonusDanoProximoAtaque || ((hab.nivel || 1) * 3);
      setDanoAplicado?.(bonus); setNotaLivre?.(`🦅 Olhos de Águia (+${bonus} dano): Mira Concentrada no próximo ataque.`); return;
    }
    if (cod === 'TRESPASSAR') {
      setCustoPm?.(5); setNotaLivre?.(`💥 Trespassar (5 PM): Causa dano normal e ${hab.danoSecundario || 5} de dano físico a outra criatura.`); return;
    }
    if (cod === 'CHUVA_DE_LAMINAS') {
      setCustoPm?.(10); setNotaLivre?.('⚔️ Chuva de Lâminas (10 PM): Ataque corpo a corpo recebe Multi(2) ou +1 em Multi (máx 3).'); return;
    }
    if (cod === 'CORACAO_NO_MOTOR') {
      setCustoPm?.(10); setNotaLivre?.(`⚙️ Coração no Motor (10 PM • Nv ${hab.nivel || 1}): Escolha um preset na área de efeito (+Dano, -Dano Sofrido ou Curar Lento/Fraco).`); return;
    }
    if (cod === 'CONFIGURACAO_FLEXIVEL') {
      setCustoPm?.(0); setNotaLivre?.(`🔧 Configuração Flexível: Troca de até ${hab.nivel || 1} módulo(s) ou arma(s) do veículo pessoal.`); return;
    }
    if (hab.danoAplicado) {
      setDanoAplicado?.(hab.danoAplicado);
      if (hab.tipoDano) setTipoDano?.(hab.tipoDano);
    }
    const tagCusto = [custo > 0 ? `${custo} PM` : null, hab.custoPi > 0 ? `${hab.custoPi} PI` : null, hab.custoPf > 0 ? `${hab.custoPf} PF` : null].filter(Boolean).join(' • ');
    setNotaLivre?.(`Habilidade: ${hab.nome}${tagCusto ? ` (${tagCusto})` : ''} • ${hab.efeito || hab.descricao || ''}`);
  };

  const handleRolarAtaqueCompanheiro = async (atk, comp) => {
    if (!onRolarDados) return;
    const res = await onRolarDados({
      combatente, perfil, categoria: 'arma', titulo: `Companheiro (${comp.nome}): ${atk.nome}`,
      attr1: atk.attr1, attr2: atk.attr2,
      bonusTeste: Number(atk.bonusPrecisao) || 0, bonusDano: Number(atk.bonusDano) || 0,
      calcularDano: true, tipoDano: atk.tipoDano || 'fisico'
    });
    if (res) {
      if (res.danoTotal !== null) setDanoAplicado?.(res.danoTotal);
      if (atk.tipoDano) setTipoDano?.(atk.tipoDano);
      setNotaLivre?.(`${comp.nome} (${atk.nome}): Precisão ${res.total} ${res.formulaDados} • RA ${res.hr}${res.statusCritico ? ` • ${res.statusCritico}` : ''}`);
    }
  };

  const handleUsarFeiticoCompanheiro = async (feit, comp) => {
    const custo = Number(feit.custoPm) || 0;
    const nota = `🐾 Companheiro (${comp.nome}): ${feit.nome} (${custo} PM) • ${feit.descricao || ''}`;
    setNotaLivre?.(nota);
    await onExecutarAcao?.({
      acaoCodigo: 'HABILIDADE', atorId: combatente.id, companheiroId: comp.id,
      custoPmCompanheiro: custo, custoPm: 0,
      danoAplicado: Number(feit.danoTotal) || 0, curaAplicada: Number(feit.curaTotal) || 0,
      alvoId: alvoId || null, notaLivre: nota, marcarTurnoConcluido
    });
  };

  const handleUsarPoderCompanheiro = async (pod, comp) => {
    const custo = Number(pod.custoPm) || 0;
    const nota = `🐾 Poder (${comp.nome}): ${pod.nome}${custo > 0 ? ` (${custo} PM)` : ''} • ${pod.descricao || ''}`;
    setNotaLivre?.(nota);
    await onExecutarAcao?.({
      acaoCodigo: 'HABILIDADE', atorId: combatente.id, companheiroId: comp.id,
      custoPmCompanheiro: custo, custoPm: 0,
      alvoId: alvoId || null, notaLivre: nota, marcarTurnoConcluido
    });
  };

  return {
    handleRolarArma,
    handleRolarMagia,
    handleInvocarArcano,
    handleDispensarArcano,
    handleAtivarHabilidadeDireta,
    handleSelecionarHabilidade,
    handleRolarAtaqueCompanheiro,
    handleUsarFeiticoCompanheiro,
    handleUsarPoderCompanheiro
  };
}
