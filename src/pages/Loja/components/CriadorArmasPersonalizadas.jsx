import React, { useState } from 'react';
import { FaHammer, FaCheckCircle } from 'react-icons/fa';
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
            alert('Arma personalizada criada com sucesso!');
            if (onCriado) onCriado();
            setNomeItem('');
            setPersonalizacoes([]);
            setTemMutavel(false);
        }
    };

    return (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px', color: '#c9d1d9', maxWidth: '650px', margin: '20px auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d4af37', fontSize: '1.2rem', marginBottom: '15px' }}>
                <FaHammer /> Criação de Armas Personalizadas (Atlas)
            </h2>

            <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Nome da Arma</label>
                    <input
                        type="text"
                        value={nomeItem}
                        onChange={e => setNomeItem(e.target.value)}
                        placeholder="Ex: Quebra-Muralha"
                        style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Categoria</label>
                        <select
                            value={categoria}
                            onChange={e => setCategoria(e.target.value)}
                            style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                        >
                            {CATEGORIAS_ARMA.map(c => (
                                <option key={c} value={c}>{c.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Alcance</label>
                        <select
                            value={alcance}
                            onChange={e => setAlcance(e.target.value)}
                            style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                        >
                            {ALCANCES_ARMA.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Atributo de Precisão</label>
                    <select
                        value={precisaoTipo}
                        onChange={e => setPrecisaoTipo(e.target.value)}
                        style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                    >
                        {ATRIBUTOS_PRECISAO.map(atr => (
                            <option key={atr} value={atr}>{atr}</option>
                        ))}
                    </select>
                </div>

                {/* Seleção de Personalizações (Até 3 vagas) */}
                <fieldset style={{ border: '1px solid #30363d', padding: '12px', borderRadius: '6px' }}>
                    <legend style={{ fontSize: '0.8rem', color: '#d4af37', padding: '0 5px', fontWeight: 'bold' }}>
                        Personalizações (Escolha até 3 vagas)
                    </legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {PERSONALIZACOES_DISPONIVEIS.map(p => {
                            const selecionada = personalizacoes.some(item => item.id === p.id);
                            return (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={selecionada}
                                        onChange={() => togglePersonalizacao(p)}
                                    />
                                    <span>{p.nome} {p.custoExtra > 0 ? `(+${p.custoExtra}z)` : ''} {p.marcial ? '⚔️ (Marcial)' : ''}</span>
                                </label>
                            );
                        })}
                    </div>
                </fieldset>

                {/* Configuração extra se for Mutável */}
                {temMutavel && (
                    <div style={{ background: '#0d1117', padding: '12px', borderRadius: '6px', border: '1px dashed #d4af37', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h4 style={{ margin: 0, color: '#d4af37', fontSize: '0.9rem' }}>Configuração da 2ª Forma (Mutável)</h4>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '3px' }}>Nome da Segunda Forma</label>
                            <input
                                type="text"
                                value={nomeSegundaForma}
                                onChange={e => setNomeSegundaForma(e.target.value)}
                                placeholder="Ex: Modo Lança Longa"
                                style={{ width: '100%', padding: '6px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <select value={categoria2} onChange={e => setCategoria2(e.target.value)} style={{ padding: '6px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}>
                                {CATEGORIAS_ARMA.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={alcance2} onChange={e => setAlcance2(e.target.value)} style={{ padding: '6px', background: '#161b22', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}>
                                {ALCANCES_ARMA.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* Resumo */}
                <div style={{ background: '#0d0f18', padding: '12px', borderRadius: '6px', border: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#8b949e' }}>
                            Dano: <strong style={{ color: '#58a6ff' }}>RA + {danoFinalNumerico}</strong> {temTagMarcial && <span style={{ color: '#f85149' }}>(Marcial ⚔️)</span>}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#8b949e', marginTop: '2px' }}>
                            Custo Inicial: <strong style={{ color: '#2ecc71', fontSize: '1.1rem' }}>{custoTotal} zênites</strong>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={salvando}
                        style={{ background: '#238636', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        <FaCheckCircle /> {salvando ? 'Criando...' : 'Criar Arma'}
                    </button>
                </div>
            </form>
        </div>
    );
}
