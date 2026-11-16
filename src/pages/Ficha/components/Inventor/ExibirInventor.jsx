import React, { useState } from 'react';
import { FaCogs } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';
import InventorRamosResumo from './InventorRamosResumo';
import InventorAlquimiaSecao from './InventorAlquimiaSecao';
import InventorInfusoesSecao from './InventorInfusoesSecao';
import InventorTecnomagiaSecao from './InventorTecnomagiaSecao';

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
    const nivelInventor = classeInventor ? (parseInt(classeInventor.nivel, 10) || 1) : 0;

    if (nivelInventor <= 0) return null;

    // 2. Localiza a habilidade "Engenhocas" e os ramos escolhidos
    const habEngenhocas = (classeInventor?.habilidades || []).find(h => (h.nome || '').toLowerCase().includes('engenhocas'));
    const nivelEngenhocas = habEngenhocas ? (parseInt(habEngenhocas.nivel, 10) || 0) : 0;

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

    // Função para Criar o Magicanhão validando as duas mãos vazias via fichaService
    const criarMagicanhão = async () => {
        const idPersonagem = fichaId || ficha?.id;

        if (!idPersonagem) {
            alert("❌ Erro: ID da ficha de personagem não encontrado!");
            return;
        }

        setCriandoCanhao(true);

        try {
            // 1. Verifica se já existem itens nas mãos
            const itensEquipados = await fichaService.getItensByFichaId(idPersonagem);

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
                await fichaService.deletarItensPersonagemPorIds(idsParaRemover);
            }

            // 3. Insere o novo Magicanhão vinculado à ficha
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

            const { error: erroInsercao } = await fichaService.addItemPersonagem(novoCanhao);
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
            <InventorRamosResumo
                ramoAlquimia={ramoAlquimia}
                ramoInfusoes={ramoInfusoes}
                ramoTecnomagia={ramoTecnomagia}
            />

            {/* 1. SEÇÃO DE ALQUIMIA */}
            {temBasicoAlquimia && (
                <InventorAlquimiaSecao
                    tipoMistura={tipoMistura}
                    setTipoMistura={setTipoMistura}
                    temAvancadoAlquimia={temAvancadoAlquimia}
                    temSuperiorAlquimia={temSuperiorAlquimia}
                    onExecutarAlquimia={executarAlquimia}
                    resultadoAlquimia={resultadoAlquimia}
                    tabelaEfeito={tabelaEfeito}
                    descreverAlvo={descreverAlvo}
                />
            )}

            {/* 2. SEÇÃO DE INFUSÕES */}
            {temBasicoInfusoes && (
                <InventorInfusoesSecao
                    temAvancadoInfusoes={temAvancadoInfusoes}
                    temSuperiorInfusoes={temSuperiorInfusoes}
                    infusaoSelecionada={infusaoSelecionada}
                    setInfusaoSelecionada={setInfusaoSelecionada}
                />
            )}

            {/* 3. SEÇÃO DE TECNOMAGIA */}
            {temBasicoTecnomagia && (
                <InventorTecnomagiaSecao
                    ficha={ficha}
                    handleAjustarRecurso={handleAjustarRecurso}
                    temAvancadoTecnomagia={temAvancadoTecnomagia}
                    temSuperiorTecnomagia={temSuperiorTecnomagia}
                    onCriarMagicanhao={criarMagicanhão}
                    criandoCanhao={criandoCanhao}
                />
            )}
        </div>
    );
}
