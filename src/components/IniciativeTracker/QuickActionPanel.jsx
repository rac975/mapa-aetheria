import { useState, useMemo } from 'react';
import { FaBolt, FaHistory, FaTrash } from 'react-icons/fa';
import { Button, Badge } from '../ui';
import { CONDICOES_DISPONIVEIS } from '../../constants/condicoes';
import {
  ACOES_CONFLITO_OFICIAIS,
  REACOES_COMBATE_OFICIAIS,
  AFINIDADES_DANO
} from '../../domain/fabula/combatRules';
import styles from './QuickActionPanel.module.css';

const TODAS_OPCOES = [
  ...Object.values(ACOES_CONFLITO_OFICIAIS),
  ...Object.values(REACOES_COMBATE_OFICIAIS).map((r) => ({ ...r, isReacao: true }))
];

export default function QuickActionPanel({
  participantes = [],
  relogios = [],
  acoesFeed = [],
  isMestre,
  onExecutarAcao,
  onLimparHistorico
}) {
  const [acaoCodigo, setAcaoCodigo] = useState('ATAQUE');
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
  const relogioSelecionadoId = relogioId || (relogios[0]?.id || '');
  const acaoAtual = TODAS_OPCOES.find((a) => a.codigo === acaoCodigo) || TODAS_OPCOES[0];

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

  return (
    <section className={`${styles.panel} ${styles.noPrint}`}>
      <header className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>
          <FaBolt /> Ações de Conflito & Reações (Tempo Real)
        </h3>
        <Badge variant="ether" size="sm">Sincronizado ao Vivo</Badge>
      </header>

      <div className={styles.actionTabs}>
        {TODAS_OPCOES.map((op) => (
          <button
            key={op.codigo}
            type="button"
            className={`${styles.actionBtn} ${acaoCodigo === op.codigo ? styles.actionBtnActive : ''}`}
            onClick={() => setAcaoCodigo(op.codigo)}
          >
            {op.isReacao ? `⚡ ${op.titulo}` : op.titulo}
          </button>
        ))}
      </div>

      <div className={styles.actionResumo}>
        {acaoAtual.resumo || acaoAtual.efeito}
      </div>

      <form onSubmit={handleDisparar} className={styles.fieldGroup}>
        <div className={styles.formGrid}>
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

          {acaoCodigo === 'OBJETIVO' && relogios.length > 0 && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Relógio Alvo</label>
                <select className={styles.select} value={relogioSelecionadoId} onChange={(e) => setRelogioId(e.target.value)}>
                  {relogios.map((r) => (
                    <option key={r.id} value={r.id}>{r.titulo} ({r.fatias_atuais}/{r.fatias_total})</option>
                  ))}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Seções (+/-)</label>
                <input type="number" className={styles.input} value={avancoRelogio} onChange={(e) => setAvancoRelogio(Number(e.target.value))} />
              </div>
            </>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Dano Bruto</label>
            <input type="number" min="0" className={styles.input} value={danoAplicado} onChange={(e) => setDanoAplicado(Number(e.target.value))} />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Cura PV</label>
            <input type="number" min="0" className={styles.input} value={curaAplicada} onChange={(e) => setCuraAplicada(Number(e.target.value))} />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Custo PM / PI</label>
            <div className={styles.actionTabs}>
              <input type="number" min="0" placeholder="PM" title="Custo PM" className={styles.input} value={custoPm} onChange={(e) => setCustoPm(Number(e.target.value))} />
              <input type="number" min="0" placeholder="PI" title="Custo PI" className={styles.input} value={custoPi} onChange={(e) => setCustoPi(Number(e.target.value))} />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Afinidade / Condição</label>
            <div className={styles.actionTabs}>
              <select className={styles.select} value={afinidadeAlvo} onChange={(e) => setAfinidadeAlvo(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="vulneravel">Vulnerável (×2)</option>
                <option value="resistente">Resistente (÷2)</option>
                <option value="imune">Imune (0)</option>
                <option value="absorve">Absorve</option>
              </select>
              <select className={styles.select} value={condicaoAlvo} onChange={(e) => setCondicaoAlvo(e.target.value)}>
                <option value="">Sem Condição</option>
                {CONDICOES_DISPONIVEIS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.submitRow}>
          <input
            type="text"
            placeholder="Nota tática rápida (ex: Multi 2, Barragem, Estudo ND 13)..."
            className={styles.input}
            value={notaLivre}
            onChange={(e) => setNotaLivre(e.target.value)}
          />
          {!acaoAtual.isReacao && (
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={marcarTurnoConcluido} onChange={(e) => setMarcarTurnoConcluido(e.target.checked)} />
              Concluir turno após ação
            </label>
          )}
          <Button type="submit" variant="primary" size="sm">
            <FaBolt /> Disparar {acaoAtual.titulo}
          </Button>
        </div>
      </form>

      <div className={styles.feedBox}>
        <div className={styles.feedHeader}>
          <span className={styles.feedTitle}><FaHistory /> Log de Combate em Tempo Real</span>
          {isMestre && acoesFeed.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={onLimparHistorico}>
              <FaTrash /> Limpar
            </Button>
          )}
        </div>
        <div className={styles.feedList}>
          {acoesFeed.length === 0 ? (
            <span className={styles.emptyFeed}>Nenhuma ação registrada nesta cena ainda.</span>
          ) : (
            acoesFeed.map((item) => (
              <div key={item.id} className={styles.feedItem}>
                <div className={styles.feedItemHeader}>
                  <span className={styles.feedAutor}>{item.autor_nome}</span>
                  <Badge variant="gold" size="sm">{item.acao_titulo}</Badge>
                </div>
                <div className={styles.feedDetalhes}>{item.detalhes}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
