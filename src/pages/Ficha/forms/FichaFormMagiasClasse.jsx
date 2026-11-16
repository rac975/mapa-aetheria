import { useState, useEffect } from 'react';
import { FaTrash, FaMagic } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';

export default function FichaFormMagiasClasse({ classeObjeto, indexClasse, formClasses, setFormClasses }) {
    const [catalogoMagias, setCatalogoMagias] = useState([]);
    const [carregando, setCarregando] = useState(false);

    const nomeClasse = classeObjeto.nome_classe || '';

    // 1. Carrega do banco o catálogo de feitiços desta classe específica
    useEffect(() => {
        let active = true;
        async function carregarCatalogoMagias() {
            setCarregando(true);
            const { data, error } = await supabase
                .from('catalogo_feiticos')
                .select('*')
                .ilike('classe', nomeClasse);

            if (!active) return;
            if (!error && data) {
                setCatalogoMagias(data);
            } else {
                console.error("Erro ao carregar catálogo de feitiços:", error);
            }
            setCarregando(false);
        }

        if (nomeClasse) {
            carregarCatalogoMagias();
        }
        return () => { active = false; };
    }, [nomeClasse]);

    // 2. Descobre o nível da habilidade de magia da classe (Ex: "Magia Elemental", "Magia Espiritual", etc.)
    const habMagia = (classeObjeto.habilidades || []).find(h => {
        const nomeH = (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return nomeH.includes('magia elemental') || 
               nomeH.includes('magia espiritual') || 
               nomeH.includes('magia entropica') || 
               nomeH.includes('magia arcanista');
    });

    const nivelHabilidadeMagia = parseInt(habMagia?.nivel) || 0;
    
    // Regra ajustada: 1 magia por nível da habilidade de magia
    const limiteMagias = nivelHabilidadeMagia; 
    const magiasAtuais = classeObjeto.magias || [];

    const adicionarMagiaDoCatalogo = (e) => {
        const idMagiaSelecionada = e.target.value;
        if (!idMagiaSelecionada) return;

        if (magiasAtuais.length >= limiteMagias) {
            alert(`⛔ Limite atingido! Sua habilidade de magia está no nível ${nivelHabilidadeMagia}, permitindo no máximo ${limiteMagias} ${limiteMagias === 1 ? 'magia' : 'magias'}. Aumente o nível da habilidade para aprender mais.`);
            e.target.value = "";
            return;
        }

        const magiaOficial = catalogoMagias.find(m => String(m.id) === String(idMagiaSelecionada));
        if (!magiaOficial) return;

        // Evita duplicar a mesma magia na mesma classe
        const jaPossui = magiasAtuais.some(m => m.catalogo_feitico_id === magiaOficial.id || m.nome === magiaOficial.nome);
        if (jaPossui) {
            alert(`⚠️ Esta magia já foi aprendida.`);
            e.target.value = "";
            return;
        }

        const atual = [...formClasses];
        if (!atual[indexClasse].magias) atual[indexClasse].magias = [];

        atual[indexClasse].magias.push({
            catalogo_feitico_id: magiaOficial.id,
            nome: magiaOficial.nome,
            custo_mp: magiaOficial.pm_custo,
            descricao: magiaOficial.descricao,
            customizacoes: {}
        });

        setFormClasses(atual);
        e.target.value = "";
    };

    const removerMagia = (mIndex) => {
        const atual = [...formClasses];
        atual[indexClasse].magias.splice(mIndex, 1);
        setFormClasses(atual);
    };

    if (nivelHabilidadeMagia === 0) {
        return (
            <div style={{ fontSize: '0.8rem', color: '#8b949e', fontStyle: 'italic', marginTop: '8px', padding: '6px', background: '#161b22', borderRadius: '4px' }}>
                💡 Distribua pontos na habilidade de magia da classe (ex: <i>Magia Elemental</i>) para desbloquear o grimório e aprender feitiços (1 magia por nível).
            </div>
        );
    }

    return (
        <div style={{ borderTop: '1px solid #30363d', paddingTop: '10px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem', color: '#58a6ff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaMagic /> Grimório ({magiasAtuais.length} / {limiteMagias} Magias Conhecidas)
                </span>

                <select
                    onChange={adicionarMagiaDoCatalogo}
                    defaultValue=""
                    style={{ padding: '4px 8px', fontSize: '0.78rem', background: '#161b22', color: '#58a6ff', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
                    disabled={carregando || magiasAtuais.length >= limiteMagias}
                >
                    <option value="" disabled>+ Aprender Magia do Catálogo</option>
                    {catalogoMagias.map((catMagia) => {
                        const jaAdicionada = magiasAtuais.some(m => m.catalogo_feitico_id === catMagia.id || m.nome === catMagia.nome);
                        return (
                            <option key={catMagia.id} value={catMagia.id} disabled={jaAdicionada}>
                                {catMagia.nome} (MP: {catMagia.pm_custo}) {jaAdicionada ? ' ✓' : ''}
                            </option>
                        );
                    })}
                </select>
            </div>

            {magiasAtuais.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: '#8b949e', fontStyle: 'italic' }}>
                    Nenhuma magia aprendida ainda. Selecione acima para adicionar do catálogo.
                </div>
            ) : (
                magiasAtuais.map((m, mIndex) => (
                    <div key={mIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161b22', padding: '6px 8px', borderRadius: '4px', marginTop: '4px', fontSize: '0.82rem' }}>
                        <div>
                            <strong style={{ color: '#f0f6fc' }}>{m.nome}</strong>{' '}
                            <span style={{ color: '#3fb950' }}>(MP: {m.custo_mp})</span>:{' '}
                            <span style={{ color: '#8b949e' }}>{m.descricao}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => removerMagia(mIndex)}
                            style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', padding: '2px 6px' }}
                            title="Esquecer Magia"
                        >
                            <FaTrash size={12} />
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}