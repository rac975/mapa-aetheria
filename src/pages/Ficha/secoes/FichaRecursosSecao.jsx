import { FaPlus, FaMinus } from 'react-icons/fa';
import { ResourceBar, Button } from '../../../components/ui';
import styles from './FichaRecursosSecao.module.css';

export default function FichaRecursos({ ficha, statusFicha, handleAjustarRecurso }) {
  if (!ficha) return null;

  // Tetos calculados com fallbacks seguros
  const hpMaxCalculado = statusFicha?.pvMax || ficha.hp_max || ficha.pv_max || 30;
  const mpMaxCalculado = statusFicha?.mpMax || ficha.mp_max || ficha.pm_max || 30;

  // Valores atuais respeitando limites (e Dosagem Precisa até 150% do máximo)
  const permiteDosagem = Boolean(statusFicha?.naturalFantasy?.temDosagemPrecisa);
  const tetoPvEfetivo = permiteDosagem ? Math.floor(hpMaxCalculado * 1.5) : hpMaxCalculado;
  const tetoPmEfetivo = permiteDosagem ? Math.floor(mpMaxCalculado * 1.5) : mpMaxCalculado;
  const hpAtualSeguro = Math.min(Math.max(ficha.hp_atual ?? hpMaxCalculado, 0), Math.max(tetoPvEfetivo, Number(ficha.hp_atual || 0)));
  const mpAtualSeguro = Math.min(Math.max(ficha.mp_atual ?? mpMaxCalculado, 0), Math.max(tetoPmEfetivo, Number(ficha.mp_atual || 0)));
  const expAtualSeguro = Math.min(Math.max(Number(ficha.exp ?? 0), 0), 10);

  const emCrise = hpAtualSeguro <= Math.floor(hpMaxCalculado / 2);

  return (
    <div className={styles.container}>
      {/* 1. PONTOS DE VIDA (PV) COM ALERTA AUTOMÁTICO DE CRISE */}
      <div className={`${styles.resourceCard} ${emCrise ? styles.resourceCardCrise : ''}`}>
        <ResourceBar
          type="pv"
          current={hpAtualSeguro}
          max={hpMaxCalculado}
          label="Pontos de Vida (PV)"
          showValues={true}
          isCrise={emCrise}
        />
        <div className={styles.cardControls}>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('hp_atual', -5)}
            title="Dano -5"
          >
            -5
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('hp_atual', -1)}
            title="Dano -1"
          >
            <FaMinus />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('hp_atual', 1)}
            title="Cura +1"
          >
            <FaPlus />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('hp_atual', 5)}
            title="Cura +5"
          >
            +5
          </Button>
        </div>
      </div>

      {/* 2. PONTOS DE MAGIA (PM) */}
      <div className={styles.resourceCard}>
        <ResourceBar
          type="pm"
          current={mpAtualSeguro}
          max={mpMaxCalculado}
          label="Pontos de Magia (PM)"
          showValues={true}
        />
        <div className={styles.cardControls}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('mp_atual', -5)}
            title="Gastar -5 MP"
          >
            -5
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('mp_atual', -1)}
            title="Gastar -1 MP"
          >
            <FaMinus />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('mp_atual', 1)}
            title="Recuperar +1 MP"
          >
            <FaPlus />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('mp_atual', 5)}
            title="Recuperar +5 MP"
          >
            +5
          </Button>
        </div>
      </div>

      {/* 3. EXPERIÊNCIA (XP) - BARRA DE 10 PONTOS / SEGMENTOS */}
      <div className={styles.resourceCard}>
        <ResourceBar
          type="exp"
          current={expAtualSeguro}
          max={10}
          segments={10}
          label="Experiência (XP)"
          showValues={true}
        />
        <div className={styles.cardControls}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('exp', -1)}
            disabled={expAtualSeguro <= 0}
            title="Reduzir -1 XP"
          >
            <FaMinus />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('exp', 1)}
            disabled={expAtualSeguro >= 10}
            title="Adicionar +1 XP"
          >
            <FaPlus />
          </Button>
        </div>
      </div>
    </div>
  );
}
