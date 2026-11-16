export default function FichaFormAtributos({ formData, setFormData }) {
    // Progressão oficial de atributos em Fabula Ultima (d6 a d12)
    const progressao = [6, 8, 10, 12];

    const atributos = [
        { key: 'destreza', sigla: 'DES' },
        { key: 'astucia', sigla: 'AST' },
        { key: 'vigor', sigla: 'VIG' },
        { key: 'vontade', sigla: 'VON' }
    ];

    return (
        <div className="form-section-box" style={{ background: '#0d0f18', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ color: '#f0f6fc', fontSize: '1rem', marginBottom: '12px' }}>Atributos, Limites e Combate</h3>
            
            {/* Atributos Principais em 4 colunas com o visual dos cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '15px' }}>
                {atributos.map(({ key, sigla }) => {
                    const valorAtual = formData[key] || 8;

                    return (
                        <div
                            key={key}
                            style={{
                                background: '#161b22',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center'
                            }}
                        >
                            <span style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: 'bold' }}>{sigla}</span>

                            <strong style={{ color: '#d4af37', fontSize: '1.3rem', margin: '6px 0' }}>
                                d{valorAtual}
                            </strong>

                            <select
                                value={valorAtual}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    [key]: parseInt(e.target.value) || 8 
                                })}
                                style={{
                                    width: '100%',
                                    background: '#0d1117',
                                    color: '#f0f6fc',
                                    border: '1px solid #30363d',
                                    borderRadius: '4px',
                                    padding: '4px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                }}
                            >
                                {progressao.map((dado) => (
                                    <option key={dado} value={dado}>
                                        d{dado}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}