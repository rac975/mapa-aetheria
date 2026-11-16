import React from 'react';
import { FaFlask, FaDice } from 'react-icons/fa';

export default function InventorAlquimiaSecao({
    tipoMistura,
    setTipoMistura,
    temAvancadoAlquimia,
    temSuperiorAlquimia,
    onExecutarAlquimia,
    resultadoAlquimia,
    tabelaEfeito,
    descreverAlvo
}) {
    return (
        <div style={{ marginBottom: '14px', borderTop: '1px solid #21262d', paddingTop: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: '#58a6ff', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaFlask /> Alquimia / Misturas (Ação Inventário)
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <button
                    type="button"
                    onClick={() => setTipoMistura('basica')}
                    style={{ flex: 1, background: tipoMistura === 'basica' ? '#21262d' : '#161b22', color: tipoMistura === 'basica' ? '#3fb950' : '#8b949e', border: '1px solid #30363d', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Básica (3 PI | 2 d20)
                </button>
                <button
                    type="button"
                    onClick={() => { if (temAvancadoAlquimia) setTipoMistura('avancada'); }}
                    disabled={!temAvancadoAlquimia}
                    style={{ flex: 1, background: tipoMistura === 'avancada' ? '#21262d' : '#161b22', color: temAvancadoAlquimia ? (tipoMistura === 'avancada' ? '#d4af37' : '#8b949e') : '#484f58', border: '1px solid #30363d', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', cursor: temAvancadoAlquimia ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                >
                    Avançada (4 PI | 3 d20) {!temAvancadoAlquimia && '🔒'}
                </button>
                <button
                    type="button"
                    onClick={() => { if (temSuperiorAlquimia) setTipoMistura('superior'); }}
                    disabled={!temSuperiorAlquimia}
                    style={{ flex: 1, background: tipoMistura === 'superior' ? '#21262d' : '#161b22', color: temSuperiorAlquimia ? (tipoMistura === 'superior' ? '#da3633' : '#8b949e') : '#484f58', border: '1px solid #30363d', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', cursor: temSuperiorAlquimia ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                >
                    Superior (5 PI | 4 d20) {!temSuperiorAlquimia && '🔒'}
                </button>
            </div>

            <button
                type="button"
                onClick={onExecutarAlquimia}
                style={{ width: '100%', background: '#238636', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            >
                <FaDice /> Rolar Mistura Alquímica (Gasta {tipoMistura === 'basica' ? 3 : tipoMistura === 'avancada' ? 4 : 5} PI)
            </button>

            {resultadoAlquimia && (
                <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '10px', borderRadius: '6px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#d4af37', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Resultado da Rolagem ({resultadoAlquimia.tipo.toUpperCase()})</span>
                        <span>[{resultadoAlquimia.dadosRolados.join(', ')}]</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#c9d1d9' }}>
                        💡 Atribua um dado para o <strong>Alvo</strong> e outro para o <strong>Efeito</strong>. Opção "Qualquer": Recupera 30 PV ou causa 20 de dano de veneno.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                        {resultadoAlquimia.dadosRolados.map((d, dIdx) => (
                            <div key={dIdx} style={{ background: '#161b22', padding: '6px', borderRadius: '4px', border: '1px solid #30363d', fontSize: '0.7rem' }}>
                                <span style={{ color: '#58a6ff', fontWeight: 'bold' }}>Dado #{dIdx + 1} ({d}):</span>
                                <div style={{ color: '#f0f6fc', marginTop: '2px' }}>🎯 Alvo: {descreverAlvo(d)}</div>
                                <div style={{ color: '#3fb950', marginTop: '2px' }}>✨ Efeito: {tabelaEfeito[d] || 'Efeito padrão'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
