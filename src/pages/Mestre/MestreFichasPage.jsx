import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaUserPlus, FaDice } from 'react-icons/fa';
import { LuUsers, LuSparkles } from 'react-icons/lu';
import { fichaService } from '../../services/fichaService';
import { playerSessionService } from '../../services/playerSessionService';
import { useToast } from '../../contexts/ToastContext';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import { calcularStatusPersonagem } from '../../utils/calculosFicha';
import { Button, Input, Modal, LoadingScreen } from '../../components/ui';
import MestreFichaCard from './components/MestreFichaCard';
import styles from './MestreFichasPage.module.css';

/**
 * Processa a ficha calculando os tetos reais de PV, PM e PI (Fabula Ultima)
 */
function processarFicha(ficha) {
  const itens = ficha.itens || [];
  const itensEquipados = itens.filter(i => i.stats_personalizados?.slot);

  const atributos = {
    destreza: ficha.destreza || 8,
    astucia: ficha.astucia || 8,
    vigor: ficha.vigor || 8,
    vontade: ficha.vontade || 8
  };

  const statusCalc = calcularStatusPersonagem(atributos, ficha.fichas_classes || [], itensEquipados, ficha);

  return {
    ...ficha,
    hp_max_real: statusCalc.pvMax,
    mp_max_real: statusCalc.mpMax,
    ip_max_real: statusCalc.piMax,
    pi_max_real: statusCalc.piMax
  };
}

