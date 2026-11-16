import React from 'react';
import { FaMagic } from 'react-icons/fa';

export default function InventorTecnomagiaSecao({
    ficha,
    handleAjustarRecurso,
    temAvancadoTecnomagia,
    temSuperiorTecnomagia,
    onCriarMagicanhao,
    criandoCanhao
}) {
    return (
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
                            onClick={onCriarMagicanhao}
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
    );
}
