import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from './services/supabase';
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
import './App.css';

function App() {
  const [iniciado, setIniciado] = useState(false);
  const [session, setSession] = useState(null);
  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  const [modalSettingsAberto, setModalSettingsAberto] = useState(false); // Estado para o modal de Configurações

  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isMestre = !!session;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {!iniciado && <BootScreen onComplete={() => setIniciado(true)} />}
      <div className={`app-container ${iniciado ? 'visivel' : 'oculto'}`}>
        <div className="app-layout">
          <Sidebar
            isMestre={isMestre}
            onOpenLogin={() => setModalLoginAberto(true)}
            onLogout={handleLogout}
            onOpenSettings={() => setModalSettingsAberto(true)} // Abre as configurações ao clicar no botão da sidebar
          />

          <main className="main-content view-transition" key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<MapPage isMestre={isMestre} />} />
              <Route path="/cronicas" element={<CronicasPage isMestre={isMestre} />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/combate" element={<CombatPage isMestre={isMestre} />} />
              <Route path="/mestre/fichas" element={<MestreFichasPage isMestre={isMestre} />} />
              <Route path="/mestre/editar/:id" element={<FichaPage isMestre={isMestre} />} />
              <Route path="/ficha/login" element={<FichaLoginPage />} /> {/* Opcional para separar */}
              <Route path="/ficha" element={<FichaPage isMestre={isMestre} />} />
              <Route path="/ficha/:id" element={<FichaPage isMestre={isMestre} />} />
            </Routes>
          </main>

          <LoginModal
            isOpen={modalLoginAberto}
            onClose={() => setModalLoginAberto(false)}
          />

          {/* Renderiza o modal de Configurações / Som quando acionado */}
          {modalSettingsAberto && (
            <SettingsPage onClose={() => setModalSettingsAberto(false)} />
          )}
        </div>
      </div>
    </>
  );
}

export default App;