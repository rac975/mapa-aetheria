import { FaBoxOpen, FaPlus, FaMinus, FaCoins, FaFlask, FaHeart, FaMagic, FaShieldAlt, FaBolt } from 'react-icons/fa';
import { MdWaterDrop } from 'react-icons/md';
import { supabase } from '../../../services/supabase';

export default function FichaPIComponent({ ficha, setFicha }) {
    if (!ficha) return null;

    const piAtual = ficha.pi_atual ?? 6;
    const piMax = ficha.pi_max ?? 6;
    const zenitAtual = ficha.zenit ?? 0;

    // Função genérica para atualizar PIs e outros recursos no Supabase e estado local
    const atualizarFichaNoBanco = async (novosDados) => {
        const dadosAtualizados = { ...ficha, ...novosDados };
        setFicha(dadosAtualizados);

        await supabase
            .from('fichas_personagens')
            .update(novosDados)
            .eq('id', ficha.id);
    };

    const alterarPI = async (quantidade) => {
        const novoPiAtual = Math.max(0, Math.min(piMax, piAtual + quantidade));
        await atualizarFichaNoBanco({ pi_atual: novoPiAtual });
    };

    const recarregarPIs = async () => {
        const piFaltando = piMax - piAtual;
        if (piFaltando <= 0) return;

        const custoTotal = piFaltando * 10;
        if (zenitAtual < custoTotal) {
            alert(`Você precisa de ${custoTotal}z para recuperar todos os PIs, mas só tem ${zenitAtual}z!`);
            return;
        }

        const novoZenit = zenitAtual - custoTotal;
        await atualizarFichaNoBanco({ pi_atual: piMax, zenit: novoZenit });
    };

    // ==========================================
    // USAR CONSUMÍVEL POR PI (Regras Oficiais)
    // ==========================================
    const usarConsumivel = async (custoPI, tipoEfeito) => {
        if (piAtual < custoPI) {
            alert(`Você precisa de ${custoPI} PIs disponíveis, mas só tem ${piAtual} na mochila!`);
            return;
        }

        const novoPiAtual = piAtual - custoPI;
        let novosDados = { pi_atual: novoPiAtual };

        if (tipoEfeito === 'remedio') {
            // Remédio: 3 PI -> Recupera 50 PV (limitado ao PV Máximo)
            const hpMax = ficha.hp_max || 100;
            const hpAtual = ficha.hp_atual || 0;
            novosDados.hp_atual = Math.min(hpMax, hpAtual + 50);
        } 
        else if (tipoEfeito === 'elixir') {
            // Elixir: 3 PI -> Recupera 50 MP (limitado ao MP Máximo)
            const mpMax = ficha.mp_max || 50;
            const mpAtual = ficha.mp_atual || 0;
            novosDados.mp_atual = Math.min(mpMax, mpAtual + 50);
        } 
        else if (tipoEfeito === 'tonico') {
            // Tônico: 2 PI -> Recupera de todas as condições (Avisa na tela para o Mestre/Jogador)
            alert("✨ Tônico utilizado! Todas as condições foram removidas.");
            // Opcional: se houver lógica de limpar condições locais, pode ser acionada aqui
        }

        await atualizarFichaNoBanco(novosDados);
    };

    return (
        <div className="ficha-card-section" style={{ background: '#161b22', border: '1px solid #30363d', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#d4af37', fontSize: '1rem' }}>
                    <FaBoxOpen /> Pontos de Inventário (PI)
                </h3>
                <span style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {piAtual} / {piMax} PI
                </span>
            </div>

            {/* Barra Visual de PIs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {Array.from({ length: piMax }).map((_, index) => {
                    const ativo = index < piAtual;
                    return (
                        <div
                            key={index}
                            style={{
                                flex: 1,
                                height: '10px',
                                borderRadius: '4px',
                                background: ativo ? '#2ecc71' : '#352123',
                                border: `1px solid ${ativo ? '#27ae60' : '#f85149'}`,
                                transition: 'all 0.2s'
                            }}
                            title={ativo ? 'PI Disponível' : 'PI Gasto/Consumido'}
                        />
                    );
                })}
            </div>

            {/* BOTÕES DE USO RÁPIDO DE CONSUMÍVEIS */}
            <div style={{ marginBottom: '16px', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: '#8b949e', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    CRIAR E USAR CONSUMÍVEL IMEDIATAMENTE:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={() => usarConsumivel(3, 'remedio')}
                        style={{ background: '#21262d', color: '#2ecc71', border: '1px solid #30363d', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                        <FaHeart /> Remédio (3 PI) <span style={{ fontSize: '0.65rem', color: '#8b949e' }}>+50 PV</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => usarConsumivel(3, 'elixir')}
                        style={{ background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                        <MdWaterDrop /> Elixir (3 PI) <span style={{ fontSize: '0.65rem', color: '#8b949e' }}>+50 MP</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => usarConsumivel(2, 'tonico')}
                        style={{ background: '#21262d', color: '#d4af37', border: '1px solid #30363d', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                        <FaFlask /> Tônico (2 PI) <span style={{ fontSize: '0.65rem', color: '#8b949e' }}>Cura Status</span>
                    </button>
                </div>
            </div>

            {/* Controles Manuais e Reabastecimento */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                        type="button"
                        onClick={() => alterarPI(-1)} 
                        disabled={piAtual <= 0}
                        style={{ background: '#21262d', color: '#f85149', border: '1px solid #30363d', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                        -1 PI Manual
                    </button>
                    <button 
                        type="button"
                        onClick={() => alterarPI(1)} 
                        disabled={piAtual >= piMax}
                        style={{ background: '#21262d', color: '#2ecc71', border: '1px solid #30363d', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                        +1 PI Manual
                    </button>
                </div>

                <button 
                    type="button"
                    onClick={recarregarPIs}
                    style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#d4af37', border: '1px solid rgba(212, 175, 55, 0.4)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
                    title="Custa 10z por PI faltante"
                >
                    <FaCoins /> Reabastecer na Vila (10z/PI)
                </button>
            </div>
        </div>
    );
}