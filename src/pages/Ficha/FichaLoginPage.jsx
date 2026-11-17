import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera } from 'react-icons/fa';
import { fichaService } from '../../services/fichaService';
import { playerSessionService } from '../../services/playerSessionService';
import { Button } from '../../components/ui';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import WelcomeAnimation from '../../components/WelcomeAnimation/WelcomeAnimation';
import QrScannerModal from '../../components/QrScanner/QrScanner';
import styles from './FichaLoginPage.module.css';

export default function FichaLoginPage() {
    const [tokenDigitado, setTokenDigitado] = useState('');
    const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });
    const [personagemLogando, setPersonagemLogando] = useState(null);
    const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);
    const [mostrarScanner, setMostrarScanner] = useState(false);
    const [validando, setValidando] = useState(false);
    const navigate = useNavigate();

    // Verifica se a sessão anterior foi expirada e exibe o aviso claro
    useEffect(() => {
        const avisoExpiracao = playerSessionService.consumirAvisoExpiracao();
        if (avisoExpiracao) {
            setAlerta({
                isOpen: true,
                title: 'Sessão Expirada',
                message: avisoExpiracao
            });
        }
    }, []);

    // Aplica a máscara automática (AAA-000)
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

        setValidando(true);
        try {
            const data = await fichaService.getFichaParaIdentificacao({ token: codigo });
            if (!data) {
                setAlerta({ isOpen: true, title: 'Não Encontrado', message: 'ID de crachá inválido em Aetheria.' });
                return;
            }

            playerSessionService.iniciarSessao(data.jogador_token, data.id, data.nome_personagem);
            setPersonagemLogando({ id: data.id, nome: data.nome_personagem });
            setMostrarBoasVindas(true);
        } catch {
            setAlerta({ isOpen: true, title: 'Não Encontrado', message: 'ID de crachá inválido em Aetheria.' });
        } finally {
            setValidando(false);
        }
    };

    const handleScanSuccess = async (decodedText) => {
        setMostrarScanner(false);
        try {
            const url = new URL(decodedText);
            const pathParts = url.hash.split('/');
            const fichaId = pathParts[pathParts.length - 1];

            if (fichaId) {
                const data = await fichaService.getFichaParaIdentificacao({ id: fichaId });
                if (!data) {
                    setAlerta({ isOpen: true, title: 'Erro na Leitura', message: 'Ficha não encontrada no banco de Aetheria.' });
                    return;
                }

                playerSessionService.iniciarSessao(data.jogador_token, data.id, data.nome_personagem);
                setPersonagemLogando({ id: data.id, nome: data.nome_personagem });
                setMostrarBoasVindas(true);
            }
        } catch {
            setAlerta({ isOpen: true, title: 'QR Code Inválido', message: 'O código lido não pertence a um crachá válido.' });
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.loginCard}>
                <h2 className={styles.title}>Identificação do Herói</h2>
                <p className={styles.subtitle}>Digite o ID do seu crachá ou escaneie com a câmera.</p>

                <form onSubmit={handleIdentificarRapido} className={styles.loginForm}>
                    <input
                        type="text"
                        className={styles.tokenInput}
                        placeholder="Ex: PLY-001"
                        maxLength={7}
                        value={tokenDigitado}
                        onChange={handleInputChange}
                        required
                    />
                    <Button
                        type="submit"
                        variant="core"
                        size="md"
                        disabled={validando}
                    >
                        {validando ? 'Verificando...' : 'Acessar Ficha'}
                    </Button>
                </form>

                <div className={styles.divider}>
                    <div className={styles.dividerLine} />
                    <span className={styles.dividerText}>OU</span>
                    <div className={styles.dividerLine} />
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className={styles.qrBtn}
                    onClick={() => setMostrarScanner(true)}
                >
                    <FaCamera /> Ler QR Code via Câmera
                </Button>
            </div>

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
