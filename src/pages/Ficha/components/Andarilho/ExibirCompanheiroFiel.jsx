import React, { useState } from 'react';
import { FaPaw, FaDice, FaBolt, FaMagic } from 'react-icons/fa';

const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

const extrairValorDado = (dadoStr) => {
    if (!dadoStr) return 8;
    const num = parseInt(String(dadoStr).replace(/\D/g, ''), 10);
    return isNaN(num) ? 8 : num;
};

export default function ExibirCompanheiroFiel({ companheiro, handleAjustarRecurso }) {
    const [modoAtaqueState, setModoAtaqueState] = useState({});
    const [resultadosRolagem, setResultadosRolagem] = useState({});

    // Movido para dentro do componente para ter acesso às props
    const conjurarFeiticoCompanheiro = (feitico) => {
        const custo = parseInt(feitico.pm_custo || 0, 10);

        if (custo > 0 && handleAjustarRecurso) {
            // Deduz o custo do MP do personagem principal
            handleAjustarRecurso('mp_atual', -custo);
        }
    };

    if (!companheiro) {
        return (
            <div style={{ fontSize: '0.8rem', color: '#8b949e', fontStyle: 'italic', marginTop: '6px' }}>
                ⚠️ Habilidade ativa, mas a ficha detalhada do companheiro ainda não foi criada ou salva no painel do Mestre/NPCs.
            </div>
        );
    }

    const executarRolagemAtaqueCompanheiro = (ataque, indexAtaque) => {
        const atributosComp = companheiro.atributos || { des: 'd8', ast: 'd6', vig: 'd8', von: 'd8' };

        const mapaAtributos = {
            'des': extrairValorDado(atributosComp.des),
            'ast': extrairValorDado(atributosComp.ast),
            'vig': extrairValorDado(atributosComp.vig),
            'von': extrairValorDado(atributosComp.von)
        };

        const attr1Key = (ataque.atributo_dado1 || 'des').toLowerCase();
        const attr2Key = (ataque.atributo_dado2 || 'vig').toLowerCase();

        const faces1 = mapaAtributos[attr1Key] || 8;
        const faces2 = mapaAtributos[attr2Key] || 8;

        const res1 = rolarDado(faces1);
        const res2 = rolarDado(faces2);

        const bonusPrecisao = parseInt(companheiro.bonus_precisao || 5, 10);
        const testeAtaque = res1 + res2 + bonusPrecisao;

        let statusCritico = null;
        if (res1 === 1 && res2 === 1) {
            statusCritico = 'Erro Crítico (Fumble)';
        } else if (res1 === res2 && res1 >= 6) {
            statusCritico = 'Sucesso Crítico!';
        }

        const dadoMaisAlto = Math.max(res1, res2);
        const modoAtual = modoAtaqueState[indexAtaque] || 'normal';
        const isMulti = modoAtual === 'multi';

        const bonusOriginal = parseInt(companheiro.bonus_dano || companheiro.nivel_poder || 5, 10);
        const bonusDanoFixo = isMulti ? 0 : bonusOriginal;
        const danoTotal = dadoMaisAlto + bonusDanoFixo;

        setResultadosRolagem(prev => ({
            ...prev,
            [indexAtaque]: {
                res1,
                res2,
                attr1Label: attr1Key.toUpperCase(),
                attr2Label: attr2Key.toUpperCase(),
                faces1,
                faces2,
                bonusPrecisao,
                testeAtaque,
                statusCritico,
                dadoMaisAlto,
                bonusOriginal,
                bonusDanoFixo,
                danoTotal,
                isMulti
            }
        }));
    };

    return (
        <div style={{ background: '#0d0f18', border: '1px solid #30363d', borderRadius: '8px', padding: '14px', marginTop: '10px' }}>

            {/* Título do Companheiro */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #21262d', paddingBottom: '8px', marginBottom: '10px' }}>
                <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaPaw /> {companheiro.nome || 'Companheiro'}
                </span>
                <span style={{ background: '#21262d', color: '#58a6ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Espécie: {companheiro.especie || 'Fera'} | Nível 5
                </span>
            </div>

            {/* Atributos Básicos */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Atributos</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                    {['des', 'ast', 'vig', 'von'].map(attr => (
                        <div key={attr} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                            <div style={{ fontSize: '0.65rem', color: '#8b949e', textTransform: 'uppercase' }}>{attr}</div>
                            <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{companheiro.atributos?.[attr] || 'd8'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Estatísticas de Combate */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Estatísticas de Combate</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#ff7b72' }}>PV Máx</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{companheiro.pv_max}</div>
                    </div>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#58a6ff' }}>PM Máx</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{companheiro.pm_max}</div>
                    </div>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#3fb950' }}>Defesa</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{companheiro.defesa}</div>
                    </div>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#d2a8ff' }}>Def. Mág.</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{companheiro.defesa_magica}</div>
                    </div>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', padding: '4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#8b949e' }}>Iniciativa</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 'bold', fontSize: '0.85rem' }}>0</div>
                    </div>
                </div>
            </div>

            {/* Traços */}
            {companheiro.tracos && companheiro.tracos.some(Boolean) && (
                <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Traços</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {companheiro.tracos.filter(Boolean).map((traco, tIdx) => (
                            <div key={tIdx} style={{ fontSize: '0.8rem', color: '#c9d1d9', background: '#161b22', padding: '4px 8px', borderRadius: '4px', borderLeft: '2px solid #d4af37' }}>
                                • {traco}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ataques Básicos */}
            {companheiro.ataques_basicos && companheiro.ataques_basicos.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Ataques Básicos</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {companheiro.ataques_basicos.map((atk, aIdx) => {
                            const modoAtual = modoAtaqueState[aIdx] || 'normal';
                            const ultimaRolagem = resultadosRolagem[aIdx];

                            return (
                                <div key={aIdx} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <strong style={{ color: '#f0f6fc', fontSize: '0.9rem' }}>{atk.nome}</strong>
                                            <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                                                Atributos: [{atk.atributo_dado1?.toUpperCase()} + {atk.atributo_dado2?.toUpperCase()}] • Tipo: {atk.tipo_dano || 'Físico'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '2px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setModoAtaqueState(prev => ({ ...prev, [aIdx]: 'normal' }))}
                                            style={{
                                                flex: 1, background: modoAtual === 'normal' ? '#21262d' : 'transparent',
                                                color: modoAtual === 'normal' ? '#f0f6fc' : '#8b949e', border: 'none',
                                                padding: '4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
                                            }}
                                        >
                                            Ataque Único
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setModoAtaqueState(prev => ({ ...prev, [aIdx]: 'multi' }))}
                                            style={{
                                                flex: 1, background: modoAtual === 'multi' ? '#da3633' : 'transparent',
                                                color: modoAtual === 'multi' ? '#fff' : '#8b949e', border: 'none',
                                                padding: '4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
                                            }}
                                        >
                                            Multiataque
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => executarRolagemAtaqueCompanheiro(atk, aIdx)}
                                        style={{ background: '#238636', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                    >
                                        <FaDice /> Rolar Ataque e Dano do Companheiro
                                    </button>

                                    {ultimaRolagem && (
                                        <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '8px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                                            {ultimaRolagem.statusCritico && (
                                                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: ultimaRolagem.statusCritico.includes('Sucesso') ? '#3fb950' : '#f85149', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px' }}>
                                                    <FaBolt /> {ultimaRolagem.statusCritico}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.75rem', color: '#f0f6fc', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Precisão Final:</span>
                                                <strong style={{ color: '#d4af37' }}>{ultimaRolagem.testeAtaque}</strong>
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: '#8b949e', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '3px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div>🧩 Atributos: {ultimaRolagem.attr1Label} ({ultimaRolagem.res1}) + {ultimaRolagem.attr2Label} ({ultimaRolagem.res2})</div>
                                                <div>⚔️ Bônus de Precisão (NP): +{ultimaRolagem.bonusPrecisao}</div>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#d4af37', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '2px', paddingTop: '2px' }}>
                                                <span>Dano Final:</span>
                                                <strong style={{ fontSize: '0.85rem' }}>{ultimaRolagem.danoTotal}</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Feitiços e Magias */}
            {companheiro.feiticos && companheiro.feiticos.length > 0 && (
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#58a6ff', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaMagic /> Feitiços e Magias
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {companheiro.feiticos.map((f, fIdx) => (
                            <div key={fIdx} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ color: '#f0f6fc' }}>{f.nome}</strong>
                                    <span style={{ color: '#3fb950', fontSize: '0.75rem', fontWeight: 'bold' }}>({f.pm_custo} PM)</span>
                                </div>
                                <div style={{ color: '#9da3af', fontSize: '0.75rem' }}>{f.descricao}</div>

                                <button
                                    type="button"
                                    onClick={() => conjurarFeiticoCompanheiro(f)}
                                    style={{ background: '#1f6feb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' }}
                                >
                                    ✨ Conjurar (Gastar {f.pm_custo || 0} PM)
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}