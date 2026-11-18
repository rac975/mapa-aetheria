import { useState } from 'react';
import { FaDice } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import { Modal, Button, Input } from '../../../components/ui';
import { playerSessionService } from '../../../services/playerSessionService';
import styles from '../MestreFichasPage.module.css';

export default function CriarCrachaModal({
  isOpen,
  onClose,
  onCriarFicha,
  fichasExistentes = []
}) {
  const [nomeJogador, setNomeJogador] = useState('');
  const [nomePersonagem, setNomePersonagem] = useState('');
  const [registroId, setRegistroId] = useState('');

  const limparCampos = () => {
    setNomeJogador('');
    setNomePersonagem('');
    setRegistroId('');
  };

  const handleClose = () => {
    limparCampos();
    onClose();
  };

  const gerarIdAutomatico = (nome, tokenExtraIgnorar = null) => {
    if (!nome?.trim()) return '';
    const tokensExistentes = fichasExistentes
      .map((f) => f.jogador_token)
      .concat(tokenExtraIgnorar ? [tokenExtraIgnorar] : [])
      .filter(Boolean);
    return playerSessionService.gerarTokenUnico(nome, tokensExistentes);
  };

  const handleNomePersonagemChange = (e) => {
    const novoNome = e.target.value;
    setNomePersonagem(novoNome);
    setRegistroId(gerarIdAutomatico(novoNome));
  };

  const handleRegistroIdChange = (e) => {
    setRegistroId(playerSessionService.aplicarMascaraToken(e.target.value));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!nomeJogador.trim() || !nomePersonagem.trim() || !registroId.trim()) return;

    onCriarFicha({
      nomeJogador: nomeJogador.trim(),
      nomePersonagem: nomePersonagem.trim(),
      registroId: registroId.trim()
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Emitir Novo Crachá de Aetheria"
      size="md"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            <LuSparkles /> Gerar Crachá
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.modalForm}>
        <Input
          label="Nome do Jogador (Real)"
          placeholder="Ex: Rafael"
          value={nomeJogador}
          onChange={(e) => setNomeJogador(e.target.value)}
          required
        />

        <Input
          label="Nome do Personagem"
          placeholder="Ex: Cyrion"
          value={nomePersonagem}
          onChange={handleNomePersonagemChange}
          required
        />

        <div className={styles.inputWithAction}>
          <Input
            label="REGISTRO ID (Automático)"
            value={registroId}
            onChange={handleRegistroIdChange}
            className={styles.inputFlex}
            required
          />
          <Button
            type="button"
            variant="secondary"
            className={styles.diceBtn}
            title="Gerar novo código aleatório único"
            onClick={() => setRegistroId(gerarIdAutomatico(nomePersonagem, registroId))}
          >
            <FaDice />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
