import React from 'react';
import { FaCheck } from 'react-icons/fa';
import PilotoHeader from './PilotoHeader';
import PilotoEstruturaCard from './PilotoEstruturaCard';
import PilotoStatsVeiculo from './PilotoStatsVeiculo';
import PilotoModulosAtivos from './PilotoModulosAtivos';
import PilotoModulosReserva from './PilotoModulosReserva';
import PilotoCatalogoModal from './PilotoCatalogoModal';
import { usePilotoVeiculo } from './usePilotoVeiculo';
import styles from './ExibirPiloto.module.css';

export default function ExibirPiloto(props) {
  const {
    catalogoEstruturas,
    catalogoModulos,
    nomeVeiculo,
    setNomeVeiculo,
    frameKey,
    setFrameKey,
    modulosAtivos,
    modulosReserva,
    modulosAdquiridos,
    zenitAtual,
    customizacoes,
    veiculoInvocado,
    custoCompressao,
    modalCatalogoAberto,
    setModalCatalogoAberto,
    salvando,
    salvoSucesso,
    feedback,
    stats,
    atributos,
    nivelPiloto,
    slVeiculoPessoal,
    nvConfigFlexivel,
    nvPulsoFirme,
    nvCoracao,
    totalModulosPermitidos,
    handleAtivarModulo,
    handleDesativarModulo,
    handleAdicionarAoHangar,
    handleComprarModulo,
    handleRemoverDaReserva,
    handleChangeCustomizacao,
    handleAlternarCompressao,
    handleAtivarCoracao,
    handleSalvarVeiculo
  } = usePilotoVeiculo(props);

  return (
    <div className={styles.container}>
      <PilotoHeader
        nomeVeiculo={nomeVeiculo}
        onChangeNome={setNomeVeiculo}
        nivelPiloto={nivelPiloto}
        veiculoInvocado={veiculoInvocado}
        custoCompressao={custoCompressao}
        onAlternarCompressao={handleAlternarCompressao}
        onSalvar={handleSalvarVeiculo}
        salvando={salvando}
        salvoSucesso={salvoSucesso}
      />

      <PilotoEstruturaCard
        frameKey={frameKey}
        catalogoEstruturas={catalogoEstruturas}
        onChangeFrame={setFrameKey}
      />

      <PilotoStatsVeiculo
        stats={stats}
        atributos={atributos}
        customizacoes={customizacoes}
        onChangeCustomizacao={handleChangeCustomizacao}
        nvPulsoFirme={nvPulsoFirme}
        nvCoracao={nvCoracao}
        onAtivarCoracao={handleAtivarCoracao}
      />

      <PilotoModulosAtivos
        modulosAtivos={modulosAtivos}
        catalogoModulos={catalogoModulos}
        slotsUsados={stats.slotsUsados}
        slotsMaximos={stats.slotsMaximos}
        onDesativarModulo={handleDesativarModulo}
        nvConfigFlexivel={nvConfigFlexivel}
      />

      <PilotoModulosReserva
        modulosReserva={modulosReserva}
        modulosAtivos={modulosAtivos}
        catalogoModulos={catalogoModulos}
        totalModulosPermitidos={totalModulosPermitidos}
        slVeiculoPessoal={slVeiculoPessoal}
        onAtivarModulo={handleAtivarModulo}
        onRemoverDaReserva={handleRemoverDaReserva}
        onAbrirCatalogo={() => setModalCatalogoAberto(true)}
      />

      <PilotoCatalogoModal
        isOpen={modalCatalogoAberto}
        onClose={() => setModalCatalogoAberto(false)}
        catalogoModulos={catalogoModulos}
        modulosReserva={modulosReserva}
        modulosAtivos={modulosAtivos}
        modulosAdquiridos={modulosAdquiridos}
        zenitAtual={zenitAtual}
        onAdicionar={handleAdicionarAoHangar}
        onComprar={handleComprarModulo}
      />

      {feedback && (
        <div className={styles.feedbackBox}>
          <FaCheck /> {feedback}
        </div>
      )}
    </div>
  );
}
