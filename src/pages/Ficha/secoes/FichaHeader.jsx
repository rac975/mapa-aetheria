import { useState } from 'react';
import { FaUser, FaArrowLeft, FaEdit, FaTimes, FaSignOutAlt, FaCoins, FaPrint, FaCog, FaPlus, FaMinus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { CONDICOES_DISPONIVEIS, getCondicaoIcon } from '../../../constants/condicoes';
import { playerSessionService } from '../../../services/playerSessionService';
import { Button, Badge } from '../../../components/ui';
import ModalZenit from './components/ModalZenit';
import styles from './FichaHeader.module.css';

export default function FichaHeader({
    ficha,
    id,
    isMestre,
    editando,
    onToggleEdit,
    nivelAtual,
    condicoesAtivas = [],
    statusCalculados = null,
    setFicha,
    handleAjustarRecurso
}) {
    const navigate = useNavigate();
    const tokenJogadorSalvo = localStorage.getItem('aetheria_jogador_token');
    const ehJogadorLogado = !!tokenJogadorSalvo && !isMestre;

    const [modalZenitAberto, setModalZenitAberto] = useState(false);

    const handleLogout = () => {
        playerSessionService.encerrarSessao();
        navigate('/ficha/login', { replace: true });
    };

    const handleImprimir = () => {
        window.print();
    };

    if (!ficha) return null;

    const pvMaxHeader = Number(statusCalculados?.pvMax || ficha?.hp_max || 30);
    const pvAtualHeader = Number(ficha?.hp_atual ?? pvMaxHeader);
    const emCriseHeader = pvAtualHeader > 0 && pvAtualHeader <= Math.floor(pvMaxHeader / 2);

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

                        {emCriseHeader && (
                            <Badge variant="crise" size="sm">
                                Em Crise
                            </Badge>
                        )}

                        <Badge variant="gold" size="md">
                            <FaCoins /> {ficha?.zenit || 0}z
                            <button
                                type="button"
                                onClick={() => setModalZenitAberto(true)}
                                title="Gerenciar Zênites"
                                className={styles.zenitGearBtn}
                                aria-label="Gerenciar Zênites"
                            ><FaCog/></button>
                        </Badge>

                        <Badge variant="default" size="md">
                            EXP: {ficha?.exp || 0}/10
                        </Badge>

                        <Badge variant="ether" size="md" className={styles.fabulaBadge}>
                            <span>Fábula: {ficha?.fabula ?? 3}</span>
                            <div className={styles.badgeMiniControls} data-print="false">
                                <button
                                    type="button"
                                    className={styles.badgeMiniBtn}
                                    onClick={() => handleAjustarRecurso?.('fabula', -1)}
                                    disabled={Number(ficha?.fabula ?? 3) <= 0}
                                    title="Gastar Ponto de Fábula (-1)"
                                    aria-label="Gastar Ponto de Fábula"
                                ><FaMinus /></button>
                                <button
                                    type="button"
                                    className={styles.badgeMiniBtn}
                                    onClick={() => handleAjustarRecurso?.('fabula', 1)}
                                    title="Adicionar Ponto de Fábula (+1)"
                                    aria-label="Adicionar Ponto de Fábula"
                                ><FaPlus /></button>
                            </div>
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
            <ModalZenit
                isOpen={modalZenitAberto}
                onClose={() => setModalZenitAberto(false)}
                ficha={ficha}
                setFicha={setFicha}
            />
        </header>
    );
}
