import { useState } from 'react';
import { FaStore, FaTools, FaCoins, FaUserAlt } from 'react-icons/fa';
import { useLojaSupabase } from './hooks/useLojaSupabase';
import LojaClienteTab from './components/LojaClienteTab';
import LojaMestreTab from './components/LojaMestreTab';
import './LojaPage.css';

export default function LojaPage({ ficha, setFicha, isMestre }) {
    const [abaAtiva, setAbaAtiva] = useState('loja');

    const {
        lojas,
        lojaSelecionadaId,
        handleSelecionarLoja,
        itensDaLoja,
        todosItensCatalogo,
        recarregarDadosGlobais,
        fichaAtiva,
        fichasDisponiveis,
        fichaSelecionadaLocalId,
        setFichaSelecionadaLocalId
    } = useLojaSupabase(ficha, isMestre);

    return (
        <div className="loja-wrapper">
            {/* Cabeçalho Principal */}
            <div className="loja-header">
                <div className="loja-titulo-area">
                    <h2 className="loja-titulo">
                        <FaStore /> Mercado e Lojas
                    </h2>

                    {isMestre && (
                        <div className="loja-abas-mestre">
                            <button
                                type="button"
                                className={`btn-aba ${abaAtiva === 'loja' ? 'ativa' : ''}`}
                                onClick={() => setAbaAtiva('loja')}
                            >
                                Ver Lojas
                            </button>
                            <button
                                type="button"
                                className={`btn-aba ${abaAtiva === 'gerenciar' ? 'ativa' : ''}`}
                                onClick={() => setAbaAtiva('gerenciar')}
                            >
                                <FaTools style={{ marginRight: '4px' }} /> Gerenciar Lojas & Catálogo
                            </button>
                        </div>
                    )}
                </div>

                {/* Área de Carteira e Simulação */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {isMestre && !ficha && fichasDisponiveis.length > 0 && (
                        <div style={{ background: '#161b22', border: '1px solid #30363d', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaUserAlt color="#58a6ff" size={12} />
                            <select
                                value={fichaSelecionadaLocalId || ''}
                                onChange={e => setFichaSelecionadaLocalId(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: '#c9d1d9', outline: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                {fichasDisponiveis.map(f => (
                                    <option key={f.id} value={f.id} style={{ background: '#161b22', color: '#c9d1d9' }}>
                                        Mestre simulando: {f.nome_personagem} ({f.zenit || 0}z)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {fichaAtiva ? (
                        <div className="loja-carteira">
                            <FaCoins color="#d4af37" />
                            <span>{fichaAtiva.zenit || 0} zênites <span style={{ color: '#8b949e', fontSize: '0.75rem' }}>({fichaAtiva.nome_personagem})</span></span>
                        </div>
                    ) : (
                        <div style={{ background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.3)', padding: '6px 12px', borderRadius: '8px', color: '#f85149', fontSize: '0.8rem' }}>
                            ⚠️ Nenhuma ficha identificada para este jogador.
                        </div>
                    )}
                </div>
            </div>

            {/* Seletor de Lojas em Carrossel Horizontal (Apenas na Aba de Compras) */}
            {abaAtiva === 'loja' && lojas.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {lojas.map(loja => (
                        <button
                            key={loja.id}
                            type="button"
                            onClick={() => handleSelecionarLoja(loja.id)}
                            style={{
                                background: lojaSelecionadaId === loja.id ? 'linear-gradient(135deg, #21262d 0%, #161b22 100%)' : '#0d1117',
                                color: lojaSelecionadaId === loja.id ? '#d4af37' : '#c9d1d9',
                                border: `1px solid ${lojaSelecionadaId === loja.id ? '#d4af37' : '#30363d'}`,
                                padding: '10px 18px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '2px',
                                minWidth: '180px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaStore size={12} /> {loja.nome}
                            </span>
                            {loja.cidade && (
                                <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>📍 {loja.cidade}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Renderização Condicional dasAbas */}
            {abaAtiva === 'loja' ? (
                lojas.length > 0 ? (
                    <LojaClienteTab
                        itensCatalogo={itensDaLoja}
                        ficha={fichaAtiva}
                        setFicha={setFicha}
                        lojaAtual={lojas.find(l => l.id === lojaSelecionadaId)}
                    />
                ) : (
                    <div className="loja-vazio">
                        <p>Nenhuma loja cadastrada no mundo ainda. O Mestre pode criá-las na aba de Gerenciamento!</p>
                    </div>
                )
            ) : (
                <LojaMestreTab
                    itensCatalogo={todosItensCatalogo}
                    lojas={lojas}
                    recarregarDados={recarregarDadosGlobais}
                    ficha={ficha}
                />
            )}
        </div>
    );
}