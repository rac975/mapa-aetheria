import { useState } from 'react';
import { FaDice, FaClock, FaMagic, FaShieldAlt } from 'react-icons/fa';

export default function ExibirEntropista({ classeObjeto }) {
    // Estado local para simular o "Sete da Sorte" (começa em 7)
    const [numeroSorte, setNumeroSorte] = useState(7);
    const [historicoUso, setHistoricoUso] = useState(false);

    const habilidades = classeObjeto?.habilidades || [];
    const nivelClasse = parseInt(classeObjeto?.nivel) || 1;

    // Verifica se o personagem possui poderes específicos investidos
    const habSeteDaSorte = habilidades.find(h => (h.nome || '').toLowerCase().includes('sete da sorte'));
    const nivelSeteDaSorte = parseInt(habSeteDaSorte?.nivel) || 0;

    const habTempoRoubado = habilidades.find(h => (h.nome || '').toLowerCase().includes('tempo roubado'));
    const nivelTempoRoubado = parseInt(habTempoRoubado?.nivel) || 0;
    const maxPMRoubo = nivelTempoRoubado * 5;

    const simularSeteDaSorte = () => {
        // Gera um valor aleatório de dado (ex: d6 ou d12) para simular a troca pelo número da sorte
        const novoValor = Math.floor(Math.random() * 6) + 1;
        setNumeroSorte(novoValor);
        setHistoricoUso(true);
    };

    return (
        <div style={{ marginTop: '12px', background: '#120f1a', border: '1px solid #483665', borderRadius: '6px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ color: '#d2a8ff', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaMagic /> Painel de Controle: Entropista (Nível {nivelClasse})
                </span>

                {nivelSeteDaSorte > 0 && (
                    <button
                        type="button"
                        onClick={simularSeteDaSorte}
                        style={{ background: '#211d2e', color: '#d2a8ff', border: '1px solid #483665', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Substituir valor de um dado pelo Número da Sorte e atualizar o número"
                    >
                        <FaDice /> Sete da Sorte: <strong>[{numeroSorte}]</strong>
                    </button>
                )}
            </div>

            {/* Dica de Rituais e Benefícios Iniciais */}
            <div style={{ fontSize: '0.78rem', color: '#8b949e', background: '#161b22', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                💡 <strong>Benefícios Ativos:</strong> +5 PM máximos garantidos • Rituais da disciplina <i>Entropismo</i> liberados (Usa <b>AST + VON</b>).
            </div>

            {/* Seção interativa para Tempo Roubado */}
            {nivelTempoRoubado > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#ffa657', background: '#261f12', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <FaClock /> <strong>Tempo Roubado (Nv. {nivelTempoRoubado}):</strong> Gasto máximo de PM por uso: <strong>{maxPMRoubo} PM</strong> (5 PM por opção).
                    </div>
                    <div style={{ color: '#c9d1d9', fontSize: '0.75rem' }}>
                        Opções disponíveis: Deixar/tirar lento, Ação Equipamento grátis, Dano necrose em lento <code>10 + ({nivelTempoRoubado}×5)</code> ou adiantar turno de aliado.
                    </div>
                </div>
            )}

            {/* Alerta de Sete da Sorte usado */}
            {nivelSeteDaSorte > 0 && historicoUso && (
                <div style={{ fontSize: '0.75rem', color: '#7ee787', fontStyle: 'italic', marginTop: '4px' }}>
                    ✨ O seu "Número da Sorte" foi atualizado para <strong>{numeroSorte}</strong> após o uso nesta cena!
                </div>
            )}
        </div>
    );
}