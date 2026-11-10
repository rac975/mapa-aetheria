import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaUserPlus, FaTrash, FaHeart, FaMagic, FaDice, FaIdBadge } from 'react-icons/fa';
import { LuUsers, LuSparkles } from 'react-icons/lu';
import { supabase } from '../../services/supabase';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import './MestreFichasPage.css';

export default function MestreFichasPage({ isMestre }) {
    const [fichas, setFichas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [modalCriarAberto, setModalCriarAberto] = useState(false);

    const [nomeJogador, setNomeJogador] = useState('');
    const [nomePersonagem, setNomePersonagem] = useState('');
    const [registroId, setRegistroId] = useState('');

    // Estado para o alerta customizado
    const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });

    const navigate = useNavigate();

    useEffect(() => {
        carregarTodasFichas();
    }, []);

    async function carregarTodasFichas() {
        try {
            const { data, error } = await supabase
                .from('fichas_personagens')
                .select('*')
                .order('nome_personagem', { ascending: true });

            if (!error) setFichas(data || []);
        } finally {
            setCarregando(false);
        }
    }

    const gerarIdAutomatico = (nome) => {
        if (!nome.trim()) return '';
        const prefixo = nome.substring(0, 3).toUpperCase();
        const numeros = Math.floor(100 + Math.random() * 900);
        return `${prefixo}-${numeros}`;
    };

    const handleNomePersonagemChange = (e) => {
        const novoNome = e.target.value;
        setNomePersonagem(novoNome);
        setRegistroId(gerarIdAutomatico(novoNome));
    };

    const handleCriarFicha = async (e) => {
        e.preventDefault();
        if (!nomeJogador || !nomePersonagem || !registroId) return;

        const { error } = await supabase
            .from('fichas_personagens')
            .insert([{
                nome_jogador: nomeJogador.trim(),
                nome_personagem: nomePersonagem.trim(),
                jogador_token: registroId.trim(),
                identidade: 'Herói de Aetheria',
                tema: 'Aventura',
                hp_atual: 30, hp_max: 30,
                mp_atual: 20, mp_max: 20,
                ip_atual: 6, ip_max: 6,
                nivel: 1
            }]);

        if (!error) {
            setNomeJogador('');
            setNomePersonagem('');
            setRegistroId('');
            setModalCriarAberto(false);
            carregarTodasFichas();
        } else {
            setAlerta({
                isOpen: true,
                title: 'Erro ao Emitir Crachá',
                message: `Não foi possível criar: ${error.message}`
            });
        }
    };

    const handleDeletarFicha = async (id, e) => {
        e.stopPropagation(); // Evita navegar ao clicar no botão de excluir
        if (confirm('Tem certeza que deseja apagar esta ficha e revogar o crachá?')) {
            await supabase.from('fichas_personagens').delete().eq('id', id);
            carregarTodasFichas();
        }
    };

    if (!isMestre) {
        return (
            <div className="mestre-fichas-page">
                <div className="mestre-bloqueado">
                    <FaShieldAlt className="icon-lock" />
                    <h2>Área Exclusiva do Mestre</h2>
                    <p>Você precisa estar logado como Mestre para gerenciar os crachás e fichas da mesa.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mestre-fichas-page">
            <div className="mestre-header">
                <div>
                    <h1><LuUsers /> Gestão de Fichas e Crachás</h1>
                    <p>Clique em qualquer cartão para abrir a página completa de edição da ficha do herói.</p>
                </div>
                <button type="button" className="btn-novo" onClick={() => setModalCriarAberto(true)}>
                    <FaUserPlus /> Cadastrar Novo Crachá
                </button>
            </div>

            {carregando ? (
                <p className="carregando-txt">Carregando fichas da mesa...</p>
            ) : (
                <div className="mestre-grid-fichas">
                    {fichas.map((f) => (
                        <div
                            key={f.id}
                            className="mestre-ficha-card clickable"
                            onClick={() => navigate(`/mestre/editar/${f.id}`)}
                            title="Abrir ficha completa"
                        >
                            <div className="card-top">
                                <div>
                                    <h3>{f.nome_personagem}</h3>
                                    <span className="jogador-sub">Jogador: <strong>{f.nome_jogador || 'Não informado'}</strong></span>
                                </div>
                                <div className="token-tag-container">
                                    <FaIdBadge />
                                    <span className="token-tag"> ID: #{f.jogador_token}</span>
                                </div>
                            </div>
                            <p className="identidade-txt"><em>{f.identidade || 'Sem identidade'}</em></p>

                            <div className="status-bars-preview">
                                <span><FaHeart color="#f85149" /> HP: {f.hp_atual}/{f.hp_max}</span>
                                <span><FaMagic color="#58a6ff" /> MP: {f.mp_atual}/{f.mp_max}</span>
                                <span className="nivel-tag">Nível {f.nivel || 1}</span>
                            </div>

                            <div className="card-actions">
                                <button type="button" className="btn-del" onClick={(e) => handleDeletarFicha(f.id, e)}>
                                    <FaTrash /> Excluir Ficha
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal para Cadastrar Novo Jogador/Crachá */}
            {modalCriarAberto && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2><LuSparkles /> Emitir Novo Crachá de Aetheria</h2>
                        <form onSubmit={handleCriarFicha}>
                            <div className="form-group">
                                <label>Nome do Jogador (Real)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Rafael"
                                    value={nomeJogador}
                                    onChange={(e) => setNomeJogador(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Nome do Personagem</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Cyrion"
                                    value={nomePersonagem}
                                    onChange={handleNomePersonagemChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>REGISTRO ID (Gerado Automaticamente)</label>
                                <div className="input-with-action">
                                    <input
                                        type="text"
                                        value={registroId}
                                        onChange={(e) => setRegistroId(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn-reroll"
                                        title="Gerar novos números aleatórios"
                                        onClick={() => setRegistroId(gerarIdAutomatico(nomePersonagem))}
                                    >
                                        <FaDice />
                                    </button>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secundario" onClick={() => setModalCriarAberto(false)}>Cancelar</button>
                                <button type="submit" className="btn-primario">Gerar Crachá</button>
                            </div>
                        </form>
                    </div>
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