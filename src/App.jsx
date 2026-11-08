import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { supabase } from './services/supabase';
import Sidebar from './components/Sidebar/Sidebar';
import LoginModal from './components/LoginModal/LoginModal';
import MapPage from './pages/Map/MapPage';
import CronicasPage from './pages/Cronicas/CronicasPage';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [modalLoginAberto, setModalLoginAberto] = useState(false);

  useEffect(() => {
    // 1. Verifica se já existe sessão ativa ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Fica escutando mudanças de login/logout em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isMestre = !!session; // Se tem sessão, o usuário é o Mestre autenticado

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="app-layout">
      <Sidebar 
        isMestre={isMestre} 
        onOpenLogin={() => setModalLoginAberto(true)} 
        onLogout={handleLogout}
      />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/cronicas" element={<CronicasPage isMestre={isMestre} />} />
        </Routes>
      </main>

      {/* Modal separado e limpo */}
      <LoginModal 
        isOpen={modalLoginAberto} 
        onClose={() => setModalLoginAberto(false)} 
      />
    </div>
  );
}

export default App;