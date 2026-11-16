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

export default function FichaFormClasses({ fichaId, formClasses = [], setFormClasses, formData, setFormData }) {
    const [catalogoClasses, setCatalogoClasses] = useState([]);

    // Carrega o catálogo de classes via Service Layer (Clean Architecture)
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

        // Validação de regras de Fabula Ultima via Domain Pure Logic
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
        <div className="form-section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <h3>Classes do Personagem</h3>

                <select
                    onChange={adicionarClasseDoCatalogo}
                    defaultValue=""
                    style={{ padding: '8px', background: '#161b22', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
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
                <p style={{ color: '#8b949e', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                    Nenhuma classe adicionada. Selecione uma classe no menu acima para começar.
                </p>
            ) : (
                formClasses.map((c, index) => {
                    const nivelClasse = parseInt(c.nivel, 10) || 1;
                    const statusHab = validarDistribuicaoHabilidades(nivelClasse, c.habilidades);
                    const classeConcluida = isClasseDominada(nivelClasse);
                    const aceitaMagia = classeAceitaMagia(c.nome_classe);

                    // 🔍 Localiza a classe correspondente no repositório oficial (catalogo_classes)
                    const classeCatalogoOficial = catalogoClasses.find(cat => cat.nome_classe === c.nome_classe);

                    return (
                        <div key={index} style={{ border: classeConcluida ? '1px solid #d4af37' : '1px solid #30363d', padding: '14px', marginTop: '14px', borderRadius: '8px', background: '#0d0f18' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={c.nome_classe}
                                        style={{ background: '#161b22', color: '#d4af37', fontWeight: 'bold', width: '100%' }}
                                    />
                                    {classeConcluida && (
                                        <span style={{ fontSize: '0.75rem', background: '#d4af37', color: '#0d0f18', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }} title="Classe Concluída / Dominada">
                                            ★ Nv. 10
                                        </span>
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
                                />
                                <button type="button" className="btn-del" onClick={() => removerClasse(index)} style={{ padding: '8px', height: '100%', background: '#da3633', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    <FaTrash />
                                </button>
                            </div>

                            {/* Benefícios */}
                            <div style={{ marginBottom: '10px' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={c.beneficios || ''}
                                    style={{ background: '#161b22', color: '#3fb950', fontSize: '0.85rem' }}
                                />
                            </div>

                            {/* Habilidades Oficiais */}
                            <div style={{ borderTop: '1px solid #30363d', paddingTop: '10px', marginTop: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.85rem', color: statusHab.excedeNivel ? '#f85149' : (statusHab.incompleto ? '#d4af37' : '#3fb950'), fontWeight: 'bold' }}>
                                        Habilidades Distribuídas: {statusHab.pontosGastos} / {statusHab.pontosMaximos} nível(is) da classe
                                        {statusHab.excedeNivel && ' ⚠️ Excede o nível!'}
                                        {statusHab.incompleto && !statusHab.excedeNivel && ' ℹ️ Há pontos livres.'}
                                    </span>
                                </div>

                                {(c.habilidades || []).map((h, hIndex) => {
                                    const ehCompanheiroFiel = (h.nome || '').toLowerCase().includes('companheiro fiel');
                                    const ehEngenhocas = (h.nome || '').toLowerCase().includes('engenhocas');
                                    const nivelHab = parseInt(h.nivel, 10) || 0;

                                    // 🎯 Busca o teto máximo diretamente no catálogo oficial usando o nome da habilidade
                                    const habCatalogoOficial = (classeCatalogoOficial?.habilidades_padrao || []).find(
                                        hp => hp.nome.trim().toLowerCase() === h.nome.trim().toLowerCase()
                                    );
                                    
                                    const limiteMaximoHab = habCatalogoOficial?.nivel_maximo ?? NIVEL_MAXIMO_HABILIDADE_PADRAO;

                                    return (
                                        <div key={hIndex} style={{ background: '#161b22', padding: '10px', borderRadius: '6px', marginTop: '8px' }}>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <div style={{ flex: 2.5 }}>
                                                    <strong style={{ color: '#f0f6fc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {h.nome} <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>(Máx: {limiteMaximoHab})</span> {ehCompanheiroFiel && <FaPaw color="#d4af37" />}
                                                    </strong>
                                                    <div style={{ color: '#8b949e', fontSize: '0.75rem', marginTop: '2px' }}>{h.descricao}</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ fontSize: '0.75rem', color: '#d4af37' }}>Nv.</span>
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
                                                        style={{ width: '70px', textAlign: 'center' }}
                                                    />
                                                </div>
                                            </div>

                                            {/* 🐾 Card do Companheiro Fiel */}
                                            {ehCompanheiroFiel && nivelHab > 0 && (
                                                <div style={{ marginTop: '10px' }}>
                                                    <CompanheiroFielCard
                                                        fichaId={fichaId}
                                                        classes={formClasses}
                                                    />
                                                </div>
                                            )}

                                            {/* ⚙️ Gerenciador de Engenhocas */}
                                            {ehEngenhocas && nivelHab > 0 && (
                                                <div style={{ marginTop: '10px' }}>
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

                            {/* Gerenciador modular de Magias da Classe */}
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
                })
            )}
        </div>
    );
}
