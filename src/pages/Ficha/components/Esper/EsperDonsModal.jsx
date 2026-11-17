import React, { useState, useEffect } from 'react';
import { FaBrain, FaCheck, FaTimes, FaSave } from 'react-icons/fa';
import { Modal, Button, Badge } from '../../../../components/ui';
import { fichaService } from '../../../../services/fichaService';
import styles from './ExibirEsper.module.css';

export default function EsperDonsModal({
  isOpen,
  onClose,
  catalogoDons = [],
  donsAprendidos = [],
  maxDons = 0,
  nvDons = 0,
  onToggleDom,
  onSalvarDons
}) {
  const [selecionados, setSelecionados] = useState([]);
  const [mensagemAviso, setMensagemAviso] = useState('');
  const [catalogoInterno, setCatalogoInterno] = useState([]);

  useEffect(() => {
    if (Array.isArray(catalogoDons) && catalogoDons.length > 0) {
      setCatalogoInterno(catalogoDons);
      return;
    }
    let cancelado = false;
    fichaService
      .getCatalogoDonsPsiquicos()
      .then((dados) => {
        if (!cancelado && Array.isArray(dados)) {
          setCatalogoInterno(dados);
        }
      })
      .catch((err) => console.error('Erro ao carregar Dons Psíquicos no modal:', err));

    return () => {
      cancelado = true;
    };
  }, [catalogoDons]);

  useEffect(() => {
    if (isOpen) {
      setSelecionados(Array.isArray(donsAprendidos) ? [...donsAprendidos] : []);
      setMensagemAviso('');
    }
  }, [isOpen, donsAprendidos]);

  const handleToggle = (key) => {
    setMensagemAviso('');
    if (selecionados.includes(key)) {
      const novos = selecionados.filter((k) => k !== key);
      setSelecionados(novos);
      if (onToggleDom) onToggleDom(key);
    } else {
      if (maxDons > 0 && selecionados.length >= maxDons) {
        setMensagemAviso(`Limite atingido! Seu NP em Dádivas Psíquicas (${nvDons}) permite aprender até ${maxDons} dom(ns). Desmarque um para escolher outro.`);
        return;
      }
      const novos = [...selecionados, key];
      setSelecionados(novos);
      if (onToggleDom) onToggleDom(key);
    }
  };

  const handleSalvar = () => {
    if (onSalvarDons) {
      onSalvarDons(selecionados);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catálogo Oficial de Dons Psíquicos (Esper)"
      size="lg"
      footer={
        <div className={styles.modalFooterActions}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FaTimes /> Fechar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSalvar}>
            <FaSave /> Salvar na Ficha ({selecionados.length}/{maxDons})
          </Button>
        </div>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.modalInfoBar}>
          <span>
            Escolha os <strong>Dons Psíquicos</strong> despertados pelo seu Esper conforme o NP investido na habilidade Dádivas Psíquicas.
          </span>
          <Badge
            variant={selecionados.length === maxDons && maxDons > 0 ? 'core' : 'gold'}
            size="md"
          >
            {selecionados.length} / {maxDons} Dons Aprendidos (NP {nvDons})
          </Badge>
        </div>

        {mensagemAviso && (
          <div className={styles.feedbackBox}>
            {mensagemAviso}
          </div>
        )}

        <div className={styles.donsModalGrid}>
          {catalogoInterno.map((dom) => {
            const isSelected = selecionados.includes(dom.key);
            return (
              <div
                key={dom.key}
                onClick={() => handleToggle(dom.key)}
                className={`${styles.domCard} ${isSelected ? styles.domCardSelected : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggle(dom.key);
                  }
                }}
              >
                <div className={styles.domCardHeader}>
                  <div className={styles.domCardTitle}>
                    <FaBrain /> {dom.nome}
                  </div>
                  {isSelected ? (
                    <Badge variant="core" size="sm">
                      <FaCheck /> Aprendido
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">
                      Disponível
                    </Badge>
                  )}
                </div>

                {dom.tipos_dano && dom.tipos_dano.length > 0 && (
                  <div className={styles.donsBadgesRow}>
                    {dom.tipos_dano.map((t) => (
                      <Badge key={t} variant="gold" size="sm">
                        {t.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className={styles.domCardGatilho}>
                  <strong>Gatilho:</strong> {dom.gatilho}
                </div>
                <div className={styles.domCardDesc}>{dom.descricao}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
