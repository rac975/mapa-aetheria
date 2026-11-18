import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { playerSessionService } from './services/playerSessionService';
import { fichaService } from './services/fichaService';
import { usePlayerSession } from './hooks/usePlayerSession';
import { useDocumentTitleVisibility } from './hooks/useDocumentTitleVisibility';
import { ToastProvider } from './contexts/ToastContext';
import { AlertProvider } from './contexts/AlertContext';
import BootScreen from './components/BootScreen/BootScreen';
import Sidebar from './components/Sidebar/Sidebar';
import LoginModal from './components/LoginModal/LoginModal';
import SettingsPage from './pages/Settings/SettingsPage';
import MapPage from './pages/Map/MapPage';
import CronicasPage from './pages/Cronicas/CronicasPage';
import JournalPage from './pages/Journal/JournalPage';
import CombatPage from './pages/Combat/CombatPage';
import FichaPage from './pages/Ficha/FichaPage';
import MestreFichasPage from './pages/Mestre/MestreFichasPage';
import FichaLoginPage from './pages/Ficha/FichaLoginPage';
import LojaPage from './pages/Loja/LojaPage';
import ListaNPCsPage from './pages/Mestre/NPC/ListaNPCsPage';
import FichaNPCPage from './pages/Mestre/NPC/FichaNPCPage';
import DesignSystemPage from './pages/DesignSystem/DesignSystemPage';
import ProjetosPage from './pages/Projetos/ProjetosPage';
import './App.css';

function App() {
  useDocumentTitleVisibility();

  const [iniciado, setIniciado] = useState(false);
  const [isMestre, setIsMestre] = useState(() => playerSessionService.isGodModeAtivo());
  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  const [modalSettingsAberto, setModalSettingsAberto] = useState(false);

  // 1. Estado global para a Ficha e Zênites ativos na sessão do app
  const [fichaAtiva, setFichaAtiva] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // 2. Persistência e God Mode da sessão do Mestre (Item 6)
  useEffect(() => {
    let ativo = true;

    playerSessionService.getSessaoMestre().then((sessaoMestre) => {
      if (ativo) {
        setIsMestre(Boolean(sessaoMestre));
      }
    });

    const unsubscribe = playerSessionService.subscribeAuthMestre((_session, mestreAtivo) => {
      if (ativo) {
        setIsMestre(mestreAtivo);
      }
    });

    return () => {
      ativo = false;
      unsubscribe();
    };
  }, []);

  // Garante que o Mestre nunca permaneça na tela de login de jogador
  useEffect(() => {
    if (isMestre && location.pathname === '/ficha/login') {
      navigate('/mestre/fichas', { replace: true });
    }
  }, [isMestre, location.pathname, navigate]);

  // 3. Restaura a ficha ativa da sessão válida do jogador ao iniciar o app
  useEffect(() => {
    if (isMestre || fichaAtiva) return;

    const sessaoJogador = playerSessionService.obterSessao();
    if (!sessaoJogador?.token) return;

    const status = playerSessionService.verificarExpiracao({ isMestre: false });
    if (status.expirada) {
      playerSessionService.encerrarSessao({
        titulo: status.titulo,
        mensagem: status.mensagem,
        motivo: status.motivo
      });
      return;
    }

    let cancelado = false;
    fichaService
      .getFichaByIdOrToken({ id: sessaoJogador.fichaId, token: sessaoJogador.token })
      .then((dados) => {
        if (cancelado || !dados) return;
        const sincronia = playerSessionService.sincronizarSessaoAtiva(dados, { isMestre: false });
        if (sincronia.valida) {
          setFichaAtiva(dados);
        }
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [isMestre, fichaAtiva]);

  // 4. Controle global de sessão de jogador via Realtime/Token (Item 7)
  usePlayerSession({
    isMestre,
    fichaIdAtiva: fichaAtiva?.id || null,
    onSessaoExpirada: () => {
      if (isMestre || playerSessionService.isGodModeAtivo()) return;
      setFichaAtiva(null);
      if (location.pathname !== '/ficha/login') {
        navigate('/ficha/login', { replace: true });
      }
    },
    onFichaRealtimeUpdate: (novosDados) => {
      setFichaAtiva((prev) =>
        prev && String(prev.id) === String(novosDados.id) ? { ...prev, ...novosDados } : prev
      );
    }
  });

  const handleLogout = async () => {
    await playerSessionService.logoutMestre();
    setIsMestre(false);
  };

  return (
    <AlertProvider>
      <ToastProvider>
        {!iniciado && <BootScreen onComplete={() => setIniciado(true)} />}
        <div className={`app-container ${iniciado ? 'visivel' : 'oculto'}`}>
          <div className="app-layout">
            <Sidebar
              isMestre={isMestre}
              onOpenLogin={() => setModalLoginAberto(true)}
              onLogout={handleLogout}
              onOpenSettings={() => setModalSettingsAberto(true)}
            />

            <main className="main-content view-transition" key={location.pathname}>
              <Routes location={location}>
                <Route path="/" element={<MapPage isMestre={isMestre} />} />
                <Route path="/cronicas" element={<CronicasPage isMestre={isMestre} />} />
                <Route path="/journal" element={<JournalPage isMestre={isMestre} />} />
                <Route path="/combate" element={<CombatPage isMestre={isMestre} />} />
                <Route path="/projetos" element={<ProjetosPage isMestre={isMestre} />} />
                <Route path="/mestre/fichas" element={<MestreFichasPage isMestre={isMestre} />} />

                {/* 2. Passamos setFichaAtiva para o FichaPage atualizar qual personagem está em uso */}
                <Route path="/mestre/editar/:id" element={<FichaPage isMestre={isMestre} setFichaGlobal={setFichaAtiva} />} />
                <Route path="/ficha/login" element={<FichaLoginPage isMestre={isMestre} />} />
                <Route path="/ficha" element={<FichaPage isMestre={isMestre} setFichaGlobal={setFichaAtiva} />} />
                <Route path="/ficha/:id" element={<FichaPage isMestre={isMestre} setFichaGlobal={setFichaAtiva} />} />
                <Route path="/f/:id" element={<FichaPage isMestre={isMestre} setFichaGlobal={setFichaAtiva} />} />

                <Route path="/mestre/npcs" element={<ListaNPCsPage />} />
                <Route path="/mestre/npcs/:id" element={<FichaNPCPage />} />

                {/* 3. Passamos a ficha ativa e o setFicha por referência para a Loja */}
                <Route
                  path="/loja"
                  element={
                    <LojaPage
                      isMestre={isMestre}
                      ficha={fichaAtiva}
                      setFicha={setFichaAtiva}
                    />
                  }
                />

                {/* Rota temporária de visualização e teste do Design System */}
                <Route path="/design-system" element={<DesignSystemPage />} />
              </Routes>
            </main>

            <LoginModal
              isOpen={modalLoginAberto}
              onClose={() => setModalLoginAberto(false)}
            />

            {modalSettingsAberto && (
              <SettingsPage isMestre={isMestre} onClose={() => setModalSettingsAberto(false)} />
            )}
          </div>
        </div>
      </ToastProvider>
    </AlertProvider>
  );
}

export default App;
