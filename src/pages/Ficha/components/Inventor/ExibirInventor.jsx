import React, { useState } from 'react';
import { FaCogs, FaFlask, FaDice, FaMagic, FaShieldAlt, FaBolt, FaCrosshairs } from 'react-icons/fa';
import { supabase } from '../../../../services/supabase';

const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

export default function ExibirInventor({ classes, ficha, fichaId, handleAjustarRecurso }) {
    // Estados da Alquimia
    const [tipoMistura, setTipoMistura] = useState('basica');
    const [resultadoAlquimia, setResultadoAlquimia] = useState(null);

    // Estados de Infusões
    const [infusaoSelecionada, setInfusaoSelecionada] = useState(null);

    // Estado de carregamento do Magicanhão
    const [criandoCanhao, setCriandoCanhao] = useState(false);

    // 1. Encontra a classe Inventor e suas habilidades
    const classeInventor = classes?.find(c => (c.nome_classe || '').toLowerCase().includes('inventor'));
    const nivelInventor = classeInventor ? (parseInt(classeInventor.nivel) || 1) : 0;

    if (nivelInventor <= 0) return null;

    // 2. Localiza a habilidade "Engenhocas" e os ramos escolhidos
    const habEngenhocas = (classeInventor?.habilidades || []).find(h => (h.nome || '').toLowerCase().includes('engenhocas'));
    const nivelEngenhocas = habEngenhocas ? (parseInt(habEngenhocas.nivel) || 0) : 0;

    if (nivelEngenhocas <= 0) return null;

    const ramos = habEngenhocas?.ramos || {};
    const ramoAlquimia = ramos.alquimia;
    const ramoInfusoes = ramos.infusoes;
    const ramoTecnomagia = ramos.tecnomagia;

    // Estágios de Alquimia
    const temBasicoAlquimia = !!ramoAlquimia;
    const temAvancadoAlquimia = ramoAlquimia === 'avancado' || ramoAlquimia === 'superior';
    const temSuperiorAlquimia = ramoAlquimia === 'superior';

    // Estágios de Infusões
    const temBasicoInfusoes = !!ramoInfusoes;
    const temAvancadoInfusoes = ramoInfusoes === 'avancado' || ramoInfusoes === 'superior';
    const temSuperiorInfusoes = ramoInfusoes === 'superior';

    // Estágios de Tecnomagia
    const temBasicoTecnomagia = !!ramoTecnomagia;
    const temAvancadoTecnomagia = ramoTecnomagia === 'avancado' || ramoTecnomagia === 'superior';
    const temSuperiorTecnomagia = ramoTecnomagia === 'superior';

    // Tabelas de Alquimia
    const tabelaAlvo = [
        { min: 1, max: 6, desc: 'Você ou um aliado que possa ver e esteja presente na cena.' },
        { min: 7, max: 11, desc: 'Um inimigo que você possa ver e esteja presente na cena.' },
        { min: 12, max: 16, desc: 'Você e todos os aliados presentes na cena.' },
        { min: 17, max: 20, desc: 'Todos os inimigos presentes na cena.' }
    ];

    const tabelaEfeito = {
        'Q': 'Recupera 30 PV ou Sofre 20 pontos de dano de veneno (aumenta para 30 no Nv. 20 e 40 no Nv. 40).',
        1: 'Considera Destreza e Vigor como de um passo maior (máx d12) até o fim do próximo turno.',
        2: 'Considera Astúcia e Vontade como de um passo maior (máx d12) até o fim do próximo turno.',
        3: 'Sofre 20 pontos de dano de ar (aumenta para 30 no Nv. 20 e 40 no Nv. 40).',
        4: 'Sofre 20 pontos de dano de raio (aumenta para 30 no Nv. 20 e 40 no Nv. 40).',
        5: 'Sofre 20 pontos de dano de trevas (aumenta para 30 no Nv. 20 e 40 no Nv. 40).',
        6: 'Sofre 20-40 de dano de terra.',
        7: 'Sofre 20-40 de dano de fogo.',
        8: 'Sofre 20-40 de dano de gelo.',
        9: 'Torna-se Resistente a dano de ar e de fogo até o fim da cena.',
        10: 'Torna-se Resistente a dano de gelo e de raio até o fim da cena.',
        11: 'Torna-se Resistente a dano de terra e de trevas até o fim da cena.',
        12: 'Fica enfurecida.',
        13: 'Fica envenenada.',
        14: 'Fica abalada, atordoada, lenta e fraca.',
        15: 'Recupera-se de todas as condições.',
        16: 'Recupera 50 PV e 50 PM.',
        17: 'Recupera 50 PV e 50 PM.',
        18: 'Recupera 100 PV.',
        19: 'Recupera 100 PM.',
        20: 'Recupera 100 PV e 100 PM.'
    };

    const executarAlquimia = () => {
        let custoPI = 3;
        let qtdDados = 2;

        if (tipoMistura === 'avancada') {
            custoPI = 4;
            qtdDados = 3;
        } else if (tipoMistura === 'superior') {
            custoPI = 5;
            qtdDados = 4;
        }

        const dadosRolados = Array.from({ length: qtdDados }, () => rolarDado(20));

        setResultadoAlquimia({
            tipo: tipoMistura,
            custoPI,
            dadosRolados
        });
    };

    const descreverAlvo = (valor) => {
        const item = tabelaAlvo.find(t => valor >= t.min && valor <= t.max);
        return item ? item.desc : 'Alvo personalizado';
    };

    // Função para Criar o Magicanhão validando as duas mãos vazias
const criarMagicanhão = async () => {
        // Usa o fichaId passado pelas props da página
        const idPersonagem = fichaId || ficha?.id;

        if (!idPersonagem) {
            alert("❌ Erro: ID da ficha de personagem não encontrado!");
            return;
        }

        setCriandoCanhao(true);

        try {
            // 1. Verifica se já existem itens nas mãos
            const { data: itensEquipados, error: erroBusca } = await supabase
                .from('itens_personagem')
                .select('*')
                .eq('ficha_id', idPersonagem);

            if (erroBusca) throw erroBusca;

            const ocupado = (itensEquipados || []).some(i => {
                const slot = i.stats_personalizados?.slot;
                return slot === 'mao_dominante' || slot === 'mao_secundaria';
            });

            if (ocupado) {
                alert("⛔ Regra do Magicanhão: Seus dois espaços de mão precisam estar completamente vazios para criar e equipar o magicanhão!");
                setCriandoCanhao(false);
                return;
            }

            // 2. Remove qualquer magicanhão anterior criado
            const idsParaRemover = (itensEquipados || [])
                .filter(i => (i.nome || '').toLowerCase().includes('magicanhão'))
                .map(i => i.id);

            if (idsParaRemover.length > 0) {
                await supabase
                    .from('itens_personagem')
                    .delete()
                    .in('id', idsParaRemover);
            }

            // 3. Insere o novo Magicanhão vinculado corretamente à ficha
            const novoCanhao = {
                ficha_id: idPersonagem,
                nome: 'Magicanhão',
                tipo: 'Arma de Fogo',
                stats_personalizados: {
                    slot: 'mao_dominante',
                    tipo_ataque: 'distancia',
                    attr1: 'destreza',
                    attr2: 'astucia',
                    dano: 'RA + 10',
                    defesa: 0,
                    duas_maos: true
                }
            };

            const { error: erroInsercao } = await supabase
                .from('itens_personagem')
                .insert([novoCanhao]);

            if (erroInsercao) throw erroInsercao;

            alert("💥 Magicanhão criado, equipado nas suas mãos vazias e pronto para disparar!");
        } catch (err) {
            console.error("Erro ao criar magicanhão:", err.message);
            alert("Erro ao criar o magicanhão. Verifique o console.");
        } finally {
            setCriandoCanhao(false);
        }
    };

    return (
        <div style={{ background: '#0d0f18', border: '1px solid #30363d', borderRadius: '8px', padding: '14px', marginTop: '10px' }}>

            {/* Título do Painel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #21262d', paddingBottom: '8px', marginBottom: '10px' }}>
                <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaCogs /> Laboratório de Inventor (Nível {nivelInventor})
                </span>
                <span style={{ background: '#21262d', color: '#58a6ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    PI Máx: +2 Ativo • Projetos Liberados
                </span>
            </div>

            {/* Resumo das Vertentes de Engenhocas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: '#161b22', padding: '8px', borderRadius: '6px', border: '1px solid #30363d', fontSize: '0.75rem' }}>
                    <div style={{ color: '#58a6ff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaFlask /> Alquimia
                    </div>
                    <div style={{ color: ramoAlquimia ? '#3fb950' : '#8b949e', marginTop: '2px', textTransform: 'uppercase' }}>
                        {ramoAlquimia || 'Não Adquirido'}
                    </div>
                </div>

                <div style={{ background: '#161b22', padding: '8px', borderRadius: '6px', border: '1px solid #30363d', fontSize: '0.75rem' }}>
                    <div style={{ color: '#d4af37', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaShieldAlt /> Infusões
                    </div>
                    <div style={{ color: ramoInfusoes ? '#3fb950' : '#8b949e', marginTop: '2px', textTransform: 'uppercase' }}>
                        {ramoInfusoes || 'Não Adquirido'}
                    </div>
                </div>

                <div style={{ background: '#161b22', padding: '8px', borderRadius: '6px', border: '1px solid #30363d', fontSize: '0.75rem' }}>
                    <div style={{ color: '#bc8cff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaMagic /> Tecnomagia
                    </div>
                    <div style={{ color: ramoTecnomagia ? '#3fb950' : '#8b949e', marginTop: '2px', textTransform: 'uppercase' }}>
                        {ramoTecnomagia || 'Não Adquirido'}
                    </div>
                </div>
            </div>

            {/* 1. SEÇÃO DE ALQUIMIA */}
            {temBasicoAlquimia && (
                <div style={{ marginBottom: '14px', borderTop: '1px solid #21262d', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#58a6ff', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaFlask /> Alquimia / Misturas (Ação Inventário)
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setTipoMistura('basica')}
                            style={{ flex: 1, background: tipoMistura === 'basica' ? '#21262d' : '#161b22', color: tipoMistura === 'basica' ? '#3fb950' : '#8b949e', border: '1px solid #30363d', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Básica (3 PI | 2 d20)
                        </button>
                        <button
                            type="button"
                            onClick={() => { if (temAvancadoAlquimia) setTipoMistura('avancada'); }}
                            disabled={!temAvancadoAlquimia}
                            style={{ flex: 1, background: tipoMistura === 'avancada' ? '#21262d' : '#161b22', color: temAvancadoAlquimia ? (tipoMistura === 'avancada' ? '#d4af37' : '#8b949e') : '#484f58', border: '1px solid #30363d', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', cursor: temAvancadoAlquimia ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                        >
                            Avançada (4 PI | 3 d20) {!temAvancadoAlquimia && '🔒'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { if (temSuperiorAlquimia) setTipoMistura('superior'); }}
                            disabled={!temSuperiorAlquimia}
                            style={{ flex: 1, background: tipoMistura === 'superior' ? '#21262d' : '#161b22', color: temSuperiorAlquimia ? (tipoMistura === 'superior' ? '#da3633' : '#8b949e') : '#484f58', border: '1px solid #30363d', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', cursor: temSuperiorAlquimia ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                        >
                            Superior (5 PI | 4 d20) {!temSuperiorAlquimia && '🔒'}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={executarAlquimia}
                        style={{ width: '100%', background: '#238636', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                    >
                        <FaDice /> Rolar Mistura Alquímica (Gasta {tipoMistura === 'basica' ? 3 : tipoMistura === 'avancada' ? 4 : 5} PI)
                    </button>

                    {resultadoAlquimia && (
                        <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '10px', borderRadius: '6px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#d4af37', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Resultado da Rolagem ({resultadoAlquimia.tipo.toUpperCase()})</span>
                                <span>[{resultadoAlquimia.dadosRolados.join(', ')}]</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#c9d1d9' }}>
                                💡 Atribua um dado para o <strong>Alvo</strong> e outro para o <strong>Efeito</strong>. Opção "Qualquer": Recupera 30 PV ou causa 20 de dano de veneno.
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                                {resultadoAlquimia.dadosRolados.map((d, dIdx) => (
                                    <div key={dIdx} style={{ background: '#161b22', padding: '6px', borderRadius: '4px', border: '1px solid #30363d', fontSize: '0.7rem' }}>
                                        <span style={{ color: '#58a6ff', fontWeight: 'bold' }}>Dado #{dIdx + 1} ({d}):</span>
                                        <div style={{ color: '#f0f6fc', marginTop: '2px' }}>🎯 Alvo: {descreverAlvo(d)}</div>
                                        <div style={{ color: '#3fb950', marginTop: '2px' }}>✨ Efeito: {tabelaEfeito[d] || 'Efeito padrão'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 2. SEÇÃO DE INFUSÕES */}
            {temBasicoInfusoes && (
                <div style={{ marginBottom: '14px', borderTop: '1px solid #21262d', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#d4af37', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaBolt /> Infusões (Custo: 2 PI por ataque)
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '6px' }}>
                        Gaste 2 PI ao atingir um alvo com um ataque para aplicar uma infusão (aplica a cada alvo se tiver propriedade multi).
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {/* Básicas */}
                        <span style={{ fontSize: '0.7rem', color: '#58a6ff', width: '100%', fontWeight: 'bold', marginTop: '4px' }}>Básicas:</span>
                        {['Crio (Gelo)', 'Piro (Fogo)', 'Volt (Raio)'].map((inf) => (
                            <button
                                key={inf}
                                type="button"
                                onClick={() => setInfusaoSelecionada(inf)}
                                style={{ background: infusaoSelecionada === inf ? '#21262d' : '#161b22', color: '#3fb950', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                            >
                                {inf} (+5 dano)
                            </button>
                        ))}

                        {/* Avançadas */}
                        {temAvancadoInfusoes && (
                            <>
                                <span style={{ fontSize: '0.7rem', color: '#d4af37', width: '100%', fontWeight: 'bold', marginTop: '4px' }}>Avançadas:</span>
                                {['Ciclone (Ar)', 'Exorcismo (Luz)', 'Sísmico (Terra)', 'Sombra (Trevas)'].map((inf) => (
                                    <button
                                        key={inf}
                                        type="button"
                                        onClick={() => setInfusaoSelecionada(inf)}
                                        style={{ background: infusaoSelecionada === inf ? '#21262d' : '#161b22', color: '#d4af37', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                                    >
                                        {inf} (+5 dano)
                                    </button>
                                ))}
                            </>
                        )}

                        {/* Superiores */}
                        {temSuperiorInfusoes && (
                            <>
                                <span style={{ fontSize: '0.7rem', color: '#da3633', width: '100%', fontWeight: 'bold', marginTop: '4px' }}>Superiores:</span>
                                {['Vampiro (Recupera PV/PM)', 'Peçonha (Veneno + Condição)'].map((inf) => (
                                    <button
                                        key={inf}
                                        type="button"
                                        onClick={() => setInfusaoSelecionada(inf)}
                                        style={{ background: infusaoSelecionada === inf ? '#21262d' : '#161b22', color: '#da3633', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                                    >
                                        {inf}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                    {infusaoSelecionada && (
                        <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#d4af37' }}>
                            ✨ Infusão Ativa para o próximo ataque: <strong>{infusaoSelecionada}</strong> (Gasta 2 PI ao acertar).
                        </div>
                    )}
                </div>
            )}

            {/* 3. SEÇÃO DE TECNOMAGIA */}
            {temBasicoTecnomagia && (
                <div style={{ marginBottom: '10px', borderTop: '1px solid #21262d', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#bc8cff', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaMagic /> Tecnomagia (Ferramentas & Feitiços)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {/* Sobreposição Tecnomágica */}
                        <div style={{ background: '#161b22', padding: '8px', borderRadius: '4px', border: '1px solid #30363d', fontSize: '0.7rem' }}>
                            <strong style={{ color: '#bc8cff' }}>Sobreposição Tecnomágica (Básico):</strong> Gasta 10 PM para curar condições de um construto/elemental não-senciente, revelar ficha e forçar uma ação.
                            <br />
                            <button
                                type="button"
                                onClick={() => {
                                    const mpAtual = ficha?.mp_atual ?? 0;
                                    if (mpAtual < 10) {
                                        alert("Você não tem MP suficiente (10 PM) para usar a Sobreposição Tecnomágica!");
                                        return;
                                    }
                                    handleAjustarRecurso('mp_atual', -10);
                                    alert("✨ Sobreposição Tecnomágica ativada! 10 PM consumidos.");
                                }}
                                style={{ marginTop: '6px', background: '#21262d', color: '#bc8cff', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                ⚡ Gastar 10 MP e Ativar Sobreposição
                            </button>
                        </div>

                        {/* Magicanhão */}
                        {temAvancadoTecnomagia && (
                            <div style={{ background: '#161b22', padding: '8px', borderRadius: '4px', border: '1px solid #30363d', fontSize: '0.7rem' }}>
                                <strong style={{ color: '#d4af37' }}>Magicanhão (Avançado):</strong> Ação Inventário + 2 PI para criar/equipar uma arma de fogo (Precisão: DES+AST+1, Dano: RA+10).
                                <br />
                                <button
                                    type="button"
                                    onClick={criarMagicanhão}
                                    disabled={criandoCanhao}
                                    style={{ marginTop: '6px', background: '#21262d', color: '#d4af37', border: '1px solid #30363d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    {criandoCanhao ? 'Criando...' : '🎯 Criar e Equipar Magicanhão (Ação Inventário + 2 PI)'}
                                </button>
                            </div>
                        )}

                        {/* Magisferas */}
                        {temSuperiorTecnomagia && (
                            <div style={{ background: '#161b22', padding: '8px', borderRadius: '4px', border: '1px solid #30363d', fontSize: '0.7rem' }}>
                                <strong style={{ color: '#da3633' }}>Magisferas (Superior):</strong> Cria magisferas de feitiços (Elementalista, Entropista, Espiritualista). Ação Inventário + 2 PI para lançar o feitiço instantaneamente pagando seus custos normais de MP.
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}