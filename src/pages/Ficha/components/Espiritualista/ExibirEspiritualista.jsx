import { useState } from 'react';
import { FaHeartbeat, FaMagic, FaShieldAlt, FaHandsHelping } from 'react-icons/fa';

export default function ExibirEspiritualista({ classeObjeto }) {
    // Estado para simular ou informar o número de Laços ativos (usado no Poder Curativo)
    const [quantidadeLacos, setQuantidadeLacos] = useState(1);

    const habilidades = classeObjeto?.habilidades || [];
    const nivelClasse = parseInt(classeObjeto?.nivel) || 1;

    // Verifica se possui poderes específicos investidos
    const habPoderCurativo = habilidades.find(h => (h.nome || '').toLowerCase().includes('poder curativo'));
    const nivelPoderCurativo = parseInt(habPoderCurativo?.nivel) || 0;

    const habMagiaSuporte = habilidades.find(h => (h.nome || '').toLowerCase().includes('magia de suporte'));
    const temMagiaSuporte = parseInt(habMagiaSuporte?.nivel) > 0;

    const habVismagus = habilidades.find(h => (h.nome || '').toLowerCase().includes('vismagus'));
    const temVismagus = parseInt(habVismagus?.nivel) > 0;

    // Cálculo oficial do Poder Curativo: 3 + (NP do Poder Curativo × número de Laços)
    const curaExtraPV = 3 + (nivelPoderCurativo * quantidadeLacos);

    return (
        <div style={{ marginTop: '12px', background: '#0f1816', border: '1px solid #285243', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ color: '#56d364', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaMagic /> Painel de Controle: Espiritualista (Nível {nivelClasse})
                </span>
            </div>

            {/* Dica de Benefícios Iniciais e Testes */}
            <div style={{ fontSize: '0.78rem', color: '#8b949e', background: '#161b22', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                💡 <strong>Benefícios Ativos:</strong> +5 PM máximos garantidos • Rituais de <i>Espiritualismo</i> liberados (Usa <b>AST + VON</b>).
            </div>

            {/* Painel do Poder Curativo (se investido) */}
            {nivelPoderCurativo > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#3fb950', background: '#112217', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                            <FaHeartbeat /> Poder Curativo (Nv. {nivelPoderCurativo}):
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#c9d1d9' }}>Laços Ativos:</span>
                            <input
                                type="number"
                                min="0"
                                max="5"
                                value={quantidadeLacos}
                                onChange={(e) => setQuantidadeLacos(parseInt(e.target.value) || 0)}
                                style={{ width: '45px', textAlign: 'center', background: '#161b22', color: '#fff', border: '1px solid #30363d', borderRadius: '4px' }}
                            />
                        </div>
                    </div>
                    <div style={{ color: '#c9d1d9', fontSize: '0.78rem' }}>
                        Ao usar arma arcana em feitiços de alvo aliado, cada alvo recupera PVs extras: <code>3 + ({nivelPoderCurativo} × {quantidadeLacos})</code> = <strong style={{ color: '#56d364' }}>{curaExtraPV} PVs</strong>.
                    </div>
                </div>
            )}

            {/* Informações de Magia de Suporte e Vismagus */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem' }}>
                {temMagiaSuporte && (
                    <div style={{ color: '#58a6ff', background: '#111d2e', padding: '6px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaHandsHelping /> <strong>Magia de Suporte:</strong> Alvo aliado com Laço ganha bônus de teste igual à força do Laço (com arma arcana).
                    </div>
                )}
                {temVismagus && (
                    <div style={{ color: '#ffa657', background: '#261f12', padding: '6px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaShieldAlt /> <strong>Vismagus Ativo:</strong> Você pode sacrificar PVs <code>(10 + Custo PM)</code> se faltarem pontos de magia.
                    </div>
                )}
            </div>
        </div>
    );
}