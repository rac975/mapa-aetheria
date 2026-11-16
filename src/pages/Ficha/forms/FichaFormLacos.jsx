import { FaPlus, FaTrash, FaHeart } from 'react-icons/fa';
import { Card, Button, Badge, Input } from '../../../components/ui';
import styles from './FichaFormLacos.module.css';

export default function FichaFormLacos({ formData, setFormData, setAlerta }) {
    const listaEmocoes = ['Adoração', 'Inferioridade', 'Lealdade', 'Desconfiança', 'Afeto', 'Ódio'];

    const adicionarLaco = () => {
        const lacos = formData.lacos || [];
        if (lacos.length >= 6) {
            setAlerta({ isOpen: true, title: 'Limite', message: 'Máximo de 6 laços permitidos.' });
            return;
        }
        setFormData({ ...formData, lacos: [...lacos, { nome: '', emocoes: [] }] });
    };

    const removerLaco = (i) => {
        setFormData({ ...formData, lacos: (formData.lacos || []).filter((_, idx) => idx !== i) });
    };

    const toggleEmocaoLaco = (lacoIndex, emocao) => {
        const lacos = [...(formData.lacos || [])];
        let emocoesAtuais = lacos[lacoIndex].emocoes || [];

        const pares = {
            'Adoração': 'Inferioridade', 'Inferioridade': 'Adoração',
            'Lealdade': 'Desconfiança', 'Desconfiança': 'Lealdade',
            'Afeto': 'Ódio', 'Ódio': 'Afeto'
        };
        const oposta = pares[emocao];

        if (emocoesAtuais.includes(emocao)) {
            emocoesAtuais = emocoesAtuais.filter(e => e !== emocao);
        } else {
            emocoesAtuais = emocoesAtuais.filter(e => e !== oposta);
            emocoesAtuais.push(emocao);
        }
        lacos[lacoIndex].emocoes = emocoesAtuais;
        setFormData({ ...formData, lacos });
    };

    const lacosLista = formData.lacos || [];

    return (
        <Card variant="default" className={styles.container}>
            <div className={styles.headerRow}>
                <h3 className={styles.title}>
                    <FaHeart className={styles.titleIcon} /> Laços ({lacosLista.length} / 6)
                </h3>
                <Button type="button" variant="secondary" size="sm" onClick={adicionarLaco}>
                    <FaPlus /> Adicionar Laço
                </Button>
            </div>

            {lacosLista.length === 0 ? (
                <p className={styles.emptyText}>
                    Nenhum laço registrado.
                </p>
            ) : (
                lacosLista.map((l, index) => {
                    const emocoes = l.emocoes || [];
                    const forca = emocoes.length;
                    return (
                        <div key={index} className={styles.lacoCard}>
                            <div className={styles.topRow}>
                                <div className={styles.inputWrapper}>
                                    <Input 
                                        type="text" 
                                        placeholder="Nome do Vínculo (Pessoa, Objeto, Organização...)" 
                                        value={l.nome || ''} 
                                        onChange={(e) => {
                                            const novos = [...formData.lacos]; 
                                            novos[index].nome = e.target.value; 
                                            setFormData({ ...formData, lacos: novos });
                                        }} 
                                    />
                                </div>
                                <Badge variant="gold" size="md">
                                    Força: {forca}
                                </Badge>
                                <Button type="button" variant="danger" size="sm" onClick={() => removerLaco(index)} title="Remover laço">
                                    <FaTrash />
                                </Button>
                            </div>
                            <div className={styles.gridEmocoes}>
                                {listaEmocoes.map(emocao => {
                                    const marcado = emocoes.includes(emocao);
                                    return (
                                        <button
                                            key={emocao}
                                            type="button"
                                            onClick={() => toggleEmocaoLaco(index, emocao)}
                                            className={`${styles.btnEmocao} ${marcado ? styles.btnEmocaoAtiva : ''}`}
                                        >
                                            {emocao} {marcado && '✓'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}
        </Card>
    );
}
