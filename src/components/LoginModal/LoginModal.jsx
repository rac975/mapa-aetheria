import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Modal, Input, Button } from '../ui';
import styles from './LoginModal.module.css';

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleLoginSupabase = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error) throw error;

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
    <Modal isOpen={isOpen} onClose={onClose} title="Autenticação do Mestre" size="sm">
      <div className={styles.container}>
        <p className={styles.subtitle}>
          Insira suas credenciais da nuvem para liberar o painel administrativo.
        </p>

        <form className={styles.form} onSubmit={handleLoginSupabase}>
          <Input
            label="E-mail do Mestre"
            type="email"
            placeholder="E-mail de mestre..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Senha Secreta"
            type="password"
            placeholder="Senha secreta..."
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          {erro && <span className={styles.errorText}>Credenciais inválidas, mestre!</span>}
          <Button type="submit" variant="primary" fullWidth disabled={carregando}>
            {carregando ? 'Verificando...' : 'Liberar Poderes'}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
