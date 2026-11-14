import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

export default function CriadorAcessorios({ onSalvarItem }) {
    const [caracteristicas, setCaracteristicas] = useState([]);
    const [caracteristicaSelecionada, setCaracteristicaSelecionada] = useState(null);
    const [nomeItem, setNomeItem] = useState('');

    useEffect(() => {
        async function carregarAcessorios() {
            const { data: catalogo } = await supabase.from('catalogo_itens').select('*');
            if (catalogo) {
                const filtrados = catalogo.filter(i => i.tipo_item?.includes('acessorio'));
                setCaracteristicas([{ id: 'nenhuma', nome: 'Nenhuma característica', custo: 0, efeito: '' }, ...filtrados]);
            }
        }
        carregarAcessorios();
    }, []);

    const precoTotal = caracteristicaSelecionada?.custo || 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nomeItem.trim()) return alert('Dê um nome para o acessório!');

        const efeitosList = caracteristicaSelecionada?.efeito ? [caracteristicaSelecionada.efeito] : [];

        onSalvarItem({
            nome: nomeItem,
            tipo: 'acessorio',
            custo: precoTotal,
            stats: {
                slot: 'acessorio',
                raridade: 'raro',
                custo: precoTotal,
                efeitos: efeitosList
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Nome do Acessório</label>
                <input
                    type="text"
                    value={nomeItem}
                    onChange={e => setNomeItem(e.target.value)}
                    placeholder="Ex: Anel Elemental"
                    style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}
                />
            </div>

            <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '3px' }}>Característica Especial</label>
                <select onChange={e => setCaracteristicaSelecionada(caracteristicas[e.target.value])} style={{ width: '100%', padding: '8px', background: '#0d0f18', border: '1px solid #30363d', color: '#fff', borderRadius: '4px' }}>
                    {caracteristicas.map((c, idx) => <option key={c.id || idx} value={idx}>{c.nome} {c.custo > 0 ? `(+${c.custo}z)` : ''}</option>)}
                </select>
            </div>

            <div style={{ background: '#0d0f18', padding: '12px', borderRadius: '6px', border: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem', color: '#8b949e' }}>
                    Custo Total: <strong style={{ color: '#2ecc71', fontSize: '1.1rem' }}>{precoTotal} zênites</strong>
                </div>
                <button type="submit" style={{ background: '#238636', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Forjar Acessório
                </button>
            </div>
        </form>
    );
}