import { useState } from 'react';
import { FaHammer, FaCheckCircle, FaCoins, FaPrint, FaShieldAlt } from 'react-icons/fa';
import {
    CATEGORIAS_ARMA,
    ALCANCES_ARMA,
    ATRIBUTOS_PRECISAO,
    PERSONALIZACOES_DISPONIVEIS,
    podeAdicionarPersonalizacao,
    calcularCustoTotal,
    calcularDanoFinal,
    verificarEhMarcial,
    construirStatsArmaPersonalizada
} from '../../../domain/fabula/weaponForge';
import { lojaService } from '../../../services/lojaService';
import { Button, Badge, Card, Input } from '../../../components/ui';
import styles from './CriadorArmasPersonalizadas.module.css';

export default function CriadorArmasPersonalizadas({ ficha, onCriado }) {
    const [nomeItem, setNomeItem] = useState('');
    const [categoria, setCategoria] = useState('espada');
    const [alcance, setAlcance] = useState('Corpo a corpo');
    const [precisaoTipo, setPrecisaoTipo] = useState('(DES + AST)');

    // As personalizações escolhidas
    const [personalizacoes, setPersonalizacoes] = useState([]);

    // Caso escolha a opção Mutável, configuramos a 2ª forma aqui
    const [temMutavel, setTemMutavel] = useState(false);
    const [nomeSegundaForma, setNomeSegundaForma] = useState('');
    const [categoria2, setCategoria2] = useState('espada');
    const [alcance2, setAlcance2] = useState('Corpo a corpo');

    const [salvando, setSalvando] = useState(false);

    const togglePersonalizacao = (item) => {
        if (personalizacoes.some(p => p.id === item.id)) {
            setPersonalizacoes(personalizacoes.filter(p => p.id !== item.id));
            if (item.id === 'mutavel') setTemMutavel(false);
        } else {
            if (!podeAdicionarPersonalizacao(personalizacoes, item)) {
                alert('Você só pode escolher o equivalente a 3 personalizações!');
                return;
            }

            setPersonalizacoes([...personalizacoes, item]);
            if (item.id === 'mutavel') setTemMutavel(true);
        }
    };

    // Cálculos derivados usando as regras puras de domínio
    const custoTotal = calcularCustoTotal(personalizacoes);
    const danoFinalNumerico = calcularDanoFinal(categoria, personalizacoes);
    const temTagMarcial = verificarEhMarcial(personalizacoes, danoFinalNumerico);
    const vagasOcupadas = personalizacoes.reduce((acc, p) => acc + (p.vagas || 1), 0);

    const handleSalvar = async (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return alert('Dê um nome para a sua arma personalizada!');

        setSalvando(true);

        const statsPersonalizados = construirStatsArmaPersonalizada({
            categoria,
            alcance,
            precisaoTipo,
            personalizacoes,
            temMutavel,
            segundaForma: {
                nome: nomeSegundaForma,
                categoria: categoria2,
                alcance: alcance2
            }
        });

        const { error: erroBanco } = await lojaService.salvarArmaPersonalizada({
            ficha,
            nome: nomeItem,
            custo: custoTotal,
            stats: statsPersonalizados
        });

        setSalvando(false);

        if (erroBanco) {
            alert('Erro ao salvar arma: ' + erroBanco.message);
        } else {
            alert('✨ Arma personalizada criada com sucesso!');
            if (onCriado) onCriado();
            setNomeItem('');
            setPersonalizacoes([]);
            setTemMutavel(false);
        }
    };

    const nomeExibicao = nomeItem || 'Arma Personalizada';

    return (
        <div className={styles.container}>
            <Card variant="default" className={styles.forjaCard}>
                <h3 className={styles.titulo}>
                    <FaHammer /> Criação de Armas Personalizadas (Atlas)
                </h3>

                <form onSubmit={handleSalvar} className={styles.formGrid}>
                    <Input
                        label="Nome da Arma"
                        value={nomeItem}
                        onChange={e => setNomeItem(e.target.value)}
                        placeholder="Ex: Quebra-Muralha"
                    />

                    <div className={styles.gridDuasColunas}>
                        <div className={styles.campoGrupo}>
                            <label htmlFor="categoria-arma" className={styles.labelCampo}>Categoria</label>
                            <select
                                id="categoria-arma"
                                value={categoria}
                                onChange={e => setCategoria(e.target.value)}
                                className={styles.selectCampo}
                            >
                                {CATEGORIAS_ARMA.map(c => (
                                    <option key={c} value={c}>{c.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.campoGrupo}>
                            <label htmlFor="alcance-arma" className={styles.labelCampo}>Alcance</label>
                            <select
                                id="alcance-arma"
                                value={alcance}
                                onChange={e => setAlcance(e.target.value)}
                                className={styles.selectCampo}
                            >
                                {ALCANCES_ARMA.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.campoGrupo}>
                        <label htmlFor="precisao-arma" className={styles.labelCampo}>Atributo de Precisão</label>
                        <select
                            id="precisao-arma"
                            value={precisaoTipo}
                            onChange={e => setPrecisaoTipo(e.target.value)}
                            className={styles.selectCampo}
                        >
                            {ATRIBUTOS_PRECISAO.map(atr => (
                                <option key={atr} value={atr}>{atr}</option>
                            ))}
                        </select>
                    </div>

                    {/* Seleção de Personalizações (Até 3 vagas) */}
                    <fieldset className={styles.fieldsetPersonalizacoes}>
                        <legend className={styles.legendPersonalizacoes}>
                            Personalizações (Escolha até 3 vagas)
                        </legend>
                        <div className={styles.listaPersonalizacoes}>
                            {PERSONALIZACOES_DISPONIVEIS.map(p => {
                                const selecionada = personalizacoes.some(item => item.id === p.id);
                                return (
                                    <label key={p.id} className={styles.checkboxItem}>
                                        <input
                                            type="checkbox"
                                            checked={selecionada}
                                            onChange={() => togglePersonalizacao(p)}
                                        />
                                        <span>
                                            {p.nome} {p.custoExtra > 0 ? `(+${p.custoExtra}z)` : ''}
                                            {p.marcial ? ' ⚔️ (Marcial)' : ''}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* Configuração extra se for Mutável */}
                    {temMutavel && (
                        <div className={styles.mutavelContainer}>
                            <h4 className={styles.mutavelTitulo}>Configuração da 2ª Forma (Mutável)</h4>
                            <Input
                                label="Nome da Segunda Forma"
                                value={nomeSegundaForma}
                                onChange={e => setNomeSegundaForma(e.target.value)}
                                placeholder="Ex: Modo Lança Longa"
                            />
                            <div className={styles.gridDuasColunas}>
                                <div className={styles.campoGrupo}>
                                    <label htmlFor="categoria-mutavel" className={styles.labelCampo}>Categoria (Forma 2)</label>
                                    <select
                                        id="categoria-mutavel"
                                        value={categoria2}
                                        onChange={e => setCategoria2(e.target.value)}
                                        className={styles.selectCampo}
                                    >
                                        {CATEGORIAS_ARMA.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className={styles.campoGrupo}>
                                    <label htmlFor="alcance-mutavel" className={styles.labelCampo}>Alcance (Forma 2)</label>
                                    <select
                                        id="alcance-mutavel"
                                        value={alcance2}
                                        onChange={e => setAlcance2(e.target.value)}
                                        className={styles.selectCampo}
                                    >
                                        {ALCANCES_ARMA.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resumo */}
                    <div className={styles.painelResumo}>
                        <div className={styles.resumoValores}>
                            <div className={styles.resumoDano}>
                                Dano: <span className={styles.resumoDanoValor}>RA + {danoFinalNumerico}</span>
                            </div>
                            <Badge variant="gold" size="lg">
                                <FaCoins /> {custoTotal} zênites
                            </Badge>
                        </div>

                        <div className={styles.resumoBotoes}>
                            {/* <Button
                                variant="ghost"
                                size="md"
                                onClick={() => window.print()}
                                title="Imprimir Carta Física para Mesa"
                            >
                                <FaPrint /> Imprimir Carta
                            </Button> */}
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={salvando}
                            >
                                <FaCheckCircle /> {salvando ? 'Criando...' : 'Criar Arma'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>

            {/* Visualização de Carta Física de Equipamento para a Mesa */}
            <section className={styles.previewArea} aria-label="Prévia da Carta de Equipamento">
                <div className={styles.previewTitulo}>
                    <FaShieldAlt /> Prévia da Carta de Equipamento (Pronta para Impressão)
                </div>

                <div className={styles.physicalCard}>
                    <div className={styles.cardHeaderFisica}>
                        <div>
                            <h4 className={styles.cardNomeFisico}>{nomeExibicao}</h4>
                            <span className={styles.cardSubtituloFisico}>
                                {categoria.toUpperCase()} • {alcance}
                            </span>
                        </div>
                        <Badge variant="gold" size="sm">
                            <FaCoins /> {custoTotal}z
                        </Badge>
                    </div>

                    <div className={styles.tagsRow}>
                        <Badge variant={temTagMarcial ? 'crise' : 'default'} size="sm">
                            {temTagMarcial ? '⚔️ Marcial' : '🛡️ Simples'}
                        </Badge>
                        <Badge variant="core" size="sm">
                            {categoria.toUpperCase()}
                        </Badge>
                        <Badge variant="ether" size="sm">
                            {vagasOcupadas}/3 Vagas
                        </Badge>
                    </div>

                    <div className={styles.cardStatsGrid}>
                        <div className={styles.cardStatItem}>
                            <span className={styles.cardStatLabel}>Precisão</span>
                            <span className={styles.cardStatValor}>{precisaoTipo}</span>
                        </div>
                        <div className={styles.cardStatItem}>
                            <span className={styles.cardStatLabel}>Dano</span>
                            <span className={styles.cardStatValor}>RA + {danoFinalNumerico}</span>
                        </div>
                    </div>

                    <div className={styles.cardEfeitosArea}>
                        <strong>Personalizações Aplicadas:</strong>
                        <ul className={styles.cardEfeitosLista}>
                            {personalizacoes.length > 0 ? (
                                personalizacoes.map(p => <li key={p.id}>{p.nome}</li>)
                            ) : (
                                <li>Nenhuma personalização selecionada.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
}
