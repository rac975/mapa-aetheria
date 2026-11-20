import { useState } from 'react';
import { FaStore, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { lojaService } from '../../../services/lojaService';
import { useToast } from '../../../contexts/ToastContext';
import { useAlert } from '../../../contexts/useAlert';
import { Button, Modal, Input } from '../../../components/ui';
import styles from './GerenciarEstabelecimentos.module.css';

export default function GerenciarEstabelecimentos({ lojas, recarregarDados }) {
    const { showAlert } = useAlert();
    const [modalLojaAberto, setModalLojaAberto] = useState(false);
    const [lojaEditando, setLojaEditando] = useState(null);
    const [nomeLoja, setNomeLoja] = useState('');
    const [cidadeLoja, setCidadeLoja] = useState('');
    const [vendedorLoja, setVendedorLoja] = useState('');
    const [descLoja, setDescLoja] = useState('');
    const [salvando, setSalvando] = useState(false);
    const { coldDelete } = useToast();

    const salvarLoja = async (e) => {
        e.preventDefault();
        setSalvando(true);
        try {
            const { error } = await lojaService.salvarEstabelecimento({
                id: lojaEditando?.id,
                nome: nomeLoja,
                cidade: cidadeLoja,
                descricao: descLoja,
                vendedor: vendedorLoja
            });
            if (error) throw error;
            fecharModalLoja();
            if (recarregarDados) recarregarDados();
        } catch (err) {
            showAlert('Erro ao salvar estabelecimento: ' + err.message);
        } finally {
            setSalvando(false);
        }
    };

    const excluirLoja = (loja) => {
        coldDelete({
            item: loja,
            message: <>Loja <strong>{loja.nome}</strong> foi removida.</>,
            onCommit: async (l) => {
                const { error } = await lojaService.excluirLoja(l.id);
                if (error) {
                    console.error('Erro ao excluir loja:', error);
                    showAlert('Erro ao excluir loja: ' + error.message);
                } else if (recarregarDados) {
                    recarregarDados();
                }
            },
            onRollback: () => {
                if (recarregarDados) recarregarDados();
            },
            duration: 6000
        });
    };

    const fecharModalLoja = () => {
        setLojaEditando(null);
        setNomeLoja('');
        setCidadeLoja('');
        setVendedorLoja('');
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
                            <div className={styles.lojaMeta}>
                                <span className={styles.lojaCidade}>📍 {loja.cidade || 'Localização não informada'}</span>
                                {(loja.vendedor || loja.atendente) && (
                                    <span className={styles.lojaVendedor}>👤 {loja.vendedor || loja.atendente}</span>
                                )}
                            </div>
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
                                    setVendedorLoja(loja.vendedor || loja.atendente || '');
                                    setDescLoja(loja.descricao || '');
                                    setModalLojaAberto(true);
                                }}
                            >
                                <FaEdit size={12} /> Editar
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => excluirLoja(loja)}
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
                        <Input
                            label="Vendedor / Atendente (Opcional)"
                            value={vendedorLoja}
                            onChange={e => setVendedorLoja(e.target.value)}
                            placeholder="Ex: Mestre Ferreiro Boris, Lyra a Alquimista..."
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
