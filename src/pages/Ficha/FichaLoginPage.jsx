import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import WelcomeAnimation from '../../components/WelcomeAnimation/WelcomeAnimation';
import './FichaPage.css';

export default function FichaLoginPage() {
    const [tokenDigitado, setTokenDigitado] = useState('');
    const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });
    const [personagemLogando, setPersonagemLogando] = useState(null);
    const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);
    const navigate = useNavigate();

    // Função que aplica a máscara automática (AAA-000)
    const handleInputChange = (e) => {
        let valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Remove caracteres especiais e deixa maiúsculo

        // Insere o hífen automaticamente após o 3º caractere se houver mais de 3
        if (valor.length > 3) {
            valor = `${valor.slice(0, 3)}-${valor.slice(3, 7)}`;
        }

        setTokenDigitado(valor);
    };

    const handleIdentificarRapido = async (e) => {
        e.preventDefault();
        const codigo = tokenDigitado.trim(); // Já está com o hífen formatado (ex: AAA-000)
        if (!codigo) return;

        try {
            const { data, error } = await supabase
                .from('fichas_personagens')
                .select('id, jogador_token, nome_personagem')
                .eq('jogador_token', codigo)
                .single();

            if (error || !data) {
                setAlerta({ isOpen: true, title: 'Não Encontrado', message: 'ID de crachá inválido em Aetheria.' });
                return;
            }

            localStorage.setItem('aetheria_jogador_token', data.jogador_token);
            setPersonagemLogando({ id: data.id, nome: data.nome_personagem });
            setMostrarBoasVindas(true);

        } catch {
            setAlerta({ isOpen: true, title: 'Erro', message: 'Erro ao validar o crachá.' });
        }
    };

    return (
        <div className="ficha-page-container flex-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0d0f18' }}>
            <div style={{ background: '#161b22', border: '1px solid #332914', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.7)' }}>
                <h2 style={{ color: '#d4af37', marginBottom: '8px' }}>Identificação do Herói</h2>
                <p style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '20px' }}>Digite o ID do seu crachá para visualizar sua ficha.</p>

                <form onSubmit={handleIdentificarRapido} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                        type="text"
                        className="placeholder_transparent"
                        placeholder="Ex: PLY-001"
                        maxLength={7} // Limita o tamanho máximo (AAA-000 = 7 caracteres)
                        value={tokenDigitado}
                        onChange={handleInputChange} // <-- Usando a função de máscara aqui
                        style={{ background: '#0d0f18', border: '1px solid #30363d', color: '#fff', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '1px' }}
                        required
                    />
                    <button type="submit" style={{ background: '#d4af37', color: '#0d0f18', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Acessar Ficha
                    </button>
                </form>
            </div>

            <CustomAlert
                isOpen={alerta.isOpen}
                title={alerta.title}
                message={alerta.message}
                onClose={() => setAlerta({ ...alerta, isOpen: false })}
            />

            {mostrarBoasVindas && personagemLogando && (
                <WelcomeAnimation
                    nomePersonagem={personagemLogando.nome}
                    onComplete={() => {
                        navigate(`/ficha/${personagemLogando.id}`, { replace: true });
                    }}
                />
            )}
        </div>
    );
}