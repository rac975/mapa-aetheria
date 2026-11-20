import { FaTrash, FaPaw } from 'react-icons/fa';
import {
  NIVEL_MAXIMO_CLASSE,
  NIVEL_MAXIMO_HABILIDADE_PADRAO,
  isClasseDominada,
  validarDistribuicaoHabilidades,
  classeAceitaMagia
} from '../../../domain/fabula/characterProgression';
import {
  ehClasseDancarino,
  extrairBeneficioInicialDancarino,
  gerarTextoBeneficioDancarino
} from '../../../domain/fabula/highFantasyRules';
import {
  ehClasseFloralista,
  ehClasseInvocador,
  extrairBeneficioInicialFloralista,
  extrairBeneficioInicialInvocador,
  gerarTextoBeneficioPvOuPm
} from '../../../domain/fabula/naturalFantasyRules';
import CompanheiroFielCard from '../components/Andarilho/CompanheiroFielCard';
import ExibirEngenhocas from '../components/Inventor/ExibirEngenhocas';
import VincularArcanoCard from '../components/Arcanista/VincularArcanoCard';
import FichaFormMagiasClasse from './FichaFormMagiasClasse';
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

  const handleAlterarBeneficioDancarino = (escolha) => {
    const atual = [...formClasses];
    const novosDados = { ...(atual[index].dados_dancarino || {}), beneficioInicial: escolha };
    atual[index] = {
      ...atual[index],
      beneficios: gerarTextoBeneficioDancarino(escolha),
      dados_dancarino: novosDados,
      habilidades: (atual[index].habilidades || []).map((h) =>
        (h.nome || '').toLowerCase().startsWith('danc') || (h.nome || '').toLowerCase().startsWith('danç')
          ? { ...h, dados_dancarino: { ...(h.dados_dancarino || {}), ...novosDados } } : h
      )
    };
    setFormClasses(atual);
  };

  const handleAlterarBeneficioNatural = (escolha, dadosProp, habTermo) => {
    const atual = [...formClasses];
    const novosDados = { ...(atual[index][dadosProp] || {}), beneficioInicial: escolha };
    atual[index] = {
      ...atual[index],
      beneficios: gerarTextoBeneficioPvOuPm(escolha),
      [dadosProp]: novosDados,
      habilidades: (atual[index].habilidades || []).map((h) =>
        (h.nome || '').toLowerCase().includes(habTermo)
          ? { ...h, [dadosProp]: { ...(h[dadosProp] || {}), ...novosDados } } : h
      )
    };
    setFormClasses(atual);
  };

  return (
    <div className={`${styles.classItemCard} ${classeConcluida ? styles.classItemCardDominada : ''}`}>
      <div className={styles.classHeaderGrid}>
        <div className={styles.classNameInputWrapper}>
          <input type="text" readOnly value={classe.nome_classe} className={styles.classNameReadOnly} />
          {classeConcluida && (
            <Badge variant="gold" size="sm" title="Classe Concluída / Dominada">★ Nv. 10</Badge>
          )}
        </div>
        <input
          type="number"
          min="1"
          max={NIVEL_MAXIMO_CLASSE}
          placeholder="Nível"
          value={classe.nivel}
          onChange={(e) => onAlterarNivelClasse(index, e.target.value)}
          className={styles.nivelInput}
        />
        <Button type="button" variant="danger" size="sm" onClick={() => onRemoverClasse(index)} title="Remover classe">
          <FaTrash />
        </Button>
      </div>

      <div>
        <input type="text" readOnly value={classe.beneficios || ''} className={styles.beneficiosInput} />
        {ehDancarino && infoDancarino && (
          <div className={styles.subCardContainer}>
            <select
              value={infoDancarino.escolha}
              onChange={(e) => handleAlterarBeneficioDancarino(e.target.value)}
              className={styles.selectClasse}
            >
              <option value="pv">Escolha Dançarino: +5 PV Máximos</option>
              <option value="pm">Escolha Dançarino: +5 PM Máximos</option>
            </select>
          </div>
        )}
        {ehFloralista && infoFloralista && (
          <div className={styles.subCardContainer}>
            <select
              value={infoFloralista.escolha}
              onChange={(e) => handleAlterarBeneficioNatural(e.target.value, 'dados_floralista', 'cloromancia')}
              className={styles.selectClasse}
            >
              <option value="pv">Escolha Floralista: +5 PV Máximos</option>
              <option value="pm">Escolha Floralista: +5 PM Máximos</option>
            </select>
          </div>
        )}
        {ehInvocador && infoInvocador && (
          <div className={styles.subCardContainer}>
            <select
              value={infoInvocador.escolha}
              onChange={(e) => handleAlterarBeneficioNatural(e.target.value, 'dados_invocador', 'invoca')}
              className={styles.selectClasse}
            >
              <option value="pv">Escolha Invocador: +5 PV Máximos</option>
              <option value="pm">Escolha Invocador: +5 PM Máximos</option>
            </select>
          </div>
        )}
      </div>

      <div className={styles.habilidadesArea}>
        <div className={styles.habilidadesStatusRow}>
          <Badge variant={statusHab.excedeNivel ? 'crise' : (statusHab.incompleto ? 'gold' : 'core')} size="sm">
            Habilidades: {statusHab.pontosGastos} / {statusHab.pontosMaximos}
            {statusHab.excedeNivel && ' ⚠️ Excede o nível!'}
            {statusHab.incompleto && !statusHab.excedeNivel && ' ℹ️ Há pontos livres'}
          </Badge>
        </div>

        {(classe.habilidades || []).map((h, hIndex) => {
          const ehCompanheiroFiel = (h.nome || '').toLowerCase().includes('companheiro fiel');
          const ehEngenhocas = (h.nome || '').toLowerCase().includes('engenhocas');
          const nomeNorm = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const ehVincularArcano = nomeNorm.includes('vincular') && nomeNorm.includes('invocar');
          const nivelHab = parseInt(h.nivel, 10) || 0;
          const habCatalogoOficial = (classeCatalogoOficial?.habilidades_padrao || []).find(
            (hp) => hp.nome.trim().toLowerCase() === h.nome.trim().toLowerCase()
          );
          const limiteMaximoHab = habCatalogoOficial?.nivel_maximo ?? NIVEL_MAXIMO_HABILIDADE_PADRAO;

          return (
            <div key={hIndex} className={styles.habilidadeRow}>
              <div className={styles.habilidadeRowTop}>
                <div className={styles.habilidadeInfo}>
                  <div className={styles.habilidadeTitle}>
                    <span>{h.nome}</span>
                    <span className={styles.habilidadeTetoText}>(Máx: {limiteMaximoHab})</span>
                    {ehCompanheiroFiel && <FaPaw />}
                  </div>
                  <div className={styles.habilidadeDescricao}>{h.descricao}</div>
                </div>
                <div className={styles.habilidadeInputGroup}>
                  <span className={styles.nivelLabel}>Nv.</span>
                  <input
                    type="number"
                    min="0"
                    max={limiteMaximoHab}
                    value={h.nivel || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      if (val > limiteMaximoHab) {
                        showAlert(`⛔ Esta habilidade pode ter no máximo ${limiteMaximoHab} ponto(s)!`);
                        return;
                      }
                      const atual = [...formClasses];
                      atual[index].habilidades[hIndex].nivel = val;
                      setFormClasses(atual);
                    }}
                    className={styles.habilidadeNivelInput}
                  />
                </div>
              </div>

              {ehCompanheiroFiel && nivelHab > 0 && (
                <div className={styles.subCardContainer}>
                  <CompanheiroFielCard fichaId={fichaId} classes={formClasses} />
                </div>
              )}

              {ehEngenhocas && nivelHab > 0 && (
                <div className={styles.subCardContainer}>
                  <ExibirEngenhocas
                    habilidadeEngenhocas={h}
                    aoAtualizarEngenhocas={(novosRamos) => {
                      const atual = [...formClasses];
                      atual[index].habilidades[hIndex].ramos = novosRamos;
                      setFormClasses(atual);
                    }}
                  />
                </div>
              )}

              {ehVincularArcano && nivelHab > 0 && (
                <div className={styles.subCardContainer}>
                  <VincularArcanoCard
                    habilidade={h}
                    aoAtualizarArcano={(novoArcano, novaLista) => {
                      const atual = [...formClasses];
                      atual[index].habilidades[hIndex].arcano_vinculado = novoArcano;
                      atual[index].habilidades[hIndex].arcanos_vinculados = novaLista;
                      atual[index].arcano_vinculado = novoArcano;
                      atual[index].arcanos_vinculados = novaLista;
                      setFormClasses(atual);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
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
