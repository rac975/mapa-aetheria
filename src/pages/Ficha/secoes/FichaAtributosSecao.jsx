import { FaDice, FaPlus, FaMinus } from 'react-icons/fa';
import { LuDot } from 'react-icons/lu';
import { Card } from '../../../components/ui';
import styles from './FichaAtributosSecao.module.css';

export default function FichaAtributos({ ficha, modificadoresTemporarios = {}, setModificadoresTemporarios, onRolarDado }) {
    const atributosBase = {
        destreza: ficha?.destreza || 8,
        astucia: ficha?.astucia || 8,
        vigor: ficha?.vigor || 8,
        vontade: ficha?.vontade || 8,
    };

    const siglas = {
        destreza: 'DES',
        astucia: 'AST',
        vigor: 'VIG',
        vontade: 'VON'
    };

    // Nova progressão solicitada incluindo o d20
    const progressao = [6, 8, 10, 12, 20];

    const getAtributoAtual = (nome) => {
        const base = atributosBase[nome];
        const mod = modificadoresTemporarios[nome] || 0;
        const idxBase = progressao.indexOf(base);
        const idxFinal = Math.max(0, Math.min(progressao.length - 1, idxBase + mod));
        return progressao[idxFinal];
    };

    const alterarModificador = (e, nome, direcao) => {
        e.stopPropagation();
        const modAtual = modificadoresTemporarios[nome] || 0;
        const novoMod = modAtual + direcao;
        if (setModificadoresTemporarios) {
            setModificadoresTemporarios({
                ...modificadoresTemporarios,
                [nome]: novoMod
            });
        }
    };

    const resetModificador = (e, nome) => {
        e.stopPropagation();
        if (setModificadoresTemporarios) {
            setModificadoresTemporarios({
                ...modificadoresTemporarios,
                [nome]: 0
            });
        }
    };

    return (
        <Card variant="default" className={styles.container}>
            <h3 className={styles.sectionHeader}>
                <FaDice /> Atributos e Modificadores Temporários
            </h3>
            <div className={styles.gridAtributos}>
                {Object.keys(atributosBase).map((key) => {
                    const base = atributosBase[key];
                    const valorFinal = getAtributoAtual(key);
                    const sigla = siglas[key];

                    const ehBuff = valorFinal > base;
                    const ehDebuff = valorFinal < base;

                    let classeValor = styles.valNormal;
                    let classeBoxEstado = '';
                    if (ehBuff) {
                        classeValor = styles.valBuff;
                        classeBoxEstado = styles.boxBuff;
                    } else if (ehDebuff) {
                        classeValor = styles.valDebuff;
                        classeBoxEstado = styles.boxDebuff;
                    }

                    // Valida se atingiu os limites da lista [6, 8, 10, 12, 20]
                    const idxAtual = progressao.indexOf(valorFinal);
                    const atingiuMinimo = idxAtual === 0;       // d6
                    const atingiuMaximo = idxAtual === progressao.length - 1; // d20
                    const atingiuBase = valorFinal === base;

                    return (
                        <div
                            key={key}
                            className={`${styles.atribBox} ${classeBoxEstado}`}
                            onClick={() => onRolarDado && onRolarDado(sigla, valorFinal)}
                            title="Clique para rolar o dado!"
                        >
                            <span className={styles.sigla}>{sigla}</span>

                            {/* Valor do Dado Atual */}
                            <strong className={`${styles.valorDado} ${classeValor}`}>
                                d{valorFinal}
                            </strong>

                            {/* Controles de Aumentar / Diminuir sem números, apenas botões */}
                            <div className={styles.controlesBox} onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    disabled={atingiuMinimo}
                                    onClick={(e) => alterarModificador(e, key, -1)}
                                    title="Reduzir dado"
                                    className={`${styles.btnControl} ${styles.btnMinus}`}
                                >
                                    <FaMinus size={10} />
                                </button>
                                <button
                                    type="button"
                                    disabled={atingiuBase}
                                    onClick={(e) => resetModificador(e, key)}
                                    title="Resetar dado"
                                    className={`${styles.btnControl} ${styles.btnReset}`}
                                >
                                    <LuDot size={32} />
                                </button>
                                <button
                                    type="button"
                                    disabled={atingiuMaximo}
                                    onClick={(e) => alterarModificador(e, key, 1)}
                                    title="Aumentar dado"
                                    className={`${styles.btnControl} ${styles.btnPlus}`}
                                >
                                    <FaPlus size={10} />
                                </button>
                            </div>

                            <div className={styles.rolarPrompt}>
                                <FaDice className={styles.rolarIcone} />
                                <span>Rolar</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
