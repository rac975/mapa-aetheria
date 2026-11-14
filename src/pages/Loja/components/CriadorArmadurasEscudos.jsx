import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

export default function CriadorArmadurasEscudos({ onSalvarItem }) {
    const [itensBase, setItensBase] = useState([]);
    const [itemBaseSelecionado, setItemBaseSelecionado] = useState(null);
    const [caracteristicas, setCaracteristicas] = useState([]);
    const [caracteristicaSelecionada, setCaracteristicaSelecionada] = useState(null);
    const [nomeItem, setNomeItem] = useState('');

    useEffect(() => {
        async function carregarDados() {
            const { data: bases } = await supabase
                .from('itens_catalogo')
                .select('*')
                .eq('tipo', 'armadura')
                .eq('stats->>raridade', 'comum');

            if (bases && bases.length > 0) {
                setItensBase(bases);
                setItemBaseSelecionado(bases[0]);
            }

            const { data: catalogo } = await supabase.from('catalogo_itens').select('*');
            if (catalogo) {
                const filtrados = catalogo.filter(i => i.tipo_item?.includes('armadura'));
                setCaracteristicas([{ id: 'nenhuma', nome: 'Nenhuma característica', custo: 0, efeito: '' }, ...filtrados]);
            }
        }
        carregarDados();
    }, []);

    const custoBase = itemBaseSelecionado?.custo || 100;
    const custoCarac = caracteristicaSelecionada?.custo || 0;
    const precoTotal = custoBase + custoCarac;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return alert('Dê um nome para a armadura/escudo!');

        const efeitosList = caracteristicaSelecionada?.efeito ? [caracteristicaSelecionada.efeito] : [];

        onSalvarItem({
            nome: nomeItem,
            tipo: 'armadura',
            custo: precoTotal,
            stats: {
                slot: 'armadura',
                raridade: 'raro',
                custo: precoTotal,
                efeitos: efeitosList
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Nome da Armadura / Escudo</label>
                <input
                    type="text"
                    value={nomeItem}
                    onChange={e => setNomeItem(e.target.value)}
                    placeholder="Ex: Armadura Aethelgard"
                    style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '3px' }}>Item Base Comum</label>
                    <select onChange={e => setItemBaseSelecionado(itensBase[e.target.value])} style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}>
                        {itensBase.map((i, idx) => <option key={i.id || idx} value={idx}>{i.nome}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '3px' }}>Característica Especial</label>
                    <select onChange={e => setCaracteristicaSelecionada(caracteristicas[e.target.value])} style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}>
                        {caracteristicas.map((c, idx) => <option key={c.id || idx} value={idx}>{c.nome} {c.custo > 0 ? `(+${c.custo}z)` : ''}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ background: '#0d0f18', padding: '12px', borderRadius: '6px', border: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem', color: '#8b949e' }}>
                    Custo Total: <strong style={{ color: '#2ecc71', fontSize: '1.1rem' }}>{precoTotal} zênites</strong>
                </div>
                <button type="submit" style={{ background: '#238636', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Forjar Armadura
                </button>
            </div>
        </form>
    );
}