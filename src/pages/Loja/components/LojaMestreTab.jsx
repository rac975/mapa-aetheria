import { useState, useEffect } from 'react';
import { FaStore, FaBoxOpen, FaHammer, FaTools } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import GerenciarEstabelecimentos from '../mestre/GerenciarEstabelecimentos';
import GerenciarEstoqueLoja from '../mestre/GerenciarEstoqueLoja';
import GerenciarForja from '../mestre/GerenciarForja';
import GerenciarCatalogoRaros from '../mestre/GerenciarCatalogosRaros';

export default function LojaMestreTab({ itensCatalogo, lojas, recarregarDados, ficha }) {
    // Sub-aba interna do Mestre: 'lojas', 'estoque', 'forja', 'catalogo'
    const [subAbaMestre, setSubAbaMestre] = useState('lojas');

    useEffect(() => {
        const canalRealtime = supabase
            .channel('tabelas-mestre-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'itens_catalogo' }, () => {
                if (recarregarDados) recarregarDados();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lojas' }, () => {
                if (recarregarDados) recarregarDados();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(canalRealtime);
        };
    }, [recarregarDados]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Menu de Sub-Abas do Mestre (Design Limpo e Organizado) */}
            <div style={{ display: 'flex', gap: '8px', background: '#0d1117', padding: '6px', borderRadius: '10px', border: '1px solid #30363d', overflowX: 'auto' }}>
                <button
                    type="button"
                    onClick={() => setSubAbaMestre('lojas')}
                    className={`btn-aba ${subAbaMestre === 'lojas' ? 'ativa' : ''}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <FaStore /> Estabelecimentos
                </button>
                <button
                    type="button"
                    onClick={() => setSubAbaMestre('estoque')}
                    className={`btn-aba ${subAbaMestre === 'estoque' ? 'ativa' : ''}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <FaBoxOpen /> Estoque das Lojas
                </button>
                <button
                    type="button"
                    onClick={() => setSubAbaMestre('forja')}
                    className={`btn-aba ${subAbaMestre === 'forja' ? 'ativa' : ''}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <FaHammer /> Oficina / Forja
                </button>
                <button
                    type="button"
                    onClick={() => setSubAbaMestre('catalogo')}
                    className={`btn-aba ${subAbaMestre === 'catalogo' ? 'ativa' : ''}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <FaTools /> Catálogo de Raros
                </button>
            </div>

            {/* Conteúdo dinâmico baseado na sub-aba escolhida */}
            <div className="mestre-conteudo-painel">
                {subAbaMestre === 'lojas' && (
                    <GerenciarEstabelecimentos lojas={lojas} recarregarDados={recarregarDados} />
                )}

                {subAbaMestre === 'estoque' && (
                    <GerenciarEstoqueLoja lojas={lojas} itensCatalogo={itensCatalogo} />
                )}

                {subAbaMestre === 'forja' && (
                    <GerenciarForja ficha={ficha} recarregarDados={recarregarDados} />
                )}

                {subAbaMestre === 'catalogo' && (
                    <GerenciarCatalogoRaros itensCatalogo={itensCatalogo} recarregarDados={recarregarDados} />
                )}
            </div>
        </div>
    );
}