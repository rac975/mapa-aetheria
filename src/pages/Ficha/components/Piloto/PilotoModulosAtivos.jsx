import React from 'react';
import { FaSlidersH, FaCheck, FaExclamationTriangle, FaArrowDown } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import { VEHICLE_MODULES_CATALOG } from '../../../../domain/fabula/technoFantasyRules';
import styles from './ExibirPiloto.module.css';

export default function PilotoModulosAtivos({
  modulosAtivos = [],
  slotsUsados = 0,
  slotsMaximos = 3,
  onDesativarModulo,
  nvConfigFlexivel = 0
}) {
  const percentual = Math.min(100, Math.round((slotsUsados / (slotsMaximos || 1)) * 100));
  const ultrapassou = slotsUsados > slotsMaximos;

  const modulosObjetos = modulosAtivos
    .map((id) => VEHICLE_MODULES_CATALOG.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          <FaSlidersH /> Módulos Ativos no Veículo
        </span>
        <Badge variant={ultrapassou ? 'crise' : 'pi'} size="sm">
          {slotsUsados} / {slotsMaximos} Slots Ocupados
        </Badge>
      </div>

      {/* Barra de Progresso de Slots */}
      <div className={styles.slotBarContainer}>
        <div className={styles.slotBarTrack}>
          <div
            className={`${styles.slotBarFill} ${ultrapassou ? styles.slotBarFillOver : ''}`}
            style={{ '--fill-percent': `${percentual}%` }}
          />
        </div>
        {ultrapassou && (
          <div className={styles.slotBarAlert}>
            <FaExclamationTriangle /> Limite de slots ultrapassado! Desative módulos para normalizar.
          </div>
        )}
      </div>

      {modulosObjetos.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum módulo ativo. Selecione módulos da sua reserva abaixo para energizar o veículo.
        </div>
      ) : (
        <div className={styles.modulesGrid}>
          {modulosObjetos.map((mod) => (
            <div key={mod.id} className={`${styles.moduleCard} ${styles.moduleCardActive}`}>
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
                <Badge variant="core" size="sm">
                  <FaCheck /> Ativo
                </Badge>
              </div>

              <div className={styles.moduleDesc}>{mod.descricao}</div>

              <div className={styles.moduleActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDesativarModulo(mod.id)}
                  title="Desativar este módulo e transferir para a reserva"
                >
                  <FaArrowDown /> Desativar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {nvConfigFlexivel > 0 && (
        <Badge variant="ether" size="sm">
          Configuração Flexível Nv. {nvConfigFlexivel}: pode trocar até {nvConfigFlexivel} módulos por ação de Guarda/Equipamento em conflito.
        </Badge>
      )}

      <div className={styles.printOnly}>
        <strong>Módulos Ativos ({slotsUsados}/{slotsMaximos} slots):</strong>{' '}
        {modulosObjetos.map(m => `${m.nome} (${m.slot_cost || 1} slots)`).join(', ')}
      </div>
    </div>
  );
}
