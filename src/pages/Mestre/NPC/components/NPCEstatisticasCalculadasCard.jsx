import React from 'react';
import { FaHeart, FaUndo } from 'react-icons/fa';
import { Card, Button } from '../../../../components/ui';
import styles from './NPCEditor.module.css';

export default function NPCEstatisticasCalculadasCard({
  npc,
  minPv,
  minPm,
  minDefesa,
  minDefMagica,
  minIniciativa,
  isCompanheiro,
  nivelNP,
  onChangeCampo
}) {
  const pvMaxAtual = npc.pv_max !== undefined && npc.pv_max !== null ? npc.pv_max : minPv;
  const pmMaxAtual = npc.pm_max !== undefined && npc.pm_max !== null ? npc.pm_max : minPm;
  const pvCustomizado = pvMaxAtual !== minPv;

  return (
    <Card variant="default">
      <div className={styles.sectionHeaderFlex}>
        <div>
          <h3 className={styles.sectionTitle}><FaHeart /> Estatísticas Calculadas</h3>
          <span className={styles.sectionSubtext}>
            {isCompanheiro ? `Precisão & Magia: +${nivelNP}` : 'Ajustadas pelo Nível, Atributos e Patente (Edição Livre)'}
          </span>
        </div>
        {pvCustomizado && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChangeCampo('pv_max', minPv)}
            title={`Restaurar PV calculado pelas regras oficiais (${minPv} PV)`}
          >
            <FaUndo size={10} /> Restaurar Padrão ({minPv} PV)
          </Button>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>
            PV Máx {pvCustomizado ? '(Manual)' : `(Padrão: ${minPv})`}
          </label>
          <input
            type="number"
            min={1}
            className={styles.input}
            value={pvMaxAtual}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                onChangeCampo('pv_max', '');
              } else {
                const parsed = parseInt(val, 10);
                onChangeCampo('pv_max', isNaN(parsed) ? 1 : Math.max(1, parsed));
              }
            }}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <label className={styles.label}>PM Máx (Padrão: {minPm})</label>
          <input
            type="number"
            min={0}
            className={styles.input}
            value={pmMaxAtual}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                onChangeCampo('pm_max', '');
              } else {
                const parsed = parseInt(val, 10);
                onChangeCampo('pm_max', isNaN(parsed) ? 0 : Math.max(0, parsed));
              }
            }}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <label className={styles.label}>Defesa (Padrão: {minDefesa})</label>
          <input
            type="number"
            min={0}
            className={styles.input}
            value={npc.defesa ?? minDefesa}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChangeCampo('defesa', isNaN(val) ? 0 : Math.max(0, val));
            }}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <label className={styles.label}>Def. Mágica (Padrão: {minDefMagica})</label>
          <input
            type="number"
            min={0}
            className={styles.input}
            value={npc.defesa_magica ?? minDefMagica}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChangeCampo('defesa_magica', isNaN(val) ? 0 : Math.max(0, val));
            }}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <label className={styles.label}>Iniciativa (Padrão: {minIniciativa})</label>
          <input
            type="number"
            min={0}
            disabled={isCompanheiro}
            className={`${styles.input} ${isCompanheiro ? styles.inputDisabled : ''}`}
            value={isCompanheiro ? 0 : (npc.iniciativa ?? minIniciativa)}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChangeCampo('iniciativa', isNaN(val) ? 0 : Math.max(0, val));
            }}
          />
        </div>
      </div>
    </Card>
  );
}
