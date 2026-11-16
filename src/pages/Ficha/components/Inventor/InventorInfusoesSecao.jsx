import React from 'react';
import { FaBolt } from 'react-icons/fa';

export default function InventorInfusoesSecao({
    temAvancadoInfusoes,
    temSuperiorInfusoes,
    infusaoSelecionada,
    setInfusaoSelecionada
}) {
    return (
        <div style={{ marginBottom: '14px', borderTop: '1px solid #21262d', paddingTop: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: '#d4af37', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaBolt /> Infusões (Custo: 2 PI por ataque)
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '6px' }}>
                Gaste 2 PI ao atingir um alvo com um ataque para aplicar uma infusão (aplica a cada alvo se tiver propriedade multi).
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {/* Básicas */}
                <span style={{ fontSize: '0.7rem', color: '#58a6ff', width: '100%', fontWeight: 'bold', marginTop: '4px' }}>Básicas:</span>
                {['Crio (Gelo)', 'Piro (Fogo)', 'Volt (Raio)'].map((inf) => (
                    <button
                        key={inf}
                        type="button"
                        onClick={() => setInfusaoSelecionada(inf)}
                        style={{ background: infusaoSelecionada === inf ? '#21262d' : '#161b22', color: '#3fb950', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                        {inf} (+5 dano)
                    </button>
                ))}

                {/* Avançadas */}
                {temAvancadoInfusoes && (
                    <>
                        <span style={{ fontSize: '0.7rem', color: '#d4af37', width: '100%', fontWeight: 'bold', marginTop: '4px' }}>Avançadas:</span>
                        {['Ciclone (Ar)', 'Exorcismo (Luz)', 'Sísmico (Terra)', 'Sombra (Trevas)'].map((inf) => (
                            <button
                                key={inf}
                                type="button"
                                onClick={() => setInfusaoSelecionada(inf)}
                                style={{ background: infusaoSelecionada === inf ? '#21262d' : '#161b22', color: '#d4af37', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                            >
                                {inf} (+5 dano)
                            </button>
                        ))}
                    </>
                )}

                {/* Superiores */}
                {temSuperiorInfusoes && (
                    <>
                        <span style={{ fontSize: '0.7rem', color: '#da3633', width: '100%', fontWeight: 'bold', marginTop: '4px' }}>Superiores:</span>
                        {['Vampiro (Recupera PV/PM)', 'Peçonha (Veneno + Condição)'].map((inf) => (
                            <button
                                key={inf}
                                type="button"
                                onClick={() => setInfusaoSelecionada(inf)}
                                style={{ background: infusaoSelecionada === inf ? '#21262d' : '#161b22', color: '#da3633', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                            >
                                {inf}
                            </button>
                        ))}
                    </>
                )}
            </div>
            {infusaoSelecionada && (
                <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#d4af37' }}>
                    ✨ Infusão Ativa para o próximo ataque: <strong>{infusaoSelecionada}</strong> (Gasta 2 PI ao acertar).
                </div>
            )}
        </div>
    );
}
