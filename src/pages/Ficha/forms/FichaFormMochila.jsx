import { Card } from '../../../components/ui';
import styles from './FichaFormMochila.module.css';

export default function FichaFormMochila({ formData, setFormData }) {
    return (
        <Card variant="default" className={styles.container}>
            <h3 className={styles.title}>Mochila & Notas</h3>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Mochila</label>
                <textarea 
                    rows="3" 
                    value={formData.mochila || ''} 
                    onChange={(e) => setFormData({ ...formData, mochila: e.target.value })} 
                    className={styles.textarea}
                />
            </div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Notas</label>
                <textarea 
                    rows="3" 
                    value={formData.notas || ''} 
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })} 
                    className={styles.textarea}
                />
            </div>
        </Card>
    );
}
