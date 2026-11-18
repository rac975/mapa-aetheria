import React, { useState, useMemo, useEffect } from 'react';
import { FaPlus, FaCheck, FaCoins, FaIndustry, FaStore } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import Modal from '../../../../components/ui/Modal/Modal';
import { fichaService } from '../../../../services/fichaService';
import { isModuloDeFabrica, obterPrecoModulo } from '../../../../domain/fabula/technoFantasyRules';
import styles from './ExibirPiloto.module.css';

const ORIGEM_TABS = [
  { key: 'todos', label: 'Todos os Módulos' },
  { key: 'fabrica', label: 'De Fábrica (Grátis)', icon: FaIndustry },
  { key: 'loja', label: 'Oficina / Loja', icon: FaStore }
];

const TABS = [
  { key: 'todos', label: 'Todos os Tipos' },
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
  modulosAdquiridos = [],
  zenitAtual = 0,
  onAdicionar,
  onComprar
}) {
  const [origem, setOrigem] = useState('todos');
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
    return todosModulos.filter((m) => {
      if (origem === 'fabrica' && !isModuloDeFabrica(m)) return false;
      if (origem === 'loja' && isModuloDeFabrica(m)) return false;

      if (categoria === 'todos') return true;
      if (categoria === 'arma') {
        return m.tipo === 'arma' || m.tipo === 'escudo';
      }
      return m.tipo === categoria;
    });
  }, [todosModulos, origem, categoria]);

  const modulosEmPosse = useMemo(() => {
    return new Set([...modulosReserva, ...modulosAtivos]);
  }, [modulosReserva, modulosAtivos]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catálogo & Oficina de Módulos Veiculares"
      size="lg"
      footer={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar Catálogo
        </Button>
      }
    >
      <div className={styles.catalogoTopBar}>
        <div className={styles.saldoBox}>
          <FaCoins className={styles.saldoIcon} />
          <span>Saldo Disponível:</span>
          <strong className={styles.saldoValor}>{zenitAtual.toLocaleString('pt-BR')} Z</strong>
        </div>

        <div className={styles.origemFilterRow}>
          {ORIGEM_TABS.map((t) => {
            const Icone = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                className={`${styles.filterBtn} ${origem === t.key ? styles.filterBtnActive : ''}`}
                onClick={() => setOrigem(t.key)}
              >
                {Icone && <Icone />} {t.label}
              </button>
            );
          })}
        </div>
      </div>

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
          const deFabrica = isModuloDeFabrica(mod);
          const preco = obterPrecoModulo(mod);
          const jaAdquirido = modulosAdquiridos.includes(mod.id);
          const podeComprar = zenitAtual >= preco;

          return (
            <div
              key={mod.id}
              className={`${styles.moduleCard} ${deFabrica ? styles.moduleCardFabrica : styles.moduleCardLoja}`}
            >
              <div className={styles.moduleHeader}>
                <div className={styles.moduleTitleGroup}>
                  <span className={styles.moduleName}>{mod.nome}</span>
                  <div className={styles.moduleMeta}>
                    <Badge variant={deFabrica ? 'core' : 'gold'} size="sm">
                      {deFabrica ? 'FÁBRICA (0 Z)' : `${preco} Z`}
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      {mod.tipo?.toUpperCase()}
                    </Badge>
                    <Badge variant={mod.slot_cost > 1 ? 'crise' : 'secondary'} size="sm">
                      {mod.slot_cost || 1} {(mod.slot_cost || 1) === 1 ? 'Slot' : 'Slots'}
                    </Badge>
                    {!deFabrica && jaAdquirido && (
                      <Badge variant="ether" size="sm">
                        Adquirido
                      </Badge>
                    )}
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
                {jaPossui ? (
                  <Button variant="ghost" size="sm" disabled>
                    <FaCheck /> No Hangar
                  </Button>
                ) : deFabrica ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onAdicionar(mod.id)}
                    title="Módulo de fábrica gratuito, pronto para equipar"
                  >
                    <FaPlus /> Equipar no Hangar
                  </Button>
                ) : jaAdquirido ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onAdicionar(mod.id)}
                    title="Módulo já adquirido previamente, retorne-o ao hangar"
                  >
                    <FaPlus /> Recuperar do Acervo
                  </Button>
                ) : (
                  <Button
                    variant={podeComprar ? 'gold' : 'ghost'}
                    size="sm"
                    disabled={!podeComprar}
                    onClick={() => onComprar && onComprar(mod)}
                    title={podeComprar ? `Adquirir por ${preco} Z` : 'Saldo insuficiente em Zênites'}
                  >
                    <FaCoins /> Comprar ({preco} Z)
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
