import { FaCogs, FaPlus } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './ExibirEngenhocas.module.css';

export default function ExibirEngenhocas({ habilidadeEngenhocas, aoAtualizarEngenhocas }) {
  const nivelInvestido = habilidadeEngenhocas?.nivel || 0;
  const ramosAtuais = habilidadeEngenhocas?.ramos || {};

  if (nivelInvestido === 0) return null;

  const TIPOS_DISPONIVEIS = [
    { id: 'alquimia', nome: 'Alquimia' },
    { id: 'infusoes', nome: 'Infusões' },
    { id: 'tecnomagia', nome: 'Tecnomagia' }
  ];

  const totalRamosEscolhidos = Object.values(ramosAtuais).reduce((acc, estagio) => {
    if (estagio === 'basico') return acc + 1;
    if (estagio === 'avancado') return acc + 2;
    if (estagio === 'superior') return acc + 3;
    return acc;
  }, 0);

  const pontosDisponiveisParaEscolha = nivelInvestido - totalRamosEscolhidos;

  const avancarRamo = (tipoId) => {
    const atual = ramosAtuais[tipoId];
    let proximo = 'basico';
    if (atual === 'basico') proximo = 'avancado';
    else if (atual === 'avancado') proximo = 'superior';
    else if (atual) return;

    const novosRamos = { ...ramosAtuais, [tipoId]: proximo };
    aoAtualizarEngenhocas(novosRamos);
  };

  const retrocederRamo = (tipoId) => {
    const atual = ramosAtuais[tipoId];
    let proximo;
    if (atual === 'superior') proximo = 'avancado';
    else if (atual === 'avancado') proximo = 'basico';

    const novosRamos = { ...ramosAtuais };
    if (proximo) {
      novosRamos[tipoId] = proximo;
    } else {
      delete novosRamos[tipoId];
    }
    aoAtualizarEngenhocas(novosRamos);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>
          <FaCogs /> Sistema de Engenhocas (Nível do Poder: {nivelInvestido})
        </span>
        <span className={pontosDisponiveisParaEscolha > 0 ? styles.statusPending : styles.statusAllocated}>
          {pontosDisponiveisParaEscolha > 0 ? `⚠️ ${pontosDisponiveisParaEscolha} escolha(s) pendente(s)` : '✅ Todos os pontos alocados'}
        </span>
      </div>

      <div className={styles.grid}>
        {TIPOS_DISPONIVEIS.map((tipo) => {
          const estagio = ramosAtuais[tipo.id];
          const ehSuperior = estagio === 'superior';

          return (
            <div key={tipo.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong className={styles.cardName}>{tipo.nome}</strong>
                <span className={styles.cardStage}>
                  {estagio || 'Não Adquirido'}
                </span>
              </div>

              <div className={styles.buttonRow}>
                {estagio ? (
                  <>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => retrocederRamo(tipo.id)}
                    >
                      Reduzir
                    </Button>
                    {!ehSuperior && pontosDisponiveisParaEscolha > 0 && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => avancarRamo(tipo.id)}
                      >
                        Evoluir (+)
                      </Button>
                    )}
                  </>
                ) : (
                  pontosDisponiveisParaEscolha > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => avancarRamo(tipo.id)}
                    >
                      <FaPlus size={10} /> Desbloquear Básico
                    </Button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
