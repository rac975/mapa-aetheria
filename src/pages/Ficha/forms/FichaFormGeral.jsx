import { Card, Input } from '../../../components/ui';
import styles from './FichaFormGeral.module.css';

export default function FichaFormGeral({ formData, setFormData }) {
    return (
        <Card variant="default" className={styles.container}>
            <h3 className={styles.title}>Informações Básicas</h3>
            
            <div className={styles.grid2}>
                <Input 
                    label="Personagem"
                    type="text" 
                    value={formData.nome_personagem || ''} 
                    onChange={(e) => setFormData({ ...formData, nome_personagem: e.target.value })} 
                />
                <Input 
                    label="Jogador"
                    type="text" 
                    value={formData.nome_jogador || ''} 
                    onChange={(e) => setFormData({ ...formData, nome_jogador: e.target.value })} 
                />
            </div>

            <div className={styles.grid2}>
                <Input 
                    label="Identidade"
                    type="text" 
                    value={formData.identidade || ''} 
                    onChange={(e) => setFormData({ ...formData, identidade: e.target.value })} 
                />
                <Input 
                    label="Tema"
                    type="text" 
                    value={formData.tema || ''} 
                    onChange={(e) => setFormData({ ...formData, tema: e.target.value })} 
                />
            </div>

            {/* Grid ajustado para 2 colunas (Fábula e EXP), já que o Zênite foi para o Header */}
            <div className={styles.grid2}>
                <Input 
                    label="Pontos de Fábula"
                    type="number" 
                    min="0" 
                    value={formData.fabula ?? 3} 
                    onChange={(e) => setFormData({ ...formData, fabula: parseInt(e.target.value) || 0 })} 
                />
                <Input 
                    label="Experiência (EXP - Máx 10)"
                    type="number" 
                    min="0" 
                    max="10" 
                    value={formData.exp || 0} 
                    onChange={(e) => {
                        let val = parseInt(e.target.value) || 0;
                        if (val > 10) val = 10;
                        if (val < 0) val = 0;
                        setFormData({ ...formData, exp: val });
                    }} 
                />
            </div>

            <Input 
                label="URL do Avatar / Imagem"
                type="text" 
                placeholder="https://..." 
                value={formData.avatar_url || ''} 
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })} 
            />
        </Card>
    );
}
