export default function FichaFormGeral({ formData, setFormData }) {
    return (
        <div className="form-section-box">
            <h3>Informações Básicas</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                    <label>Personagem</label>
                    <input 
                        type="text" 
                        value={formData.nome_personagem || ''} 
                        onChange={(e) => setFormData({ ...formData, nome_personagem: e.target.value })} 
                    />
                </div>
                <div className="form-group">
                    <label>Jogador</label>
                    <input 
                        type="text" 
                        value={formData.nome_jogador || ''} 
                        onChange={(e) => setFormData({ ...formData, nome_jogador: e.target.value })} 
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                    <label>Identidade</label>
                    <input 
                        type="text" 
                        value={formData.identidade || ''} 
                        onChange={(e) => setFormData({ ...formData, identidade: e.target.value })} 
                    />
                </div>
                <div className="form-group">
                    <label>Tema</label>
                    <input 
                        type="text" 
                        value={formData.tema || ''} 
                        onChange={(e) => setFormData({ ...formData, tema: e.target.value })} 
                    />
                </div>
            </div>

            {/* 🔹 Grid ajustado para 2 colunas (Fábula e EXP), já que o Zênite saiu daqui */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                    <label>Pontos de Fábula</label>
                    <input 
                        type="number" 
                        min="0" 
                        value={formData.fabula || 3} 
                        onChange={(e) => setFormData({ ...formData, fabula: parseInt(e.target.value) || 0 })} 
                    />
                </div>
                <div className="form-group">
                    <label>Experiência (EXP - Máx 10)</label>
                    <input 
                        type="number" 
                        min="0" 
                        max="10" 
                        value={formData.exp || 0} 
                        onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            if (val > 10) val = 10; if (val < 0) val = 0;
                            setFormData({ ...formData, exp: val });
                        }} 
                    />
                </div>
            </div>

            <div className="form-group">
                <label>URL do Avatar / Imagem</label>
                <input 
                    type="text" 
                    placeholder="https://..." 
                    value={formData.avatar_url || ''} 
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })} 
                />
            </div>
        </div>
    );
}