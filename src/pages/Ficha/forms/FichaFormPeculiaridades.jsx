import { LuSparkles } from 'react-icons/lu';

export default function FichaFormPeculiaridade({ formData, setFormData }) {
    return (
        <div className="form-section-box">
            <h3><LuSparkles /> Peculiaridade (Regra Suplementar)</h3>
            <div className="form-group">
                <label>Nome da Peculiaridade</label>
                <input
                    type="text"
                    placeholder="Ex: Linhagem Celestial, Alma de Aço..."
                    value={formData.titulo_pecularidade || ''}
                    onChange={(e) => setFormData({ ...formData, titulo_pecularidade: e.target.value })}
                />
            </div>
            <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Descrição</label>
                <textarea
                    rows="3"
                    placeholder="Descreva os efeitos e detalhes desta peculiaridade..."
                    value={formData.descricao_pecularidade || ''}
                    onChange={(e) => setFormData({ ...formData, descricao_pecularidade: e.target.value })}
                />
            </div>
        </div>
    );
}