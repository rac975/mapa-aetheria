import { useMemo } from 'react';
import { FaMagic, FaCheckCircle, FaStar } from 'react-icons/fa';
import { Card, Badge } from '../../../components/ui';
import { DISCIPLINAS_RITUAL, detectarDisciplinasPersonagem } from '../../../domain/fabula/ritualRules';
import styles from './FichaFormRituais.module.css';

export default function FichaFormRituais({ formData = {}, setFormData, formClasses = [] }) {
  const rituaisAtuais = useMemo(() => {
    return Array.isArray(formData.rituais) ? formData.rituais : [];
  }, [formData.rituais]);

  // Detecção automática de disciplinas baseada nas classes atuais do formulário
  const disciplinasAuto = useMemo(() => {
    const detectadas = detectarDisciplinasPersonagem(
      formClasses.length > 0 ? formClasses : (formData.classes || []),
      [],
      formData.peculiaridade
    );
    const mapa = {};
    detectadas.forEach(d => {
      mapa[d.nome.toLowerCase()] = d.fontes;
    });
    return mapa;
  }, [formClasses, formData.classes, formData.peculiaridade]);

  const listaDisciplinas = Object.values(DISCIPLINAS_RITUAL);

  const handleToggle = (nomeDisciplina, desbloqueadaAuto) => {
    if (desbloqueadaAuto) {
      // Já garantida por habilidade/classe
      return;
    }
    const marcado = rituaisAtuais.includes(nomeDisciplina);
    const novos = marcado
      ? rituaisAtuais.filter((r) => r !== nomeDisciplina)
      : [...rituaisAtuais, nomeDisciplina];

    setFormData({ ...formData, rituais: novos });
  };

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <FaMagic /> Disciplinas de Rituais Mágicos
        </h3>
        <span className={styles.subtitle}>
          Disciplinas concedidas por suas classes/habilidades são detectadas automaticamente.
          Você também pode habilitar disciplinas manuais adicionais.
        </span>
      </div>

      <div className={styles.gridRituais}>
        {listaDisciplinas.map((disc) => {
          const fontesAuto = disciplinasAuto[disc.nome.toLowerCase()];
          const desbloqueadaAuto = Boolean(fontesAuto && fontesAuto.length > 0);
          const marcadoManual = rituaisAtuais.includes(disc.nome);
          const ativo = desbloqueadaAuto || marcadoManual;

          return (
            <div
              key={disc.id}
              className={`${styles.ritualCard} ${ativo ? styles.ritualCardAtivo : ''} ${desbloqueadaAuto ? styles.ritualCardAuto : ''}`}
              onClick={() => handleToggle(disc.nome, desbloqueadaAuto)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggle(disc.nome, desbloqueadaAuto);
                }
              }}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardTitleGroup}>
                  <input
                    type="checkbox"
                    checked={ativo}
                    disabled={desbloqueadaAuto}
                    onChange={() => handleToggle(disc.nome, desbloqueadaAuto)}
                    className={styles.checkboxInput}
                    aria-label={`Disciplina ${disc.nome}`}
                  />
                  <strong className={styles.ritualNome}>{disc.nome}</strong>
                </div>
                <Badge variant={ativo ? 'ether' : 'default'} size="sm">
                  {disc.sigla}
                </Badge>
              </div>

              <p className={styles.ritualDescricao}>{disc.descricao}</p>

              <div className={styles.statusFooter}>
                {desbloqueadaAuto ? (
                  <Badge variant="core" size="sm" className={styles.badgeFonte}>
                    <FaCheckCircle /> {fontesAuto[0]}
                  </Badge>
                ) : marcadoManual ? (
                  <Badge variant="gold" size="sm" className={styles.badgeFonte}>
                    <FaStar /> Seleção Manual
                  </Badge>
                ) : (
                  <span className={styles.fonteNaoDominada}>Não dominada</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
