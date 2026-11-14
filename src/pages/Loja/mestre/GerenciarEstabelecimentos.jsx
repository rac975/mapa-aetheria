import { useState } from 'react';
import { FaStore, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';

export default function GerenciarEstabelecimentos({ lojas, recarregarDados }) {
    const [modalLojaAberto, setModalLojaAberto] = useState(false);
    const [lojaEditando, setLojaEditando] = useState(null);
    const [nomeLoja, setNomeLoja] = useState('');
    const [cidadeLoja, setCidadeLoja] = useState('');
    const [descLoja, setDescLoja] = useState('');

    const salvarLoja = async (e) => {
        e.preventDefault();
        const dados = { nome: nomeLoja, cidade: cidadeLoja, descricao: descLoja };
        if (lojaEditando) {
            await supabase.from('lojas').update(dados).eq('id', lojaEditando.id);
        } else {
            await supabase.from('lojas').insert([dados]);
        }
        fecharModalLoja();
        if (recarregarDados) recarregarDados();
    };

    const excluirLoja = async (id) => {
        if (!confirm("Deseja apagar esta loja e todo o seu estoque?")) return;
        await supabase.from('lojas').delete().eq('id', id);
        if (recarregarDados) recarregarDados();
    };

    const fecharModalLoja = () => {
        setLojaEditando(null);
        setNomeLoja('');
        setCidadeLoja('');
        setDescLoja('');
        setModalLojaAberto(false);
    };

    return (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#d4af37', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                        <FaStore /> Estabelecimentos Cadastrados
                    </h3>
                    <p style={{ margin: 0, color: '#8b949e', fontSize: '0.85rem' }}>Gerencie as lojas, ferreiros e empórios espalhados pelo mundo da campanha.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setModalLojaAberto(true)}
                    className="btn-cadastrar-novo"
                >
                    <FaPlus /> Nova Loja
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {lojas.map(loja => (
                    <div key={loja.id} style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                        <div>
                            <h4 style={{ margin: '0 0 4px 0', color: '#f0f6fc', fontSize: '1.1rem' }}>{loja.nome}</h4>
                            <span style={{ fontSize: '0.8rem', color: '#d4af37', display: 'block', marginBottom: '8px' }}>📍 {loja.cidade || 'Localização não informada'}</span>
                            {loja.descricao && (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#8b949e', lineHeight: '1.4' }}>{loja.descricao}</p>
                            )}
                        </div>

                        {/* Botões de Ação Organizados Lado a Lado (Corrigindo o botão gigante) */}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #21262d', paddingTop: '12px' }}>
                            <button
                                type="button"
                                className="btn-editar"
                                style={{ padding: '8px 16px', flex: 'unset' }}
                                onClick={() => {
                                    setLojaEditando(loja);
                                    setNomeLoja(loja.nome);
                                    setCidadeLoja(loja.cidade || '');
                                    setDescLoja(loja.descricao || '');
                                    setModalLojaAberto(true);
                                }}
                            >
                                <FaEdit size={12} /> Editar
                            </button>
                            <button
                                type="button"
                                className="btn-del"
                                style={{ padding: '8px 16px' }}
                                onClick={() => excluirLoja(loja.id)}
                            >
                                <FaTrash size={12} /> Excluir
                            </button>
                        </div>
                    </div>
                ))}
                {lojas.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#8b949e' }}>
                        Nenhuma loja cadastrada. Clique em "Nova Loja" para começar.
                    </div>
                )}
            </div>

            {modalLojaAberto && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-titulo">
                            <FaStore /> {lojaEditando ? 'Editar Estabelecimento' : 'Cadastrar Nova Loja'}
                        </h3>
                        <form onSubmit={salvarLoja}>
                            <div className="form-grupo">
                                <label>Nome do Estabelecimento</label>
                                <input type="text" value={nomeLoja} onChange={e => setNomeLoja(e.target.value)} required placeholder="Ex: Ferreiro de Rivenia" />
                            </div>
                            <div className="form-grupo">
                                <label>Cidade / Região</label>
                                <input type="text" value={cidadeLoja} onChange={e => setCidadeLoja(e.target.value)} placeholder="Ex: Capital de Oakhaven" />
                            </div>
                            <div className="form-grupo">
                                <label>Descrição / Especialidade</label>
                                <textarea value={descLoja} onChange={e => setDescLoja(e.target.value)} rows={3} placeholder="Ex: Especializado em armas pesadas." />
                            </div>
                            <div className="modal-botoes">
                                <button type="button" className="btn-modal-cancelar" onClick={fecharModalLoja}>Cancelar</button>
                                <button type="submit" className="btn-modal-salvar">Salvar Loja</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}