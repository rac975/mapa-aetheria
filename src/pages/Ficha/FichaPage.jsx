import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaIdCard, FaSignInAlt } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import { supabase } from '../../services/supabase';
import { useFichaData } from '../../hooks/useFichaData';
import { calcularStatusPersonagem } from '../../utils/calculosFicha';

// Importação das subcomponentes de visualização
import FichaHeader from './secoes/FichaHeader';
import FichaRecursos from './secoes/FichaRecursosSecao';
import FichaAtributos from './secoes/FichaAtributosSecao';
import FichaClassesSecao from './secoes/FichaClassesSecao';
import FichaEquipamentosSecao from './secoes/FichaEquipamentosSecao';
import FichaMagiasSecao from './secoes/FichaMagiasSecao';
import FichaLacosSecao from './secoes/FichaLacosSecao';
import FichaMochilaSecao from './secoes/FichaMochilaSecao';
import FichaEstatisticasSecao from './secoes/FichaEstatisticasSecao';
import FichaPericiasSecao from './secoes/FichaPericiaSecao';
import FichaPIComponent from './components/FichaPIComponent';

// Importação dos subcomponentes de formulário (Edição)
import FichaFormGeral from './forms/FichaFormGeral';
import FichaFormPeculiaridade from './forms/FichaFormPeculiaridades';
import FichaFormAtributos from './forms/FichaFormAtributos';
import FichaFormRituais from './forms/FichaFormRituais';
import FichaFormClasses from './forms/FichaFormClasses';
import FichaFormMagias from './forms/FichaFormMagias';
import FichaFormLacos from './forms/FichaFormLacos';
import FichaFormMochila from './forms/FichaFormMochila';

import './FichaPage.css';

