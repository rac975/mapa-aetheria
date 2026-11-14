export default function FichaFormMochila({ formData, setFormData }) {
    return (
        <div className="form-section-box">
            <h3>Mochila & Notas</h3>
            <div className="form-group">
                <label>Mochila</label>
                <textarea 
                    rows="3" 
                    value={formData.mochila || ''} 
                    onChange={(e) => setFormData({ ...formData, mochila: e.target.value })} 
                />
            </div>
            <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Notas</label>
                <textarea 
                    rows="3" 
                    value={formData.notas || ''} 
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })} 
                />
            </div>
        </div>
    );
}