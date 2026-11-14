import { FaDice, FaPlus, FaMinus } from 'react-icons/fa';
import { LuDot } from 'react-icons/lu';

export default function FichaAtributos({ ficha, modificadoresTemporarios = {}, setModificadoresTemporarios, onRolarDado }) {
    const atributosBase = {
        destreza: ficha.destreza || 8,
        astucia: ficha.astucia || 8,
        vigor: ficha.vigor || 8,
        vontade: ficha.vontade || 8,
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
    }

    return (
        <section className="ficha-card-section">
            <h3>Atributos e Modificadores Temporários</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {Object.keys(atributosBase).map((key) => {
                    const base = atributosBase[key];
                    const valorFinal = getAtributoAtual(key);
                    const sigla = siglas[key];

                    // Cor do dado: verde se for maior que o original, vermelho se for menor, normal se igual
                    let corTexto = '#d4af37';
                    if (valorFinal > base) corTexto = '#2ecc71'; // Verde (maior)
                    if (valorFinal < base) corTexto = '#f85149'; // Vermelho (menor)

                    // Valida se atingiu os limites da lista [6, 8, 10, 12, 20]
                    const idxAtual = progressao.indexOf(valorFinal);
                    const atingiuMinimo = idxAtual === 0;       // d6
                    const atingiuMaximo = idxAtual === progressao.length - 1; // d20
                    const atingiuBase = valorFinal === base;

                    return (
                        <div
                            key={key}
                            className="atrib-box"
                            onClick={() => onRolarDado && onRolarDado(sigla, valorFinal)}
                            style={{
                                cursor: 'pointer',
                                position: 'relative',
                                borderColor: valorFinal < base ? '#f85149' : valorFinal > base ? '#2ecc71' : undefined,
                            }}
                            title="Clique para rolar o dado!"
                        >
                            <span>{sigla}</span>

                            {/* Valor do Dado Atual com cor dinâmica */}
                            <strong style={{ color: corTexto, fontSize: '1.3rem' }}>
                                d{valorFinal}
                            </strong>

                            {/* Controles de Aumentar / Diminuir sem números, apenas botões */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    disabled={atingiuMinimo}
                                    onClick={(e) => alterarModificador(e, key, -1)}
                                    title="Reduzir dado"
                                    style={{
                                        background: '#21262d',
                                        color: atingiuMinimo ? '#484f58' : '#f85149',
                                        border: '1px solid #30363d',
                                        borderRadius: '4px',
                                        width: '24px',
                                        height: '24px',
                                        cursor: atingiuMinimo ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: atingiuMinimo ? 0.4 : 1
                                    }}
                                >
                                    <FaMinus size={10} />
                                </button>
                                <button
                                    type="button"
                                    disabled={atingiuBase}
                                    onClick={(e) => resetModificador(e, key)}
                                    title="Resetar dado"
                                    style={{
                                        background: '#21262d',
                                        color: '#d4af37',
                                        border: '1px solid #30363d',
                                        borderRadius: '4px',
                                        width: '24px',
                                        height: '24px',
                                        cursor: atingiuBase ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: atingiuBase ? 0.4 : 1
                                    }}
                                >
                                    <LuDot size={50} />
                                </button>
                                <button
                                    type="button"
                                    disabled={atingiuMaximo}
                                    onClick={(e) => alterarModificador(e, key, 1)}
                                    title="Aumentar dado"
                                    style={{
                                        background: '#21262d',
                                        color: atingiuMaximo ? '#484f58' : '#2ecc71',
                                        border: '1px solid #30363d',
                                        borderRadius: '4px',
                                        width: '24px',
                                        height: '24px',
                                        cursor: atingiuMaximo ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: atingiuMaximo ? 0.4 : 1
                                    }}
                                >
                                    <FaPlus size={10} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <FaDice style={{ fontSize: '0.7rem', color: '#d4af37', opacity: 0.8 }} />
                                <span style={{ fontSize: '0.65rem', color: '#8b949e' }}>Rolar</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}