import { FaHammer } from 'react-icons/fa';
import CriadorEquipamentoUnificado from '../components/CriadorEquipamentoUnificado';
import styles from './GerenciarForja.module.css';

export default function GerenciarForja({ ficha, recarregarDados }) {
    return (
        <div className={styles.container}>
            <header className={styles.cabecalho}>
                <h3 className={styles.titulo}>
                    <FaHammer /> Oficina do Mestre: Forja de Itens Raros
                </h3>
                <p className={styles.subtitulo}>
                    Crie armas, armaduras e acessórios mágicos customizados aplicando as regras do livro para alimentar o seu catálogo ou recompensar os heróis.
                </p>
            </header>

            <CriadorEquipamentoUnificado
                onCriado={() => {
                    if (recarregarDados) recarregarDados();
                }}
                ficha={ficha}
            />
        </div>
    );
}
