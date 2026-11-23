import { FaEdit, FaTrash } from 'react-icons/fa';
import {
  inferirAlcanceFeitico,
  inferirAlvoFeitico,
  inferirBonusDanoFeitico,
  inferirCondicaoFeitico,
  formatarBadgeAlcance,
  formatarBadgeAlvo,
  formatarBadgeCondicao
} from '../../../../domain/fabula/chimeristRules';
import { Badge } from '../../../../components/ui';
import styles from './ExibirQuimerista.module.css';

export default function QuimeristaSpellCard({
  magia,
  index,
  onEditar,
  onRemover
}) {
  const alcanceInfo = formatarBadgeAlcance(inferirAlcanceFeitico(magia));
  const alvoInfo = formatarBadgeAlvo(inferirAlvoFeitico(magia));
  const bonusDano = inferirBonusDanoFeitico(magia);
  const condicaoInfo = formatarBadgeCondicao(inferirCondicaoFeitico(magia));
  const custoMp = magia.custo_mp || magia.custo_pm || magia.custo;

  return (
    <div className={styles.spellCard}>
      <div className={styles.spellHeader}>
        <div className={styles.spellHeaderInfo}>
          <strong className={styles.spellName}>{magia.nome}</strong>
          <span className={styles.spellMp} title="Custo de Pontos de Mana">
            {custoMp ? `${custoMp} PM` : 'Sem Custo'}
          </span>
          <span className={styles.spellSpecies} title={`Espécie: ${magia.especie}`}>
            [{magia.especie || 'monstro'}]
          </span>
        </div>

        <div className={styles.spellActions}>
          <button
            type="button"
            onClick={() => onEditar?.(magia, index)}
            className={styles.editBtn}
            title={`Editar feitiço ${magia.nome}`}
            aria-label={`Editar feitiço ${magia.nome}`}
          >
            <FaEdit size={12} />
          </button>
          <button
            type="button"
            onClick={() => onRemover?.(index)}
            className={styles.deleteBtn}
            title={`Esquecer feitiço ${magia.nome}`}
            aria-label={`Esquecer feitiço ${magia.nome}`}
          >
            <FaTrash size={11} />
          </button>
        </div>
      </div>

      <div className={styles.spellTacticalBadges}>
        <Badge variant="core" size="sm" title="Alcance tático de conjuração">
          {alcanceInfo.icone} {alcanceInfo.label}
        </Badge>
        <Badge variant="gold" size="sm" title="Modo de seleção de alvos">
          {alvoInfo.icone} {alvoInfo.label}
        </Badge>
        {bonusDano > 0 && (
          <Badge variant="warning" size="sm" title={`Bônus adicional de +${bonusDano} no dano`}>
            💥 +{bonusDano} Dano
          </Badge>
        )}
        {condicaoInfo && (
          <Badge variant="danger" size="sm" title={`Aplica a condição ${condicaoInfo.label}`}>
            {condicaoInfo.icone} {condicaoInfo.label}
          </Badge>
        )}
      </div>

      {magia.descricao && (
        <div className={styles.spellDesc}>{magia.descricao}</div>
      )}
    </div>
  );
}
