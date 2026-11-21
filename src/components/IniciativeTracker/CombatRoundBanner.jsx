import { FaRedo, FaCheckCircle, FaHourglassEnd } from 'react-icons/fa';
import { Button } from '../ui';
import styles from './CombatRoundBanner.module.css';

export default function CombatRoundBanner({
  rodada = 1,
  isMestre,
  pendentesTurno = 0,
  totalVivos = 0,
  onResetRodada
}) {
  const todosConcluidos = totalVivos > 0 && pendentesTurno === 0;
  if (!todosConcluidos) return null;

  return (
    <div className={styles.roundBanner} role="status" aria-live="polite">
      <div className={styles.bannerInfo}>
        <FaCheckCircle className={styles.bannerIcon} />
        <div className={styles.bannerText}>
          <span className={styles.bannerTitle}>
            Fim da Rodada {rodada}
          </span>
          <span className={styles.bannerSubtext}>
            {isMestre
              ? 'Todos os combatentes ativos concluíram suas ações nesta rodada.'
              : 'Você e seus aliados/adversários agiram. Aguardando o Mestre avançar a rodada.'}
          </span>
        </div>
      </div>

      {isMestre && onResetRodada && (
        <Button
          type="button"
          variant="primary"
          size="md"
          className={styles.btnNextRound}
          onClick={onResetRodada}
          title={`Iniciar Rodada ${rodada + 1} e recuperar turnos`}
        >
          <FaRedo /> Iniciar Rodada {rodada + 1}
        </Button>
      )}

      {!isMestre && (
        <span className={styles.bannerSubtext}>
          <FaHourglassEnd /> Aguardando Mestre...
        </span>
      )}
    </div>
  );
}
