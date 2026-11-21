import { useState } from 'react';
import AddParticipantForm from './AddParticipantForm';

export default function AddParticipantContainer({
  isMestre,
  mostrarFormAdicao,
  participantesLength = 0,
  fichasDisponiveis = [],
  npcsDisponiveis = [],
  onAddParticipante
}) {
  const [novoTipo, setNovoTipo] = useState('heroi');
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState('');
  const [nomeInimigo, setNomeInimigo] = useState('');
  const [hpMaxInput, setHpMaxInput] = useState(30);
  const [mpMaxInput, setMpMaxInput] = useState(20);
  const [tipoVilaoInput, setTipoVilaoInput] = useState('padrao');
  const [voadorInput, setVoadorInput] = useState(false);
  const [npcCatalogoSelecionado, setNpcCatalogoSelecionado] = useState(null);

  const exibirPainel = isMestre && (mostrarFormAdicao || participantesLength === 0);
  if (!exibirPainel) return null;

  const idFichaAtual = fichaSelecionadaId || (fichasDisponiveis.length > 0 ? fichasDisponiveis[0].id : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const acoesDefault = tipoVilaoInput === 'soberano' ? 3 : (tipoVilaoInput === 'elite' || tipoVilaoInput === 'campeao') ? 2 : 1;
    const sucesso = await onAddParticipante?.({
      tipo: novoTipo,
      fichaSelecionadaId: idFichaAtual,
      nomeInimigo,
      hpMaxInput,
      mpMaxInput,
      tipoVilaoInput,
      acoesPorTurnoInput: acoesDefault,
      voadorInput,
      npcCatalogoSelecionado
    });
    if (sucesso) {
      setNomeInimigo('');
      setVoadorInput(false);
    }
  };

  return (
    <AddParticipantForm
      novoTipo={novoTipo}
      setNovoTipo={setNovoTipo}
      fichaSelecionadaId={idFichaAtual}
      setFichaSelecionadaId={setFichaSelecionadaId}
      fichasDisponiveis={fichasDisponiveis}
      npcsDisponiveis={npcsDisponiveis}
      nomeInimigo={nomeInimigo}
      setNomeInimigo={setNomeInimigo}
      hpMaxInput={hpMaxInput}
      setHpMaxInput={setHpMaxInput}
      mpMaxInput={mpMaxInput}
      setMpMaxInput={setMpMaxInput}
      tipoVilaoInput={tipoVilaoInput}
      setTipoVilaoInput={setTipoVilaoInput}
      voadorInput={voadorInput}
      setVoadorInput={setVoadorInput}
      onAddParticipante={handleSubmit}
      onSelecionarNpcCatalogo={(npc) => {
        setNpcCatalogoSelecionado(npc);
        setNomeInimigo('');
      }}
    />
  );
}
