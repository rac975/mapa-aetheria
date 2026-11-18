import React, { useState, useMemo } from 'react';
import { FaBoxes, FaPlus, FaArrowUp, FaTrash, FaCoins, FaIndustry, FaStore } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import { obterModuloPorId, isModuloDeFabrica, obterPrecoModulo } from '../../../../domain/fabula/technoFantasyRules';
import styles from './ExibirPiloto.module.css';

export default function PilotoModulosReserva({
  modulosReserva = [],
  modulosAtivos = [],
  catalogoModulos = [],
  totalModulosPermitidos = 3,
  slVeiculoPessoal = 1,
  onAtivarModulo,
  onRemoverDaReserva,
  onAbrirCatalogo
}) {
  const [filtroOrigem, setFiltroOrigem] = useState('todos');

  const modulosObjetos = useMemo(() => {
    return modulosReserva
      .map((id) => obterModuloPorId(id, catalogoModulos))
      .filter(Boolean);
  }, [modulosReserva, catalogoModulos]);

  const modulosExibidos = useMemo(() => {
    if (filtroOrigem === 'todos') return modulosObjetos;
    if (filtroOrigem === 'fabrica') return modulosObjetos.filter((m) => isModuloDeFabrica(m));
    if (filtroOrigem === 'loja') return modulosObjetos.filter((m) => !isModuloDeFabrica(m));
    return modulosObjetos;
  }, [modulosObjetos, filtroOrigem]);

  const totalEmPosse = modulosReserva.length + modulosAtivos.length;
  const qtdFabrica = useMemo(() => modulosObjetos.filter((m) => isModuloDeFabrica(m)).length, [modulosObjetos]);
  const qtdLoja = modulosObjetos.length - qtdFabrica;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          <FaBoxes /> Reserva de Módulos (Hangar / Inventário)
        </span>
        <div className={styles.headerActions}>
          <Badge variant={totalEmPosse > totalModulosPermitidos ? 'crise' : 'gold'} size="sm">
            Hangar: {totalEmPosse} / {totalModulosPermitidos} Módulos (Veículo Pessoal Nv. {slVeiculoPessoal})
          </Badge>
          <Button variant="secondary" size="sm" onClick={onAbrirCatalogo}>
            <FaPlus /> Catálogo & Oficina
          </Button>
        </div>
      </div>

      {modulosObjetos.length > 0 && (
        <div className={styles.filterRow}>
          <button
            type="button"
            className={`${styles.filterBtn} ${filtroOrigem === 'todos' ? styles.filterBtnActive : ''}`}
            onClick={() => setFiltroOrigem('todos')}
          >
            Todos ({modulosObjetos.length})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filtroOrigem === 'fabrica' ? styles.filterBtnActive : ''}`}
            onClick={() => setFiltroOrigem('fabrica')}
          >
            <FaIndustry /> Fábrica ({qtdFabrica})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filtroOrigem === 'loja' ? styles.filterBtnActive : ''}`}
            onClick={() => setFiltroOrigem('loja')}
          >
            <FaStore /> Oficina ({qtdLoja})
          </button>
        </div>
      )}

      {modulosObjetos.length === 0 ? (
        <div className={styles.emptyState}>
          Sua reserva de módulos está vazia. Clique no botão acima para escolher novos módulos de fábrica ou adquirir na oficina (capacidade total: {totalModulosPermitidos} módulos no hangar).
        </div>
      ) : modulosExibidos.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum módulo encontrado para o filtro selecionado.
        </div>
      ) : (
        <div className={styles.modulesGrid}>
          {modulosExibidos.map((mod) => {
            const deFabrica = isModuloDeFabrica(mod);
            const preco = obterPrecoModulo(mod);

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
                        {deFabrica ? 'FÁBRICA' : <><FaCoins /> {preco} Z</>}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {mod.tipo?.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {mod.slot_cost || 1} {(mod.slot_cost || 1) === 1 ? 'Slot' : 'Slots'}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="default" size="sm">
                    Reserva
                  </Badge>
                </div>

                <div className={styles.moduleDesc}>{mod.descricao}</div>

                <div className={styles.moduleActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoverDaReserva(mod.id)}
                    title="Remover módulo da sua reserva"
                  >
                    <FaTrash />
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onAtivarModulo(mod.id)}
                    title="Ativar módulo no veículo"
                  >
                    <FaArrowUp /> Ativar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
