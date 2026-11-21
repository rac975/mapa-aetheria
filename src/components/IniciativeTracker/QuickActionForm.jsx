import { FaBolt, FaSlidersH, FaExclamationCircle } from 'react-icons/fa';
import { Button, Badge } from '../ui';
import { CONDICOES_DISPONIVEIS } from '../../constants/condicoes';
import styles from './QuickActionPanel.module.css';

export default function QuickActionForm({
  acaoAtual, acaoCodigo, atorSelecionadoId, setAtorIdInput,
  participantes, alvoId, setAlvoId, relogios, relogioSelecionadoId, setRelogioId,
  formState, formSetters, handleDisparar, isMestre, meuHeroi
}) {
  const {
    danoAplicado, curaAplicada, custoPm, custoPi, afinidadeAlvo, condicaoAlvo,
    avancoRelogio, notaLivre, marcarTurnoConcluido, mostrarAvancado, temModAvancado
  } = formState;
  const {
    setDanoAplicado, setCuraAplicada, setCustoPm, setCustoPi, setAfinidadeAlvo,
    setCondicaoAlvo, setAvancoRelogio, setNotaLivre, setMarcarTurnoConcluido, setMostrarAvancado
  } = formSetters;

  const podeSubmeter = isMestre || Boolean(meuHeroi);

  return (
    <form onSubmit={handleDisparar} className={styles.actionForm}>
      {!isMestre && !meuHeroi && (
        <div className={styles.playerWarningBanner}>
          <FaExclamationCircle />
          <span>Seu personagem não está na ordem de iniciativa. Aguarde o Mestre incluí-lo.</span>
        </div>
      )}

      <div className={styles.formPrimaryGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Quem Age</label>
          {isMestre ? (
            <select className={styles.select} value={atorSelecionadoId} onChange={(e) => setAtorIdInput(e.target.value)}>
              {participantes.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} ({p.tipo === 'heroi' ? 'Herói' : 'NPC'})</option>
              ))}
            </select>
          ) : (
            <div className={styles.lockedActorDisplay}>
              <span className={styles.lockedActorName}>
                {meuHeroi ? `★ ${meuHeroi.nome}` : 'Aguardando vínculo'}
              </span>
            </div>
          )}
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
          <Button type="submit" variant="primary" size="sm" disabled={!podeSubmeter}>
            <FaBolt /> Disparar {acaoAtual.titulo}
          </Button>
        </div>
      </div>
    </form>
  );
}
