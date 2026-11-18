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

export default function FichaLoginPage({ isMestre = false }) {
    const [tokenDigitado, setTokenDigitado] = useState('');
    const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });
    const [personagemLogando, setPersonagemLogando] = useState(null);
    const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);
    const [mostrarScanner, setMostrarScanner] = useState(false);
    const [validando, setValidando] = useState(false);
    const navigate = useNavigate();

    // Regra Item 6: O Mestre (God Mode) nunca deve ficar na tela de Conectar Personagem
    useEffect(() => {
        if (isMestre || playerSessionService.isGodModeAtivo()) {
            navigate('/mestre/fichas', { replace: true });
        }
    }, [isMestre, navigate]);

    // Regra Item 7: Verifica se a sessão anterior foi expirada/invalidada e exibe o aviso contextual
    useEffect(() => {
        if (isMestre || playerSessionService.isGodModeAtivo()) return;
        const avisoReconexao = playerSessionService.consumirAvisoReconexao();
        if (avisoReconexao) {
            setAlerta({
                isOpen: true,
                title: avisoReconexao.titulo || 'Sessão Expirada',
                message: avisoReconexao.mensagem
            });
        }
    }, [isMestre]);

    // Aplica a máscara automática (AAA-000) com remoção segura de acentos
    const handleInputChange = (e) => {
        const mascarado = playerSessionService.aplicarMascaraToken(e.target.value);
        setTokenDigitado(mascarado);
    };

    const handleIdentificarRapido = async (e) => {
        e?.preventDefault();
        const codigo = playerSessionService.normalizarToken(tokenDigitado);
        if (!codigo || !playerSessionService.validarFormatoToken(codigo)) {
            setAlerta({
                isOpen: true,
                title: 'Formato Inválido',
                message: 'Informe um código de crachá válido no padrão AAA-000 (ex: PLY-001).'
            });
            return;
        }

        setValidando(true);
        try {
            const data = await fichaService.getFichaParaIdentificacao({ token: codigo });
            if (!data) {
                setAlerta({
                    isOpen: true,
                    title: 'Não Encontrado',
                    message: 'ID de crachá inválido ou atualizado pelo Mestre em Aetheria.'
                });
                return;
            }

            playerSessionService.iniciarSessao(data.jogador_token, data.id, data.nome_personagem);
            setPersonagemLogando({ id: data.id, nome: data.nome_personagem });
            setMostrarBoasVindas(true);
        } catch {
            setAlerta({
                isOpen: true,
                title: 'Não Encontrado',
                message: 'ID de crachá inválido em Aetheria.'
            });
        } finally {
            setValidando(false);
        }
    };

    const handleScanSuccess = async (decodedText, credencialExtraida) => {
        setMostrarScanner(false);
        try {
            const credencial = credencialExtraida || playerSessionService.extrairCredencial(decodedText);
            if (credencial.tipo === 'invalido') {
                setAlerta({
                    isOpen: true,
                    title: 'QR Code Inválido',
                    message: 'O código lido não pertence a um crachá válido de Aetheria.'
                });
                return;
            }

            let data = null;
            if (credencial.token) {
                const resToken = await playerSessionService.buscarFichaPorToken(credencial.token);
                if (resToken.valido && resToken.ficha) {
                    data = resToken.ficha;
                }
            } else if (credencial.id) {
                data = await fichaService.getFichaParaIdentificacao({ id: credencial.id });
                if (data) {
                    playerSessionService.iniciarSessao(data.jogador_token, data.id, data.nome_personagem);
                }
            }

            if (!data) {
                setAlerta({
                    isOpen: true,
                    title: 'Erro na Leitura',
                    message: 'Ficha não encontrada no banco de Aetheria.'
                });
                return;
            }

            setPersonagemLogando({ id: data.id, nome: data.nome_personagem });
            setMostrarBoasVindas(true);
        } catch {
            setAlerta({
                isOpen: true,
                title: 'QR Code Inválido',
                message: 'O código lido não pertence a um crachá válido.'
            });
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
                        maxLength={8}
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
