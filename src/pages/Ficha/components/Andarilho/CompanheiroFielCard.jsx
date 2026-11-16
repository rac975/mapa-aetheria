import { useState, useEffect } from 'react';
import { FaPaw, FaCog, FaPlusCircle } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { npcService } from '../../../../services/npcService';
import { calcularPvMaximoCompanheiro, extrairNivelCompanheiroFiel } from '../../../../domain/fabula/classRules';
import { calcularNivelTotal } from '../../../../domain/fabula/characterProgression';
import NPCEditor from '../../../Mestre/NPC/components/NPCEditor';

export default function CompanheiroFielCard({ fichaId, classes = [] }) {
    const { id: idUrl } = useParams();
    const realFichaId = fichaId || idUrl;

    const [companheiro, setCompanheiro] = useState(null);
    const [editando, setEditando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [catalogoPoderes, setCatalogoPoderes] = useState([]);
    const [catalogoFeiticos, setCatalogoFeiticos] = useState([]);

    const nivelNP = extrairNivelCompanheiroFiel(classes);
    const nivelPersonagem = calcularNivelTotal(classes);

    useEffect(() => {
        let active = true;

        async function carregarDados() {
            if (!realFichaId || nivelNP <= 0) return;

            const { data: compData, error: errComp } = await npcService.getCompanheiroFielPorPersonagemId(realFichaId);

            if (errComp) {
                console.error("❌ [CompanheiroFiel] Erro ao buscar:", errComp.message);
            }

            const { data: poderesData } = await npcService.getCatalogoPoderesNpc();
            const { data: feiticosData } = await npcService.getCatalogoFeiticos();

            if (!active) return;

            if (poderesData) setCatalogoPoderes(poderesData);
            if (feiticosData) setCatalogoFeiticos(feiticosData);

            if (compData) {
                const pvCalculado = calcularPvMaximoCompanheiro(nivelNP, compData.atributos?.vig, nivelPersonagem);
                if (compData.pv_max !== pvCalculado) {
                    const compSincronizado = { ...compData, pv_max: pvCalculado };
                    setCompanheiro(compSincronizado);
                    const { id, ...resto } = compSincronizado;
                    await npcService.updateNpc(id, resto);
                } else {
                    setCompanheiro(compData);
                }
            } else {
                setCompanheiro(null);
            }
        }

        carregarDados();
        return () => { active = false; };
    }, [realFichaId, nivelNP, nivelPersonagem]);

    if (nivelNP <= 0) return null;

    if (!realFichaId) {
        return (
            <div style={{ background: '#0d0f18', border: '1px solid #30363d', borderRadius: '8px', padding: '12px', marginTop: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#ff7b72' }}>⚠️ Erro: Ficha ID ausente. Salve a ficha principal primeiro para gerar um ID.</span>
            </div>
        );
    }

    const criarCompanheiroNoBanco = async () => {
        setSalvando(true);
        const { data: userData } = await npcService.getAuthUser();
        const pvInicial = calcularPvMaximoCompanheiro(nivelNP, 'd8', nivelPersonagem);

        const novoMolde = {
            user_id: userData?.user?.id || null,
            nome: 'Meu Companheiro',
            especie: 'fera',
            nivel: 5,
            rank: 'soldado',
            atributos: { des: 'd8', ast: 'd8', vig: 'd8', von: 'd8' },
            pv_max: pvInicial,
            pv_atual: pvInicial,
            pm_max: 20,
            pm_atual: 20,
            defesa: 8,
            defesa_magica: 6,
            iniciativa: 0,
            afinidades: { veneno: 'vul' },
            tracos: ['', '', '', ''],
            ataques_basicos: [],
            poderes: [],
            feiticos: [],
            personagem_id: realFichaId,
            tipo_registro: 'companheiro'
        };

        const { data, error } = await npcService.createCompanheiroFiel(novoMolde);

        if (!error && data) {
            setCompanheiro(data);
            setEditando(true);
        } else {
            console.error("❌ Erro ao criar companheiro:", error);
            alert("Erro ao criar o companheiro no banco. Verifique o console (F12).");
        }
        setSalvando(false);
    };

    const salvarNoBanco = async (novoEstado) => {
        const pvRecalculado = calcularPvMaximoCompanheiro(nivelNP, novoEstado.atributos?.vig, nivelPersonagem);
        const estadoAtualizado = {
            ...novoEstado,
            pv_max: pvRecalculado
        };

        setCompanheiro(estadoAtualizado);
        setSalvando(true);

        const { id, quantidade_soldados: _q, ...dadosAtualizacao } = estadoAtualizado;
        const payload = {
            ...dadosAtualizacao,
            personagem_id: realFichaId,
            tipo_registro: 'companheiro'
        };

        if (id) {
            const { error } = await npcService.updateNpc(id, payload);

            if (error) {
                console.error("❌ [CompanheiroFiel] Erro ao atualizar:", error.message);
            }
        }
        setSalvando(false);
    };

    return (
        <div style={{ background: '#0d0f18', border: '1px solid #30363d', borderRadius: '8px', padding: '16px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: '#d4af37', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaPaw /> Companheiro Fiel (NP {nivelNP})
                </span>

                {companheiro && (
                    <button
                        type="button"
                        onClick={() => setEditando(!editando)}
                        style={{ background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <FaCog /> {editando ? 'Fechar Editor' : 'Configurar / Editar NPC'}
                    </button>
                )}
            </div>

            {!companheiro ? (
                <div style={{ textAlign: 'center', padding: '15px' }}>
                    <p style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '10px' }}>
                        Você possui a habilidade Companheiro Fiel, mas ainda não gerou a ficha do seu animal/construto.
                    </p>
                    <button
                        type="button"
                        onClick={criarCompanheiroNoBanco}
                        disabled={salvando}
                        style={{ background: '#238636', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <FaPlusCircle /> {salvando ? 'Criando...' : 'Criar Ficha do Companheiro Fiel'}
                    </button>
                </div>
            ) : editando ? (
                <div style={{ marginTop: '10px' }}>
                    <NPCEditor
                        npc={companheiro}
                        onUpdate={(novoEstado) => salvarNoBanco(novoEstado)}
                        catalogoPoderes={catalogoPoderes}
                        catalogoFeiticos={catalogoFeiticos}
                        isCompanheiro={true}  
                        nivelNP={nivelNP}     
                        nivelPersonagem={nivelPersonagem}
                    />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#c9d1d9' }}>
                    <div><strong>Nome:</strong> {companheiro.nome || 'Não definido'}</div>
                    <div><strong>Espécie:</strong> {companheiro.especie?.toUpperCase()} | <strong>PV Máx:</strong> {companheiro.pv_max}</div>
                    <div style={{ color: '#8b949e', fontStyle: 'italic', fontSize: '0.75rem', marginTop: '2px' }}>
                        Clique em "Configurar / Editar NPC" acima para abrir o motor completo de atributos, ataques e poderes do seu companheiro.
                    </div>
                </div>
            )}

            {salvando && <div style={{ fontSize: '0.65rem', color: '#3fb950', textAlign: 'right', marginTop: '6px' }}>A salvar alterações...</div>}
        </div>
    );
}