import { FaCogs, FaPlus } from 'react-icons/fa';

export default function ExibirEngenhocas({ habilidadeEngenhocas, aoAtualizarEngenhocas }) {
    const nivelInvestido = habilidadeEngenhocas?.nivel || 0;
    const ramosAtuais = habilidadeEngenhocas?.ramos || {};

    if (nivelInvestido === 0) return null;

    const TIPOS_DISPONIVEIS = [
        { id: 'alquimia', nome: 'Alquimia' },
        { id: 'infusoes', nome: 'Infusões' },
        { id: 'tecnomagia', nome: 'Tecnomagia' }
    ];

    const totalRamosEscolhidos = Object.values(ramosAtuais).reduce((acc, estagio) => {
        if (estagio === 'basico') return acc + 1;
        if (estagio === 'avancado') return acc + 2;
        if (estagio === 'superior') return acc + 3;
        return acc;
    }, 0);

    const pontosDisponiveisParaEscolha = nivelInvestido - totalRamosEscolhidos;

    const avancarRamo = (tipoId) => {
        const atual = ramosAtuais[tipoId];
        let proximo = 'basico';
        if (atual === 'basico') proximo = 'avancado';
        else if (atual === 'avancado') proximo = 'superior';
        else if (atual) return;

        const novosRamos = { ...ramosAtuais, [tipoId]: proximo };
        aoAtualizarEngenhocas(novosRamos);
    };

    const retrocederRamo = (tipoId) => {
        const atual = ramosAtuais[tipoId];
        let proximo;
        if (atual === 'superior') proximo = 'avancado';
        else if (atual === 'avancado') proximo = 'basico';

        const novosRamos = { ...ramosAtuais };
        if (proximo) {
            novosRamos[tipoId] = proximo;
        } else {
            delete novosRamos[tipoId];
        }
        aoAtualizarEngenhocas(novosRamos);
    };

    return (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaCogs /> Sistema de Engenhocas (Nível do Poder: {nivelInvestido})
                </span>
                <span style={{ fontSize: '0.75rem', color: pontosDisponiveisParaEscolha > 0 ? '#3fb950' : '#8b949e' }}>
                    {pontosDisponiveisParaEscolha > 0 ? `⚠️ ${pontosDisponiveisParaEscolha} escolha(s) pendente(s)` : '✅ Todos os pontos alocados'}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {TIPOS_DISPONIVEIS.map((tipo) => {
                    const estagio = ramosAtuais[tipo.id];
                    const ehSuperior = estagio === 'superior';

                    return (
                        <div key={tipo.id} style={{ background: '#0d0f18', border: '1px solid #30363d', borderRadius: '4px', padding: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <strong style={{ color: '#f0f6fc', fontSize: '0.8rem' }}>{tipo.nome}</strong>
                                <span style={{ fontSize: '0.7rem', color: '#58a6ff', textTransform: 'uppercase' }}>
                                    {estagio || 'Não Adquirido'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                                {estagio ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => retrocederRamo(tipo.id)}
                                            style={{ background: '#21262d', color: '#f85149', border: '1px solid #30363d', padding: '2px 6px', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                        >
                                            Reduzir
                                        </button>
                                        {!ehSuperior && pontosDisponiveisParaEscolha > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => avancarRamo(tipo.id)}
                                                style={{ background: '#21262d', color: '#3fb950', border: '1px solid #30363d', padding: '2px 6px', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                            >
                                                Evoluir (+)
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    pontosDisponiveisParaEscolha > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => avancarRamo(tipo.id)}
                                            style={{ background: '#21262d', color: '#d4af37', border: '1px solid #30363d', padding: '4px 8px', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                        >
                                            <FaPlus size={10} /> Desbloquear Básico
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}