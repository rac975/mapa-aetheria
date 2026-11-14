export default function FichaFormRituais({ formData, setFormData }) {
    const rituaisDisponiveis = ['Arcanismo', 'Quimerismo', 'Elementalismo', 'Entropismo', 'Ritualismo', 'Espiritualismo'];

    return (
        <div className="form-section-box">
            <h3>Rituais que Pode Realizar</h3>
            <div className="checkbox-grid grid_mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {rituaisDisponiveis.map(rit => {
                    const rituaisAtuais = formData.rituais || [];
                    const marcado = rituaisAtuais.includes(rit);
                    return (
                        <label key={rit} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c9d1d9', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={marcado} 
                                onChange={(e) => {
                                    const novos = e.target.checked ? [...rituaisAtuais, rit] : rituaisAtuais.filter(r => r !== rit);
                                    setFormData({ ...formData, rituais: novos });
                                }} 
                            /> 
                            {rit}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}