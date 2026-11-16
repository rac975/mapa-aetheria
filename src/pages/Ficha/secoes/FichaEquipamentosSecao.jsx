import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaShieldAlt, FaHandHolding, FaRing, FaTimes, FaExchangeAlt, FaBoxOpen, FaDice, FaBolt, FaSkull, FaBrain } from 'react-icons/fa';
import { fichaService } from '../../../services/fichaService';
import {
  SLOTS_EQUIPAMENTO,
  validarSlotEquipamento,
  isArmaDuasMaos
} from '../../../domain/fabula/equipmentRules';
import { rolarAtaqueEDanoArma } from '../../../utils/calculosFicha';
import { Card, Button, Badge, Modal } from '../../../components/ui';
import FichaArmasVeiculoSecao from './FichaArmasVeiculoSecao';
import FichaSlotMaoVazia from './components/FichaSlotMaoVazia';
import FichaSlotEquipado from './components/FichaSlotEquipado';
import styles from './FichaEquipamentosSecao.module.css';

export default function FichaEquipamentosSecao({
  fichaId,
  atributosAtuais = {},
  classes = [],
  opcoesGolpeAtivo = null,
  limparGolpeAtivo = null,
  emCriseGlobal = false,
  statusFicha = null,
  onAtualizarMutante = null
}) {
  const [itensInventario, setItensInventario] = useState([]);
  const [modalSlotAberto, setModalSlotAberto] = useState(null);
  const [itemParaEquiparDireto, setItemParaEquiparDireto] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [modoAtaqueState, setModoAtaqueState] = useState({
    mao_dominante: 'normal',
    mao_secundaria: 'normal'
  });

  const [resultadosRolagem, setResultadosRolagem] = useState({});

  // Verifica se o personagem possui a habilidade Psicocinese (classe Esper)
  const temPsicocinese = useMemo(() => {
    return (classes || []).some(c =>
      (c.habilidades || []).some(h => {
        const nomeNorm = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const nv = parseInt(h.nivel, 10) || 0;
        return nomeNorm.includes('psicocinese') && nv > 0;
      })
    );
  }, [classes]);

  const [usarPsicocinese, setUsarPsicocinese] = useState(false);

  const carregarItens = useCallback(async () => {
    if (!fichaId) {
      setCarregando(false);
      return;
    }
    try {
      const data = await fichaService.getItensByFichaId(fichaId);
      setItensInventario(data || []);
    } catch (error) {
      console.error("❌ Erro ao carregar itens_personagem:", error.message);
    } finally {
      setCarregando(false);
    }
  }, [fichaId]);

  useEffect(() => {
    let ativo = true;
    const sincronizar = async () => {
      if (!fichaId) {
        if (ativo) setCarregando(false);
        return;
      }
      await carregarItens();
    };
    sincronizar();

    if (!fichaId) return;

    const channel = fichaService.subscribeItens(fichaId, () => {
      carregarItens();
    });

    return () => {
      ativo = false;
      fichaService.removeChannel(channel);
    };
  }, [fichaId, carregarItens]);

  const getItemNoSlot = (slotName) => itensInventario.find(i => i.stats_personalizados?.slot === slotName);
  const itensMochila = itensInventario.filter(i => !i.stats_personalizados?.slot);

  const desequiparItem = async (item) => {
    const novosStats = { ...(item.stats_personalizados || {}) };
    delete novosStats.slot;
    try {
      await fichaService.atualizarItemPersonagem(item.id, {
        equipado: false,
        stats_personalizados: novosStats
      });
      carregarItens();
    } catch (err) {
      console.error("Erro ao desequipar item:", err);
    }
  };

  const equiparItemNoSlot = async (item, slotAlvo) => {
    const validacao = validarSlotEquipamento({ item, slotAlvo, classes });
    if (!validacao.permitido) {
      alert(validacao.motivo);
      return;
    }

    const ehDuasMaos = isArmaDuasMaos(item);
    const itemAtualNoSlot = getItemNoSlot(slotAlvo);
    if (itemAtualNoSlot) {
      await desequiparItem(itemAtualNoSlot);
    }

    const slotParaSalvar = ehDuasMaos ? SLOTS_EQUIPAMENTO.MAO_DOMINANTE : slotAlvo;
    const novosStats = { ...(item.stats_personalizados || {}), slot: slotParaSalvar };

    try {
      await fichaService.atualizarItemPersonagem(item.id, {
        equipado: true,
        stats_personalizados: novosStats
      });

      if (ehDuasMaos) {
        const outraMao = getItemNoSlot(SLOTS_EQUIPAMENTO.MAO_SECUNDARIA);
        if (outraMao) await desequiparItem(outraMao);
      }
      setModalSlotAberto(null);
      setItemParaEquiparDireto(null);
      carregarItens();
    } catch (error) {
      alert("Erro ao equipar item: " + error.message);
    }
  };

  const lidarComCliqueEquipar = (item) => {
    const tipoItem = (item.tipo || '').toLowerCase();
    if (tipoItem.includes('armadura')) {
      equiparItemNoSlot(item, SLOTS_EQUIPAMENTO.ARMADURA);
      return;
    }
    if (tipoItem.includes('acessorio') || tipoItem.includes('acessório')) {
      equiparItemNoSlot(item, SLOTS_EQUIPAMENTO.ACESSORIO);
      return;
    }
    if (tipoItem.includes('escudo')) {
      equiparItemNoSlot(item, SLOTS_EQUIPAMENTO.MAO_SECUNDARIA);
      return;
    }
    setItemParaEquiparDireto(item);
  };

  const deletarItem = async (itemId) => {
    if (!window.confirm("Deseja realmente descartar este item do inventário?")) return;
    try {
      await fichaService.deletarItemPersonagem(itemId);
      carregarItens();
    } catch (err) {
      console.error("Erro ao deletar item:", err);
    }
  };

  const executarRolagemArma = (itemArma, slotId) => {
    const isMulti = modoAtaqueState[slotId] === 'multi';
    const resultadoCalculado = rolarAtaqueEDanoArma(
      itemArma,
      atributosAtuais,
      isMulti,
      classes,
      itensInventario,
      {
        ...(opcoesGolpeAtivo || {}),
        usarPsicocinese
      },
      emCriseGlobal
    );

    const usandoGolpe = !!(opcoesGolpeAtivo && opcoesGolpeAtivo.usandoGolpeDasSombras);
    setResultadosRolagem(prev => ({
      ...prev,
      [slotId]: {
        ...resultadoCalculado,
        usandoGolpe,
        usandoPsicocinese,
        danoExtraGolpe: resultadoCalculado.danoExtraHabilidade || 0
      }
    }));

    if (usandoGolpe && limparGolpeAtivo) {
      limparGolpeAtivo();
    }
  };

  if (carregando) return <div className={styles.loadingText}>Carregando equipamentos...</div>;

  const slotConfig = [
    { id: SLOTS_EQUIPAMENTO.MAO_DOMINANTE, label: 'Mão Dominante', icone: <FaHandHolding /> },
    { id: SLOTS_EQUIPAMENTO.MAO_SECUNDARIA, label: 'Mão Não Dominante / Escudo', icone: <FaHandHolding /> },
    { id: SLOTS_EQUIPAMENTO.ARMADURA, label: 'Armadura', icone: <FaShieldAlt /> },
    { id: SLOTS_EQUIPAMENTO.ACESSORIO, label: 'Acessório', icone: <FaRing /> }
  ];

  return (
    <div className={styles.container}>
      {/* 1. SEÇÃO DE SLOTS EQUIPADOS */}
      <Card variant="default">
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <FaShieldAlt /> Itens Equipados
          </h3>
          {opcoesGolpeAtivo && (
            <Badge variant="core" size="sm" className={styles.golpeArmadoBadge}>
              <FaSkull /> Golpe das Sombras Armado (Trevas)
            </Badge>
          )}
        </div>

        {temPsicocinese && (
          <div className={styles.psicocineseBar}>
            <div className={styles.psicocineseInfo}>
              <FaBrain className={styles.psicocineseIcon} />
              <span>
                <strong>Psicocinese:</strong> Substitui um dado de atributo por Vontade (VON).
              </span>
            </div>
            <Button
              type="button"
              variant={usarPsicocinese ? 'core' : 'secondary'}
              size="sm"
              onClick={() => setUsarPsicocinese(prev => !prev)}
            >
              {usarPsicocinese ? 'VON Ativo' : 'Ativar VON'}
            </Button>
          </div>
        )}

        <div className={styles.slotsGrid}>
          {slotConfig.map(slot => {
            const itemEquipado = getItemNoSlot(slot.id);
            const ehSlotMao = slot.id === SLOTS_EQUIPAMENTO.MAO_DOMINANTE || slot.id === SLOTS_EQUIPAMENTO.MAO_SECUNDARIA;

            // Mão vazia: renderiza Ataque Desarmado e Arma Improvisada oficiais de Fabula Ultima
            if (!itemEquipado && ehSlotMao) {
              const itemMaoDom = getItemNoSlot(SLOTS_EQUIPAMENTO.MAO_DOMINANTE);
              const ocupadoPor2H = slot.id === SLOTS_EQUIPAMENTO.MAO_SECUNDARIA && itemMaoDom && isArmaDuasMaos(itemMaoDom);

              return (
                <FichaSlotMaoVazia
                  key={slot.id}
                  slotId={slot.id}
                  slotLabel={slot.label}
                  slotIcon={slot.icone}
                  isOcupadoPor2H={ocupadoPor2H}
                  classes={classes}
                  onAbrirModalEquipar={() => setModalSlotAberto(slot.id)}
                  onExecutarRolagem={(itemVirtual, slotId) => executarRolagemArma(itemVirtual, slotId)}
                  ultimaRolagem={resultadosRolagem[slot.id]}
                  modoAtaque={modoAtaqueState[slot.id] || 'normal'}
                  setModoAtaque={(modo) => setModoAtaqueState(prev => ({ ...prev, [slot.id]: modo }))}
                  onAtualizarMutante={onAtualizarMutante}
                />
              );
            }

            return (
              <div key={slot.id} className={styles.slotBox}>
                <div className={styles.slotHeader}>
                  {slot.icone} <span>{slot.label}</span>
                </div>

                {itemEquipado ? (
                  <FichaSlotEquipado
                    slot={slot}
                    itemEquipado={itemEquipado}
                    classes={classes}
                    ultimaRolagem={resultadosRolagem[slot.id]}
                    modoAtual={modoAtaqueState[slot.id] || 'normal'}
                    setModoAtual={(modo) => setModoAtaqueState(prev => ({ ...prev, [slot.id]: modo }))}
                    onExecutarRolagem={executarRolagemArma}
                    onTrocar={() => setModalSlotAberto(slot.id)}
                    onDesequipar={() => desequiparItem(itemEquipado)}
                  />
                ) : (
                  <div className={styles.slotEmpty}>
                    <span className={styles.slotEmptyText}>Vazio</span>
                    <Button
                      type="button"
                      variant="core"
                      size="sm"
                      onClick={() => setModalSlotAberto(slot.id)}
                    >
                      + Equipar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. SEÇÃO DE MOCHILA & INVENTÁRIO */}
      <Card variant="default">
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <FaBoxOpen /> Mochila & Inventário ({itensInventario.length})
          </h3>
        </div>

        {itensInventario.length === 0 ? (
          <p className={styles.mochilaVazia}>Sua mochila está vazia.</p>
        ) : (
          <div className={styles.mochilaLista}>
            {itensInventario.map((item) => {
              const estaEquipado = !!item.stats_personalizados?.slot;
              return (
                <div key={item.id} className={styles.mochilaItem}>
                  <div className={styles.mochilaItemDetails}>
                    <span className={styles.mochilaItemNome}>{item.nome}</span>
                    {item.tipo && <Badge variant="gold" size="sm">{item.tipo}</Badge>}
                    <Badge variant={estaEquipado ? 'core' : 'default'} size="sm">
                      {estaEquipado ? `Equipado (${item.stats_personalizados.slot.replace('_', ' ')})` : 'Na Mochila'}
                    </Badge>
                  </div>

                  <div className={styles.mochilaItemActions}>
                    {estaEquipado ? (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => desequiparItem(item)}
                      >
                        Desequipar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="core"
                        size="sm"
                        onClick={() => lidarComCliqueEquipar(item)}
                      >
                        Equipar
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deletarItem(item.id)}
                      title="Descartar item"
                    >
                      <FaTimes />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* SEÇÃO DE ARMAS VEICULARES SE O VEÍCULO ESTIVER OPERACIONAL/ATIVO */}
      {statusFicha?.veiculoAtivo && statusFicha?.dadosVeiculo && (
        <FichaArmasVeiculoSecao
          dadosVeiculo={statusFicha.dadosVeiculo}
          atributos={atributosAtuais}
          nvPulsoFirme={
            (classes.find(c =>
              (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('pilot')
            )?.habilidades || []).find(h =>
              (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('pulso firme')
            )?.nivel || 0
          }
        />
      )}

      {/* MODAL 1: Escolher Item da Mochila */}
      <Modal
        isOpen={!!modalSlotAberto}
        onClose={() => setModalSlotAberto(null)}
        title="Escolher item da Mochila"
        size="md"
      >
        <div className={styles.modalItensLista}>
          {itensMochila.length === 0 ? (
            <p className={styles.mochilaVazia}>Sua mochila está sem itens disponíveis.</p>
          ) : (
            itensMochila.map(item => (
              <div key={item.id} className={styles.modalItemLinha}>
                <div>
                  <div className={styles.itemNome}>{item.nome}</div>
                  <Badge variant="default" size="sm">Tipo: {item.tipo}</Badge>
                </div>
                <Button
                  type="button"
                  variant="core"
                  size="sm"
                  onClick={() => equiparItemNoSlot(item, modalSlotAberto)}
                >
                  Equipar Aqui
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* MODAL 2: Escolher Mão */}
      <Modal
        isOpen={!!itemParaEquiparDireto}
        onClose={() => setItemParaEquiparDireto(null)}
        title={`Escolher Mão para ${itemParaEquiparDireto?.nome || 'Item'}`}
        size="sm"
      >
        <div className={styles.modalMaoOpcoes}>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => equiparItemNoSlot(itemParaEquiparDireto, SLOTS_EQUIPAMENTO.MAO_DOMINANTE)}
          >
            ⚔️ Mão Dominante
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => equiparItemNoSlot(itemParaEquiparDireto, SLOTS_EQUIPAMENTO.MAO_SECUNDARIA)}
          >
            🛡️ Mão Não Dominante / Escudo
          </Button>
        </div>
      </Modal>
    </div>
  );
}
