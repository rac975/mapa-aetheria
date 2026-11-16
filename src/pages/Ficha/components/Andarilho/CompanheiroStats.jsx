import React from 'react';

export default function CompanheiroStats({ companheiro }) {
    return (
        <>
            {/* Atributos Básicos */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Atributos</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                    {['des', 'ast', 'vig', 'von'].map(attr => (
                        <div key={attr} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                            <div style={{ fontSize: '0.65rem', color: '#8b949e', textTransform: 'uppercase' }}>{attr}</div>
                            <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{companheiro.atributos?.[attr] || 'd8'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Estatísticas de Combate */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Estatísticas de Combate</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#ff7b72' }}>PV Máx</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{companheiro.pv_max}</div>
                    </div>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#58a6ff' }}>PM Máx</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{companheiro.pm_max}</div>
                    </div>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#3fb950' }}>Defesa</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{companheiro.defesa}</div>
                    </div>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#d2a8ff' }}>Def. Mág.</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{companheiro.defesa_magica}</div>
                    </div>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#8b949e' }}>Iniciativa</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>0</div>
                    </div>
                </div>
            </div>
        </>
    );
}
