import { useState } from 'react';
import { FaUser, FaArrowLeft, FaEdit, FaTimes, FaSignOutAlt, FaCoins, FaPrint, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { CONDICOES_DISPONIVEIS, getCondicaoIcon } from '../../../constants/condicoes';
import { fichaService } from '../../../services/fichaService';
import { Button, Badge, Modal, Input } from '../../../components/ui';
import styles from './FichaHeader.module.css';

export default function FichaHeader({
    ficha,
    id,
    isMestre,
    editando,
    onToggleEdit,
    nivelAtual,
    condicoesAtivas = [],
    setFicha
}) {
    const navigate = useNavigate();
    const tokenJogadorSalvo = localStorage.getItem('aetheria_jogador_token');
    const ehJogadorLogado = !!tokenJogadorSalvo && !isMestre;

    // Estados para o Modal de Gerenciamento de Zênites
    const [modalZenitAberto, setModalZenitAberto] = useState(false);
    const [tipoAjuste, setTipoAjuste] = useState('adicionar');
    const [valorZenit, setValorZenit] = useState('');
    const [motivoZenit, setMotivoZenit] = useState('');
    const [processandoZenit, setProcessandoZenit] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('aetheria_jogador_token');
        navigate('/ficha/login', { replace: true });
    };

    const handleImprimir = () => {
        window.print();
    };

    const lidarComTransacaoZenit = async (e) => {
        e.preventDefault();
        const qtd = parseInt(valorZenit, 10);
        if (isNaN(qtd) || qtd <= 0) {
            alert("Insira um valor válido maior que zero.");
            return;
        }

        const zenitAtual = ficha?.zenit || 0;
        const novoZenit = tipoAjuste === 'adicionar' ? zenitAtual + qtd : zenitAtual - qtd;

        if (novoZenit < 0) {
            alert("O personagem não tem zênites suficientes para essa retirada!");
            return;
        }

        setProcessandoZenit(true);
        try {
            await fichaService.atualizarZenit(ficha.id, novoZenit);

            if (setFicha) {
                setFicha(prev => ({ ...prev, zenit: novoZenit }));
            }

            alert(`✨ Transação realizada! ${tipoAjuste === 'adicionar' ? `+${qtd}` : `-${qtd}`} zênites (${motivoZenit || 'Sem motivo especificado'}).`);
            setModalZenitAberto(false);
            setValorZenit('');
            setMotivoZenit('');
        } catch (err) {
            alert("Erro ao atualizar zênites: " + err.message);
        } finally {
            setProcessandoZenit(false);
        }
    };

    if (!ficha) return null;

    return (
        <header className={styles.headerCard}>
            <div className={styles.headerInfoWrapper}>
                {isMestre && id && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/mestre/fichas')}
                        className={styles.backBtn}
                    >
                        <FaArrowLeft /> Painel do Mestre
                    </Button>
                )}

                <div className={styles.avatarContainer}>
                    {ficha?.avatar_url ? (
                        <img
                            src={ficha.avatar_url}
                            alt={ficha?.nome_personagem || 'Herói'}
                            className={styles.avatarImg}
                        />
                    ) : (
                        <FaUser size={30} className={styles.avatarPlaceholder} />
                    )}
                </div>

                <div className={styles.headerTextGroup}>
                    <h1 className={styles.characterName}>{ficha?.nome_personagem || 'Carregando...'}</h1>

                    <div className={styles.badgesWrapper}>
                        <Badge variant="gold" size="md">
                            Nível {nivelAtual}
                        </Badge>

                        <Badge variant="gold" size="md">
                            <FaCoins /> {ficha?.zenit || 0}z
                            <button
                                type="button"
                                onClick={() => setModalZenitAberto(true)}
                                title="Gerenciar Zênites"
                                className={styles.zenitGearBtn}
                                aria-label="Gerenciar Zênites"
                            >
                            <FaCog/>
                            </button>
                        </Badge>

                        <Badge variant="default" size="md">
                            EXP: {ficha?.exp || 0}/10
                        </Badge>

                        <Badge variant="ether" size="md">
                            Fábula: {ficha?.fabula || 3}
                        </Badge>
                    </div>

                    {condicoesAtivas.length > 0 && (
                        <div className={styles.condicoesStrip}>
                            {condicoesAtivas.map(cId => {
                                const condObj = CONDICOES_DISPONIVEIS.find(item => item.id === cId);
                                return (
                                    <Badge key={cId} variant="crise" size="sm">
                                        {getCondicaoIcon(cId)}
                                        <span>{condObj?.label || cId}</span>
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.headerActionsGroup}>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleImprimir}
                    title="Imprimir folha de personagem para mesa física"
                >
                    <FaPrint /> Imprimir Ficha
                </Button>

                <Button
                    type="button"
                    variant={editando ? 'danger' : 'primary'}
                    size="sm"
                    onClick={onToggleEdit}
                >
                    {editando ? <><FaTimes /> Cancelar</> : <><FaEdit /> Editar Ficha</>}
                </Button>

                {ehJogadorLogado && !editando && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        title="Desconectar crachá deste dispositivo"
                    >
                        <FaSignOutAlt /> Sair
                    </Button>
                )}
            </div>

            {/* MODAL DE TRANSAÇÃO DE ZÊNITES */}
            <Modal
                isOpen={modalZenitAberto}
                onClose={() => setModalZenitAberto(false)}
                title="Gerenciar Zênites"
                size="sm"
            >
                <form onSubmit={lidarComTransacaoZenit} className={styles.zenitModalForm}>
                    <div className={styles.zenitTypeSwitcher}>
                        <button
                            type="button"
                            onClick={() => setTipoAjuste('adicionar')}
                            className={`${styles.zenitTypeBtn} ${tipoAjuste === 'adicionar' ? styles.zenitTypeBtnActiveAdd : ''}`}
                        >
                            ➕ Adicionar
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipoAjuste('remover')}
                            className={`${styles.zenitTypeBtn} ${tipoAjuste === 'remover' ? styles.zenitTypeBtnActiveSub : ''}`}
                        >
                            ➖ Retirar
                        </button>
                    </div>

                    <Input
                        label="Quantidade de Zênites:"
                        type="number"
                        min="1"
                        placeholder="Ex: 200"
                        value={valorZenit}
                        onChange={(e) => setValorZenit(e.target.value)}
                        required
                    />

                    <Input
                        label="Motivo / Descrição (Opcional):"
                        type="text"
                        placeholder="Ex: Recompensa de missão, Tesouro..."
                        value={motivoZenit}
                        onChange={(e) => setMotivoZenit(e.target.value)}
                    />

                    <div className={styles.modalFooterActions}>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setModalZenitAberto(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant={tipoAjuste === 'adicionar' ? 'core' : 'danger'}
                            size="sm"
                            disabled={processandoZenit}
                        >
                            {processandoZenit ? 'Salvando...' : 'Confirmar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </header>
    );
}
