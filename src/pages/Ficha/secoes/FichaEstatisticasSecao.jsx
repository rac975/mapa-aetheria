import { FaShieldAlt } from 'react-icons/fa';

export default function FichaEstatisticasSecao({ statusFicha }) {
    if (!statusFicha) return null;

    return (
        <section className="ficha-card-section" style={{ background: '#0d0f18', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛡️ Estatísticas de Combate (Calculadas)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: '#161b22', padding: '10px', borderRadius: '6px', border: '1px solid #21262d' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8b949e', display: 'block' }}>DEFESA (DEF)</span>
                    <strong style={{ fontSize: '1.2rem', color: '#58a6ff' }}>{statusFicha.defesaTotal}</strong>
                </div>
                <div style={{ background: '#161b22', padding: '10px', borderRadius: '6px', border: '1px solid #21262d' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8b949e', display: 'block' }}>DEF. MÁGICA (MDEF)</span>
                    <strong style={{ fontSize: '1.2rem', color: '#bc8cff' }}>{statusFicha.mdefTotal}</strong>
                </div>
                <div style={{ background: '#161b22', padding: '10px', borderRadius: '6px', border: '1px solid #21262d' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8b949e', display: 'block' }}>INICIATIVA</span>
                    <strong style={{ fontSize: '1.2rem', color: '#d4af37' }}>{statusFicha.iniciativaTotal}</strong>
                </div>
            </div>
        </section>
    );
}