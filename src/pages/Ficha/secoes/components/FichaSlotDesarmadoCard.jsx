import { FaFistRaised, FaDice } from 'react-icons/fa';
import { GiBrokenBottle } from 'react-icons/gi';
import { Badge, Button } from '../../../../components/ui';
import ResultadoRolagemArma from './ResultadoRolagemArma';
import styles from './FichaSlotMaoVazia.module.css';

export default function FichaSlotDesarmadoCard({
  itemVirtual,
  stats = {},
  tipoArma,
  setTipoArma,
  nvAcromorfose = 0,
  categoriaArma,
  handleMudarCategoria,
  tipoAlcanceImprovisada,
  setTipoAlcanceImprovisada,
  modoAtaque = 'normal',
  setModoAtaque,
  onExecutarRolagem,
  slotId,
  ultimaRolagem
}) {
  return (
    <div className={styles.itemVirtualCard}>
      {/* Identificação da Arma Virtual */}
      <div className={styles.itemInfo}>
        <div className={styles.itemNomeRow}>
          <span className={styles.itemNome}>{itemVirtual.nome}</span>
          <div className={styles.badgesRow}>
            <Badge variant="gold" size="sm">{stats.categoria}</Badge>
            <Badge variant="default" size="sm">
              {stats.alcance === 'distancia' ? 'À Distância' : 'Corpo a Corpo'}
            </Badge>
            <Badge variant="default" size="sm">
              {stats.tipo_dano?.toUpperCase() || 'FÍSICO'}
            </Badge>
            {stats.multiplo && (
              <Badge variant="ether" size="sm">Múltiplo ({stats.multiplo})</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Toggle integrado tipo arma */}
      <div className={styles.toggleTipoArma}>
        <button
          type="button"
          onClick={() => setTipoArma('desarmado')}
          className={`${styles.toggleBtn} ${tipoArma === 'desarmado' ? styles.toggleBtnActive : ''}`}
        >
          <FaFistRaised /> Ataque Desarmado
        </button>
        <button
          type="button"
          onClick={() => setTipoArma('improvisada')}
          className={`${styles.toggleBtn} ${tipoArma === 'improvisada' ? styles.toggleBtnActive : ''}`}
        >
          <GiBrokenBottle /> Arma Improvisada
        </button>
      </div>

      {/* Opção contextual: Acromorfose */}
      {tipoArma === 'desarmado' && nvAcromorfose > 0 && (
        <div className={styles.acroCategoriaRow}>
          <span className={styles.acroLabel}>Acromorfose:</span>
          <select
            value={categoriaArma}
            onChange={(e) => handleMudarCategoria(e.target.value)}
            className={styles.acroSelect}
          >
            <option value="Armas de Luta">Armas de Luta (Brawling)</option>
            <option value="Armas Brancas / Espadas">Armas Brancas / Espadas</option>
            <option value="Armas Pesadas">Armas Pesadas (Heavy)</option>
            <option value="Adagas">Adagas (Daggers)</option>
            <option value="Arcos">Arcos (Distância)</option>
            <option value="Armas de Fogo">Armas de Fogo (Distância)</option>
            <option value="Armas de Arremesso">Armas de Arremesso (Distância)</option>
          </select>
        </div>
      )}

      {/* Opção contextual: Arma Improvisada */}
      {tipoArma === 'improvisada' && (
        <div className={styles.acroCategoriaRow}>
          <span className={styles.acroLabel}>Uso:</span>
          <select
            value={tipoAlcanceImprovisada}
            onChange={(e) => setTipoAlcanceImprovisada(e.target.value)}
            className={styles.acroSelect}
          >
            <option value="corpo_a_corpo">Corpo a Corpo (DES + VIG | RA + 2 Físico)</option>
            <option value="distancia">Arremesso à Distância (DES + VIG | RA + 2 Físico)</option>
          </select>
        </div>
      )}

      {/* Resumo de Fórmulas */}
      <div className={styles.formulaBox}>
        <div className={styles.formulaLinha}>
          <span>Precisão:</span>
          <strong className={styles.formulaValor}>{stats.precisao}</strong>
        </div>
        <div className={styles.formulaLinha}>
          <span>Dano:</span>
          <strong className={styles.formulaValor}>{stats.dano} [{stats.tipo_dano}]</strong>
        </div>
        {stats.qualidade && (
          <div className={styles.qualidadeTexto}>{stats.qualidade}</div>
        )}
      </div>

      {/* Área de Ataque e Rolagem */}
      <div className={styles.ataqueArea}>
        <div className={styles.modoAtaqueSwitcher}>
          <button
            type="button"
            onClick={() => setModoAtaque('normal')}
            className={`${styles.modoAtaqueBtn} ${modoAtaque === 'normal' ? styles.modoAtaqueBtnActive : ''}`}
          >
            Ataque Único
          </button>
          <button
            type="button"
            onClick={() => setModoAtaque('multi')}
            className={`${styles.modoAtaqueBtn} ${modoAtaque === 'multi' ? styles.modoAtaqueBtnActiveMulti : ''}`}
          >
            Multiataque / 2ª Arma
          </button>
        </div>

        <Button type="button" variant="core" size="sm" fullWidth onClick={() => onExecutarRolagem(itemVirtual, slotId)}>
          <FaDice /> Rolar Ataque e Dano
        </Button>

        <ResultadoRolagemArma ultimaRolagem={ultimaRolagem} />
      </div>
    </div>
  );
}
