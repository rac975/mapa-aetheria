import { FaPlus, FaTrash } from 'react-icons/fa';
import { Card, Button, Input } from '../../../components/ui';
import styles from './FichaFormEquipamentos.module.css';

export default function FichaFormEquipamentos({ formEquipamentos, setFormEquipamentos }) {
    const adicionarEquipamento = () => setFormEquipamentos([...formEquipamentos, { nome: '', descricao: '' }]);
    const removerEquipamento = (i) => setFormEquipamentos(formEquipamentos.filter((_, idx) => idx !== i));

    return (
        <Card variant="default" className={styles.container}>
            <div className={styles.headerRow}>
                <h3 className={styles.title}>Equipamentos</h3>
                <Button type="button" variant="secondary" size="sm" onClick={adicionarEquipamento}>
                    <FaPlus /> Adicionar Equipamento
                </Button>
            </div>
            {formEquipamentos.map((eq, index) => (
                <div key={index} className={styles.itemCard}>
                    <div className={styles.topRow}>
                        <div className={styles.inputNomeWrapper}>
                            <Input
                                placeholder="Nome do Equipamento"
                                value={eq.nome}
                                onChange={(e) => {
                                    const atual = [...formEquipamentos];
                                    atual[index].nome = e.target.value;
                                    setFormEquipamentos(atual);
                                }}
                            />
                        </div>
                        <Button type="button" variant="danger" size="sm" onClick={() => removerEquipamento(index)}>
                            <FaTrash /> Remover
                        </Button>
                    </div>
                    <textarea
                        rows="2"
                        placeholder="Descrição..."
                        value={eq.descricao || ''}
                        onChange={(e) => {
                            const atual = [...formEquipamentos];
                            atual[index].descricao = e.target.value;
                            setFormEquipamentos(atual);
                        }}
                        className={styles.textareaDescricao}
                    />
                </div>
            ))}
        </Card>
    );
}
