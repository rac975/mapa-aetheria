import { FaPlus, FaMinus } from 'react-icons/fa';
import { ResourceBar, Button } from '../../../components/ui';
import styles from './FichaRecursosSecao.module.css';

export default function FichaRecursos({ ficha, statusFicha, handleAjustarRecurso }) {
  if (!ficha) return null;

  // Tetos calculados com fallbacks seguros
  const hpMaxCalculado = statusFicha?.pvMax || ficha.hp_max || ficha.pv_max || 30;
  const mpMaxCalculado = statusFicha?.mpMax || ficha.mp_max || ficha.pm_max || 30;
  const piMaxCalculado = statusFicha?.piMax || ficha.ip_max || ficha.pi_max || 6;

  // Valores atuais respeitando limites
  const hpAtualSeguro = Math.min(Math.max(ficha.hp_atual ?? hpMaxCalculado, 0), hpMaxCalculado);
  const mpAtualSeguro = Math.min(Math.max(ficha.mp_atual ?? mpMaxCalculado, 0), mpMaxCalculado);
  const piAtualSeguro = Math.min(Math.max(ficha.ip_atual ?? ficha.pi_atual ?? piMaxCalculado, 0), piMaxCalculado);

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

      {/* 3. PONTOS DE INVENTÁRIO (PI) */}
      <div className={styles.resourceCard}>
        <ResourceBar
          type="pi"
          current={piAtualSeguro}
          max={piMaxCalculado}
          label="Pontos de Inventário (PI)"
          showValues={true}
        />
        <div className={styles.cardControls}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('ip_atual', -1)}
            title="Usar -1 PI"
          >
            <FaMinus />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className={styles.adjustBtn}
            onClick={() => handleAjustarRecurso('ip_atual', 1)}
            title="Recuperar +1 PI"
          >
            <FaPlus />
          </Button>
        </div>
      </div>
    </div>
  );
}
