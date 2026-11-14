import React, { useState } from 'react';
import { FaHammer, FaShieldAlt, FaCrosshairs, FaRing } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import CriadorArmas from './CriadorArmas';
import CriadorArmadurasEscudos from './CriadorArmadurasEscudos';
import CriadorAcessorios from './CriadorAcessorios';

export default function CriadorEquipamentoUnificado({ ficha, onCriado }) {
    const [tipoEquipamento, setTipoEquipamento] = useState('arma');

    const handleSalvarItem = async (novoItem) => {
        let erroBanco = null;

        if (ficha && ficha.id) {
            const { error } = await supabase.from('itens_personagem').insert([{
                ficha_id: ficha.id,
                nome: novoItem.nome,
                tipo: novoItem.tipo,
                stats_personalizados: novoItem.stats
            }]);
            erroBanco = error;
        } else {
            const { error } = await supabase.from('itens_catalogo').insert([{
                nome: novoItem.nome,
                tipo: novoItem.tipo,
                custo: novoItem.custo,
                stats: novoItem.stats
            }]);
            erroBanco = error;
        }

        if (erroBanco) {
            alert('Erro ao salvar equipamento: ' + erroBanco.message);
        } else {
            alert('✨ Equipamento forjado e salvo com sucesso!');
            if (onCriado) onCriado();
        }
    };

    return (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px', color: '#c9d1d9', maxWidth: '700px', margin: '20px auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d4af37', fontSize: '1.2rem', marginBottom: '15px' }}>
                <FaHammer /> Oficina Central de Equipamentos
            </h2>

            {/* Abas Superiores */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    type="button"
                    className='btn-itens-raros'
                    onClick={() => setTipoEquipamento('arma')}
                    style={{ flex: 1, padding: '10px', background: tipoEquipamento === 'arma' ? '#238636' : '#21262d', color: '#fff', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    <FaCrosshairs /> Armas
                </button>
                <button
                    type="button"
                    className='btn-itens-raros'
                    onClick={() => setTipoEquipamento('armadura')}
                    style={{ flex: 1, padding: '10px', background: tipoEquipamento === 'armadura' ? '#238636' : '#21262d', color: '#fff', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    <FaShieldAlt /> Armaduras / Escudos
                </button>
                <button
                    type="button"
                    className='btn-itens-raros'
                    onClick={() => setTipoEquipamento('acessorio')}
                    style={{ flex: 1, padding: '10px', background: tipoEquipamento === 'acessorio' ? '#238636' : '#21262d', color: '#fff', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    <FaRing /> Acessórios
                </button>
            </div>

            {/* Renderização condicional do componente filho escolhido */}
            {tipoEquipamento === 'arma' && <CriadorArmas onSalvarItem={handleSalvarItem} />}
            {tipoEquipamento === 'armadura' && <CriadorArmadurasEscudos onSalvarItem={handleSalvarItem} />}
            {tipoEquipamento === 'acessorio' && <CriadorAcessorios onSalvarItem={handleSalvarItem} />}
        </div>
    );
}