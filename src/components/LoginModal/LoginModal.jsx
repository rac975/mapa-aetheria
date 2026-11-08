import { useState } from 'react';
import { supabase } from '../../services/supabase';
import './LoginModal.css';

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);

  if (!isOpen) return null;

  const handleLoginSupabase = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) throw error;

      // Sucesso! O listener do App.jsx vai pegar a sessão automaticamente
      onClose();
      setEmail('');
      setSenha('');
    } catch (err) {
      console.error('Erro no login:', err.message);
      setErro(true);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Autenticação do Mestre</h2>
        <p>Insira suas credenciais da nuvem para liberar o painel.</p>
        
        <form onSubmit={handleLoginSupabase}>
          <input 
            type="email" 
            placeholder="E-mail de mestre..." 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input 
            type="password" 
            placeholder="Senha secreta..." 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          {erro && <span className="error-text">Credenciais inválidas, mestre!</span>}
          <button type="submit" className="btn-submit-mestre" disabled={carregando}>
            {carregando ? 'Verificando...' : 'Liberar Poderes'}
          </button>
        </form>
      </div>
    </div>
  );
}