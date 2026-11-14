import { FaPlus, FaTrash } from 'react-icons/fa';

export default function FichaFormEquipamentos({ formEquipamentos, setFormEquipamentos }) {
    const adicionarEquipamento = () => setFormEquipamentos([...formEquipamentos, { nome: '', descricao: '' }]);
    const removerEquipamento = (i) => setFormEquipamentos(formEquipamentos.filter((_, idx) => idx !== i));

    return (
        <div className="form-section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Equipamentos</h3>
                <button type="button" className="btn-secundario" onClick={adicionarEquipamento}>
                    <FaPlus /> Adicionar Equipamento
                </button>
            </div>
            {formEquipamentos.map((eq, index) => (
                <div key={index} style={{ border: '1px solid #30363d', padding: '10px', marginTop: '10px', borderRadius: '6px' }}>
                    <div className="form-grid-2" style={{ marginBottom: '8px' }}>
                        <input
                            type="text"
                            placeholder="Nome do Equipamento"
                            value={eq.nome}
                            onChange={(e) => {
                                const atual = [...formEquipamentos]; atual[index].nome = e.target.value; setFormEquipamentos(atual);
                            }}
                        />
                        <button type="button" className="btn-del" onClick={() => removerEquipamento(index)}>
                            <FaTrash /> Remover
                        </button>
                    </div>
                    <textarea
                        rows="2"
                        placeholder="Descrição..."
                        value={eq.descricao || ''}
                        onChange={(e) => {
                            const atual = [...formEquipamentos]; atual[index].descricao = e.target.value; setFormEquipamentos(atual);
                        }}
                    />
                </div>
            ))}
        </div>
    );
}