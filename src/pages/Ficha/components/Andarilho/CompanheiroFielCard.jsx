import { useState, useEffect } from 'react';
import { FaPaw, FaCog, FaPlusCircle } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../services/supabase';
import NPCEditor from '../../../Mestre/NPC/components/NPCEditor';

// Helper para converter string de dado ('d8') em valor numérico (8)
const extrairValorDado = (dadoStr) => {
    if (!dadoStr) return 8;
    const num = parseInt(String(dadoStr).replace(/\D/g, ''), 10);
    return isNaN(num) ? 8 : num;
};

// Fórmula oficial de Fabula Ultima para PV do Companheiro Fiel
const calcularPvMaximo = (nivelNP, dadoVigor, nivelPersonagem) => {
    const valorVigor = extrairValorDado(dadoVigor);
    return (nivelNP * valorVigor) + Math.floor(nivelPersonagem / 2);
};

export default function CompanheiroFielCard({ fichaId, classes = [] }) {
    const { id: idUrl } = useParams();
    const realFichaId = fichaId || idUrl;

    const [companheiro, setCompanheiro] = useState(null);
    const [editando, setEditando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [catalogoPoderes, setCatalogoPoderes] = useState([]);
    const [catalogoFeiticos, setCatalogoFeiticos] = useState([]);

    const nivelNP = classes.reduce((max, c) => {
        const hab = (c.habilidades || []).find(h => (h.nome || '').toLowerCase().includes('companheiro fiel'));
        return hab ? Math.max(max, parseInt(hab.nivel) || 0) : max;
    }, 0);

    const nivelPersonagem = classes.reduce((acc, c) => acc + (parseInt(c.nivel) || 1), 0);

    useEffect(() => {
        let active = true;

        async function carregarDados() {
            if (!realFichaId || nivelNP <= 0) return;

            const { data: compData, error: errComp } = await supabase
                .from('npcs_mestre')
                .select('*')
                .eq('personagem_id', realFichaId)
                .eq('tipo_registro', 'companheiro')
                .maybeSingle();

            if (errComp) {
                console.error("❌ [CompanheiroFiel] Erro ao buscar:", errComp.message);
            }

            const { data: poderesData } = await supabase.from('catalogo_poderes_npc').select('*');
            const { data: feiticosData } = await supabase.from('catalogo_feiticos').select('*');

            if (!active) return;

            if (poderesData) setCatalogoPoderes(poderesData);
            if (feiticosData) setCatalogoFeiticos(feiticosData);

            if (compData) {
                const pvCalculado = calcularPvMaximo(nivelNP, compData.atributos?.vig, nivelPersonagem);
                if (compData.pv_max !== pvCalculado) {
                    const compSincronizado = { ...compData, pv_max: pvCalculado };
                    setCompanheiro(compSincronizado);
                    const { id, ...resto } = compSincronizado;
                    await supabase.from('npcs_mestre').update(resto).eq('id', id);
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
        const { data: userData } = await supabase.auth.getUser();
        const pvInicial = calcularPvMaximo(nivelNP, 'd8', nivelPersonagem);

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

        const { data, error } = await supabase
            .from('npcs_mestre')
            .insert([novoMolde])
            .select()
            .single();

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
        const pvRecalculado = calcularPvMaximo(nivelNP, novoEstado.atributos?.vig, nivelPersonagem);
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
            const { error } = await supabase
                .from('npcs_mestre')
                .update(payload)
                .eq('id', id);

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