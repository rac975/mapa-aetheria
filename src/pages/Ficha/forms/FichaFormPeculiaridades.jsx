import { LuSparkles } from 'react-icons/lu';
import { Card, Input } from '../../../components/ui';
import styles from './FichaFormPeculiaridades.module.css';

export default function FichaFormPeculiaridade({ formData, setFormData }) {
    return (
        <Card variant="default" className={styles.container}>
            <h3 className={styles.title}>
                <LuSparkles className={styles.titleIcon} /> Peculiaridade (Regra Suplementar)
            </h3>
            
            <Input
                label="Nome da Peculiaridade"
                type="text"
                placeholder="Ex: Linhagem Celestial, Alma de Aço..."
                value={formData.titulo_pecularidade || ''}
                onChange={(e) => setFormData({ ...formData, titulo_pecularidade: e.target.value })}
            />

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Descrição</label>
                <textarea
                    rows="3"
                    placeholder="Descreva os efeitos e detalhes desta peculiaridade..."
                    value={formData.descricao_pecularidade || ''}
                    onChange={(e) => setFormData({ ...formData, descricao_pecularidade: e.target.value })}
                    className={styles.textarea}
                />
            </div>
        </Card>
    );
}
