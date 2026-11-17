import { useState } from 'react';
import { FaMusic, FaCheck, FaTimes, FaSave } from 'react-icons/fa';
import { Modal, Button, Badge } from '../../../../components/ui';
import { validarSelecaoMagicanto } from '../../../../domain/fabula/highFantasyRules';
import styles from './ExibirVirtuoso.module.css';

export default function VirtuosoRepertorioModal({
  onClose,
  catalogoEscalas = [],
  catalogoTons = [],
  escalasIniciais = [],
  tonsIniciais = [],
  nvMagicanto = 0,
  totalPermitido = 0,
  onSalvar
}) {
  const [escalasSel, setEscalasSel] = useState(() => [...escalasIniciais]);
  const [tonsSel, setTonsSel] = useState(() => [...tonsIniciais]);
  const [aviso, setAviso] = useState('');

  const totalAtual = escalasSel.length + tonsSel.length;

  const toggleEscala = (key) => {
    setAviso('');
    if (escalasSel.includes(key)) {
      setEscalasSel((prev) => prev.filter((k) => k !== key));
      return;
    }
    if (totalAtual >= totalPermitido) {
      setAviso(`Limite atingido! Magicanto Nv. ${nvMagicanto} permite ${totalPermitido} itens (Escalas + Tons).`);
      return;
    }
    if (tonsSel.length === 0 && escalasSel.length + 1 >= totalPermitido) {
      setAviso('Reserve pelo menos 1 vaga para escolher 1 Tom (regra inicial do Magicanto).');
      return;
    }
    setEscalasSel((prev) => [...prev, key]);
  };

  const toggleTom = (key) => {
    setAviso('');
    if (tonsSel.includes(key)) {
      setTonsSel((prev) => prev.filter((k) => k !== key));
      return;
    }
    if (totalAtual >= totalPermitido) {
      setAviso(`Limite atingido! Magicanto Nv. ${nvMagicanto} permite ${totalPermitido} itens (Escalas + Tons).`);
      return;
    }
    if (escalasSel.length === 0 && tonsSel.length + 1 >= totalPermitido) {
      setAviso('Reserve pelo menos 1 vaga para escolher 1 Escala (regra inicial do Magicanto).');
      return;
    }
    setTonsSel((prev) => [...prev, key]);
  };

  const handleConfirmar = async () => {
    const check = validarSelecaoMagicanto(nvMagicanto, escalasSel, tonsSel);
    if (!check.valido) {
      setAviso(check.motivo || 'Seleção inválida.');
      return;
    }
    const ok = await onSalvar(escalasSel, tonsSel);
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Repertório de Magicanto — Escalas (Chaves) & Tons"
      size="lg"
      footer={
        <div className={styles.modalFooterActions}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FaTimes /> Fechar
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirmar}>
            <FaSave /> Salvar Repertório ({totalAtual}/{totalPermitido})
          </Button>
        </div>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.modalInfoBar}>
          <span>
            Magicanto Nv. <strong>{nvMagicanto}</strong>: aprenda todos os 3 Volumes, 1 Escala + 1 Tom iniciais e +1 item por nível adicional.
          </span>
          <Badge variant={totalAtual === totalPermitido ? 'core' : 'gold'} size="md">
            {totalAtual} / {totalPermitido} Aprendidos
          </Badge>
        </div>

        {aviso && <div className={styles.erroBox}>{aviso}</div>}

        <div className={styles.sectionTitle}>Escalas / Chaves ({escalasSel.length})</div>
        <div className={styles.catalogGrid}>
          {catalogoEscalas.map((esc) => {
            const ativo = escalasSel.includes(esc.key);
            return (
              <div
                key={esc.key}
                onClick={() => toggleEscala(esc.key)}
                className={`${styles.catalogCard} ${ativo ? styles.catalogCardSelected : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleEscala(esc.key);
                  }
                }}
              >
                <div className={styles.catalogCardHeader}>
                  <span className={styles.catalogCardTitle}>
                    <FaMusic /> {esc.nome}
                  </span>
                  <Badge variant={ativo ? 'core' : 'default'} size="sm">
                    {ativo ? <><FaCheck /> Aprendida</> : 'Disponível'}
                  </Badge>
                </div>
                <div className={styles.catalogCardMeta}>
                  Dano: <strong>{esc.tipo_dano}</strong> • Condição: <strong>{esc.condicao}</strong> • Atributo: <strong>{esc.atributo}</strong> • Recup.: <strong>{esc.recuperacao}</strong>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.sectionTitle}>Tons ({tonsSel.length})</div>
        <div className={styles.catalogGrid}>
          {catalogoTons.map((tom) => {
            const ativo = tonsSel.includes(tom.key);
            return (
              <div
                key={tom.key}
                onClick={() => toggleTom(tom.key)}
                className={`${styles.catalogCard} ${ativo ? styles.catalogCardSelected : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleTom(tom.key);
                  }
                }}
              >
                <div className={styles.catalogCardHeader}>
                  <span className={styles.catalogCardTitle}>{tom.nome}</span>
                  <Badge variant={ativo ? 'core' : 'default'} size="sm">
                    {ativo ? <><FaCheck /> Aprendido</> : 'Disponível'}
                  </Badge>
                </div>
                <div className={styles.catalogCardDesc}>{tom.descricao}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
