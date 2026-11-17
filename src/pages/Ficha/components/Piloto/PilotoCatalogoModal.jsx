import React, { useState, useMemo, useEffect } from 'react';
import { FaPlus, FaCheck } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import Modal from '../../../../components/ui/Modal/Modal';
import { fichaService } from '../../../../services/fichaService';
import styles from './ExibirPiloto.module.css';

const TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'armadura', label: 'Armaduras' },
  { key: 'arma', label: 'Armas & Escudos' },
  { key: 'suporte', label: 'Suporte' }
];

export default function PilotoCatalogoModal({
  isOpen,
  onClose,
  catalogoModulos = [],
  modulosReserva = [],
  modulosAtivos = [],
  onAdicionar
}) {
  const [categoria, setCategoria] = useState('todos');
  const [catalogoInterno, setCatalogoInterno] = useState([]);

  useEffect(() => {
    if (Array.isArray(catalogoModulos) && catalogoModulos.length > 0) {
      return;
    }
    let cancelado = false;
    fichaService
      .getCatalogoVeiculosModulos()
      .then((dados) => {
        if (!cancelado && Array.isArray(dados)) {
          setCatalogoInterno(dados);
        }
      })
      .catch((err) => console.error('Erro ao carregar módulos de veículo no modal:', err));

    return () => {
      cancelado = true;
    };
  }, [catalogoModulos]);

  const catalogoFonte = useMemo(
    () => (Array.isArray(catalogoModulos) && catalogoModulos.length > 0 ? catalogoModulos : catalogoInterno),
    [catalogoModulos, catalogoInterno]
  );

  const todosModulos = useMemo(() => {
    const unique = [];
    const seen = new Set();
    catalogoFonte.forEach((m) => {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        unique.push(m);
      }
    });
    return unique;
  }, [catalogoFonte]);

  const modulosFiltrados = useMemo(() => {
    if (categoria === 'todos') return todosModulos;
    if (categoria === 'arma') {
      return todosModulos.filter((m) => m.tipo === 'arma' || m.tipo === 'escudo');
    }
    return todosModulos.filter((m) => m.tipo === categoria);
  }, [todosModulos, categoria]);

  const modulosEmPosse = useMemo(() => {
    return new Set([...modulosReserva, ...modulosAtivos]);
  }, [modulosReserva, modulosAtivos]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catálogo Oficial de Módulos de Veículo"
      size="lg"
      footer={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar Catálogo
        </Button>
      }
    >
      <div className={styles.filterRow}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${styles.filterBtn} ${categoria === t.key ? styles.filterBtnActive : ''}`}
            onClick={() => setCategoria(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.catalogGrid}>
        {modulosFiltrados.map((mod) => {
          const jaPossui = modulosEmPosse.has(mod.id);

          return (
            <div key={mod.id} className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleTitleGroup}>
                  <span className={styles.moduleName}>{mod.nome}</span>
                  <div className={styles.moduleMeta}>
                    <Badge variant="gold" size="sm">
                      {mod.tipo?.toUpperCase()}
                    </Badge>
                    <Badge variant={mod.slot_cost > 1 ? 'crise' : 'secondary'} size="sm">
                      {mod.slot_cost || 1} {(mod.slot_cost || 1) === 1 ? 'Slot' : 'Slots'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className={styles.moduleDesc}>{mod.descricao}</div>

              {mod.propriedades && (
                <div className={styles.weaponProperty}>
                  ★ {mod.propriedades}
                </div>
              )}
              {mod.restricoes && (
                <div className={styles.weaponProperty}>
                  ⚠ {mod.restricoes}
                </div>
              )}

              <div className={styles.moduleActions}>
                <Button
                  variant={jaPossui ? 'ghost' : 'primary'}
                  size="sm"
                  disabled={jaPossui}
                  onClick={() => onAdicionar(mod.id)}
                >
                  {jaPossui ? <><FaCheck /> No Hangar</> : <><FaPlus /> Adicionar</>}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
