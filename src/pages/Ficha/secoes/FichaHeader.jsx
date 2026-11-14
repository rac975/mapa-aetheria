import { useState } from 'react';
import { FaUser, FaArrowLeft, FaEdit, FaTimes, FaSignOutAlt, FaCoins } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { CONDICOES_DISPONIVEIS, getCondicaoIcon } from '../../../constants/condicoes';
import { supabase } from '../../../services/supabase';

export default function FichaHeader({
    ficha,
    id,
    isMestre,
    editando,
    onToggleEdit,
    nivelAtual,
    condicoesAtivas = [],
    setFicha // 🔹 Adicionado para atualizar o estado global da ficha quando os zênites mudarem
}) {
    const navigate = useNavigate();
    const tokenJogadorSalvo = localStorage.getItem('aetheria_jogador_token');
    const ehJogadorLogado = !!tokenJogadorSalvo && !isMestre;

    // 🔹 Estados para o Modal de Gerenciamento de Zênites
    const [modalZenitAberto, setModalZenitAberto] = useState(false);
    const [tipoAjuste, setTipoAjuste] = useState('adicionar');
    const [valorZenit, setValorZenit] = useState('');
    const [motivoZenit, setMotivoZenit] = useState('');
    const [processandoZenit, setProcessandoZenit] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('aetheria_jogador_token');
        navigate('/ficha/login', { replace: true });
    };

    const lidarComTransacaoZenit = async (e) => {
        e.preventDefault();
        const qtd = parseInt(valorZenit, 10);
        if (isNaN(qtd) || qtd <= 0) {
            alert("Insira um valor válido maior que zero.");
            return;
        }

        const zenitAtual = ficha.zenit || 0;
        let novoZenit = tipoAjuste === 'adicionar' ? zenitAtual + qtd : zenitAtual - qtd;

        if (novoZenit < 0) {
            alert("O personagem não tem zênites suficientes para essa retirada!");
            return;
        }

        setProcessandoZenit(true);
        try {
            const { error } = await supabase
                .from('fichas_personagens')
                .update({ zenit: novoZenit })
                .eq('id', ficha.id);

            if (error) throw error;

            // Atualiza o estado da ficha na página pai
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
        <header className="ficha-page-header">
            <div className="header-info-wrapper">
                {isMestre && id && (
                    <button type="button" onClick={() => navigate('/mestre/fichas')} className="btn-secundario">
                        <FaArrowLeft /> Painel do Mestre
                    </button>
                )}

                <div className="ficha-avatar-container">
                    {ficha?.avatar_url ? (
                        <img src={ficha.avatar_url} alt={ficha?.nome_personagem || 'Herói'} />
                    ) : (
                        <FaUser size={28} color="#d4af37" />
                    )}
                </div>

                <div className="ficha-header-text-group">
                    <h1 className="nome_personagem_text">{ficha?.nome_personagem || 'Carregando...'}</h1>

                    <div className="badge-nivel-wrapper">
                        <span className="badge-nivel">Nível {nivelAtual}</span>
                        
                        {/* 🔹 Badge de Zênites com Botão Interativo de Ajuste */}
                        <span className="badge-nivel-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <FaCoins color="#d4af37" size={12} /> {ficha?.zenit || 0}z
                            <button
                                type="button"
                                onClick={() => setModalZenitAberto(true)}
                                title="Gerenciar Zênites"
                                style={{ background: '#21262d', border: '1px solid #30363d', color: '#d4af37', borderRadius: '4px', padding: '1px 6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                ⚙️
                            </button>
                        </span>

                        <span className="badge-nivel-meta">EXP: {ficha?.exp || 0}/10</span>
                        <span className="badge-nivel-meta">Fábula: {ficha?.fabula || 3}</span>
                    </div>

                    {/* Exibição das Tags de Status Ativos no Header */}
                    {condicoesAtivas.length > 0 && (
                        <div className="condicoes-strip">
                            {condicoesAtivas.map(cId => {
                                const condObj = CONDICOES_DISPONIVEIS.find(item => item.id === cId);
                                return (
                                    <span key={cId} className={`condicao-chip cond-${cId}`}>
                                        {getCondicaoIcon(cId)}
                                        <span>{condObj?.label}</span>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="header-actions-group">
                <button
                    type="button"
                    className={`btn-toggle-edit ${editando ? 'cancel' : ''}`}
                    onClick={onToggleEdit}
                >
                    {editando ? <><FaTimes /> Cancelar</> : <><FaEdit /> Editar Ficha</>}
                </button>

                {ehJogadorLogado && !editando && (
                    <button
                        type="button"
                        className="btn-secundario"
                        onClick={handleLogout}
                        title="Desconectar crachá deste dispositivo"
                    >
                        <FaSignOutAlt /> Sair
                    </button>
                )}
            </div>

            {/* 🔹 MODAL DE TRANSAÇÃO DE ZÊNITES */}
            {modalZenitAberto && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                    <form onSubmit={lidarComTransacaoZenit} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                        <h4 style={{ margin: 0, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaCoins color="#d4af37" /> Gerenciar Zênites
                        </h4>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setTipoAjuste('adicionar')}
                                style={{ flex: 1, padding: '8px', background: tipoAjuste === 'adicionar' ? 'rgba(35, 134, 54, 0.2)' : '#0d1117', border: `1px solid ${tipoAjuste === 'adicionar' ? '#238636' : '#30363d'}`, color: '#c9d1d9', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                            >
                                ➕ Adicionar
                            </button>
                            <button
                                type="button"
                                onClick={() => setTipoAjuste('remover')}
                                style={{ flex: 1, padding: '8px', background: tipoAjuste === 'remover' ? 'rgba(218, 54, 51, 0.2)' : '#0d1117', border: `1px solid ${tipoAjuste === 'remover' ? '#da3633' : '#30363d'}`, color: '#c9d1d9', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                            >
                                ➖ Retirar
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#8b949e' }}>Quantidade de Zênites:</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Ex: 200"
                                value={valorZenit}
                                onChange={(e) => setValorZenit(e.target.value)}
                                required
                                style={{ background: '#0d1117', border: '1px solid #30363d', color: '#f0f6fc', padding: '8px', borderRadius: '6px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#8b949e' }}>Motivo / Descrição (Opcional):</label>
                            <input
                                type="text"
                                placeholder="Ex: Recompensa de missão, Tesouro..."
                                value={motivoZenit}
                                onChange={(e) => setMotivoZenit(e.target.value)}
                                style={{ background: '#0d1117', border: '1px solid #30363d', color: '#f0f6fc', padding: '8px', borderRadius: '6px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setModalZenitAberto(false)}
                                style={{ background: 'transparent', border: '1px solid #30363d', color: '#c9d1d9', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={processandoZenit}
                                style={{ background: tipoAjuste === 'adicionar' ? '#238636' : '#da3633', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                {processandoZenit ? 'Salvando...' : 'Confirmar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </header>
    );
}