import { useState, useMemo } from 'react';
import {
  FaBolt, FaCrosshairs, FaShieldAlt, FaSlidersH, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { Button, Badge } from '../ui';
import { CONDICOES_DISPONIVEIS } from '../../constants/condicoes';
import {
  ACOES_CONFLITO_OFICIAIS,
  REACOES_COMBATE_OFICIAIS,
  MANOBRAS_TATICAS_OFICIAIS,
  AFINIDADES_DANO,
  calcularProgressoRelogioPorTeste
} from '../../domain/fabula/combatRules';
import QuickDiceStrip from './QuickDiceStrip';
import ActionFeedPanel from './ActionFeedPanel';
import styles from './QuickActionPanel.module.css';

const CATEGORIAS_ACOES = [
  {
    id: 'principais',
    label: 'Ações Principais',
    icon: <FaCrosshairs />,
    opcoes: Object.values(ACOES_CONFLITO_OFICIAIS).map((a) => ({ ...a, categoriaTab: 'principais', isReacao: false }))
  },
  {
    id: 'reacoes',
    label: 'Reações',
    icon: <FaBolt />,
    opcoes: Object.values(REACOES_COMBATE_OFICIAIS).map((r) => ({ ...r, categoriaTab: 'reacoes', isReacao: true }))
  },
  {
    id: 'manobras',
    label: 'Manobras',
    icon: <FaShieldAlt />,
    opcoes: Object.values(MANOBRAS_TATICAS_OFICIAIS).map((m) => ({ ...m, categoriaTab: 'manobras', isReacao: false }))
  }
];

const TODAS_OPCOES = CATEGORIAS_ACOES.flatMap((c) => c.opcoes);

export default function QuickActionPanel({
  participantes = [],
  relogios = [],
  acoesFeed = [],
  isMestre,
  obterPerfilRolagem,
  onRolarDados,
  onExecutarAcao,
  onLimparHistorico
}) {
  const [abaAtiva, setAbaAtiva] = useState('principais');
  const [acaoCodigo, setAcaoCodigo] = useState('ATAQUE');
  const [mostrarAvancado, setMostrarAvancado] = useState(false);
  const [painelRecolhido, setPainelRecolhido] = useState(false);

  const [atorIdInput, setAtorIdInput] = useState('');
  const [alvoId, setAlvoId] = useState('');
  const [relogioId, setRelogioId] = useState('');
  const [custoPm, setCustoPm] = useState(0);
  const [custoPi, setCustoPi] = useState(0);
  const [danoAplicado, setDanoAplicado] = useState(0);
  const [curaAplicada, setCuraAplicada] = useState(0);
  const [afinidadeAlvo, setAfinidadeAlvo] = useState(AFINIDADES_DANO.NORMAL);
  const [condicaoAlvo, setCondicaoAlvo] = useState('');
  const [avancoRelogio, setAvancoRelogio] = useState(1);
  const [notaLivre, setNotaLivre] = useState('');
  const [marcarTurnoConcluido, setMarcarTurnoConcluido] = useState(true);

  const atorAtivoPadrao = useMemo(() => {
    const noTurno = participantes.find((p) => p.turno_atual && Number(p.hp_atual) > 0);
    return noTurno?.id || participantes.find((p) => Number(p.hp_atual) > 0)?.id || '';
  }, [participantes]);

  const atorSelecionadoId = atorIdInput || atorAtivoPadrao;
  const atorSelecionado = useMemo(
    () => participantes.find((p) => String(p.id) === String(atorSelecionadoId)) || null,
    [participantes, atorSelecionadoId]
  );
  const perfilAtor = useMemo(
    () => (atorSelecionado && obterPerfilRolagem ? obterPerfilRolagem(atorSelecionado) : null),
    [atorSelecionado, obterPerfilRolagem]
  );

  const relogioSelecionadoId = relogioId || (relogios[0]?.id || '');
  const categoriaAtual = CATEGORIAS_ACOES.find((c) => c.id === abaAtiva) || CATEGORIAS_ACOES[0];
  const acaoAtual = TODAS_OPCOES.find((a) => a.codigo === acaoCodigo) || TODAS_OPCOES[0];

  const handleTrocarAba = (novaAbaId) => {
    setAbaAtiva(novaAbaId);
    const cat = CATEGORIAS_ACOES.find((c) => c.id === novaAbaId);
    if (cat && cat.opcoes.length > 0) setAcaoCodigo(cat.opcoes[0].codigo);
  };

  const handleRolarArma = async (arma) => {
    if (!onRolarDados || !atorSelecionado) return;
    const semDano = acaoCodigo === 'TIRO_AVISO_QUEBRA_OSSOS';
    const res = await onRolarDados({
      combatente: atorSelecionado,
      perfil: perfilAtor,
      categoria: 'arma',
      titulo: `${acaoAtual.titulo}: ${arma.nome}`,
      attr1: arma.attr1,
      attr2: arma.attr2,
      bonusTeste: Number(arma.bonusPrecisao) || 0,
      bonusDano: Number(arma.bonusDano) || 0,
      calcularDano: !semDano,
      isMulti: acaoCodigo === 'MULTI_ATAQUE',
      zerarHr: acaoCodigo === 'CONTRA_ATAQUE' || acaoCodigo === 'DUAS_ARMAS',
      tipoDano: arma.tipoDano || 'fisico'
    });
    if (res) {
      if (!semDano && res.danoTotal !== null) setDanoAplicado(res.danoTotal);
      setNotaLivre(`${arma.nome}: Precisão ${res.total} ${res.formulaDados} • RA ${res.hr}${res.statusCritico ? ` • ${res.statusCritico}` : ''}`);
    }
  };

  const handleRolarMagia = async (magia) => {
    if (!onRolarDados || !atorSelecionado) return;
    const res = await onRolarDados({
      combatente: atorSelecionado,
      perfil: perfilAtor,
      categoria: 'magia',
      titulo: `Conjurar: ${magia.nome}`,
      attr1: magia.attr1 || 'ast',
      attr2: magia.attr2 || 'von',
      bonusTeste: Number(magia.bonusPrecisao) || 0,
      bonusDano: Number(magia.bonusDano) || 0,
      calcularDano: Boolean(magia.ofensiva),
      tipoDano: 'magico',
      custoPm: Number(magia.custoPm) || 0
    });
    if (res) {
      setCustoPm(Number(magia.custoPm) || 0);
      if (res.danoTotal !== null) setDanoAplicado(res.danoTotal);
      setNotaLivre(`${magia.nome}: Magia ${res.total} ${res.formulaDados} • RA ${res.hr}`);
    }
  };

  const handleRolarTeste = async (attr1, attr2) => {
    if (!onRolarDados || !atorSelecionado) return;
    const res = await onRolarDados({
      combatente: atorSelecionado,
      perfil: perfilAtor,
      categoria: 'atributo',
      titulo: `Teste (${acaoAtual.titulo})`,
      attr1,
      attr2,
      isOposto: acaoCodigo === 'IMPEDIMENTO',
      ndAlvo: acaoCodigo === 'ESTUDO' || acaoCodigo === 'OBJETIVO' ? 10 : null,
      calcularDano: false
    });
    if (res) {
      if (acaoCodigo === 'OBJETIVO') {
        const prog = calcularProgressoRelogioPorTeste({
          resultadoTeste: res.total,
          nivelDificuldade: 10,
          isCritico: res.isCritico,
          isFalhaCritica: res.isFumble
        });
        setAvancoRelogio(prog.secoesAvancadas);
      }
      setNotaLivre(`Teste ${res.total} ${res.formulaDados}${res.statusCritico ? ` • ${res.statusCritico}` : ''}`);
    }
  };

  const handleDisparar = async (e) => {
    e.preventDefault();
    if (!atorSelecionadoId) return;

    const ok = await onExecutarAcao({
      acaoCodigo,
      atorId: atorSelecionadoId,
      alvoId: alvoId || null,
      relogioId: acaoCodigo === 'OBJETIVO' ? relogioSelecionadoId : null,
      custoPm,
      custoPi,
      danoAplicado,
      curaAplicada,
      afinidadeAlvo,
      condicaoAlvo: condicaoAlvo || null,
      avancoRelogio: acaoCodigo === 'OBJETIVO' ? avancoRelogio : 0,
      notaLivre,
      marcarTurnoConcluido: !acaoAtual.isReacao && marcarTurnoConcluido
    });

    if (ok) {
      setDanoAplicado(0);
      setCuraAplicada(0);
      setCustoPm(0);
      setCustoPi(0);
      setCondicaoAlvo('');
      setNotaLivre('');
    }
  };

  if (participantes.length === 0) return null;

  const temModAvancado = custoPm > 0 || custoPi > 0 || afinidadeAlvo !== 'normal' || Boolean(condicaoAlvo);
  const podeExibirDadosAtor = isMestre || atorSelecionado?.tipo === 'heroi';

  return (
    <div className={`${styles.tacticalGrid} ${styles.noPrint}`}>
      <section className={styles.actionCard}>
        <header className={styles.panelHeader} onClick={() => setPainelRecolhido((v) => !v)}>
          <div className={styles.headerTitleWrap}>
            <h3 className={styles.panelTitle}><FaBolt /> Central de Ações & Rolagens</h3>
            <Badge variant="gold" size="sm">{acaoAtual.titulo}</Badge>
          </div>
          <button
            type="button"
            className={styles.collapseToggleBtn}
            title={painelRecolhido ? 'Expandir painel de ações' : 'Recolher painel de ações'}
          >
            {painelRecolhido ? <FaChevronDown /> : <FaChevronUp />}
          </button>
        </header>

        {!painelRecolhido && (
          <div className={styles.panelBody}>
            <div className={styles.categoryTabs} role="tablist">
              {CATEGORIAS_ACOES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={abaAtiva === cat.id}
                  className={`${styles.categoryTabBtn} ${abaAtiva === cat.id ? styles.categoryTabActive : ''}`}
                  onClick={() => handleTrocarAba(cat.id)}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  <span className={styles.categoryCount}>{cat.opcoes.length}</span>
                </button>
              ))}
            </div>

            <div className={styles.actionChipsRow}>
              {categoriaAtual.opcoes.map((op) => (
                <button
                  key={op.codigo}
                  type="button"
                  className={`${styles.actionChip} ${acaoCodigo === op.codigo ? styles.actionChipActive : ''}`}
                  onClick={() => setAcaoCodigo(op.codigo)}
                >
                  {op.titulo}
                </button>
              ))}
            </div>

            {podeExibirDadosAtor && (
              <QuickDiceStrip
                atorSelecionado={atorSelecionado}
                perfilAtor={perfilAtor}
                acaoCodigo={acaoCodigo}
                onRolarArma={handleRolarArma}
                onRolarMagia={handleRolarMagia}
                onRolarTeste={handleRolarTeste}
              />
            )}

            <form onSubmit={handleDisparar} className={styles.actionForm}>
              <div className={styles.formPrimaryGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Quem Age</label>
                  <select className={styles.select} value={atorSelecionadoId} onChange={(e) => setAtorIdInput(e.target.value)}>
                    {participantes.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome} ({p.tipo === 'heroi' ? 'Herói' : 'NPC'})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Alvo / Aliado</label>
                  <select className={styles.select} value={alvoId} onChange={(e) => setAlvoId(e.target.value)}>
                    <option value="">-- Sem Alvo --</option>
                    {participantes.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Dano Bruto</label>
                  <input type="number" min="0" className={styles.input} value={danoAplicado} onChange={(e) => setDanoAplicado(Number(e.target.value))} />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Cura PV</label>
                  <input type="number" min="0" className={styles.input} value={curaAplicada} onChange={(e) => setCuraAplicada(Number(e.target.value))} />
                </div>
              </div>

              {acaoCodigo === 'OBJETIVO' && relogios.length > 0 && (
                <div className={styles.clockTargetRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Relógio Alvo</label>
                    <select className={styles.select} value={relogioSelecionadoId} onChange={(e) => setRelogioId(e.target.value)}>
                      {relogios.map((r) => (
                        <option key={r.id} value={r.id}>{r.titulo} ({r.fatias_atuais}/{r.fatias_total})</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.fieldGroupSmall}>
                    <label className={styles.fieldLabel}>Seções (+/-)</label>
                    <input type="number" className={styles.input} value={avancoRelogio} onChange={(e) => setAvancoRelogio(Number(e.target.value))} />
                  </div>
                </div>
              )}

              <div className={styles.advancedToggleBar}>
                <button
                  type="button"
                  className={`${styles.advancedToggleBtn} ${mostrarAvancado || temModAvancado ? styles.advancedToggleActive : ''}`}
                  onClick={() => setMostrarAvancado((v) => !v)}
                >
                  <FaSlidersH />
                  <span>Custos (PM/PI), Afinidade & Condição</span>
                  {temModAvancado && <Badge variant="ether" size="sm">Ativo</Badge>}
                </button>
              </div>

              {mostrarAvancado && (
                <div className={styles.advancedGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Custo PM</label>
                    <input type="number" min="0" className={styles.input} value={custoPm} onChange={(e) => setCustoPm(Number(e.target.value))} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Custo PI</label>
                    <input type="number" min="0" className={styles.input} value={custoPi} onChange={(e) => setCustoPi(Number(e.target.value))} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Afinidade do Alvo</label>
                    <select className={styles.select} value={afinidadeAlvo} onChange={(e) => setAfinidadeAlvo(e.target.value)}>
                      <option value="normal">Normal (×1)</option>
                      <option value="vulneravel">Vulnerável (×2)</option>
                      <option value="resistente">Resistente (÷2)</option>
                      <option value="imune">Imune (0)</option>
                      <option value="absorve">Absorve (Cura)</option>
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Aplicar Condição</label>
                    <select className={styles.select} value={condicaoAlvo} onChange={(e) => setCondicaoAlvo(e.target.value)}>
                      <option value="">Nenhuma</option>
                      {CONDICOES_DISPONIVEIS.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className={styles.submitRow}>
                <input
                  type="text"
                  placeholder="Nota tática ou resumo da rolagem..."
                  className={styles.noteInput}
                  value={notaLivre}
                  onChange={(e) => setNotaLivre(e.target.value)}
                />
                <div className={styles.submitActions}>
                  {!acaoAtual.isReacao && (
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={marcarTurnoConcluido} onChange={(e) => setMarcarTurnoConcluido(e.target.checked)} />
                      <span>Concluir turno</span>
                    </label>
                  )}
                  <Button type="submit" variant="primary" size="sm">
                    <FaBolt /> Disparar {acaoAtual.titulo}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </section>

      <ActionFeedPanel
        acoesFeed={acoesFeed}
        isMestre={isMestre}
        onLimparHistorico={onLimparHistorico}
      />
    </div>
  );
}
