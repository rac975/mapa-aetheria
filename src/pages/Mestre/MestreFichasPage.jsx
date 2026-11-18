import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaUserPlus } from 'react-icons/fa';
import { LuUsers } from 'react-icons/lu';
import { fichaService } from '../../services/fichaService';
import { playerSessionService } from '../../services/playerSessionService';
import { useToast } from '../../contexts/ToastContext';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import { calcularStatusPersonagem } from '../../utils/calculosFicha';
import { baixarQRCodeSvg } from '../../utils/qrDownload';
import { Button, LoadingScreen } from '../../components/ui';
import MestreFichaCard from './components/MestreFichaCard';
import CriarCrachaModal from './components/CriarCrachaModal';
import styles from './MestreFichasPage.module.css';

/**
 * Processa a ficha calculando os tetos reais de PV, PM e PI (Fabula Ultima)
 */
function processarFicha(ficha) {
  const itensEquipados = (ficha.itens || []).filter((i) => i.stats_personalizados?.slot);
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
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });
  const { coldDelete } = useToast();
  const navigate = useNavigate();

  const modoMestreAtivo = Boolean(isMestre || playerSessionService.isGodModeAtivo());

  const carregarTodasFichas = useCallback(async () => {
    try {
      const fichasData = await fichaService.getFichasCompletasMestre();
      setFichas((fichasData || []).map(processarFicha));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (modoMestreAtivo) {
      playerSessionService.ativarGodMode();
    }
    carregarTodasFichas();

    const canalFichas = fichaService.subscribeFichasPersonagens((payload) => {
      if (payload?.eventType === 'UPDATE' && payload?.new) {
        setFichas((fichasAtuais) =>
          fichasAtuais.map((f) => (f.id === payload.new.id ? processarFicha({ ...f, ...payload.new }) : f))
        );
      } else {
        carregarTodasFichas();
      }
    });

    return () => {
      fichaService.removeChannel(canalFichas);
    };
  }, [modoMestreAtivo, carregarTodasFichas]);

  const handleCriarFicha = async ({ nomeJogador, nomePersonagem, registroId }) => {
    const tokenNormalizado = playerSessionService.normalizarToken(registroId);
    if (!nomeJogador || !nomePersonagem || !tokenNormalizado) return;

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
      nome_jogador: nomeJogador,
      nome_personagem: nomePersonagem,
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
    const tokensExistentes = fichas.map((f) => f.jogador_token).filter(Boolean);
    const novoToken = playerSessionService.gerarTokenUnico(
      ficha.nome_personagem,
      tokensExistentes.concat([ficha.jogador_token])
    );
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
        setFichas((prev) => prev.filter((f) => f.id !== it.id));
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

  const handleBaixarQr = (personagemNome, svgElement, opcoes = {}) => {
    baixarQRCodeSvg(personagemNome, svgElement, { tamanhoDesejado: 512, ...opcoes });
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
              onBaixarQr={handleBaixarQr}
              onRotacionarToken={handleRotacionarToken}
              onDeletarFicha={handleDeletarFicha}
            />
          ))}
        </div>
      )}

      {modalCriarAberto && (
        <CriarCrachaModal
          isOpen={modalCriarAberto}
          onClose={() => setModalCriarAberto(false)}
          onCriarFicha={handleCriarFicha}
          fichasExistentes={fichas}
        />
      )}

      <CustomAlert
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />
    </div>
  );
}
