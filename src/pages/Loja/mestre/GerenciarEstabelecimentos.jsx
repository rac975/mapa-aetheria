import { useState } from 'react';
import { FaStore, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { Button, Modal, Input } from '../../../components/ui';
import styles from './GerenciarEstabelecimentos.module.css';

export default function GerenciarEstabelecimentos({ lojas, recarregarDados }) {
    const [modalLojaAberto, setModalLojaAberto] = useState(false);
    const [lojaEditando, setLojaEditando] = useState(null);
    const [nomeLoja, setNomeLoja] = useState('');
    const [cidadeLoja, setCidadeLoja] = useState('');
    const [descLoja, setDescLoja] = useState('');
    const [salvando, setSalvando] = useState(false);

    const salvarLoja = async (e) => {
        e.preventDefault();
        setSalvando(true);
        const dados = { nome: nomeLoja, cidade: cidadeLoja, descricao: descLoja };
        try {
            if (lojaEditando) {
                const { error } = await supabase.from('lojas').update(dados).eq('id', lojaEditando.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('lojas').insert([dados]);
                if (error) throw error;
            }
            fecharModalLoja();
            if (recarregarDados) recarregarDados();
        } catch (err) {
            alert('Erro ao salvar estabelecimento: ' + err.message);
        } finally {
            setSalvando(false);
        }
    };

    const excluirLoja = async (id) => {
        if (!confirm("Deseja apagar esta loja e todo o seu estoque?")) return;
        const { error } = await supabase.from('lojas').delete().eq('id', id);
        if (error) {
            alert('Erro ao excluir loja: ' + error.message);
        } else {
            if (recarregarDados) recarregarDados();
        }
    };

    const fecharModalLoja = () => {
        setLojaEditando(null);
        setNomeLoja('');
        setCidadeLoja('');
        setDescLoja('');
        setModalLojaAberto(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.cabecalho}>
                <div className={styles.tituloArea}>
                    <h3 className={styles.titulo}>
                        <FaStore /> Estabelecimentos Cadastrados
                    </h3>
                    <p className={styles.subtitulo}>
                        Gerencie as lojas, ferreiros e empórios espalhados pelo mundo da campanha.
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => setModalLojaAberto(true)}
                >
                    <FaPlus /> Nova Loja
                </Button>
            </div>

            <div className={styles.lojasGrid}>
                {lojas.map(loja => (
                    <div key={loja.id} className={styles.lojaCard}>
                        <div className={styles.lojaInfo}>
                            <h4 className={styles.lojaNome}>{loja.nome}</h4>
                            <span className={styles.lojaCidade}>📍 {loja.cidade || 'Localização não informada'}</span>
                            {loja.descricao && (
                                <p className={styles.lojaDesc}>{loja.descricao}</p>
                            )}
                        </div>

                        <div className={styles.cardAcoes}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setLojaEditando(loja);
                                    setNomeLoja(loja.nome);
                                    setCidadeLoja(loja.cidade || '');
                                    setDescLoja(loja.descricao || '');
                                    setModalLojaAberto(true);
                                }}
                            >
                                <FaEdit size={12} /> Editar
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => excluirLoja(loja.id)}
                            >
                                <FaTrash size={12} /> Excluir
                            </Button>
                        </div>
                    </div>
                ))}
                {lojas.length === 0 && (
                    <div className={styles.lojasVazio}>
                        Nenhuma loja cadastrada. Clique em "Nova Loja" para começar.
                    </div>
                )}
            </div>

            {modalLojaAberto && (
                <Modal
                    isOpen={modalLojaAberto}
                    onClose={fecharModalLoja}
                    title={lojaEditando ? 'Editar Estabelecimento' : 'Cadastrar Nova Loja'}
                    size="md"
                    footer={
                        <div className={styles.modalFooter}>
                            <Button variant="ghost" size="md" onClick={fecharModalLoja} disabled={salvando}>
                                Cancelar
                            </Button>
                            <Button variant="primary" size="md" onClick={salvarLoja} disabled={salvando}>
                                {salvando ? 'Salvando...' : 'Salvar Loja'}
                            </Button>
                        </div>
                    }
                >
                    <form onSubmit={salvarLoja} className={styles.formModal}>
                        <Input
                            label="Nome do Estabelecimento"
                            value={nomeLoja}
                            onChange={e => setNomeLoja(e.target.value)}
                            required
                            placeholder="Ex: Ferreiro de Rivenia"
                        />
                        <Input
                            label="Cidade / Região"
                            value={cidadeLoja}
                            onChange={e => setCidadeLoja(e.target.value)}
                            placeholder="Ex: Capital de Oakhaven"
                        />
                        <div className={styles.textareaGrupo}>
                            <label className={styles.textareaLabel}>Descrição / Especialidade</label>
                            <textarea
                                value={descLoja}
                                onChange={e => setDescLoja(e.target.value)}
                                rows={3}
                                placeholder="Ex: Especializado em armas pesadas e catalisadores arcanos."
                                className={styles.textareaInput}
                            />
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
