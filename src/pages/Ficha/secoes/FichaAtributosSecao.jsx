import { FaDice, FaPlus, FaMinus, FaUndo } from 'react-icons/fa';
import { Card, Badge } from '../../../components/ui';
import { calcularBonusPassivosPoderesHeroicos } from '../../../domain/fabula/heroicAndQuirksRules';
import styles from './FichaAtributosSecao.module.css';

export default function FichaAtributos({
    ficha,
    atributosCalculados = null,
    travaAmarras = false,
    modificadoresTemporarios = {},
    setModificadoresTemporarios,
    onRolarDado
}) {
    const atributosBaseBrutos = {
        destreza: Number(ficha?.destreza) || 8,
        astucia: Number(ficha?.astucia) || 8,
        vigor: Number(ficha?.vigor) || 8,
        vontade: Number(ficha?.vontade) || 8,
    };

    const siglas = {
        destreza: 'DES',
        astucia: 'AST',
        vigor: 'VIG',
        vontade: 'VON'
    };

    // Progressão oficial de dados incluindo d20
    const progressao = [6, 8, 10, 12, 20];
    const bonusHeroicos = calcularBonusPassivosPoderesHeroicos(ficha?.poderes_heroicos || [], ficha?.nivel || 5);

    const getAtributoBaseEfetivo = (nome) => {
        if (atributosCalculados && atributosCalculados[nome]) {
            return Number(atributosCalculados[nome]) || atributosBaseBrutos[nome];
        }
        const baseBruto = atributosBaseBrutos[nome];
        const idxBruto = Math.max(0, progressao.indexOf(baseBruto));
        const passosHeroicos = bonusHeroicos.aumentosAtributo?.[nome] || 0;
        // Poderes Heróicos de Atributo Aprimorado têm teto em d12 (índice 3)
        const idxEfetivo = Math.min(3, idxBruto + passosHeroicos);
        return progressao[idxEfetivo];
    };

    const getAtributoAtual = (nome) => {
        if (atributosCalculados && atributosCalculados[nome]) {
            return Number(atributosCalculados[nome]) || getAtributoBaseEfetivo(nome);
        }
        const base = getAtributoBaseEfetivo(nome);
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
                {travaAmarras && (
                    <Badge variant="crise" size="sm">Símbolo das Amarras (Travado no Base)</Badge>
                )}
            </h3>
            <div className={styles.gridAtributos}>
                {Object.keys(atributosBaseBrutos).map((key) => {
                    const baseBruto = atributosBaseBrutos[key];
                    const base = getAtributoBaseEfetivo(key);
                    const valorFinal = getAtributoAtual(key);
                    const sigla = siglas[key];
                    const temAprimoramentoHeroico = (bonusHeroicos.aumentosAtributo?.[key] || 0) > 0;

                    const ehBuff = valorFinal > baseBruto;
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
                            {temAprimoramentoHeroico && (
                                <Badge variant="core" size="sm">
                                    ★ Aprimorado
                                </Badge>
                            )}

                            {/* Controles de Aumentar / Diminuir sem números, apenas botões */}
                            <div className={styles.controlesBox} onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    disabled={atingiuMinimo}
                                    onClick={(e) => alterarModificador(e, key, -1)}
                                    title="Reduzir dado"
                                    aria-label="Reduzir dado"
                                    className={`${styles.btnControl} ${styles.btnMinus}`}
                                >
                                    <FaMinus size={9} />
                                </button>
                                <button
                                    type="button"
                                    disabled={atingiuBase}
                                    onClick={(e) => resetModificador(e, key)}
                                    title="Resetar dado para o valor base"
                                    aria-label="Resetar dado para o valor base"
                                    className={`${styles.btnControl} ${styles.btnReset}`}
                                >
                                    <FaUndo size={9} />
                                </button>
                                <button
                                    type="button"
                                    disabled={atingiuMaximo}
                                    onClick={(e) => alterarModificador(e, key, 1)}
                                    title="Aumentar dado"
                                    aria-label="Aumentar dado"
                                    className={`${styles.btnControl} ${styles.btnPlus}`}
                                >
                                    <FaPlus size={9} />
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
