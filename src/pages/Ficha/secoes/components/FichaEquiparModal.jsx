import { useState, useMemo } from 'react';
import { FaShieldAlt, FaExchangeAlt, FaBoxOpen } from 'react-icons/fa';
import { GiBroadsword, GiArmorVest, GiRing, GiBowman } from 'react-icons/gi';
import { Modal, Button, Badge } from '../../../../components/ui';
import {
  validarSlotEquipamento,
  isEscudo,
  armaAtingeVoadores,
  extrairResumoCaracteristicasEquipamento
} from '../../../../domain/fabula/equipmentRules';
import styles from './FichaEquiparModal.module.css';

// eslint-disable-next-line react-refresh/only-export-components
export function getItemCategoryIcon(item) {
  const tipo = (item?.tipo || '').toLowerCase();
  const nome = (item?.nome || '').toLowerCase();

  if (isEscudo(item)) return { icon: <FaShieldAlt />, className: styles.itemIconEscudo, label: 'Escudo' };
  if (tipo.includes('armadura') || nome.includes('armadura')) return { icon: <GiArmorVest />, className: styles.itemIconArmadura, label: 'Armadura' };
  if (tipo.includes('acessorio') || tipo.includes('acessório') || nome.includes('anel') || nome.includes('colar')) {
    return { icon: <GiRing />, className: styles.itemIconAcessorio, label: 'Acessório' };
  }
  if (tipo.includes('arco') || tipo.includes('distância') || tipo.includes('distancia')) {
    return { icon: <GiBowman />, className: styles.itemIconArma, label: 'Arma à Distância' };
  }
  return { icon: <GiBroadsword />, className: styles.itemIconArma, label: 'Arma' };
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatarNomeSlot(slotId) {
  switch (slotId) {
    case 'mao_dominante': return 'Mão Dominante';
    case 'mao_secundaria': return 'Mão Não Dominante / Escudo';
    case 'armadura': return 'Armadura';
    case 'acessorio': return 'Acessório';
    default: return slotId ? slotId.replace('_', ' ') : 'Slot';
  }
}

export default function FichaEquiparModal({
  isOpen, onClose, slotAlvo, slotConfig = [], itensInventario = [],
  classes = [], onEquipar, onDesequipar, onTrocarRapido
}) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('compativeis');

  const slotInfo = useMemo(() => {
    return (slotConfig || []).find((s) => s.id === slotAlvo) || {
      id: slotAlvo,
      label: formatarNomeSlot(slotAlvo),
      icone: <FaBoxOpen />
    };
  }, [slotConfig, slotAlvo]);

  const itemAtualNoSlot = useMemo(() => {
    if (!slotAlvo) return null;
    return itensInventario.find((i) => i.stats_personalizados?.slot === slotAlvo);
  }, [itensInventario, slotAlvo]);

  const itensExibidos = useMemo(() => {
    if (!slotAlvo) return [];
    return itensInventario.filter((item) => {
      const tipo = (item.tipo || '').toLowerCase();
      switch (categoriaAtiva) {
        case 'compativeis': return validarSlotEquipamento({ item, slotAlvo, classes }).permitido;
        case 'armas': return tipo.includes('arma') && !isEscudo(item);
        case 'escudos': return isEscudo(item);
        case 'armaduras': return tipo.includes('armadura');
        case 'acessorios': return tipo.includes('acessorio') || tipo.includes('acessório');
        default: return true;
      }
    });
  }, [itensInventario, slotAlvo, categoriaAtiva, classes]);

  if (!isOpen) return null;

  const abas = [
    { key: 'compativeis', label: 'Compatíveis' },
    { key: 'armas', label: 'Armas' },
    { key: 'escudos', label: 'Escudos' },
    { key: 'armaduras', label: 'Armaduras' },
    { key: 'acessorios', label: 'Acessórios' },
    { key: 'todos', label: `Todos (${itensInventario.length})` }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Equipar: ${slotInfo.label}`} size="md">
      <div className={styles.modalContainer}>
        <div className={styles.slotAtualBanner}>
          <div className={styles.slotAtualInfo}>
            {itemAtualNoSlot ? (
              <>
                <div className={`${styles.itemIconWrapper} ${getItemCategoryIcon(itemAtualNoSlot).className}`}>
                  {getItemCategoryIcon(itemAtualNoSlot).icon}
                </div>
                <div>
                  <div className={styles.slotAtualLabel}>Equipado Atualmente:</div>
                  <div className={styles.slotAtualNome}>{itemAtualNoSlot.nome}</div>
                </div>
              </>
            ) : (
              <div>
                <div className={styles.slotAtualLabel}>Status do Slot:</div>
                <div className={styles.slotVazioTexto}>Vazio / Mão Livre</div>
              </div>
            )}
          </div>
          {itemAtualNoSlot && (
            <Button type="button" variant="danger" size="sm" onClick={() => onDesequipar(itemAtualNoSlot)}>
              Desequipar
            </Button>
          )}
        </div>

        <div className={styles.tabsFiltro}>
          {abas.map((aba) => (
            <button
              key={aba.key}
              type="button"
              className={`${styles.tabBtn} ${categoriaAtiva === aba.key ? styles.tabBtnActive : ''}`}
              onClick={() => setCategoriaAtiva(aba.key)}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <div className={styles.itensLista}>
          {itensExibidos.length === 0 ? (
            <p className={styles.itensListaVazia}>Nenhum item encontrado nesta categoria para este slot.</p>
          ) : (
            itensExibidos.map((item) => {
              const categoryMeta = getItemCategoryIcon(item);
              const slotOcupado = item.stats_personalizados?.slot;
              const estaEquipadoAqui = slotOcupado === slotAlvo;
              const estaEquipadoOutro = slotOcupado && slotOcupado !== slotAlvo;
              const stats = item.stats_personalizados || {};
              const resumoCarac = extrairResumoCaracteristicasEquipamento(item);
              const efeitosTexto = Array.isArray(stats.efeitos) ? stats.efeitos.join(' • ') : (stats.qualidade || '');

              return (
                <div
                  key={item.id}
                  className={`${styles.itemLinha} ${
                    estaEquipadoAqui ? styles.itemLinhaEquipadoAqui : estaEquipadoOutro ? styles.itemLinhaEquipadoOutro : ''
                  }`}
                >
                  <div className={styles.itemLinhaEsquerda}>
                    <div className={`${styles.itemIconWrapper} ${categoryMeta.className}`}>
                      {categoryMeta.icon}
                    </div>

                    <div className={styles.itemTextos}>
                      <span className={styles.itemNome}>{item.nome}</span>
                      <div className={styles.itemBadges}>
                        <Badge variant="gold" size="sm">{item.tipo || categoryMeta.label}</Badge>
                        {estaEquipadoAqui ? (
                          <Badge variant="core" size="sm">Equipado Aqui</Badge>
                        ) : estaEquipadoOutro ? (
                          <Badge variant="ether" size="sm">Equipado em: {formatarNomeSlot(slotOcupado)}</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Na Mochila</Badge>
                        )}
                        {armaAtingeVoadores(item) && (
                          <Badge variant="ether" size="sm" title="Atinge alvos voadores">🦅 Atinge Voadores</Badge>
                        )}
                        {resumoCarac.especiesCacadora.length > 0 && (
                          <Badge variant="crise" size="sm">🎯 Caçadora: {resumoCarac.especiesCacadora.join(' / ')}</Badge>
                        )}
                        {resumoCarac.resistencias.length > 0 && (
                          <Badge variant="ether" size="sm">🛡️ Res: {resumoCarac.resistencias.join(' / ')}</Badge>
                        )}
                        {resumoCarac.segundaForma && (
                          <Badge variant="gold" size="sm">🔄 2ª Forma: {resumoCarac.segundaForma.nome}</Badge>
                        )}
                      </div>

                      <div className={styles.itemStatsResumo}>
                        {stats.precisao && <span>Precisão: {stats.precisao} | </span>}
                        {stats.dano && <span>Dano: {stats.dano} [{stats.tipo_dano || 'Físico'}] | </span>}
                        {Boolean(stats.defesa) && <span>DEF: {stats.defesa} | </span>}
                        {Boolean(stats.defesa_magica) && <span>M.DEF: {stats.defesa_magica} | </span>}
                        {efeitosTexto && <span>{efeitosTexto}</span>}
                      </div>
                    </div>
                  </div>

                  <div className={styles.itemAcoes}>
                    {estaEquipadoAqui ? (
                      <Button type="button" variant="danger" size="sm" onClick={() => onDesequipar(item)}>
                        Desequipar
                      </Button>
                    ) : estaEquipadoOutro ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => onTrocarRapido(item, slotAlvo)}>
                        <FaExchangeAlt /> Trocar para Cá
                      </Button>
                    ) : (
                      <Button type="button" variant="core" size="sm" onClick={() => onEquipar(item, slotAlvo)}>
                        Equipar Aqui
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