export default function FichaPage({ isMestre, setFichaGlobal }) {
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const tokenAtual = localStorage.getItem('aetheria_jogador_token');
        if (!id && !tokenAtual) {
            navigate('/ficha/login', { replace: true });
        }
    }, [id, navigate]);

    const {
        ficha, setFicha, classes, setClasses, magias, setMagias, carregando, erro
    } = useFichaData(id, navigate);

    const [editando, setEditando] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const [formData, setFormData] = useState({});
    const [formClasses, setFormClasses] = useState([]);
    const [formMagias, setFormMagias] = useState([]);
    const [modificadoresTemporarios, setModificadoresTemporarios] = useState({});
    const [condicoesAtivas, setCondicoesAtivasState] = useState([]);
    const [itensEquipadosParaCalculo, setItensEquipadosParaCalculoState] = useState([]);

    const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });

    const progressaoDados = [6, 8, 10, 12, 20];

    const getAtributoAtualValor = (nomeAtributo, valorBase) => {
        const mod = modificadoresTemporarios[nomeAtributo] || 0;
        const idxBase = progressaoDados.indexOf(valorBase || 8);
        const idxFinal = Math.max(0, Math.min(progressaoDados.length - 1, idxBase + mod));
        return progressaoDados[idxFinal];
    };

    const atributosAtuaisParaCalculo = {
        destreza: getAtributoAtualValor('destreza', ficha?.destreza),
        astucia: getAtributoAtualValor('astucia', ficha?.astucia),
        vigor: ficha?.vigor || 8,
        vontade: ficha?.vontade || 8
    };

    // Sincronizações globais
    useEffect(() => {
        if (ficha && setFichaGlobal) setFichaGlobal(ficha);
    }, [ficha, setFichaGlobal]);

    useEffect(() => {
        if (ficha && !editando) {
            setFormData(ficha);
            setFormClasses(classes);
            setFormMagias(magias);
        }
    }, [ficha, classes, magias, editando]);

    // WebSocket de condições de combate
    useEffect(() => {
        if (!ficha?.id) return;

        const calcularModificadores = (condicoes) => {
            let mods = {};
            if (condicoes.includes('abalado')) mods.vontade = (mods.vontade || 0) - 1;
            if (condicoes.includes('atordoado')) mods.astucia = (mods.astucia || 0) - 1;
            if (condicoes.includes('enfurecido')) {
                mods.destreza = (mods.destreza || 0) - 1;
                mods.astucia = (mods.astucia || 0) - 1;
            }
            if (condicoes.includes('envenenado')) {
                mods.vigor = (mods.vigor || 0) - 1;
                mods.vontade = (mods.vontade || 0) - 1;
            }
            if (condicoes.includes('fraco')) {
                mods.destreza = (mods.destreza || 0) - 1;
                mods.astucia = (mods.astucia || 0) - 1;
                mods.vigor = (mods.vigor || 0) - 1;
                mods.vontade = (mods.vontade || 0) - 1;
            }
            if (condicoes.includes('lento')) mods.destreza = (mods.destreza || 0) - 1;
            return mods;
        };

        async function verificarCondicoesDeCombate() {
            const { data, error } = await supabase
                .from('iniciativa_combate')
                .select('condicoes')
                .eq('ficha_id', ficha.id)
                .maybeSingle();

            if (error) {
                console.error("Erro ao buscar condições de combate:", error.message);
                return;
            }

            if (data && data.condicoes && data.condicoes.length > 0) {
                setCondicoesAtivasState(data.condicoes);
                setModificadoresTemporarios(calcularModificadores(data.condicoes));
            } else {
                setCondicoesAtivasState([]);
                setModificadoresTemporarios({});
            }
        }

        verificarCondicoesDeCombate();

        const channel = supabase
            .channel(`ficha_condicoes_${ficha?.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'iniciativa_combate', filter: `ficha_id=eq.${ficha?.id}` },
                (payload) => {
                    if (payload.new && payload.new.condicoes) {
                        const novasCondicoes = payload.new.condicoes;
                        setCondicoesAtivasState(novasCondicoes);
                        setModificadoresTemporarios(calcularModificadores(novasCondicoes));
                    } else {
                        setCondicoesAtivasState([]);
                        setModificadoresTemporarios({});
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [ficha?.id]);

    // Equipamentos para cálculo
    useEffect(() => {
        if (!ficha?.id) return;

        async function carregarEquipamentosParaCalculo() {
            const { data } = await supabase
                .from('itens_personagem')
                .select('*')
                .eq('ficha_id', ficha.id);
            if (data) {
                setItensEquipadosParaCalculoState(data.filter(i => i.stats_personalizados?.slot));
            }
        }
        carregarEquipamentosParaCalculo();

        const channelEquip = supabase
            .channel(`realtime_calculo_equip_${ficha.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'itens_personagem', filter: `ficha_id=eq.${ficha.id}` },
                () => {
                    carregarEquipamentosParaCalculo();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channelEquip);
        };
    }, [ficha?.id]);

    const statusFicha = calcularStatusPersonagem(
        atributosAtuaisParaCalculo,
        editando ? formClasses : classes,
        itensEquipadosParaCalculo
    );

    const calcularNivelTotal = (classesArray) => {
        return classesArray.reduce((acc, curr) => acc + (parseInt(curr.nivel) || 0), 0);
    };

    const handleAjustarRecurso = async (campo, valor) => {
        if (!ficha) return;
        let maximo = 999;
        if (campo === 'hp_atual') maximo = ficha.hp_max || 999;
        if (campo === 'mp_atual') maximo = ficha.mp_max || 999;
        if (campo === 'ip_atual') maximo = ficha.pi_max || 999;

        const novoValor = Math.min(maximo, Math.max(0, (ficha[campo] || 0) + valor));
        const fichaAtualizada = { ...ficha, [campo]: novoValor };

        setFicha(fichaAtualizada);
        setFormData(fichaAtualizada);

        await supabase.from('fichas_personagens').update({ [campo]: novoValor }).eq('id', ficha.id);
    };

    const handleSalvarEdicao = async (e) => {
        e.preventDefault();
        setSalvando(true);

        for (const c of formClasses) {
            const somaHabs = (c.habilidades || []).reduce((acc, h) => acc + (parseInt(h.nivel) || 0), 0);
            if (somaHabs > (parseInt(c.nivel) || 0)) {
                setAlerta({
                    isOpen: true,
                    title: 'Atenção',
                    message: `A classe "${c.nome_classe || 'Sem Nome'}" tem habilidades somando nível ${somaHabs}, mas o nível da classe é ${c.nivel}!`
                });
                setSalvando(false);
                return;
            }
        }

        const nivelCalculado = calcularNivelTotal(formClasses);
        const dadosParaSalvar = {
            ...formData,
            nivel: nivelCalculado
        };

        try {
            const { error: erroFicha } = await supabase
                .from('fichas_personagens')
                .update(dadosParaSalvar)
                .eq('id', ficha.id);

            if (erroFicha) throw erroFicha;

            await supabase.from('fichas_classes').delete().eq('ficha_id', ficha.id);
            if (formClasses.length > 0) {
                const classesParaInserir = formClasses.map(c => ({
                    ficha_id: ficha.id,
                    nome_classe: c.nome_classe,
                    nivel: c.nivel,
                    beneficios: c.beneficios,
                    habilidades: c.habilidades || []
                }));
                await supabase.from('fichas_classes').insert(classesParaInserir);
            }

            await supabase.from('fichas_magias').delete().eq('ficha_id', ficha.id);
            if (formMagias.length > 0) {
                const magiasParaInserir = formMagias.map(m => ({
                    ficha_id: ficha.id,
                    nome: m.nome,
                    custo_mp: m.custo_mp,
                    alvos: m.alvos,
                    duracao: m.duracao,
                    descricao: m.descricao
                }));
                await supabase.from('fichas_magias').insert(magiasParaInserir);
            }

            setFicha(dadosParaSalvar);
            setClasses(formClasses);
            setMagias(formMagias);
            setEditando(false);
            setAlerta({ isOpen: true, title: 'Sucesso', message: 'Ficha atualizada com sucesso!' });
        } catch (err) {
            setAlerta({ isOpen: true, title: 'Erro', message: `Erro ao salvar: ${err.message}` });
        } finally {
            setSalvando(false);
        }
    };

    if (carregando) {
        return (
            <div className="ficha-page-container flex-center">
                <div className="loader-box">
                    <LuSparkles className="icon-spin" />
                    <p>Lendo dados do herói...</p>
                </div>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="ficha-page-container flex-center">
                <div className="badge-warning-card" style={{ textAlign: 'center', padding: '30px' }}>
                    <FaIdCard className="icon-warning" style={{ fontSize: '3rem', color: '#d4af37' }} />
                    <h2>Acesso Não Identificado</h2>
                    <p style={{ color: '#8b949e', margin: '10px 0 20px 0' }}>{erro}</p>
                    <button className="btn-salvar-ficha" onClick={() => navigate('/ficha/login')}>
                        <FaSignInAlt /> Identificar-se no Sistema
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ficha-page-container">
            <FichaHeader
                ficha={ficha}
                id={id}
                isMestre={isMestre}
                editando={editando}
                nivelAtual={statusFicha.nivelTotal}
                condicoesAtivas={condicoesAtivas}
                statusCalculados={statusFicha}
                onToggleEdit={() => {
                    if (!editando) {
                        setFormData(ficha);
                        setFormClasses(classes);
                        setFormMagias(magias);
                    }
                    setEditando(!editando);
                }}
            />

            {editando ? (
                <form onSubmit={handleSalvarEdicao} className="ficha-form-edit">
                    <FichaFormGeral formData={formData} setFormData={setFormData} />
                    <FichaFormPeculiaridade formData={formData} setFormData={setFormData} />
                    <FichaFormAtributos formData={formData} setFormData={setFormData} />
                    <FichaFormRituais formData={formData} setFormData={setFormData} />
                    <FichaFormClasses formClasses={formClasses} setFormClasses={setFormClasses} formData={formData} setFormData={setFormData} calcularNivelTotal={calcularNivelTotal} />
                    <FichaFormMagias formMagias={formMagias} setFormMagias={setFormMagias} />
                    <FichaFormLacos formData={formData} setFormData={setFormData} setAlerta={setAlerta} />
                    <FichaFormMochila formData={formData} setFormData={setFormData} />

                    <button type="submit" className="btn-salvar-ficha" disabled={salvando}>
                        <FaSave /> {salvando ? 'Salvando...' : 'Salvar Alterações da Ficha'}
                    </button>
                </form>
            ) : (
                <div className="ficha-view-content">
                    <FichaRecursos ficha={ficha} statusFicha={statusFicha} handleAjustarRecurso={handleAjustarRecurso} />
                    <FichaPericiasSecao atributos={atributosAtuaisParaCalculo} />
                    <FichaEstatisticasSecao statusFicha={statusFicha} />
                    <FichaPIComponent ficha={ficha} setFicha={setFicha} />
                    <FichaAtributos
                        ficha={ficha}
                        modificadoresTemporarios={modificadoresTemporarios}
                        setModificadoresTemporarios={setModificadoresTemporarios}
                        onRolarDado={(sigla, valor) => {
                            setAlerta({ isOpen: true, title: `Atributo ${sigla}`, message: `Rolando dado d${valor}...` });
                        }}
                    />
                    <FichaClassesSecao classes={classes} />
                    <FichaEquipamentosSecao
                        fichaId={ficha?.id}
                        atributosAtuais={atributosAtuaisParaCalculo}
                    />
                    <FichaMagiasSecao magias={magias} />
                    <FichaLacosSecao lacos={ficha?.lacos} />
                    <FichaMochilaSecao mochila={ficha?.mochila} notas={ficha?.notas} />
                </div>
            )}

            <CustomAlert
                isOpen={alerta.isOpen}
                title={alerta.title}
                message={alerta.message}
                onClose={() => setAlerta({ ...alerta, isOpen: false })}
            />
        </div>
    );
}