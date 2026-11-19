import { FaShieldAlt, FaHandHolding, FaRing, FaSkull, FaBrain } from 'react-icons/fa';
import { SLOTS_EQUIPAMENTO, isArmaDuasMaos } from '../../../domain/fabula/equipmentRules';
import { normalizarTextoHF } from '../../../domain/fabula/highFantasyRules';
import { useEquipamentosSecao } from '../../../hooks/useEquipamentosSecao';
import { Card, Button, Badge, Modal, LoadingScreen } from '../../../components/ui';
import FichaArmasVeiculoSecao from './FichaArmasVeiculoSecao';
import FichaSlotMaoVazia from './components/FichaSlotMaoVazia';
import FichaSlotEquipado from './components/FichaSlotEquipado';
import FichaSinergiasAtaqueBar from './components/FichaSinergiasAtaqueBar';
import FichaMochilaLista from './components/FichaMochilaLista';
import FichaEquiparModal from './components/FichaEquiparModal';
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
  const {
    itensInventario,
    carregando,
    modalSlotAberto,
    setModalSlotAberto,
    itemParaEquiparDireto,
    setItemParaEquiparDireto,
    modoAtaqueState,
    setModoAtaqueState,
    resultadosRolagem,
    opcoesTaticas,
    toggles,
    getItemNoSlot,
    desequiparItem,
    trocarRapidoItem,
    equiparItemNoSlot,
    lidarComCliqueEquipar,
    deletarItem,
    executarRolagemArma
  } = useEquipamentosSecao({
    fichaId,
    atributosAtuais,
    classes,
    opcoesGolpeAtivo,
    limparGolpeAtivo,
    emCriseGlobal,
    statusFicha
  });

  if (carregando) return <LoadingScreen subblock mensagem="Carregando equipamentos do herói..." />;

  const slotConfig = [
    { id: SLOTS_EQUIPAMENTO.MAO_DOMINANTE, label: 'Mão Dominante', icone: <FaHandHolding /> },
    { id: SLOTS_EQUIPAMENTO.MAO_SECUNDARIA, label: 'Mão Não Dominante / Escudo', icone: <FaShieldAlt /> },
    { id: SLOTS_EQUIPAMENTO.ARMADURA, label: 'Armadura', icone: <FaShieldAlt /> },
    { id: SLOTS_EQUIPAMENTO.ACESSORIO, label: 'Acessório', icone: <FaRing /> }
  ];

  const bonusPrecisaoSinergiaVeicular =
    (opcoesTaticas.focoCognitivoAtivo && toggles.usarFocoCognitivo ? opcoesTaticas.bonusFocoTeste : 0) +
    (opcoesTaticas.temSimboloVerdadeCena && toggles.usarSimboloVerdade ? 2 : 0);

  return (
    <div className={styles.container}>
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

        {opcoesTaticas.temPsicocinese && (
          <div className={styles.psicocineseBar}>
            <div className={styles.psicocineseInfo}>
              <FaBrain className={styles.psicocineseIcon} />
              <span>
                <strong>Psicocinese:</strong> Substitui um dado de atributo por Vontade (VON).
              </span>
            </div>
            <Button
              type="button"
              variant={toggles.usarPsicocinese ? 'core' : 'secondary'}
              size="sm"
              onClick={() => toggles.setUsarPsicocinese((prev) => !prev)}
            >
              {toggles.usarPsicocinese ? 'VON Ativo' : 'Ativar VON'}
            </Button>
          </div>
        )}

        <FichaSinergiasAtaqueBar opcoesTaticas={opcoesTaticas} toggles={toggles} />

        <div className={styles.slotsGrid}>
          {slotConfig.map((slot) => {
            const itemEquipado = getItemNoSlot(slot.id);
            const ehSlotMao = slot.id === SLOTS_EQUIPAMENTO.MAO_DOMINANTE || slot.id === SLOTS_EQUIPAMENTO.MAO_SECUNDARIA;

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
                  setModoAtaque={(modo) => setModoAtaqueState((prev) => ({ ...prev, [slot.id]: modo }))}
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
                    setModoAtual={(modo) => setModoAtaqueState((prev) => ({ ...prev, [slot.id]: modo }))}
                    onExecutarRolagem={executarRolagemArma}
                    onTrocar={() => setModalSlotAberto(slot.id)}
                    onDesequipar={() => desequiparItem(itemEquipado)}
                  />
                ) : (
                  <div className={styles.slotEmpty}>
                    <span className={styles.slotEmptyText}>Vazio</span>
                    <Button type="button" variant="core" size="sm" onClick={() => setModalSlotAberto(slot.id)}>
                      + Equipar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <FichaMochilaLista
        itensInventario={itensInventario}
        onDesequipar={desequiparItem}
        onEquipar={lidarComCliqueEquipar}
        onDeletar={deletarItem}
      />

      {statusFicha?.veiculoAtivo && statusFicha?.dadosVeiculo && (
        <FichaArmasVeiculoSecao
          dadosVeiculo={statusFicha.dadosVeiculo}
          atributos={atributosAtuais}
          nvPulsoFirme={
            (classes.find((c) => normalizarTextoHF(c.nome_classe || '').includes('pilot'))?.habilidades || [])
              .find((h) => normalizarTextoHF(h.nome || '').includes('pulso firme'))?.nivel || 0
          }
          bonusPrecisaoSinergia={bonusPrecisaoSinergiaVeicular}
          bonusDanoSinergia={opcoesTaticas.bonusDanoDecreto}
        />
      )}

      <FichaEquiparModal
        isOpen={!!modalSlotAberto}
        onClose={() => setModalSlotAberto(null)}
        slotAlvo={modalSlotAberto}
        slotConfig={slotConfig}
        itensInventario={itensInventario}
        classes={classes}
        onEquipar={equiparItemNoSlot}
        onDesequipar={desequiparItem}
        onTrocarRapido={trocarRapidoItem}
      />

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
