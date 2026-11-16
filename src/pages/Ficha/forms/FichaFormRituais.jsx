import { Card } from '../../../components/ui';
import styles from './FichaFormRituais.module.css';

export default function FichaFormRituais({ formData, setFormData }) {
    const rituaisDisponiveis = ['Arcanismo', 'Quimerismo', 'Elementalismo', 'Entropismo', 'Ritualismo', 'Espiritualismo'];

    return (
        <Card variant="default" className={styles.container}>
            <h3 className={styles.title}>Rituais que Pode Realizar</h3>
            <div className={styles.gridRituais}>
                {rituaisDisponiveis.map(rit => {
                    const rituaisAtuais = formData.rituais || [];
                    const marcado = rituaisAtuais.includes(rit);
                    return (
                        <label 
                            key={rit} 
                            className={`${styles.checkboxItem} ${marcado ? styles.checkboxItemAtivo : ''}`}
                        >
                            <input 
                                type="checkbox" 
                                checked={marcado} 
                                onChange={(e) => {
                                    const novos = e.target.checked 
                                        ? [...rituaisAtuais, rit] 
                                        : rituaisAtuais.filter(r => r !== rit);
                                    setFormData({ ...formData, rituais: novos });
                                }} 
                                className={styles.checkboxInput}
                            /> 
                            <span>{rit}</span>
                        </label>
                    );
                })}
            </div>
        </Card>
    );
}
