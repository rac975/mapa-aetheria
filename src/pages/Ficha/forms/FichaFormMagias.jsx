import { FaPlus, FaTrash, FaMagic } from 'react-icons/fa';

export default function FichaFormMagias({ formMagias, setFormMagias }) {
    const adicionarMagia = () => {
        setFormMagias([
            ...formMagias, 
            { nome: '', custo_mp: 5, alvos: '', duracao: 'Instantânea', descricao: '' }
        ]);
    };

    const removerMagia = (i) => {
        setFormMagias(formMagias.filter((_, idx) => idx !== i));
    };

    const atualizarMagia = (index, campo, valor) => {
        const atual = [...formMagias];
        atual[index][campo] = valor;
        setFormMagias(atual);
    };

    return (
        <div className="form-section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3><FaMagic /> Magias / Arcanas</h3>
                <button type="button" className="btn-secundario" onClick={adicionarMagia}>
                    <FaPlus /> Adicionar Magia
                </button>
            </div>

            {formMagias.length === 0 ? (
                <p style={{ color: '#8b949e', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }}>
                    Nenhuma magia cadastrada.
                </p>
            ) : (
                formMagias.map((m, index) => (
                    <div key={index} style={{ border: '1px solid #30363d', padding: '12px', marginTop: '10px', borderRadius: '6px', background: '#0d0f18' }}>
                        
                        {/* Linha 1: Nome, Custo MP, Alvos e Botão de Deletar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 100px 1.5fr 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                            <input 
                                type="text" 
                                placeholder="Nome da Magia" 
                                value={m.nome || ''} 
                                onChange={(e) => atualizarMagia(index, 'nome', e.target.value)} 
                            />
                            <input 
                                type="number" 
                                placeholder="MP" 
                                value={m.custo_mp ?? 5} 
                                onChange={(e) => atualizarMagia(index, 'custo_mp', parseInt(e.target.value) || 0)} 
                            />
                            <input 
                                type="text" 
                                placeholder="Alvos" 
                                value={m.alvos || ''} 
                                onChange={(e) => atualizarMagia(index, 'alvos', e.target.value)} 
                            />
                            <button type="button" className="btn-del" onClick={() => removerMagia(index)} style={{ padding: '8px', height: '100%' }}>
                                <FaTrash />
                            </button>
                        </div>

                        {/* Linha 2: Duração */}
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                            <input 
                                type="text" 
                                placeholder="Duração (ex: Instantânea, Cenas de Conflito...)" 
                                value={m.duracao || ''} 
                                onChange={(e) => atualizarMagia(index, 'duracao', e.target.value)} 
                            />
                        </div>

                        {/* Linha 3: Descrição */}
                        <textarea 
                            rows="2" 
                            placeholder="Descrição dos efeitos e regras da magia..." 
                            value={m.descricao || ''} 
                            onChange={(e) => atualizarMagia(index, 'descricao', e.target.value)} 
                        />
                    </div>
                ))
            )}
        </div>
    );
}