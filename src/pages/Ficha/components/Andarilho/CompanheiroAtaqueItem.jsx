import React from 'react';
import { FaDice, FaBolt } from 'react-icons/fa';

export default function CompanheiroAtaqueItem({
    ataque,
    indexAtaque,
    modoAtual,
    onAlterarModo,
    onRolarAtaque,
    ultimaRolagem
}) {
    return (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <strong style={{ color: '#f0f6fc', fontSize: '0.9rem' }}>{ataque.nome}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                        Atributos: [{ataque.atributo_dado1?.toUpperCase()} + {ataque.atributo_dado2?.toUpperCase()}] • Tipo: {ataque.tipo_dano || 'Físico'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '2px' }}>
                <button
                    type="button"
                    onClick={() => onAlterarModo(indexAtaque, 'normal')}
                    style={{
                        flex: 1, background: modoAtual === 'normal' ? '#21262d' : 'transparent',
                        color: modoAtual === 'normal' ? '#f0f6fc' : '#8b949e', border: 'none',
                        padding: '4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    Ataque Único
                </button>
                <button
                    type="button"
                    onClick={() => onAlterarModo(indexAtaque, 'multi')}
                    style={{
                        flex: 1, background: modoAtual === 'multi' ? '#da3633' : 'transparent',
                        color: modoAtual === 'multi' ? '#fff' : '#8b949e', border: 'none',
                        padding: '4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    Multiataque
                </button>
            </div>

            <button
                type="button"
                onClick={() => onRolarAtaque(ataque, indexAtaque)}
                style={{ background: '#238636', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            >
                <FaDice /> Rolar Ataque e Dano do Companheiro
            </button>

            {ultimaRolagem && (
                <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '8px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    {ultimaRolagem.statusCritico && (
                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: ultimaRolagem.statusCritico.includes('Sucesso') ? '#3fb950' : '#f85149', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px' }}>
                            <FaBolt /> {ultimaRolagem.statusCritico}
                        </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#f0f6fc', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Precisão Final:</span>
                        <strong style={{ color: '#d4af37' }}>{ultimaRolagem.testeAtaque}</strong>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#8b949e', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '3px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div>🧩 Atributos: {ultimaRolagem.attr1Label} ({ultimaRolagem.res1}) + {ultimaRolagem.attr2Label} ({ultimaRolagem.res2})</div>
                        <div>⚔️ Bônus de Precisão (NP): +{ultimaRolagem.bonusPrecisao}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#d4af37', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '2px', paddingTop: '2px' }}>
                        <span>Dano Final:</span>
                        <strong style={{ fontSize: '0.85rem' }}>{ultimaRolagem.danoTotal}</strong>
                    </div>
                </div>
            )}
        </div>
    );
}
