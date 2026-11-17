import { useState, useMemo } from 'react';
import { FaShieldAlt, FaExchangeAlt, FaBoxOpen } from 'react-icons/fa';
import { GiBroadsword, GiArmorVest, GiRing, GiBowman } from 'react-icons/gi';
import { Modal, Button, Badge } from '../../../../components/ui';
import { validarSlotEquipamento, isEscudo } from '../../../../domain/fabula/equipmentRules';
import styles from './FichaEquiparModal.module.css';

/**
 * Retorna o ícone e a classe temática para a categoria de equipamento
 */
export function getItemCategoryIcon(item) {
  const tipo = (item?.tipo || '').toLowerCase();
  const nome = (item?.nome || '').toLowerCase();

  if (isEscudo(item)) {
    return {
      icon: <FaShieldAlt />,
      className: styles.itemIconEscudo,
      label: 'Escudo'
    };
  }
  if (tipo.includes('armadura') || nome.includes('armadura')) {
    return {
      icon: <GiArmorVest />,
      className: styles.itemIconArmadura,
      label: 'Armadura'
    };
  }
  if (tipo.includes('acessorio') || tipo.includes('acessório') || nome.includes('anel') || nome.includes('colar')) {
    return {
      icon: <GiRing />,
      className: styles.itemIconAcessorio,
      label: 'Acessório'
    };
  }
  if (tipo.includes('arco') || tipo.includes('distância') || tipo.includes('distancia')) {
    return {
      icon: <GiBowman />,
      className: styles.itemIconArma,
      label: 'Arma à Distância'
    };
  }
  return {
    icon: <GiBroadsword />,
    className: styles.itemIconArma,
    label: 'Arma'
  };
}

export function formatarNomeSlot(slotId) {
  switch (slotId) {
    case 'mao_dominante':
      return 'Mão Dominante';
    case 'mao_secundaria':
      return 'Mão Não Dominante / Escudo';
    case 'armadura':
      return 'Armadura';
    case 'acessorio':
      return 'Acessório';
    default:
      return slotId ? slotId.replace('_', ' ') : 'Slot';
  }
}

export default function FichaEquiparModal({
  isOpen,
  onClose,
  slotAlvo,
  slotConfig = [],
  itensInventario = [],
  classes = [],
  onEquipar,
  onDesequipar,
  onTrocarRapido
}) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('compativeis');

  const slotInfo = useMemo(() => {
    return (slotConfig || []).find((s) => s.id === slotAlvo) || {
      id: slotAlvo,
      label: formatarNomeSlot(slotAlvo),
      icone: <FaBoxOpen />
    };
  }, [slotConfig, slotAlvo]);

  // Item atualmente equipado no slot alvo
  const itemAtualNoSlot = useMemo(() => {
    if (!slotAlvo) return null;
    return itensInventario.find((i) => i.stats_personalizados?.slot === slotAlvo);
  }, [itensInventario, slotAlvo]);

  // Filtragem dos itens de inventário
  const itensExibidos = useMemo(() => {
    if (!slotAlvo) return [];

    return itensInventario.filter((item) => {
      const tipo = (item.tipo || '').toLowerCase();

      switch (categoriaAtiva) {
        case 'compativeis': {
          const check = validarSlotEquipamento({ item, slotAlvo, classes });
          return check.permitido;
        }
        case 'armas':
          return tipo.includes('arma') && !isEscudo(item);
        case 'escudos':
          return isEscudo(item);
        case 'armaduras':
          return tipo.includes('armadura');
        case 'acessorios':
          return tipo.includes('acessorio') || tipo.includes('acessório');
        case 'todos':
        default:
          return true;
      }
    });
  }, [itensInventario, slotAlvo, categoriaAtiva, classes]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Equipar: ${slotInfo.label}`}
      size="md"
    >
      <div className={styles.modalContainer}>
        {/* 1. BANNER DO QUE JÁ ESTÁ EQUIPADO NESTE SLOT */}
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
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => onDesequipar(itemAtualNoSlot)}
            >
              Desequipar
            </Button>
          )}
        </div>

        {/* 2. ABAS DE FILTRO POR CATEGORIA */}
        <div className={styles.tabsFiltro}>
          <button
            type="button"
            className={`${styles.tabBtn} ${categoriaAtiva === 'compativeis' ? styles.tabBtnActive : ''}`}
            onClick={() => setCategoriaAtiva('compativeis')}
          >
            Compatíveis
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${categoriaAtiva === 'armas' ? styles.tabBtnActive : ''}`}
            onClick={() => setCategoriaAtiva('armas')}
          >
            Armas
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${categoriaAtiva === 'escudos' ? styles.tabBtnActive : ''}`}
            onClick={() => setCategoriaAtiva('escudos')}
          >
            Escudos
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${categoriaAtiva === 'armaduras' ? styles.tabBtnActive : ''}`}
            onClick={() => setCategoriaAtiva('armaduras')}
          >
            Armaduras
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${categoriaAtiva === 'acessorios' ? styles.tabBtnActive : ''}`}
            onClick={() => setCategoriaAtiva('acessorios')}
          >
            Acessórios
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${categoriaAtiva === 'todos' ? styles.tabBtnActive : ''}`}
            onClick={() => setCategoriaAtiva('todos')}
          >
            Todos ({itensInventario.length})
          </button>
        </div>

        {/* 3. LISTA DE ITENS DISPONÍVEIS */}
        <div className={styles.itensLista}>
          {itensExibidos.length === 0 ? (
            <p className={styles.itensListaVazia}>
              Nenhum item encontrado nesta categoria para este slot.
            </p>
          ) : (
            itensExibidos.map((item) => {
              const categoryMeta = getItemCategoryIcon(item);
              const slotOcupado = item.stats_personalizados?.slot;
              const estaEquipadoAqui = slotOcupado === slotAlvo;
              const estaEquipadoOutro = slotOcupado && slotOcupado !== slotAlvo;
              const stats = item.stats_personalizados || {};

              return (
                <div
                  key={item.id}
                  className={`${styles.itemLinha} ${
                    estaEquipadoAqui
                      ? styles.itemLinhaEquipadoAqui
                      : estaEquipadoOutro
                      ? styles.itemLinhaEquipadoOutro
                      : ''
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
                          <Badge variant="ether" size="sm">
                            Equipado em: {formatarNomeSlot(slotOcupado)}
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">Na Mochila</Badge>
                        )}
                      </div>

                      {/* Resumo de atributos/efeitos */}
                      <div className={styles.itemStatsResumo}>
                        {stats.precisao && <span>Precisão: {stats.precisao} | </span>}
                        {stats.dano && <span>Dano: {stats.dano} [{stats.tipo_dano || 'Físico'}] | </span>}
                        {stats.defesa && <span>DEF: {stats.defesa} | </span>}
                        {stats.defesa_magica && <span>M.DEF: {stats.defesa_magica} | </span>}
                        {stats.qualidade && <span>{stats.qualidade}</span>}
                      </div>
                    </div>
                  </div>

                  <div className={styles.itemAcoes}>
                    {estaEquipadoAqui ? (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => onDesequipar(item)}
                      >
                        Desequipar
                      </Button>
                    ) : estaEquipadoOutro ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onTrocarRapido(item, slotAlvo)}
                        title="Move este item diretamente para este slot sem precisar desequipar antes"
                      >
                        <FaExchangeAlt /> Trocar para Cá
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="core"
                        size="sm"
                        onClick={() => onEquipar(item, slotAlvo)}
                      >
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