export default function MestreFichasPage({ isMestre }) {
  const [fichas, setFichas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const { coldDelete } = useToast();

  const [nomeJogador, setNomeJogador] = useState('');
  const [nomePersonagem, setNomePersonagem] = useState('');
  const [registroId, setRegistroId] = useState('');

  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });
  const navigate = useNavigate();

  const modoMestreAtivo = Boolean(isMestre || playerSessionService.isGodModeAtivo());

  const carregarTodasFichas = useCallback(async () => {
    try {
      const fichasData = await fichaService.getFichasCompletasMestre();
      const fichasCompletas = (fichasData || []).map(processarFicha);
      setFichas(fichasCompletas);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (modoMestreAtivo) {
      playerSessionService.ativarGodMode();
    }
    carregarTodasFichas();

    // Subscription em tempo real para sincronização instantânea de PV, PM, PI e dados da ficha
    const canalFichas = fichaService.subscribeFichasPersonagens((payload) => {
      if (payload?.eventType === 'UPDATE' && payload?.new) {
        setFichas((fichasAtuais) =>
          fichasAtuais.map((f) => {
            if (f.id === payload.new.id) {
              return processarFicha({
                ...f,
                ...payload.new
              });
            }
            return f;
          })
        );
      } else {
        carregarTodasFichas();
      }
    });

    return () => {
      fichaService.removeChannel(canalFichas);
    };
  }, [modoMestreAtivo, carregarTodasFichas]);

  const gerarIdAutomatico = (nome, tokenExtraIgnorar = null) => {
    if (!nome.trim()) return '';
    const tokensExistentes = fichas
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

  const handleCriarFicha = async (e) => {
    e.preventDefault();
    const tokenNormalizado = playerSessionService.normalizarToken(registroId);
    if (!nomeJogador.trim() || !nomePersonagem.trim() || !tokenNormalizado) return;

    // Verifica conflito de token com outras fichas já cadastradas na mesa
    const tokenDuplicado = fichas.some(
      (f) => playerSessionService.normalizarToken(f.jogador_token) === tokenNormalizado
    );
    if (tokenDuplicado) {
      setAlerta({
        isOpen: true,
        title: 'Conflito de Crachá',
        message: `O código "${tokenNormalizado}" já está em uso por outro personagem na mesa. Gere um novo código antes de emitir.`
      });
      return;
    }

    const { error } = await fichaService.criarFicha({
      nome_jogador: nomeJogador.trim(),
      nome_personagem: nomePersonagem.trim(),
      jogador_token: tokenNormalizado,
      identidade: 'Herói de Aetheria',
      tema: 'Aventura',
      hp_atual: 30,
      hp_max: 30,
      mp_atual: 20,
      mp_max: 20,
      pi_atual: 6,
      ip_atual: 6,
      pi_max: 6,
      nivel: 1
    });

    if (!error) {
      setNomeJogador('');
      setNomePersonagem('');
      setRegistroId('');
      setModalCriarAberto(false);
      carregarTodasFichas();
    } else {
      setAlerta({
        isOpen: true,
        title: 'Erro ao Emitir Crachá',
        message: `Não foi possível criar: ${error.message}`
      });
    }
  };

  const handleRotacionarToken = async (ficha) => {
    const novoToken = gerarIdAutomatico(ficha.nome_personagem, ficha.jogador_token);
    if (!novoToken) return;

    try {
      await fichaService.rotacionarTokenFicha(ficha.id, novoToken);
      await playerSessionService.revogarSessaoJogadorRealtime(ficha.id);
      setFichas((prev) =>
        prev.map((f) => (f.id === ficha.id ? { ...f, jogador_token: novoToken } : f))
      );
      setAlerta({
        isOpen: true,
        title: 'Crachá Renovado',
        message: `Novo código de ${ficha.nome_personagem}: ${novoToken}. Apenas este jogador foi solicitado a reconectar.`
      });
    } catch (err) {
      setAlerta({
        isOpen: true,
        title: 'Erro ao Renovar Crachá',
        message: err.message || 'Não foi possível atualizar o token.'
      });
    }
  };

  const handleDeletarFicha = (ficha, e) => {
    e.stopPropagation();
    coldDelete({
      item: ficha,
      message: (
        <>
          Ficha de <strong>{ficha.nome_personagem || 'Personagem'}</strong> foi removida.
        </>
      ),
      onRemove: (it) => {
        setFichas(prev => prev.filter(f => f.id !== it.id));
      },
      onCommit: async (it) => {
        await fichaService.deletarFicha(it.id);
        carregarTodasFichas();
      },
      onRollback: () => {
        carregarTodasFichas();
      },
      duration: 6000
    });
  };

  const baixarQRCode = (personagemNome, svgElement) => {
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `QRCode_${personagemNome.replace(/\s+/g, '_')}.svg`;

      document.body.appendChild(downloadLink);
      downloadLink.click();

      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar o download do QR Code:', error);
    }
  };

  if (!modoMestreAtivo) {
    return (
      <div className={styles.page}>
        <div className={styles.blockedContainer}>
          <FaShieldAlt className={styles.lockIcon} />
          <h2>Área Exclusiva do Mestre</h2>
          <p>Você precisa estar logado como Mestre para gerenciar os crachás e fichas da mesa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1><LuUsers /> Gestão de Fichas e Crachás</h1>
          <p>Visualize os dados dos heróis, baixe os QR Codes para crachás e gerencie a mesa.</p>
        </div>
        <Button variant="primary" onClick={() => setModalCriarAberto(true)}>
          <FaUserPlus /> Cadastrar Novo Crachá
        </Button>
      </header>

      {carregando ? (
        <LoadingScreen mensagem="Sincronizando fichas e crachás da mesa..." />
      ) : fichas.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhuma ficha cadastrada na mesa ainda.</p>
          <Button variant="secondary" onClick={() => setModalCriarAberto(true)}>
            Cadastrar Primeira Ficha
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {fichas.map((f) => (
            <MestreFichaCard
              key={f.id}
              ficha={f}
              onAbrirFicha={(fichaId) => navigate(`/mestre/editar/${fichaId}`)}
              onBaixarQr={baixarQRCode}
              onRotacionarToken={handleRotacionarToken}
              onDeletarFicha={handleDeletarFicha}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalCriarAberto}
        onClose={() => setModalCriarAberto(false)}
        title="Emitir Novo Crachá de Aetheria"
        size="md"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="secondary" onClick={() => setModalCriarAberto(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCriarFicha}>
              <LuSparkles /> Gerar Crachá
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCriarFicha} className={styles.modalForm}>
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

      <CustomAlert
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />
    </div>
  );
}
