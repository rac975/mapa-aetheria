import { FaPlus, FaTrash, FaHeart } from 'react-icons/fa';

export default function FichaFormLacos({ formData, setFormData, setAlerta }) {
    const listaEmocoes = ['Adoração', 'Inferioridade', 'Lealdade', 'Desconfiança', 'Afeto', 'Ódio'];

    const adicionarLaco = () => {
        const lacos = formData.lacos || [];
        if (lacos.length >= 6) {
            setAlerta({ isOpen: true, title: 'Limite', message: 'Máximo de 6 laços permitidos.' });
            return;
        }
        setFormData({ ...formData, lacos: [...lacos, { nome: '', emocoes: [] }] });
    };

    const removerLaco = (i) => {
        setFormData({ ...formData, lacos: (formData.lacos || []).filter((_, idx) => idx !== i) });
    };

    const toggleEmocaoLaco = (lacoIndex, emocao) => {
        const lacos = [...(formData.lacos || [])];
        let emocoesAtuais = lacos[lacoIndex].emocoes || [];

        const pares = {
            'Adoração': 'Inferioridade', 'Inferioridade': 'Adoração',
            'Lealdade': 'Desconfiança', 'Desconfiança': 'Lealdade',
            'Afeto': 'Ódio', 'Ódio': 'Afeto'
        };
        const oposta = pares[emocao];

        if (emocoesAtuais.includes(emocao)) {
            emocoesAtuais = emocoesAtuais.filter(e => e !== emocao);
        } else {
            emocoesAtuais = emocoesAtuais.filter(e => e !== oposta);
            emocoesAtuais.push(emocao);
        }
        lacos[lacoIndex].emocoes = emocoesAtuais;
        setFormData({ ...formData, lacos });
    };

    return (
        <div className="form-section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3><FaHeart /> Laços ({(formData.lacos || []).length} / 6)</h3>
                <button type="button" className="btn-secundario" onClick={adicionarLaco}>
                    <FaPlus /> Adicionar Laço
                </button>
            </div>

            {(formData.lacos || []).length === 0 ? (
                <p style={{ color: '#8b949e', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }}>
                    Nenhum laço registrado.
                </p>
            ) : (
                (formData.lacos || []).map((l, index) => {
                    const emocoes = l.emocoes || [];
                    const forca = emocoes.length;
                    return (
                        <div key={index} style={{ border: '1px solid #30363d', padding: '12px', marginTop: '10px', borderRadius: '6px', background: '#0d0f18' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                <input 
                                    type="text" 
                                    placeholder="Nome do Vínculo (Pessoa, Objeto, Organização...)" 
                                    value={l.nome || ''} 
                                    onChange={(e) => {
                                        const novos = [...formData.lacos]; 
                                        novos[index].nome = e.target.value; 
                                        setFormData({ ...formData, lacos: novos });
                                    }} 
                                    style={{ flex: 1 }} 
                                />
                                <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', background: 'rgba(212, 175, 55, 0.1)', padding: '6px 10px', borderRadius: '4px' }}>
                                    Força: {forca}
                                </span>
                                <button type="button" className="btn-del" onClick={() => removerLaco(index)} style={{ padding: '8px', height: '100%' }}>
                                    <FaTrash />
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                {listaEmocoes.map(emocao => {
                                    const marcado = emocoes.includes(emocao);
                                    return (
                                        <button
                                            key={emocao}
                                            type="button"
                                            onClick={() => toggleEmocaoLaco(index, emocao)}
                                            style={{
                                                background: marcado ? 'rgba(212, 175, 55, 0.2)' : '#161b22',
                                                color: marcado ? '#d4af37' : '#c9d1d9',
                                                border: `1px solid ${marcado ? '#d4af37' : '#30363d'}`,
                                                padding: '6px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: marcado ? 'bold' : 'normal',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {emocao} {marcado && '✓'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}