import React from 'react';
import { FaBoxes, FaPlus, FaArrowUp, FaTrash } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import { VEHICLE_MODULES_CATALOG } from '../../../../domain/fabula/technoFantasyRules';
import styles from './ExibirPiloto.module.css';

export default function PilotoModulosReserva({
  modulosReserva = [],
  modulosAtivos = [],
  totalModulosPermitidos = 3,
  slVeiculoPessoal = 1,
  onAtivarModulo,
  onRemoverDaReserva,
  onAbrirCatalogo
}) {
  const modulosObjetos = modulosReserva
    .map((id) => VEHICLE_MODULES_CATALOG.find((m) => m.id === id))
    .filter(Boolean);

  const totalEmPosse = modulosReserva.length + modulosAtivos.length;

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
            <FaPlus /> Catálogo de Módulos
          </Button>
        </div>
      </div>

      {modulosObjetos.length === 0 ? (
        <div className={styles.emptyState}>
          Sua reserva de módulos está vazia. Clique no botão acima para escolher novos módulos do catálogo oficial (limite de {totalModulosPermitidos} módulos no hangar).
        </div>
      ) : (
        <div className={styles.modulesGrid}>
          {modulosObjetos.map((mod) => (
            <div key={mod.id} className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleTitleGroup}>
                  <span className={styles.moduleName}>{mod.nome}</span>
                  <div className={styles.moduleMeta}>
                    <Badge variant="gold" size="sm">
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
          ))}
        </div>
      )}
    </div>
  );
}
