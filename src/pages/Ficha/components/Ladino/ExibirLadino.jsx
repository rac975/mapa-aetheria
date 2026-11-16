import React, { useState } from 'react';
import { FaUserSecret, FaRunning, FaShieldAlt, FaCrosshairs, FaGhost, FaBolt } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';

const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

export default function ExibirLadino({ classes, ficha, fichaId, handleAjustarRecurso }) {
    // Estado para resultados de Roubo de Alma ou interações
    const [resultadoRoubo, setResultadoRoubo] = useState(null);
    const [alvoNivel, setAlvoNivel] = useState(5);
    const [tipoAlvo, setTipoAlvo] = useState('soldado'); // soldado, elite, campeao, vilao

    // 1. Encontra a classe Ladino e suas habilidades
    const classeLadino = classes?.find(c => (c.nome_classe || '').toLowerCase().includes('ladino'));
    const nivelLadino = classeLadino ? (parseInt(classeLadino.nivel) || 1) : 0;

    if (nivelLadino <= 0) return null;

    // 2. Extrai as habilidades e seus níveis
    const habilidades = classeLadino?.habilidades || [];
    const getHabNivel = (nome) => {
        const h = habilidades.find(item => (item.nome || '').toLowerCase().includes(nome.toLowerCase()));
        return h ? (parseInt(h.nivel) || 0) : 0;
    };

    const nivelAltaVelocidade = getHabNivel('alta velocidade');
    const nivelEsquiva = getHabNivel('esquiva');
    const nivelGolpeBaixo = getHabNivel('golpe baixo');
    const nivelRouboAlma = getHabNivel('roubo de alma');
    const nivelVejoMaisTarde = getHabNivel('vejo você mais tarde');

    // Função para Alta Velocidade (Gasta 10 PM)
    const usarAltaVelocidade = () => {
        const mpAtual = ficha?.mp_atual ?? 0;
        if (mpAtual < 10) {
            alert("Você não tem MP suficiente (10 PM) para usar Alta Velocidade!");
            return;
        }
        handleAjustarRecurso('mp_atual', -10);
        alert(`⚡ Alta Velocidade ativada! 10 PM consumidos. Você ganha +${nivelAltaVelocidade} em testes da ação escolhida.`);
    };

    // Função para Roubo de Alma (Gasta Ação, Roda DES+VON)
    const executarRouboDeAlma = async () => {
        const idPersonagem = fichaId || ficha?.id;
        if (!idPersonagem) {
            alert("Erro: ID da ficha não encontrado.");
            return;
        }

        const bonusNp = nivelRouboAlma;
        const d1 = rolarDado(20);
        const d2 = rolarDado(20);
        const totalRolagem = d1 + d2 + bonusNp;

        let mensagemResultado = '';
        if (tipoAlvo === 'soldado') {
            mensagemResultado = `🎯 Sucesso contra Soldado! Você recuperou ${bonusNp} PI.`;
        } else {
            const multiplicador = tipoAlvo === 'vilao' ? 50 : 30;
            const valorZenites = alvoNivel * multiplicador;
            const nomeItem = `Tesouro da Alma (${tipoAlvo.toUpperCase()} Nv. ${alvoNivel})`;

            try {
                // Inserção corrigida sem a coluna 'custo' via fichaService
                const { error } = await fichaService.addItemPersonagem({
                    ficha_id: idPersonagem,
                    nome: nomeItem,
                    tipo: 'Tesouro / Valioso',
                    stats_personalizados: {
                        origem: 'Roubo de Alma',
                        valor_zenites: valorZenites,
                        descricao: `Tesouro no valor de ${valorZenites} zênites obtido de um ${tipoAlvo} de nível ${alvoNivel}.`
                    }
                });

                if (error) throw error;
                mensagemResultado = `💎 Tesouro da Alma obtido! Um item no valor de ${valorZenites} zênites foi adicionado à sua mochila.`;
            } catch (err) {
                console.error("Erro ao inserir tesouro:", err.message);
                mensagemResultado = "Erro ao adicionar o tesouro na mochila.";
            }
        }

        setResultadoRoubo({
            rolagem: [d1, d2],
            bonus: bonusNp,
            total: totalRolagem,
            detalhe: mensagemResultado
        });
    };

    return (
        <div style={{ background: '#0d0f18', border: '1px solid #30363d', borderRadius: '8px', padding: '14px', marginTop: '10px' }}>

            {/* Título do Painel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #21262d', paddingBottom: '8px', marginBottom: '10px' }}>
                <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaUserSecret /> Sombra do Ladino (Nível {nivelLadino})
                </span>
                <span style={{ background: '#21262d', color: '#3fb950', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    PI Máx: +2 Ativo
                </span>
            </div>

            {/* Resumo dos Poderes Ativos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>

                {/* Esquiva */}
                <div style={{ background: '#161b22', padding: '8px', borderRadius: '6px', border: '1px solid #30363d', fontSize: '0.75rem' }}>
                    <div style={{ color: '#58a6ff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaShieldAlt /> Esquiva (Nv. {nivelEsquiva})
                    </div>
                    <div style={{ color: nivelEsquiva > 0 ? '#3fb950' : '#8b949e', marginTop: '2px' }}>
                        {nivelEsquiva > 0 ? `Defesa +${nivelEsquiva} (sem escudo/armadura marcial)` : 'Não Adquirido'}
                    </div>
                </div>

                {/* Golpe Baixo */}
                <div style={{ background: '#161b22', padding: '8px', borderRadius: '6px', border: '1px solid #30363d', fontSize: '0.75rem' }}>
                    <div style={{ color: '#d4af37', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaCrosshairs /> Golpe Baixo (Nv. {nivelGolpeBaixo})
                    </div>
                    <div style={{ color: nivelGolpeBaixo > 0 ? '#3fb950' : '#8b949e', marginTop: '2px' }}>
                        {nivelGolpeBaixo > 0 ? `Dano extra: Nv + Condições` : 'Não Adquirido'}
                    </div>
                </div>

            </div>

            {/* 1. ALTA VELOCIDADE */}
            {nivelAltaVelocidade > 0 && (
                <div style={{ marginBottom: '12px', borderTop: '1px solid #21262d', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#58a6ff', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaRunning /> Alta Velocidade (Início de Conflito)
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '6px' }}>
                        Gasta 10 PM para ataque livre ou ação de Impedimento/Objetivo com bônus de +{nivelAltaVelocidade} antes da 1ª rodada.
                    </div>
                    <button
                        type="button"
                        onClick={usarAltaVelocidade}
                        style={{ width: '100%', background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', padding: '6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        ⚡ Ativar Alta Velocidade (Gasta 10 PM)
                    </button>
                </div>
            )}

            {/* 2. ROUBO DE ALMA */}
            {nivelRouboAlma > 0 && (
                <div style={{ marginBottom: '10px', borderTop: '1px solid #21262d', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#bc8cff', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaGhost /> Roubo de Alma (Nv. {nivelRouboAlma})
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '6px' }}>
                        Teste de DES + VON (+{nivelRouboAlma} bônus) contra Defesa Mágica do alvo para recuperar PI ou gerar tesouro.
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <select
                            value={tipoAlvo}
                            onChange={(e) => setTipoAlvo(e.target.value)}
                            style={{ flex: 1, background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '4px', fontSize: '0.7rem' }}
                        >
                            <option value="soldado">Soldado (Recupera PI)</option>
                            <option value="elite">Elite (Tesouro da Alma)</option>
                            <option value="campeao">Campeão (Tesouro da Alma)</option>
                            <option value="vilao">Vilão (Tesouro da Alma x50)</option>
                        </select>

                        <input
                            type="number"
                            value={alvoNivel}
                            onChange={(e) => setAlvoNivel(parseInt(e.target.value) || 1)}
                            placeholder="Nível do Alvo"
                            style={{ width: '80px', background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '4px', fontSize: '0.7rem' }}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={executarRouboDeAlma}
                        style={{ width: '100%', background: '#8957e5', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        👻 Executar Roubo de Alma
                    </button>

                    {resultadoRoubo && (
                        <div style={{ background: 'rgba(137, 87, 229, 0.1)', border: '1px solid rgba(137, 87, 229, 0.3)', padding: '8px', borderRadius: '6px', marginTop: '6px', fontSize: '0.7rem', color: '#c9d1d9' }}>
                            <div>🎲 Rolagem: [{resultadoRoubo.rolagem.join(', ')}] + Bônus ({resultadoRoubo.bonus}) = <strong>{resultadoRoubo.total}</strong></div>
                            <div style={{ color: '#bc8cff', marginTop: '4px', fontWeight: 'bold' }}>{resultadoRoubo.detalhe}</div>
                        </div>
                    )}
                </div>
            )}

            {/* 3. VEJO VOCÊ MAIS TARDE */}
            {nivelVejoMaisTarde > 0 && (
                <div style={{ borderTop: '1px solid #21262d', paddingTop: '8px', fontSize: '0.7rem', color: '#8b949e' }}>
                    <strong style={{ color: '#d4af37' }}>Vejo Você Mais Tarde:</strong> Gasta 1 Ponto de Fábula para sumir da cena atual e reaparecer em outra com outro PJ.
                </div>
            )}

        </div>
    );
}