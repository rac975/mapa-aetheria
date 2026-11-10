import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import WelcomeAnimation from '../../components/WelcomeAnimation/WelcomeAnimation';
import QrScannerModal from '../../components/QrScanner/QrScanner';
import { FaCamera } from 'react-icons/fa';
import './FichaPage.css';

export default function FichaLoginPage() {
    const [tokenDigitado, setTokenDigitado] = useState('');
    const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });
    const [personagemLogando, setPersonagemLogando] = useState(null);
    const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);
    const [mostrarScanner, setMostrarScanner] = useState(false); // <-- Estado para abrir/fechar a câmera
    const navigate = useNavigate();

    // Função que aplica a máscara automática (AAA-000)
    const handleInputChange = (e) => {
        let valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (valor.length > 3) {
            valor = `${valor.slice(0, 3)}-${valor.slice(3, 7)}`;
        }

        setTokenDigitado(valor);
    };

    const handleIdentificarRapido = async (e) => {
        e?.preventDefault();
        const codigo = tokenDigitado.trim();
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

    // Função chamada quando a câmera lê com sucesso o QR Code do crachá físico
    const handleScanSuccess = async (decodedText) => {
        setMostrarScanner(false);
        try {
            // O QR Code gerado contém a URL completa: https://.../#/ficha/uuid-da-ficha
            const url = new URL(decodedText);
            const pathParts = url.hash.split('/');
            const fichaId = pathParts[pathParts.length - 1];

            if (fichaId) {
                // Busca os dados da ficha no Supabase usando o ID obtido pelo QR Code da câmera
                const { data, error } = await supabase
                    .from('fichas_personagens')
                    .select('id, jogador_token, nome_personagem')
                    .eq('id', fichaId)
                    .single();

                if (error || !data) {
                    setAlerta({ isOpen: true, title: 'Erro na Leitura', message: 'Ficha não encontrada no banco de Aetheria.' });
                    return;
                }

                // Salva o token, ativa a mesma animação bonita de boas-vindas e redireciona
                localStorage.setItem('aetheria_jogador_token', data.jogador_token);
                setPersonagemLogando({ id: data.id, nome: data.nome_personagem });
                setMostrarBoasVindas(true);
                return;
            }
        } catch {
            setAlerta({ isOpen: true, title: 'QR Code Inválido', message: 'O código lido não pertence a um crachá válido.' });
        }
    };

    return (
        <div className="ficha-page-container flex-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0d0f18' }}>
            <div style={{ background: '#161b22', border: '1px solid #332914', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.7)' }}>
                <h2 style={{ color: '#d4af37', marginBottom: '8px' }}>Identificação do Herói</h2>
                <p style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '20px' }}>Digite o ID do seu crachá ou escaneie com a câmera.</p>

                <form onSubmit={handleIdentificarRapido} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                        type="text"
                        className="placeholder_transparent"
                        placeholder="Ex: PLY-001"
                        maxLength={7}
                        value={tokenDigitado}
                        onChange={handleInputChange}
                        style={{ background: '#0d0f18', border: '1px solid #30363d', color: '#fff', padding: '12px', borderRadius: '6px', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '1px' }}
                        required
                    />
                    <button type="submit" style={{ background: '#d4af37', color: '#0d0f18', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Acessar Ficha
                    </button>
                </form>

                {/* Divisor visual */}
                <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#8b949e', fontSize: '0.8rem' }}>
                    <div style={{ flex: 1, height: '1px', background: '#30363d' }}></div>
                    <span style={{ padding: '0 10px' }}>OU</span>
                    <div style={{ flex: 1, height: '1px', background: '#30363d' }}></div>
                </div>

                {/* Botão para abrir o Scanner de Câmera */}
                <button
                    type="button"
                    onClick={() => setMostrarScanner(true)}
                    style={{ background: 'transparent', color: '#d4af37', border: '1px solid #d4af37', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                >
                    <FaCamera /> Ler QR Code via Câmera
                </button>
            </div>

            {/* Modal da Câmera isolado */}
            {mostrarScanner && (
                <QrScannerModal
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setMostrarScanner(false)}
                />
            )}

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