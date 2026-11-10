import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaSave, FaIdCard, FaSignInAlt } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import { supabase } from '../../services/supabase';

// Importação dos subcomponentes de visualização
import FichaHeader from './components/FichaHeader';
import FichaRecursos from './components/FichaRecursos';
import FichaAtributos from './components/FichaAtributos';
import FichaClassesSecao from './components/FichaClassesSecao';
import FichaEquipamentosSecao from './components/FichaEquipamentosSecao';
import FichaMagiasSecao from './components/FichaMagiasSecao';
import FichaLacosSecao from './components/FichaLacosSecao';
import FichaMochilaSecao from './components/FichaMochilaSecao';

import './FichaPage.css';

export default function FichaPage({ isMestre }) {
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const tokenAtual = localStorage.getItem('aetheria_jogador_token');
        // Se NÃO tem ID na URL E NÃO tem token salvo, aí sim redireciona para o login
        if (!id && !tokenAtual) {
            navigate('/ficha/login', { replace: true });
        }
    }, [id, navigate]);

    const [ficha, setFicha] = useState(null);
    const [classes, setClasses] = useState([]);
    const [magias, setMagias] = useState([]);

    const [editando, setEditando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');

    const [formData, setFormData] = useState({});
    const [formClasses, setFormClasses] = useState([]);
    const [formMagias, setFormMagias] = useState([]);
    const [formEquipamentos, setFormEquipamentos] = useState([]);

    const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        async function carregarDadosCompletos() {
            setCarregando(true);
            setErro('');

            try {
                const tokenAtual = localStorage.getItem('aetheria_jogador_token');
                let query = supabase.from('fichas_personagens').select('*');

                // Se tem ID na URL (ex: via QR Code ou rota do mestre), busca diretamente por ele
                if (id) {
                    query = query.eq('id', id).single();
                }
                // Se NÃO tem ID na URL, mas tem o token salvo, busca pelo token do jogador logado
                else if (tokenAtual) {
                    query = query.eq('jogador_token', tokenAtual).single();
                }
                // Caso contrário, redireciona para a tela dedicada de login/crachá
                else {
                    navigate('/ficha/login', { replace: true });
                    return;
                }

                const { data: fichaData, error: fichaError } = await query;

                if (fichaError || !fichaData) {
                    setErro('Ficha não encontrada ou ID inválido.');
                    return;
                }

                setFicha(fichaData);
                setFormData(fichaData);
                setFormEquipamentos(fichaData.equipamentos || []);

                const { data: classesData } = await supabase
                    .from('fichas_classes')
                    .select('*')
                    .eq('ficha_id', fichaData.id);

                setClasses(classesData || []);
                setFormClasses(classesData || []);

                const { data: magiasData } = await supabase
                    .from('fichas_magias')
                    .select('*')
                    .eq('ficha_id', fichaData.id);

                setMagias(magiasData || []);
                setFormMagias(magiasData || []);

            } catch (err) {
                console.error(err);
                setErro('Erro ao carregar dados do banco.');
            } finally {
                setCarregando(false);
            }
        }

        carregarDadosCompletos();
    }, [id, navigate]);

    const calcularNivelTotal = (classesArray) => {
        return classesArray.reduce((acc, curr) => acc + (parseInt(curr.nivel) || 0), 0);
    };

    const handleAjustarRecurso = async (campo, valor) => {
        if (!ficha) return;

        let maximo = 999;
        if (campo === 'hp_atual') maximo = ficha.hp_max || 999;
        if (campo === 'mp_atual') maximo = ficha.mp_max || 999;
        if (campo === 'ip_atual') maximo = ficha.ip_max || 999;

        const novoValor = Math.min(maximo, Math.max(0, (ficha[campo] || 0) + valor));
        const fichaAtualizada = { ...ficha, [campo]: novoValor };

        setFicha(fichaAtualizada);
        setFormData(fichaAtualizada);

        await supabase
            .from('fichas_personagens')
            .update({ [campo]: novoValor })
            .eq('id', ficha.id);
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
                    message: `A classe "${c.nome_classe || 'Sem Nome'}" tem habilidades somando nível ${somaHabs}, mas o nível da classe é ${c.nivel}! Ajuste os pontos.`
                });
                setSalvando(false);
                return;
            }
        }

        const nivelCalculado = calcularNivelTotal(formClasses);
        const dadosParaSalvar = {
            ...formData,
            nivel: nivelCalculado,
            equipamentos: formEquipamentos
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
            setAlerta({
                isOpen: true,
                title: 'Sucesso',
                message: 'Ficha atualizada com sucesso!'
            });
        } catch (err) {
            setAlerta({
                isOpen: true,
                title: 'Erro',
                message: `Erro ao salvar: ${err.message}`
            });
        } finally {
            setSalvando(false);
        }
    };

    const adicionarClasse = () => {
        const novas = [...formClasses, { nome_classe: '', nivel: 1, beneficios: '', habilidades: [] }];
        setFormClasses(novas);
        setFormData({ ...formData, nivel: calcularNivelTotal(novas) });
    };

    const removerClasse = (i) => {
        const novas = formClasses.filter((_, idx) => idx !== i);
        setFormClasses(novas);
        setFormData({ ...formData, nivel: calcularNivelTotal(novas) });
    };

    const adicionarHabilidade = (classeIndex) => {
        const novas = [...formClasses];
        if (!novas[classeIndex].habilidades) novas[classeIndex].habilidades = [];
        novas[classeIndex].habilidades.push({ nome: '', nivel: 1, descricao: '' });
        setFormClasses(novas);
    };

    const removerHabilidade = (classeIndex, habIndex) => {
        const novas = [...formClasses];
        novas[classeIndex].habilidades = novas[classeIndex].habilidades.filter((_, idx) => idx !== habIndex);
        setFormClasses(novas);
    };

    const adicionarMagia = () => setFormMagias([...formMagias, { nome: '', custo_mp: 5, alvos: '', duracao: 'Instantânea', descricao: '' }]);
    const removerMagia = (i) => setFormMagias(formMagias.filter((_, idx) => idx !== i));

    const adicionarEquipamento = () => setFormEquipamentos([...formEquipamentos, { nome: '', descricao: '' }]);
    const removerEquipamento = (i) => setFormEquipamentos(formEquipamentos.filter((_, idx) => idx !== i));

    const adicionarLaco = () => {
        const lacos = formData.lacos || [];
        if (lacos.length >= 6) {
            setAlerta({ isOpen: true, title: 'Limite', message: 'Máximo de 6 laços permitidos.' });
            return;
        }
        setFormData({ ...formData, lacos: [...lacos, { nome: '', emocoes: [] }] });
    };

    const removerLaco = (i) => {
        setFormData({ ...formData, lacos: (formData.lacos || []).filter((_, idx) => idx !== i) });
    };

    const toggleEmocaoLaco = (lacoIndex, emocao) => {
        const lacos = [...(formData.lacos || [])];
        let emocoesAtuais = lacos[lacoIndex].emocoes || [];

        const pares = {
            'Adoração': 'Inferioridade', 'Inferioridade': 'Adoração',
            'Lealdade': 'Desconfiança', 'Desconfiança': 'Lealdade',
            'Afeto': 'Ódio', 'Ódio': 'Afeto'
        };
        const oposta = pares[emocao];

        if (emocoesAtuais.includes(emocao)) {
            emocoesAtuais = emocoesAtuais.filter(e => e !== emocao);
        } else {
            emocoesAtuais = emocoesAtuais.filter(e => e !== oposta);
            emocoesAtuais.push(emocao);
        }
        lacos[lacoIndex].emocoes = emocoesAtuais;
        setFormData({ ...formData, lacos });
    };

    // Se estiver carregando, mostra o loader fluidamente
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
                    <button
                        className="btn-salvar-ficha"
                        onClick={() => navigate('/ficha/login')}
                    >
                        <FaSignInAlt /> Identificar-se no Sistema
                    </button>
                </div>
            </div>
        );
    }

    const rituaisDisponiveis = ['Arcanismo', 'Quimerismo', 'Elementalismo', 'Entropismo', 'Ritualismo', 'Espiritualismo'];
    const listaEmocoes = ['Adoração', 'Inferioridade', 'Lealdade', 'Desconfiança', 'Afeto', 'Ódio'];

    return (
        <div className="ficha-page-container">
            <FichaHeader
                ficha={ficha}
                id={id}
                isMestre={isMestre}
                editando={editando}
                setEditando={setEditando}
                formData={formData}
                formClasses={formClasses}
                calcularNivelTotal={calcularNivelTotal}
                setFormData={setFormData}
                setFormClasses={setFormClasses}
                setFormMagias={setFormMagias}
                setFormEquipamentos={setFormEquipamentos}
                classes={classes}
                magias={magias}
            />

            {editando ? (
                <form onSubmit={handleSalvarEdicao} className="ficha-form-edit">
                    {/* Informações Básicas */}
                    <div className="form-section-box">
                        <h3>Informações Básicas</h3>
                        <div className="form-grid-2">
                            <div className="form-group"><label>Personagem</label><input type="text" value={formData.nome_personagem || ''} onChange={(e) => setFormData({ ...formData, nome_personagem: e.target.value })} /></div>
                            <div className="form-group"><label>Jogador</label><input type="text" value={formData.nome_jogador || ''} onChange={(e) => setFormData({ ...formData, nome_jogador: e.target.value })} /></div>
                        </div>
                        <div className="form-grid-4" style={{ marginTop: '10px' }}>
                            <div className="form-group"><label>Identidade</label><input type="text" value={formData.identidade || ''} onChange={(e) => setFormData({ ...formData, identidade: e.target.value })} /></div>
                            <div className="form-group"><label>Tema</label><input type="text" value={formData.tema || ''} onChange={(e) => setFormData({ ...formData, tema: e.target.value })} /></div>
                            <div className="form-group"><label>Zênites (z)</label><input type="number" value={formData.zenit || 0} onChange={(e) => setFormData({ ...formData, zenit: parseInt(e.target.value) || 0 })} /></div>
                            <div className="form-group">
                                <label>Pontos de Fábula</label>
                                <input type="number" min="0" value={formData.fabula || 3} onChange={(e) => setFormData({ ...formData, fabula: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>
                        <div className="form-grid-2" style={{ marginTop: '10px' }}>
                            <div className="form-group">
                                <label>Experiência (EXP - Máx 10)</label>
                                <input type="number" min="0" max="10" value={formData.exp || 0} onChange={(e) => {
                                    let val = parseInt(e.target.value) || 0;
                                    if (val > 10) val = 10; if (val < 0) val = 0;
                                    setFormData({ ...formData, exp: val });
                                }} />
                            </div>
                            <div className="form-group">
                                <label>URL do Avatar / Imagem</label>
                                <input type="text" placeholder="https://..." value={formData.avatar_url || ''} onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* PECULARIDADE */}
                    <div className="form-section-box">
                        <h3><LuSparkles /> Peculiaridade (Regra Suplementar)</h3>
                        <div className="form-group">
                            <label>Nome da Peculiaridade</label>
                            <input
                                type="text"
                                placeholder="Ex: Linhagem Celestial, Alma de Aço..."
                                value={formData.titulo_pecularidade || ''}
                                onChange={(e) => setFormData({ ...formData, titulo_pecularidade: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ marginTop: '10px' }}>
                            <label>Descrição</label>
                            <textarea
                                rows="3"
                                placeholder="Descreva os efeitos e detalhes desta peculiaridade..."
                                value={formData.descricao_pecularidade || ''}
                                onChange={(e) => setFormData({ ...formData, descricao_pecularidade: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Atributos e Limites */}
                    <div className="form-section-box">
                        <h3>Atributos, Limites de Recursos e Combate</h3>
                        <div className="form-grid-4">
                            <div className="form-group"><label>DES (d)</label><input type="number" value={formData.destreza || 8} onChange={(e) => setFormData({ ...formData, destreza: parseInt(e.target.value) || 8 })} /></div>
                            <div className="form-group"><label>INS (d)</label><input type="number" value={formData.intuicao || 8} onChange={(e) => setFormData({ ...formData, intuicao: parseInt(e.target.value) || 8 })} /></div>
                            <div className="form-group"><label>VIG (d)</label><input type="number" value={formData.vigor || 8} onChange={(e) => setFormData({ ...formData, vigor: parseInt(e.target.value) || 8 })} /></div>
                            <div className="form-group"><label>VON (d)</label><input type="number" value={formData.vontade || 8} onChange={(e) => setFormData({ ...formData, vontade: parseInt(e.target.value) || 8 })} /></div>
                        </div>
                        <div className="form-grid-3" style={{ marginTop: '10px' }}>
                            <div className="form-group"><label>HP Máximo</label><input type="number" value={formData.hp_max || 40} onChange={(e) => setFormData({ ...formData, hp_max: parseInt(e.target.value) || 1 })} /></div>
                            <div className="form-group"><label>MP Máximo</label><input type="number" value={formData.mp_max || 40} onChange={(e) => setFormData({ ...formData, mp_max: parseInt(e.target.value) || 0 })} /></div>
                            <div className="form-group"><label>IP Máximo</label><input type="number" value={formData.ip_max || 6} onChange={(e) => setFormData({ ...formData, ip_max: parseInt(e.target.value) || 0 })} /></div>
                        </div>
                        <div className="form-grid-4" style={{ marginTop: '10px' }}>
                            <div className="form-group"><label>Iniciativa</label><input type="number" value={formData.iniciativa || 0} onChange={(e) => setFormData({ ...formData, iniciativa: parseInt(e.target.value) || 0 })} /></div>
                            <div className="form-group"><label>Defesa</label><input type="number" value={formData.defesa || 10} onChange={(e) => setFormData({ ...formData, defesa: parseInt(e.target.value) || 10 })} /></div>
                            <div className="form-group"><label>M. Defesa</label><input type="number" value={formData.mdef || 10} onChange={(e) => setFormData({ ...formData, mdef: parseInt(e.target.value) || 10 })} /></div>
                            <div className="form-group"><label>Nível Total</label><div style={{ padding: '10px', background: '#0d0f18', border: '1px solid #30363d', borderRadius: '6px', color: '#d4af37', fontWeight: 'bold' }}>Nv. {calcularNivelTotal(formClasses)}</div></div>
                        </div>
                    </div>

                    {/* Equipamento Permitido */}
                    <div className="form-section-box">
                        <h3>Tipos de Equipamento Permitidos (Marciais)</h3>
                        <div className="checkbox-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <label><input type="checkbox" checked={!!formData.pode_armadura_marcial} onChange={(e) => setFormData({ ...formData, pode_armadura_marcial: e.target.checked })} /> Armadura Marcial</label>
                            <label><input type="checkbox" checked={!!formData.pode_escudo_marcial} onChange={(e) => setFormData({ ...formData, pode_escudo_marcial: e.target.checked })} /> Escudo Marcial</label>
                            <label><input type="checkbox" checked={!!formData.pode_arma_corpo_marcial} onChange={(e) => setFormData({ ...formData, pode_arma_corpo_marcial: e.target.checked })} /> Arma Corpo-a-Corpo Marcial</label>
                            <label><input type="checkbox" checked={!!formData.pode_arma_distancia_marcial} onChange={(e) => setFormData({ ...formData, pode_arma_distancia_marcial: e.target.checked })} /> Arma à Distância Marcial</label>
                        </div>
                    </div>

                    {/* Rituais */}
                    <div className="form-section-box">
                        <h3>Rituais que Pode Realizar</h3>
                        <div className="checkbox-grid grid_mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {rituaisDisponiveis.map(rit => {
                                const rituaisAtuais = formData.rituais || [];
                                const marcado = rituaisAtuais.includes(rit);
                                return (
                                    <label key={rit}>
                                        <input type="checkbox" checked={marcado} onChange={(e) => {
                                            const novos = e.target.checked ? [...rituaisAtuais, rit] : rituaisAtuais.filter(r => r !== rit);
                                            setFormData({ ...formData, rituais: novos });
                                        }} /> {rit}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* CLASSES E HABILIDADES (Formulário) */}
                    <div className="form-section-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Classes e Habilidades</h3>
                            <button type="button" className="btn-secundario" onClick={adicionarClasse}><FaPlus /> Adicionar Classe</button>
                        </div>
                        {formClasses.map((c, index) => {
                            const somaHabs = (c.habilidades || []).reduce((acc, h) => acc + (parseInt(h.nivel) || 0), 0);
                            const nivelClasse = parseInt(c.nivel) || 0;
                            return (
                                <div key={index} style={{ border: '1px solid #30363d', padding: '12px', marginTop: '14px', borderRadius: '6px', background: '#0d0f18' }}>
                                    <div className="form-grid-3" style={{ marginBottom: '8px' }}>
                                        <input type="text" placeholder="Nome da Classe" value={c.nome_classe} onChange={(e) => {
                                            const atual = [...formClasses]; atual[index].nome_classe = e.target.value; setFormClasses(atual);
                                        }} />
                                        <input type="number" min="1" max="10" placeholder="Nível da Classe" value={c.nivel} onChange={(e) => {
                                            let val = parseInt(e.target.value) || 1;
                                            if (val > 10) val = 10; if (val < 1) val = 1;
                                            const atual = [...formClasses]; atual[index].nivel = val;
                                            setFormClasses(atual);
                                            setFormData({ ...formData, nivel: calcularNivelTotal(atual) });
                                        }} />
                                        <button type="button" className="btn-del" onClick={() => removerClasse(index)}><FaTrash /> Remover Classe</button>
                                    </div>
                                    <input type="text" placeholder="Benefícios iniciais" value={c.beneficios || ''} onChange={(e) => {
                                        const atual = [...formClasses]; atual[index].beneficios = e.target.value; setFormClasses(atual);
                                    }} style={{ marginBottom: '10px' }} />

                                    <div style={{ borderTop: '1px solid #30363d', paddingTop: '8px', marginTop: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '0.85rem', color: somaHabs > nivelClasse ? '#f85149' : '#d4af37', fontWeight: 'bold' }}>
                                                Habilidades (Soma Níveis: {somaHabs} / {nivelClasse})
                                            </span>
                                            <button type="button" className="btn-secundario" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => adicionarHabilidade(index)}>
                                                <FaPlus /> Adicionar Habilidade
                                            </button>
                                        </div>

                                        {(c.habilidades || []).map((h, hIndex) => (
                                            <div key={hIndex} style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center', background: '#161b22', padding: '8px', borderRadius: '4px' }}>
                                                <input type="text" placeholder="Nome da Habilidade" value={h.nome} onChange={(e) => {
                                                    const atual = [...formClasses];
                                                    atual[index].habilidades[hIndex].nome = e.target.value;
                                                    setFormClasses(atual);
                                                }} style={{ flex: 2 }} />
                                                <input type="number" min="1" max="10" placeholder="Nv" value={h.nivel} onChange={(e) => {
                                                    let val = parseInt(e.target.value) || 1;
                                                    if (val > 10) val = 10; if (val < 1) val = 1;
                                                    const atual = [...formClasses];
                                                    atual[index].habilidades[hIndex].nivel = val;
                                                    setFormClasses(atual);
                                                }} style={{ flex: 0.5 }} />
                                                <input type="text" placeholder="Descrição" value={h.descricao} onChange={(e) => {
                                                    const atual = [...formClasses];
                                                    atual[index].habilidades[hIndex].descricao = e.target.value;
                                                    setFormClasses(atual);
                                                }} style={{ flex: 3 }} />
                                                <button type="button" className="btn-del" style={{ padding: '6px' }} onClick={() => removerHabilidade(index, hIndex)}><FaTrash /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Equipamentos (Formulário) */}
                    <div className="form-section-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Equipamentos</h3>
                            <button type="button" className="btn-secundario" onClick={adicionarEquipamento}><FaPlus /> Adicionar Equipamento</button>
                        </div>
                        {formEquipamentos.map((eq, index) => (
                            <div key={index} style={{ border: '1px solid #30363d', padding: '10px', marginTop: '10px', borderRadius: '6px' }}>
                                <div className="form-grid-2" style={{ marginBottom: '8px' }}>
                                    <input type="text" placeholder="Nome do Equipamento" value={eq.nome} onChange={(e) => {
                                        const atual = [...formEquipamentos]; atual[index].nome = e.target.value; setFormEquipamentos(atual);
                                    }} />
                                    <button type="button" className="btn-del" onClick={() => removerEquipamento(index)}><FaTrash /> Remover</button>
                                </div>
                                <textarea rows="2" placeholder="Descrição..." value={eq.descricao || ''} onChange={(e) => {
                                    const atual = [...formEquipamentos]; atual[index].descricao = e.target.value; setFormEquipamentos(atual);
                                }} />
                            </div>
                        ))}
                    </div>

                    {/* Magias (Formulário) */}
                    <div className="form-section-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Magias / Arcanas</h3>
                            <button type="button" className="btn-secundario" onClick={adicionarMagia}><FaPlus /> Adicionar Magia</button>
                        </div>
                        {formMagias.map((m, index) => (
                            <div key={index} style={{ border: '1px solid #30363d', padding: '10px', marginTop: '10px', borderRadius: '6px' }}>
                                <div className="form-grid-4" style={{ marginBottom: '8px' }}>
                                    <input type="text" placeholder="Nome da Magia" value={m.nome} onChange={(e) => {
                                        const atual = [...formMagias]; atual[index].nome = e.target.value; setFormMagias(atual);
                                    }} />
                                    <input type="number" placeholder="Custo MP" value={m.custo_mp} onChange={(e) => {
                                        const atual = [...formMagias]; atual[index].custo_mp = parseInt(e.target.value) || 0; setFormMagias(atual);
                                    }} />
                                    <input type="text" placeholder="Alvos" value={m.alvos || ''} onChange={(e) => {
                                        const atual = [...formMagias]; atual[index].alvos = e.target.value; setFormMagias(atual);
                                    }} />
                                    <button type="button" className="btn-del" onClick={() => removerMagia(index)}><FaTrash /> Remover</button>
                                </div>
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                    <input type="text" placeholder="Duração" value={m.duracao || ''} onChange={(e) => {
                                        const atual = [...formMagias]; atual[index].duracao = e.target.value; setFormMagias(atual);
                                    }} />
                                </div>
                                <textarea rows="2" placeholder="Descrição..." value={m.descricao || ''} onChange={(e) => {
                                    const atual = [...formMagias]; atual[index].descricao = e.target.value; setFormMagias(atual);
                                }} />
                            </div>
                        ))}
                    </div>

                    {/* Laços (Formulário) */}
                    <div className="form-section-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Laços ({(formData.lacos || []).length} / 6)</h3>
                            <button type="button" className="btn-secundario" onClick={adicionarLaco}><FaPlus /> Adicionar Laço</button>
                        </div>
                        {(formData.lacos || []).map((l, index) => {
                            const emocoes = l.emocoes || [];
                            const forca = emocoes.length;
                            return (
                                <div key={index} style={{ border: '1px solid #30363d', padding: '12px', marginTop: '10px', borderRadius: '6px', background: '#0d0f18' }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                        <input type="text" placeholder="Nome do Vínculo" value={l.nome} onChange={(e) => {
                                            const novos = [...formData.lacos]; novos[index].nome = e.target.value; setFormData({ ...formData, lacos: novos });
                                        }} style={{ flex: 1 }} />
                                        <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Força: {forca}</span>
                                        <button type="button" className="btn-del" onClick={() => removerLaco(index)}><FaTrash /></button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                        {listaEmocoes.map(emocao => {
                                            const marcado = emocoes.includes(emocao);
                                            return (
                                                <button
                                                    key={emocao}
                                                    type="button"
                                                    onClick={() => toggleEmocaoLaco(index, emocao)}
                                                    style={{
                                                        background: marcado ? 'rgba(212, 175, 55, 0.2)' : '#161b22',
                                                        color: marcado ? '#d4af37' : '#c9d1d9',
                                                        border: `1px solid ${marcado ? '#d4af37' : '#30363d'}`,
                                                        padding: '6px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: marcado ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    {emocao} {marcado && '✓'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mochila e Notas */}
                    <div className="form-section-box">
                        <h3>Mochila & Notas</h3>
                        <div className="form-group"><label>Mochila</label><textarea rows="3" value={formData.mochila || ''} onChange={(e) => setFormData({ ...formData, mochila: e.target.value })} /></div>
                        <div className="form-group"><label>Notas</label><textarea rows="3" value={formData.notas || ''} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} /></div>
                    </div>

                    <button type="submit" className="btn-salvar-ficha" disabled={salvando}>
                        <FaSave /> {salvando ? 'Salvando...' : 'Salvar Alterações da Ficha'}
                    </button>
                </form>
            ) : (
                /* ================= VISUALIZAÇÃO COM OS COMPONENTES ================= */
                <div className="ficha-view-content">
                    <FichaRecursos ficha={ficha} handleAjustarRecurso={handleAjustarRecurso} />
                    <FichaAtributos ficha={ficha} />
                    <FichaClassesSecao classes={classes} />
                    <FichaEquipamentosSecao equipamentos={ficha?.equipamentos} />
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