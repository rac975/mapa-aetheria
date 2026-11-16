import React from 'react';
import { FaTools } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import { VEHICLE_FRAMES } from '../../../../domain/fabula/technoFantasyRules';
import styles from './ExibirPiloto.module.css';

export default function PilotoEstruturaCard({ frameKey, onChangeFrame }) {
  const frameAtual = VEHICLE_FRAMES[frameKey] || VEHICLE_FRAMES.exoesqueleto;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          <FaTools /> Estrutura do Chassi (Frame)
        </span>
        <Badge variant="gold" size="sm">{frameAtual.nome}</Badge>
      </div>

      <div className={styles.frameButtonsRow}>
        {Object.values(VEHICLE_FRAMES).map((f) => (
          <Button
            key={f.key}
            variant={frameKey === f.key ? 'core' : 'ghost'}
            size="sm"
            onClick={() => onChangeFrame(f.key)}
          >
            {f.nome}
          </Button>
        ))}
      </div>

      <div className={styles.frameInfoBox}>
        <strong>{frameAtual.descricao}</strong>
        <div>{frameAtual.regra_especial}</div>
      </div>

      <div className={styles.frameDetailsGrid}>
        <div className={styles.frameDetailItem}>
          <span className={styles.frameDetailLabel}>Porte / Tamanho</span>
          <span className={styles.frameDetailVal}>{frameAtual.tamanho}</span>
        </div>
        <div className={styles.frameDetailItem}>
          <span className={styles.frameDetailLabel}>Slots Base</span>
          <span className={styles.frameDetailVal}>{frameAtual.capacidade_modulos_base} Módulos</span>
        </div>
        <div className={styles.frameDetailItem}>
          <span className={styles.frameDetailLabel}>Armas Máx.</span>
          <span className={styles.frameDetailVal}>Até {frameAtual.max_armas_ativas} Armamento(s)</span>
        </div>
        <div className={styles.frameDetailItem}>
          <span className={styles.frameDetailLabel}>Mod. Iniciativa</span>
          <span className={styles.frameDetailVal}>
            {frameAtual.modificador_iniciativa >= 0 ? `+${frameAtual.modificador_iniciativa}` : frameAtual.modificador_iniciativa}
          </span>
        </div>
      </div>

      <div className={styles.printOnly}>
        <strong>Estrutura:</strong> {frameAtual.nome} ({frameAtual.tamanho}) — {frameAtual.regra_especial}
      </div>
    </div>
  );
}
