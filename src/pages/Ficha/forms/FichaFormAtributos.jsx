export default function FichaFormAtributos({ formData, setFormData }) {
    return (
        <div className="form-section-box">
            <h3>Atributos, Limites e Combate</h3>
            
            {/* Atributos Principais em 4 colunas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '15px' }}>
                <div className="form-group">
                    <label>DES (d)</label>
                    <input type="number" value={formData.destreza || 8} onChange={(e) => setFormData({ ...formData, destreza: parseInt(e.target.value) || 8 })} />
                </div>
                <div className="form-group">
                    <label>VIG (d)</label>
                    <input type="number" value={formData.vigor || 8} onChange={(e) => setFormData({ ...formData, vigor: parseInt(e.target.value) || 8 })} />
                </div>
                <div className="form-group">
                    <label>AST (d)</label>
                    <input type="number" value={formData.astucia || 8} onChange={(e) => setFormData({ ...formData, astucia: parseInt(e.target.value) || 8 })} />
                </div>
                <div className="form-group">
                    <label>VON (d)</label>
                    <input type="number" value={formData.vontade || 8} onChange={(e) => setFormData({ ...formData, vontade: parseInt(e.target.value) || 8 })} />
                </div>
            </div>

            {/* Limites e Defesas em grid balanceado */}
            {/* <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                <div className="form-group">
                    <label>HP Máximo</label>
                    <input type="number" value={formData.hp_max || 40} onChange={(e) => setFormData({ ...formData, hp_max: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="form-group">
                    <label>MP Máximo</label>
                    <input type="number" value={formData.mp_max || 40} onChange={(e) => setFormData({ ...formData, mp_max: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                    <label>IP Máximo</label>
                    <input type="number" value={formData.pi_max || 6} onChange={(e) => setFormData({ ...formData, pi_max: parseInt(e.target.value) || 0 })} />
                </div>
            </div> */}

            {/* <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div className="form-group">
                    <label>Iniciativa</label>
                    <input type="number" value={formData.iniciativa || 0} onChange={(e) => setFormData({ ...formData, iniciativa: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                    <label>Defesa</label>
                    <input type="number" value={formData.defesa || 10} onChange={(e) => setFormData({ ...formData, defesa: parseInt(e.target.value) || 10 })} />
                </div>
                <div className="form-group">
                    <label>M. Defesa</label>
                    <input type="number" value={formData.mdef || 10} onChange={(e) => setFormData({ ...formData, mdef: parseInt(e.target.value) || 10 })} />
                </div>
            </div> */}
        </div>
    );
}