import { useState, useEffect } from 'react';
import { FaTrash, FaPaw } from 'react-icons/fa';
import { fichaService } from '../../../services/fichaService';
import {
    NIVEL_MAXIMO_CLASSE,
    NIVEL_MAXIMO_HABILIDADE_PADRAO,
    calcularNivelTotal,
    sanitizarNivelClasse,
    isClasseDominada,
    validarDistribuicaoHabilidades,
    podeAdicionarClasse,
    classeAceitaMagia
} from '../../../domain/fabula/characterProgression';
import CompanheiroFielCard from '../components/Andarilho/CompanheiroFielCard';
import ExibirEngenhocas from '../components/Inventor/ExibirEngenhocas';
import FichaFormMagiasClasse from './FichaFormMagiasClasse';
import { Button, Badge } from '../../../components/ui';
import styles from './FichaFormClasses.module.css';

export default function FichaFormClasses({ fichaId, formClasses = [], setFormClasses, formData, setFormData }) {
    const [catalogoClasses, setCatalogoClasses] = useState([]);

    useEffect(() => {
        let isMounted = true;
        async function carregarCatalogo() {
            try {
                const data = await fichaService.getCatalogoClasses();
                if (isMounted && data) {
                    setCatalogoClasses(data);
                }
            } catch (error) {
                console.error("❌ Erro ao carregar catálogo:", error);
            }
        }
        carregarCatalogo();
        return () => { isMounted = false; };
    }, []);

    const adicionarClasseDoCatalogo = (e) => {
        const nomeSelecionado = e.target.value;
        if (!nomeSelecionado) return;

        const validacao = podeAdicionarClasse(formClasses, nomeSelecionado);
        if (!validacao.permitido) {
            alert(validacao.motivo);
            e.target.value = "";
            return;
        }

        const classeOficial = catalogoClasses.find(c => c.nome_classe === nomeSelecionado);
        if (!classeOficial) return;

        const beneficioTexto = typeof classeOficial.beneficios_iniciais === 'object'
            ? (classeOficial.beneficios_iniciais?.texto || '')
            : (classeOficial.beneficios_iniciais || '');

        const novas = [...formClasses, {
            nome_classe: classeOficial.nome_classe,
            nivel: 1,
            beneficios: beneficioTexto,
            habilidades: (classeOficial.habilidades_padrao || []).map(h => ({
                nome: h.nome,
                nivel: 0,
                descricao: h.descricao
            })),
            magias: []
        }];

        setFormClasses(novas);
        setFormData({ ...formData, nivel: calcularNivelTotal(novas) });
        e.target.value = "";
    };

    const removerClasse = (index) => {
        const atual = [...formClasses];
        atual.splice(index, 1);
        setFormClasses(atual);
        setFormData({ ...formData, nivel: calcularNivelTotal(atual) });
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <h3 className={styles.headerTitle}>Classes do Personagem</h3>

                <select
                    onChange={adicionarClasseDoCatalogo}
                    defaultValue=""
                    className={styles.selectClasse}
                >
                    <option value="" disabled>+ Adicionar Classe do Manual</option>
                    {catalogoClasses.map((cat) => {
                        const jaAdicionada = formClasses.some(c => c.nome_classe === cat.nome_classe);
                        return (
                            <option key={cat.id} value={cat.nome_classe} disabled={jaAdicionada}>
                                {cat.nome_classe} {jaAdicionada ? ' (Já adicionada)' : ''}
                            </option>
                        );
                    })}
                </select>
            </div>

            {formClasses.length === 0 ? (
                <p className={styles.emptyClassesText}>
                    Nenhuma classe adicionada. Selecione uma classe no menu acima para começar.
                </p>
            ) : (
                <div className={styles.classList}>
                    {formClasses.map((c, index) => {
                        const nivelClasse = parseInt(c.nivel, 10) || 1;
                        const statusHab = validarDistribuicaoHabilidades(nivelClasse, c.habilidades);
                        const classeConcluida = isClasseDominada(nivelClasse);
                        const aceitaMagia = classeAceitaMagia(c.nome_classe);
                        const classeCatalogoOficial = catalogoClasses.find(cat => cat.nome_classe === c.nome_classe);

                        return (
                            <div
                                key={index}
                                className={`${styles.classItemCard} ${classeConcluida ? styles.classItemCardDominada : ''}`}
                            >
                                <div className={styles.classHeaderGrid}>
                                    <div className={styles.classNameInputWrapper}>
                                        <input
                                            type="text"
                                            readOnly
                                            value={c.nome_classe}
                                            className={styles.classNameReadOnly}
                                        />
                                        {classeConcluida && (
                                            <Badge variant="gold" size="sm" title="Classe Concluída / Dominada">
                                                ★ Nv. 10
                                            </Badge>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        max={NIVEL_MAXIMO_CLASSE}
                                        placeholder="Nível"
                                        value={c.nivel}
                                        onChange={(e) => {
                                            const val = sanitizarNivelClasse(e.target.value);
                                            const atual = [...formClasses];
                                            atual[index].nivel = val;
                                            setFormClasses(atual);
                                            setFormData({ ...formData, nivel: calcularNivelTotal(atual) });
                                        }}
                                        className={styles.nivelInput}
                                    />
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={() => removerClasse(index)}
                                        title="Remover classe"
                                    >
                                        <FaTrash />
                                    </Button>
                                </div>

                                {/* Benefícios */}
                                <div>
                                    <input
                                        type="text"
                                        readOnly
                                        value={c.beneficios || ''}
                                        className={styles.beneficiosInput}
                                    />
                                </div>

                                {/* Habilidades Oficiais */}
                                <div className={styles.habilidadesArea}>
                                    <div className={styles.habilidadesStatusRow}>
                                        <Badge
                                            variant={statusHab.excedeNivel ? 'crise' : (statusHab.incompleto ? 'gold' : 'core')}
                                            size="sm"
                                        >
                                            Habilidades: {statusHab.pontosGastos} / {statusHab.pontosMaximos}
                                            {statusHab.excedeNivel && ' ⚠️ Excede o nível!'}
                                            {statusHab.incompleto && !statusHab.excedeNivel && ' ℹ️ Há pontos livres'}
                                        </Badge>
                                    </div>

                                    {(c.habilidades || []).map((h, hIndex) => {
                                        const ehCompanheiroFiel = (h.nome || '').toLowerCase().includes('companheiro fiel');
                                        const ehEngenhocas = (h.nome || '').toLowerCase().includes('engenhocas');
                                        const nivelHab = parseInt(h.nivel, 10) || 0;

                                        const habCatalogoOficial = (classeCatalogoOficial?.habilidades_padrao || []).find(
                                            hp => hp.nome.trim().toLowerCase() === h.nome.trim().toLowerCase()
                                        );
                                        const limiteMaximoHab = habCatalogoOficial?.nivel_maximo ?? NIVEL_MAXIMO_HABILIDADE_PADRAO;

                                        return (
                                            <div key={hIndex} className={styles.habilidadeRow}>
                                                <div className={styles.habilidadeRowTop}>
                                                    <div className={styles.habilidadeInfo}>
                                                        <div className={styles.habilidadeTitle}>
                                                            <span>{h.nome}</span>
                                                            <span className={styles.habilidadeTetoText}>(Máx: {limiteMaximoHab})</span>
                                                            {ehCompanheiroFiel && <FaPaw />}
                                                        </div>
                                                        <div className={styles.habilidadeDescricao}>{h.descricao}</div>
                                                    </div>
                                                    <div className={styles.habilidadeInputGroup}>
                                                        <span className={styles.nivelLabel}>Nv.</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={limiteMaximoHab}
                                                            value={h.nivel || 0}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value, 10) || 0;
                                                                if (val > limiteMaximoHab) {
                                                                    alert(`⛔ Esta habilidade pode ter no máximo ${limiteMaximoHab} ponto(s)!`);
                                                                    return;
                                                                }
                                                                const atual = [...formClasses];
                                                                atual[index].habilidades[hIndex].nivel = val;
                                                                setFormClasses(atual);
                                                            }}
                                                            className={styles.habilidadeNivelInput}
                                                        />
                                                    </div>
                                                </div>

                                                {ehCompanheiroFiel && nivelHab > 0 && (
                                                    <div className={styles.subCardContainer}>
                                                        <CompanheiroFielCard
                                                            fichaId={fichaId}
                                                            classes={formClasses}
                                                        />
                                                    </div>
                                                )}

                                                {ehEngenhocas && nivelHab > 0 && (
                                                    <div className={styles.subCardContainer}>
                                                        <ExibirEngenhocas
                                                            habilidadeEngenhocas={h}
                                                            aoAtualizarEngenhocas={(novosRamos) => {
                                                                const atual = [...formClasses];
                                                                atual[index].habilidades[hIndex].ramos = novosRamos;
                                                                setFormClasses(atual);
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {aceitaMagia && (
                                    <FichaFormMagiasClasse
                                        classeObjeto={c}
                                        indexClasse={index}
                                        formClasses={formClasses}
                                        setFormClasses={setFormClasses}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
