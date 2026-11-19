import { useState } from 'react';
import { FaUser, FaArrowLeft, FaEdit, FaTimes, FaSignOutAlt, FaCoins, FaCog, FaPlus, FaMinus } from 'react-icons/fa';
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
    onLogoutJogador,
    handleAjustarRecurso
}) {
    const navigate = useNavigate();
    const modoMestreAtivo = Boolean(isMestre || playerSessionService.isGodModeAtivo());
    const sessaoJogador = modoMestreAtivo ? null : playerSessionService.obterSessao();
    const ehJogadorLogado = Boolean(sessaoJogador?.token) && !modoMestreAtivo;

    const [modalZenitAberto, setModalZenitAberto] = useState(false);

    const handleLogout = () => {
        playerSessionService.encerrarSessao();
        if (onLogoutJogador) onLogoutJogador();
        navigate('/ficha/login', { replace: true });
    };

    if (!ficha) return null;

    const pvMaxHeader = Number(statusCalculados?.pvMax || ficha?.hp_max || 30);
    const pvAtualHeader = Number(ficha?.hp_atual ?? pvMaxHeader);
    const emCriseHeader = pvAtualHeader > 0 && pvAtualHeader <= Math.floor(pvMaxHeader / 2);

    const nfHeader = statusCalculados?.naturalFantasy || null;
    const magiseedHeader = nfHeader?.floralista?.magiseedAtiva || null;
    const secaoRelogioHeader = nfHeader?.floralista?.secaoRelogioGerminacao ?? 0;
    const pratoHeader = nfHeader?.gourmet?.pratoAtivoCena || null;
    const pragaHeader = nfHeader?.invocador?.pragaAtivaInimigo || null;
    const mercadorAtivoHeader = Boolean(nfHeader?.mercador?.ativo && nfHeader?.mercador?.nvVentosDoComercio > 0);
    const imunidadesHeader = statusCalculados?.imunidadesCondicaoAtivas || [];

    return (
        <header className={styles.headerCard}>
            <div className={styles.topActionsRow}>
                <div className={styles.topNavLeft}>
                    {modoMestreAtivo && (id || ficha?.id) && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/mestre/fichas')}
                            className={styles.backBtn}
                        >
                            <FaArrowLeft /> Mestre
                        </Button>
                    )}
                </div>

                <div className={styles.topNavRight}>
                    <Button
                        type="button"
                        variant={editando ? 'danger' : 'primary'}
                        size="sm"
                        onClick={onToggleEdit}
                        className={styles.editBtn}
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
                            className={styles.logoutBtn}
                        >
                            <FaSignOutAlt /> Sair
                        </Button>
                    )}
                </div>
            </div>

            <div className={styles.heroIdentityRow}>
                <div className={styles.avatarContainer}>
                    {ficha?.avatar_url ? (
                        <img
                            src={ficha.avatar_url}
                            alt={ficha?.nome_personagem || 'Herói'}
                            className={styles.avatarImg}
                        />
                    ) : (
                        <FaUser size={28} className={styles.avatarPlaceholder} />
                    )}
                </div>

                <div className={styles.identityDetailsCol}>
                    <h1 className={styles.characterName}>{ficha?.nome_personagem || 'Carregando...'}</h1>

                    <div className={styles.nivelBadgeWrap}>
                        <Badge variant="gold" size="sm">
                            NÍVEL {nivelAtual}
                        </Badge>
                        {emCriseHeader && (
                            <Badge variant="crise" size="sm">
                                Em Crise
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.bottomResourcesRow}>
                <Badge variant="gold" size="sm" className={styles.zenitBadge}>
                    <FaCoins /> {ficha?.zenit || 0}Z
                    <button
                        type="button"
                        onClick={() => setModalZenitAberto(true)}
                        title="Gerenciar Zênites"
                        className={styles.zenitGearBtn}
                        aria-label="Gerenciar Zênites"
                    ><FaCog /></button>
                </Badge>

                <Badge variant="ether" size="sm" className={styles.fabulaBadge}>
                    <span>FÁBULA:</span>
                    <button
                        type="button"
                        className={styles.badgeMiniBtn}
                        onClick={() => handleAjustarRecurso?.('fabula', -1)}
                        disabled={Number(ficha?.fabula ?? 3) <= 0}
                        title="Gastar Ponto de Fábula (-1)"
                        aria-label="Gastar Ponto de Fábula"
                    ><FaMinus size={8} /></button>
                    <strong className={styles.fabulaValor}>{ficha?.fabula ?? 3}</strong>
                    <button
                        type="button"
                        className={styles.badgeMiniBtn}
                        onClick={() => handleAjustarRecurso?.('fabula', 1)}
                        title="Adicionar Ponto de Fábula (+1)"
                        aria-label="Adicionar Ponto de Fábula"
                    ><FaPlus size={8} /></button>
                </Badge>

                {mercadorAtivoHeader && (
                    <Badge variant="gold" size="sm">
                        Comércio: {nfHeader.mercador.pontosComercioAtuais}/{nfHeader.mercador.maxPontosComercio} PC
                    </Badge>
                )}
                {magiseedHeader && (
                    <Badge variant="core" size="sm">
                        🌱 {magiseedHeader.nome} (T={secaoRelogioHeader}/4)
                    </Badge>
                )}
                {pratoHeader && (
                    <Badge variant="pv" size="sm" title={pratoHeader.resumo}>
                        🍲 Iguaria ({pratoHeader.pares?.join('+')})
                    </Badge>
                )}
                {pragaHeader && (
                    <Badge variant="ether" size="sm">
                        ⚡ {pragaHeader.nome} (+{pragaHeader.bonusDano} Dano)
                    </Badge>
                )}
            </div>

            {condicoesAtivas.length > 0 && (
                <div className={styles.condicoesStrip}>
                    {condicoesAtivas.map(cId => {
                        const condObj = CONDICOES_DISPONIVEIS.find(item => item.id === cId);
                        const ehImune = imunidadesHeader.includes(cId);
                        return (
                            <Badge key={cId} variant={ehImune ? 'core' : 'crise'} size="sm">
                                {getCondicaoIcon(cId)}
                                <span>{condObj?.label || cId}{ehImune ? ' (Imune)' : ''}</span>
                            </Badge>
                        );
                    })}
                </div>
            )}

            <ModalZenit
                isOpen={modalZenitAberto}
                onClose={() => setModalZenitAberto(false)}
                ficha={ficha}
                setFicha={setFicha}
            />
        </header>
    );
}
