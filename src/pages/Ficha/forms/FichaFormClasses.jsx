import { FaPlus, FaTrash } from 'react-icons/fa';

export default function FichaFormClasses({ formClasses, setFormClasses, formData, setFormData, calcularNivelTotal }) {

    const adicionarClasse = () => {
        const novas = [...formClasses, { 
            nome_classe: '', 
            nivel: 1, 
            beneficios: '', 
            habilidades: [], 
            magias: [] // Magias atreladas diretamente à classe
        }];
        setFormClasses(novas);
        setFormData({ ...formData, nivel: calcularNivelTotal(novas) });
    };

    const removerClasse = (i) => {
        const novas = formClasses.filter((_, idx) => idx !== i);
        setFormClasses(novas);
        setFormData({ ...formData, nivel: calcularNivelTotal(novas) });
    };

    const adicionarMagiaClasse = (classeIndex) => {
        const novas = [...formClasses];
        if (!novas[classeIndex].magias) novas[classeIndex].magias = [];
        novas[classeIndex].magias.push({ nome: '', custo_mp: 0, alvo: '', duracao: '', descricao: '' });
        setFormClasses(novas);
    };

    const removerMagiaClasse = (classeIndex, magiaIndex) => {
        const novas = [...formClasses];
        novas[classeIndex].magias = novas[classeIndex].magias.filter((_, idx) => idx !== magiaIndex);
        setFormClasses(novas);
    };

    return (
        <div className="form-section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Classes, Habilidades e Magias</h3>
                <button type="button" className="btn-secundario" onClick={adicionarClasse}>
                    <FaPlus /> Adicionar Classe
                </button>
            </div>

            {formClasses.map((c, index) => {
                const somaHabs = (c.habilidades || []).reduce((acc, h) => acc + (parseInt(h.nivel) || 0), 0);
                const nivelClasse = parseInt(c.nivel) || 0;
                
                return (
                    <div key={index} style={{ border: '1px solid #30363d', padding: '14px', marginTop: '14px', borderRadius: '8px', background: '#0d0f18' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Nome da Classe (Ex: Elementalista, Guardião)"
                                value={c.nome_classe}
                                onChange={(e) => {
                                    const atual = [...formClasses]; atual[index].nome_classe = e.target.value; setFormClasses(atual);
                                }}
                            />
                            <input
                                type="number"
                                min="1"
                                max="10"
                                placeholder="Nível"
                                value={c.nivel}
                                onChange={(e) => {
                                    let val = parseInt(e.target.value) || 1;
                                    if (val > 10) val = 10; if (val < 1) val = 1;
                                    const atual = [...formClasses]; atual[index].nivel = val;
                                    setFormClasses(atual);
                                    setFormData({ ...formData, nivel: calcularNivelTotal(atual) });
                                }}
                            />
                            <button type="button" className="btn-del" onClick={() => removerClasse(index)} style={{ padding: '8px', height: '100%' }}>
                                <FaTrash />
                            </button>
                        </div>

                        {/* Benefícios e Proficiências */}
                        <div style={{ marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder="Benefícios (Ex: +5 PV, Proficiência com Armas Marciais)"
                                value={c.beneficios || ''}
                                onChange={(e) => {
                                    const atual = [...formClasses];
                                    atual[index].beneficios = e.target.value;
                                    setFormClasses(atual);
                                }}
                            />
                        </div>

                        {/* Seção de Magias Atreladas à Classe */}
                        <div style={{ borderTop: '1px solid #30363d', paddingTop: '8px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#58a6ff', fontWeight: 'bold' }}>
                                    Magias da Classe
                                </span>
                                <button type="button" className="btn-secundario" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => adicionarMagiaClasse(index)}>
                                    <FaPlus /> Adicionar Magia
                                </button>
                            </div>

                            {(c.magias || []).map((m, mIndex) => (
                                <div key={mIndex} style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center', background: '#161b22', padding: '6px', borderRadius: '4px' }}>
                                    <input
                                        type="text"
                                        placeholder="Nome da Magia"
                                        value={m.nome}
                                        onChange={(e) => {
                                            const atual = [...formClasses];
                                            atual[index].magias[mIndex].nome = e.target.value;
                                            setFormClasses(atual);
                                        }}
                                        style={{ flex: 2 }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="MP"
                                        value={m.custo_mp}
                                        onChange={(e) => {
                                            const atual = [...formClasses];
                                            atual[index].magias[mIndex].custo_mp = e.target.value;
                                            setFormClasses(atual);
                                        }}
                                        style={{ flex: 0.5 }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Descrição curta"
                                        value={m.descricao}
                                        onChange={(e) => {
                                            const atual = [...formClasses];
                                            atual[index].magias[mIndex].descricao = e.target.value;
                                            setFormClasses(atual);
                                        }}
                                        style={{ flex: 3 }}
                                    />
                                    <button type="button" className="btn-del" style={{ padding: '4px' }} onClick={() => removerMagiaClasse(index, mIndex)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Habilidades da Classe */}
                        <div style={{ borderTop: '1px solid #30363d', paddingTop: '8px', marginTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.85rem', color: somaHabs > nivelClasse ? '#f85149' : '#d4af37', fontWeight: 'bold' }}>
                                    Habilidades (Soma Níveis: {somaHabs} / {nivelClasse})
                                </span>
                                {/* ... botão adicionar habilidade ... */}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}