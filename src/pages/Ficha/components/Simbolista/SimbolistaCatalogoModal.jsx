import { useState } from 'react';
import { FaPaintBrush, FaCheck, FaTimes, FaSave } from 'react-icons/fa';
import { Modal, Button, Badge } from '../../../../components/ui';
import styles from './ExibirSimbolista.module.css';

export default function SimbolistaCatalogoModal({
  onClose,
  catalogoSimbolos = [],
  simbolosIniciais = [],
  maxAprendidos = 0,
  nvSimbolismo = 0,
  onSalvar
}) {
  const [selecionados, setSelecionados] = useState(() => [...simbolosIniciais]);
  const [aviso, setAviso] = useState('');

  const handleToggle = (key) => {
    setAviso('');
    if (selecionados.includes(key)) {
      setSelecionados((prev) => prev.filter((k) => k !== key));
      return;
    }
    if (maxAprendidos > 0 && selecionados.length >= maxAprendidos) {
      setAviso(`Limite atingido! Simbolismo Nv. ${nvSimbolismo} permite aprender até ${maxAprendidos} símbolos (2 por NP).`);
      return;
    }
    setSelecionados((prev) => [...prev, key]);
  };

  const handleConfirmar = async () => {
    await onSalvar(selecionados);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Grimório de Sigilos — Catálogo Oficial de Símbolos"
      size="lg"
      footer={
        <div className={styles.modalFooterActions}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FaTimes /> Fechar
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirmar}>
            <FaSave /> Salvar Símbolos ({selecionados.length}/{maxAprendidos})
          </Button>
        </div>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.modalInfoBar}>
          <span>
            Cada nível em <strong>Simbolismo</strong> ensina 2 símbolos oficiais (máximo 10).
          </span>
          <Badge variant={selecionados.length === maxAprendidos && maxAprendidos > 0 ? 'core' : 'gold'} size="md">
            {selecionados.length} / {maxAprendidos} Aprendidos (NP {nvSimbolismo})
          </Badge>
        </div>

        {aviso && <div className={styles.erroBox}>{aviso}</div>}

        <div className={styles.catalogGrid}>
          {catalogoSimbolos.map((simb) => {
            const ativo = selecionados.includes(simb.key);
            return (
              <div
                key={simb.key}
                onClick={() => handleToggle(simb.key)}
                className={`${styles.catalogCard} ${ativo ? styles.catalogCardSelected : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggle(simb.key);
                  }
                }}
              >
                <div className={styles.catalogCardHeader}>
                  <span className={styles.catalogCardTitle}>
                    <FaPaintBrush /> {simb.nome}
                  </span>
                  <Badge variant={ativo ? 'core' : 'default'} size="sm">
                    {ativo ? <><FaCheck /> Aprendido</> : 'Disponível'}
                  </Badge>
                </div>
                {simb.requer_escolha && (
                  <Badge variant="gold" size="sm">Requer escolha ({simb.tipo_escolha})</Badge>
                )}
                <div className={styles.catalogCardDesc}>{simb.descricao}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
