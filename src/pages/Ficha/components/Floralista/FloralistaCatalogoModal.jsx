import { useState } from 'react';
import { FaCheck, FaTimes, FaSave, FaSeedling } from 'react-icons/fa';
import { Modal, Button, Badge } from '../../../../components/ui';
import styles from './ExibirFloralista.module.css';

export default function FloralistaCatalogoModal({
  onClose,
  catalogoMagiseeds = [],
  magiseedsIniciais = [],
  maxMagiseeds = 0,
  nvCloromancia = 0,
  onSalvar
}) {
  const [selecionadas, setSelecionadas] = useState(() => [...magiseedsIniciais]);
  const [aviso, setAviso] = useState('');

  const handleToggle = (key) => {
    setAviso('');
    if (selecionadas.includes(key)) {
      setSelecionadas((prev) => prev.filter((k) => k !== key));
      return;
    }
    if (maxMagiseeds > 0 && selecionadas.length >= maxMagiseeds) {
      setAviso(`Limite atingido! Cloromancia Nv. ${nvCloromancia} permite conhecer até ${maxMagiseeds} magissemente(s).`);
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
      title="Catálogo Oficial de Magissementes (Floralista)"
      size="lg"
      footer={
        <div className={styles.modalFooterActions}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FaTimes /> Fechar
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirmar}>
            <FaSave /> Salvar Magissementes ({selecionadas.length}/{maxMagiseeds})
          </Button>
        </div>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.modalInfoBar}>
          <span>
            Cada nível em <strong>Cloromancia</strong> permite conhecer 1 magissemente oficial do Atlas Fantasia Natural.
          </span>
          <Badge variant={selecionadas.length === maxMagiseeds && maxMagiseeds > 0 ? 'core' : 'gold'} size="md">
            {selecionadas.length} / {maxMagiseeds} Conhecidas (NP {nvCloromancia})
          </Badge>
        </div>

        {aviso && <div className={styles.erroBox}>{aviso}</div>}

        <div className={styles.catalogGrid}>
          {catalogoMagiseeds.map((seed) => {
            const ativo = selecionadas.includes(seed.key);
            return (
              <div
                key={seed.key}
                onClick={() => handleToggle(seed.key)}
                className={`${styles.catalogCard} ${ativo ? styles.catalogCardSelected : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggle(seed.key);
                  }
                }}
              >
                <div className={styles.catalogCardHeader}>
                  <span className={styles.catalogCardTitle}>
                    <FaSeedling /> {seed.nome}
                  </span>
                  <Badge variant={ativo ? 'core' : 'default'} size="sm">
                    {ativo ? <><FaCheck /> Conhecida</> : 'Disponível'}
                  </Badge>
                </div>
                <div className={styles.catalogCardDesc}>{seed.descricao}</div>
                <div className={styles.seedSecoesList}>
                  {seed.efeito_secao_0 && <div><strong>[0-1]:</strong> {seed.efeito_secao_0}</div>}
                  {!seed.efeito_secao_0 && seed.efeito_secao_1 && <div><strong>[1]:</strong> {seed.efeito_secao_1}</div>}
                  {seed.efeito_secao_2 && <div><strong>[2]:</strong> {seed.efeito_secao_2}</div>}
                  {seed.efeito_secao_3 && seed.efeito_secao_3 !== seed.efeito_secao_2 && (
                    <div><strong>[3]:</strong> {seed.efeito_secao_3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
