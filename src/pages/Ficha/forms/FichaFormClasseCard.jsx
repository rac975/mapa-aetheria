import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import {
  NIVEL_MAXIMO_CLASSE,
  isClasseDominada,
  validarDistribuicaoHabilidades,
  classeAceitaMagia
} from '../../../domain/fabula/characterProgression';
import {
  ehClasseDancarino,
  extrairBeneficioInicialDancarino
} from '../../../domain/fabula/highFantasyRules';
import {
  ehClasseFloralista,
  ehClasseInvocador,
  extrairBeneficioInicialFloralista,
  extrairBeneficioInicialInvocador
} from '../../../domain/fabula/naturalFantasyRules';
import FichaFormMagiasClasse from './FichaFormMagiasClasse';
import FichaFormBeneficioCard from './FichaFormBeneficioCard';
import FichaFormHabilidadeItem from './FichaFormHabilidadeItem';
import { Button, Badge } from '../../../components/ui';
import { useAlert } from '../../../contexts/useAlert';
import styles from './FichaFormClasses.module.css';

export default function FichaFormClasseCard({
  fichaId,
  classe,
  index,
  formClasses,
  setFormClasses,
  classeCatalogoOficial,
  onAlterarNivelClasse,
  onRemoverClasse
}) {
  const { showAlert } = useAlert();
  const nivelClasse = parseInt(classe.nivel, 10) || 1;
  const statusHab = validarDistribuicaoHabilidades(nivelClasse, classe.habilidades);
  const classeConcluida = isClasseDominada(nivelClasse);
  const aceitaMagia = classeAceitaMagia(classe.nome_classe);
  const ehDancarino = ehClasseDancarino(classe.nome_classe);
  const ehFloralista = ehClasseFloralista(classe.nome_classe);
  const ehInvocador = ehClasseInvocador(classe.nome_classe);
  const infoDancarino = ehDancarino ? extrairBeneficioInicialDancarino(classe) : null;
  const infoFloralista = ehFloralista ? extrairBeneficioInicialFloralista(classe) : null;
  const infoInvocador = ehInvocador ? extrairBeneficioInicialInvocador(classe) : null;

  return (
    <div className={`${styles.classItemCard} ${classeConcluida ? styles.classItemCardDominada : ''}`}>
      <div className={styles.classHeaderGrid}>
        <div className={styles.classNameInputWrapper}>
          <input type="text" readOnly value={classe.nome_classe} className={styles.classNameReadOnly} />
          {classeConcluida && (
            <Badge variant="gold" size="sm" title="Classe Concluída / Dominada">★ Nv. 10</Badge>
          )}
        </div>

        <div className={styles.stepperContainer}>
          <button
            type="button"
            className={styles.stepperBtn}
            onClick={(e) => {
              e.stopPropagation();
              onAlterarNivelClasse(index, nivelClasse - 1);
            }}
            disabled={nivelClasse <= 1}
            aria-label="Diminuir nível da classe"
            title="Diminuir nível da classe"
          >
            <FaMinus size={11} />
          </button>
          <input
            type="number"
            min="1"
            max={NIVEL_MAXIMO_CLASSE}
            placeholder="Nível"
            value={classe.nivel}
            onChange={(e) => onAlterarNivelClasse(index, e.target.value)}
            className={styles.nivelInput}
            aria-label={`Nível da classe ${classe.nome_classe}`}
          />
          <button
            type="button"
            className={styles.stepperBtn}
            onClick={(e) => {
              e.stopPropagation();
              onAlterarNivelClasse(index, nivelClasse + 1);
            }}
            disabled={nivelClasse >= NIVEL_MAXIMO_CLASSE}
            aria-label="Aumentar nível da classe"
            title="Aumentar nível da classe"
          >
            <FaPlus size={11} />
          </button>
        </div>

        <Button type="button" variant="danger" size="sm" onClick={() => onRemoverClasse(index)} title="Remover classe">
          <FaTrash />
        </Button>
      </div>

      <div>
        <FichaFormBeneficioCard
          classe={classe}
          index={index}
          setFormClasses={setFormClasses}
          ehDancarino={ehDancarino}
          ehFloralista={ehFloralista}
          ehInvocador={ehInvocador}
          infoDancarino={infoDancarino}
          infoFloralista={infoFloralista}
          infoInvocador={infoInvocador}
        />
      </div>

      <div className={styles.habilidadesArea}>
        <div className={styles.habilidadesStatusRow}>
          <Badge variant={statusHab.excedeNivel ? 'crise' : (statusHab.incompleto ? 'gold' : 'core')} size="sm">
            Habilidades: {statusHab.pontosGastos} / {statusHab.pontosMaximos}
            {statusHab.excedeNivel && ' ⚠️ Excede o nível!'}
            {statusHab.incompleto && !statusHab.excedeNivel && ' ℹ️ Há pontos livres'}
          </Badge>
        </div>

        {(classe.habilidades || []).map((h, hIndex) => (
          <FichaFormHabilidadeItem
            key={hIndex}
            h={h}
            hIndex={hIndex}
            indexClasse={index}
            fichaId={fichaId}
            formClasses={formClasses}
            setFormClasses={setFormClasses}
            classeCatalogoOficial={classeCatalogoOficial}
            showAlert={showAlert}
          />
        ))}
      </div>

      {aceitaMagia && (
        <FichaFormMagiasClasse
          classeObjeto={classe}
          indexClasse={index}
          formClasses={formClasses}
          setFormClasses={setFormClasses}
        />
      )}
    </div>
  );
}
