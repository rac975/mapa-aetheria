import { useState } from 'react';
import { FaDice } from 'react-icons/fa';

const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

export default function FichaPericiasSecao({ atributos = {} }) {
    const periciasComuns = [
        { categoria: 'Destreza', itens: [
            { nome: 'Mover-se em silêncio / Esconder-se', attrs: ['destreza', 'destreza'], sigla: 'DES + DES' },
            { nome: 'Evitar armadilha / Fugir de desabamento', attrs: ['destreza', 'astucia'], sigla: 'DES + AST' },
            { nome: 'Prever movimentos / Pegar de surpresa', attrs: ['destreza', 'astucia'], sigla: 'DES + AST' },
            { nome: 'Concluir obra artesanal / Consertar', attrs: ['destreza', 'astucia'], sigla: 'DES + AST' },
            { nome: 'Mover-se com graça / Evitar detecção', attrs: ['destreza', 'vontade'], sigla: 'DES + VON' }
        ]},
        { categoria: 'Astúcia', itens: [
            { nome: 'Examinar ou investigar algo/alguém', attrs: ['astucia', 'astucia'], sigla: 'AST + AST' },
            { nome: 'Lembrar-se de informações úteis', attrs: ['astucia', 'astucia'], sigla: 'AST + AST' },
            { nome: 'Conseguir informações em conversa', attrs: ['astucia', 'vontade'], sigla: 'AST + VON' },
            { nome: 'Convencer por autoridade/diplomacia', attrs: ['astucia', 'vontade'], sigla: 'AST + VON' }
        ]},
        { categoria: 'Vigor / Vontade', itens: [
            { nome: 'Trabalho pesado (erguer grades, empurrar)', attrs: ['vigor', 'vigor'], sigla: 'VIG + VIG' },
            { nome: 'Resistir a intensa dor ou fadiga', attrs: ['vigor', 'vontade'], sigla: 'VIG + VON' },
            { nome: 'Intimidar com força ou presença', attrs: ['vigor', 'vontade'], sigla: 'VIG + VON' }
        ]}
    ];

    const [periciaSelecionada, setPericiaSelecionada] = useState('');
    const [ultimaRolagem, setUltimaRolagem] = useState(null);

    const executarRolagem = () => {
        if (!periciaSelecionada) return;
        const [gIdx, iIdx] = periciaSelecionada.split('-');
        const item = periciasComuns[gIdx].itens[iIdx];

        const extrairFaces = (valorAttr) => {
            if (!valorAttr) return 8;
            const str = String(valorAttr).trim().toLowerCase();
            if (str.startsWith('d')) {
                const faces = parseInt(str.substring(1), 10);
                return isNaN(faces) ? 8 : faces;
            }
            const num = parseInt(str, 10);
            return isNaN(num) ? 8 : num;
        };

        const faces1 = extrairFaces(atributos[item.attrs[0]]);
        const faces2 = extrairFaces(atributos[item.attrs[1]]);

        const resultado1 = rolarDado(faces1);
        const resultado2 = rolarDado(faces2);
        const total = resultado1 + resultado2;

        setUltimaRolagem({
            titulo: item.nome,
            sigla: item.sigla,
            res1: resultado1,
            res2: resultado2,
            total
        });
    };

    return (
        <div className="form-section-box" style={{ marginTop: '16px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                
                {/* Título Compacto */}
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#f0f6fc', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                    <FaDice color="#d4af37" /> Testes Frequentes
                </h3>

                {/* Combobox + Botão de Rolar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '500px' }}>
                    <select
                        value={periciaSelecionada}
                        onChange={(e) => setPericiaSelecionada(e.target.value)}
                        style={{
                            width: '100%', background: '#0d1117', border: '1px solid #30363d',
                            color: '#c9d1d9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer'
                        }}
                    >
                        <option value="">Selecione uma circunstância...</option>
                        {periciasComuns.map((grupo, gIdx) => (
                            <optgroup key={gIdx} label={grupo.categoria}>
                                {grupo.itens.map((item, iIdx) => (
                                    <option key={iIdx} value={`${gIdx}-${iIdx}`}>
                                        {item.nome} ({item.sigla})
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={executarRolagem}
                        disabled={!periciaSelecionada}
                        style={{
                            background: periciaSelecionada ? '#238636' : '#21262d',
                            border: '1px solid #30363d',
                            color: periciaSelecionada ? '#fff' : '#8b949e',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            cursor: periciaSelecionada ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.15s'
                        }}
                    >
                        <FaDice /> Rolar
                    </button>
                </div>

                {/* Barrinha Simples de Resultado Inline */}
                {ultimaRolagem ? (
                    <div style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.4)', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#d4af37', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ultimaRolagem.titulo}>
                            {ultimaRolagem.titulo}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#f0f6fc' }}>
                            {ultimaRolagem.res1} + {ultimaRolagem.res2} = <strong>{ultimaRolagem.total}</strong>
                        </span>
                    </div>
                ) : (
                    <div style={{ fontSize: '0.75rem', color: '#8b949e', fontStyle: 'italic' }}>
                        Nenhum teste realizado
                    </div>
                )}
            </div>
        </div>
    );
}