import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from './services/supabase';
import BootScreen from './components/BootScreen/BootScreen';
import Sidebar from './components/Sidebar/Sidebar';
import LoginModal from './components/LoginModal/LoginModal';
import MapPage from './pages/Map/MapPage';
import CronicasPage from './pages/Cronicas/CronicasPage/CronicasPage';
import JournalPage from './pages/Journal/JournalPage';
import CombatPage from './pages/Combat/CombatPage';
import AudioController from './components/AudioController/AudioController';
import './App.css';

function App() {
  const [iniciado, setIniciado] = useState(false);
  const [session, setSession] = useState(null);
  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  
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
          />

          {/* 3. Adicionamos a key={location.pathname} para disparar a animação ao mudar de rota */}
          <main className="main-content view-transition" key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<MapPage isMestre={isMestre} />} />
              <Route path="/cronicas" element={<CronicasPage isMestre={isMestre} />} />
              <Route path="/journal" element={<JournalPage/>} />
              <Route path="/combate" element={<CombatPage isMestre={isMestre}/>} />
            </Routes>
          </main>

          <LoginModal
            isOpen={modalLoginAberto}
            onClose={() => setModalLoginAberto(false)}
          />
          <AudioController/>
        </div>
      </div>
    </>
  );
}

export default App;