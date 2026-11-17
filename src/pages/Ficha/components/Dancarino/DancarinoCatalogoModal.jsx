import { useState } from 'react';
import { FaCheck, FaTimes, FaSave } from 'react-icons/fa';
import { GiSpinningRibbons } from 'react-icons/gi';
import { Modal, Button, Badge } from '../../../../components/ui';
import styles from './ExibirDancarino.module.css';

export default function DancarinoCatalogoModal({
  onClose,
  catalogoDancas = [],
  dancasIniciais = [],
  maxDancas = 0,
  nvDanca = 0,
  onSalvar
}) {
  const [selecionadas, setSelecionadas] = useState(() => [...dancasIniciais]);
  const [aviso, setAviso] = useState('');

  const handleToggle = (key) => {
    setAviso('');
    if (selecionadas.includes(key)) {
      setSelecionadas((prev) => prev.filter((k) => k !== key));
      return;
    }
    if (maxDancas > 0 && selecionadas.length >= maxDancas) {
      setAviso(`Limite atingido! Dança Nv. ${nvDanca} permite aprender até ${maxDancas} dança(s).`);
      return;
    }
    setSelecionadas((prev) => [...prev, key]);
  };

  const handleConfirmar = async () => {
    await onSalvar(selecionadas);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Catálogo Oficial de Danças (Dançarino)"
      size="lg"
      footer={
        <div className={styles.modalFooterActions}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FaTimes /> Fechar
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirmar}>
            <FaSave /> Salvar Danças ({selecionadas.length}/{maxDancas})
          </Button>
        </div>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.modalInfoBar}>
          <span>
            Cada nível em <strong>Dança</strong> ensina 1 dança oficial do Atlas Alta Fantasia.
          </span>
          <Badge variant={selecionadas.length === maxDancas && maxDancas > 0 ? 'core' : 'gold'} size="md">
            {selecionadas.length} / {maxDancas} Aprendidas (NP {nvDanca})
          </Badge>
        </div>

        {aviso && <div className={styles.erroBox}>{aviso}</div>}

        <div className={styles.catalogGrid}>
          {catalogoDancas.map((danca) => {
            const ativo = selecionadas.includes(danca.key);
            return (
              <div
                key={danca.key}
                onClick={() => handleToggle(danca.key)}
                className={`${styles.catalogCard} ${ativo ? styles.catalogCardSelected : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggle(danca.key);
                  }
                }}
              >
                <div className={styles.catalogCardHeader}>
                  <span className={styles.catalogCardTitle}>
                    <GiSpinningRibbons /> {danca.nome}
                  </span>
                  <Badge variant={ativo ? 'core' : 'default'} size="sm">
                    {ativo ? <><FaCheck /> Aprendida</> : 'Disponível'}
                  </Badge>
                </div>
                <Badge variant={danca.tipo_duracao === 'turno' ? 'ether' : 'gold'} size="sm">
                  {danca.duracao}
                </Badge>
                <div className={styles.catalogCardDesc}>{danca.descricao}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
