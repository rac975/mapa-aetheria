import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaUserPlus, FaTrash, FaHeart, FaMagic, FaDice, FaIdBadge, FaDownload, FaUser, FaEdit } from 'react-icons/fa';
import { LuUsers, LuSparkles } from 'react-icons/lu';
import { QRCodeSVG } from 'qrcode.react';
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

    const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });
    const navigate = useNavigate();

    // Referências para capturar os QR Codes para download
    const qrRefs = useRef({});

    useEffect(() => {
        carregarTodasFichas();
    }, []);

    async function carregarTodasFichas() {
        try {
            const { data, error } = await supabase
                .from('fichas_personagens')
                .select(`
                    *,
                    fichas_classes (
                        nome_classe,
                        nivel
                    )
                `)
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
                ip_atual: 6, pi_max: 6,
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
        e.stopPropagation();
        if (confirm('Tem certeza que deseja apagar esta ficha e revogar o crachá?')) {
            await supabase.from('fichas_personagens').delete().eq('id', id);
            carregarTodasFichas();
        }
    };

    // Função para baixar o QR Code diretamente como arquivo SVG (sem erro de Canvas/CORS)
    const baixarQRCode = (personagemNome, fichaId) => {
        const svgElement = qrRefs.current[fichaId];
        if (!svgElement) {
            console.error("Elemento SVG do QR Code não encontrado para o ID:", fichaId);
            return;
        }

        try {
            // Serializa o elemento SVG para texto/string XML
            const svgData = new XMLSerializer().serializeToString(svgElement);

            // Cria um Blob com o conteúdo do SVG
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            // Cria o link temporário de download
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `QRCode_${personagemNome.replace(/\s+/g, '_')}.svg`;

            document.body.appendChild(downloadLink);
            downloadLink.click();

            // Limpa os recursos da memória
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao gerar o download do QR Code:", error);
            setAlerta({
                isOpen: true,
                title: 'Erro no Download',
                message: 'Não foi possível baixar o QR Code. Tente novamente.'
            });
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
                    <p>Visualize os dados dos heróis, baixe os QR Codes para os crachás e gerencie a mesa.</p>
                </div>
                <button type="button" className="btn-novo" onClick={() => setModalCriarAberto(true)}>
                    <FaUserPlus /> Cadastrar Novo Crachá
                </button>
            </div>

            {carregando ? (
                <p className="carregando-txt">Carregando fichas da mesa...</p>
            ) : (
                <div className="mestre-grid-fichas">
                    {fichas.map((f) => {
                        const urlFicha = `https://rac975.github.io/mapa-aetheria/#/ficha/${f.id}`;

                        return (
                            <div
                                key={f.id}
                                className="mestre-ficha-card clickable"
                                onClick={() => navigate(`/mestre/editar/${f.id}`)}
                                title="Abrir ficha completa"
                            >
                                {/* Cabeçalho do Card: Avatar + Nome + Jogador + ID */}
                                <div className="card-top" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div className="card-avatar" style={{ width: '54px', height: '54px', borderRadius: '50%', border: '2px solid #d4af37', overflow: 'hidden', background: '#0d0f18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {f.avatar_url ? (
                                            <img src={f.avatar_url} alt={f.nome_personagem} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <FaUser size={22} color="#d4af37" />
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f0f6fc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {f.nome_personagem}
                                        </h3>
                                        <span className="jogador-sub" style={{ fontSize: '0.85rem', color: '#8b949e' }}>
                                            Jogador: <strong>{f.nome_jogador || 'Não informado'}</strong>
                                        </span>
                                    </div>
                                    <div className="token-tag-container" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(212, 175, 55, 0.1)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                                        <FaIdBadge color="#d4af37" size={12} />
                                        <span className="token-tag" style={{ fontSize: '0.75rem', color: '#d4af37', fontWeight: 'bold' }}>#{f.jogador_token}</span>
                                    </div>
                                </div>

                                {/* Informações de Classes com Níveis, Peculiaridade/Identidade */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '12px 0', fontSize: '0.85rem' }}>
                                    <p className="identidade-txt" style={{ margin: 0, color: '#c9d1d9' }}>
                                        <em>{f.identidade || 'Sem peculiaridade informada'}</em>
                                    </p>

                                    <div style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '6px 10px', borderRadius: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 'bold' }}>Classes:</span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {f.fichas_classes && f.fichas_classes.length > 0 ? (
                                                f.fichas_classes.map((c, idx) => (
                                                    <span key={idx} style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37', padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                        {c.nome_classe} ({c.nivel}v)
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ color: '#8b949e', fontStyle: 'italic', fontSize: '0.75rem' }}>Nenhuma classe informada</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Barras de Status, IP, Fábula e Nível Geral */}
                                <div className="status-bars-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center', background: 'rgba(13, 17, 23, 0.5)', padding: '10px 12px', borderRadius: '8px', border: '1px solid #30363d', fontSize: '0.85rem' }}>
                                    <span title="Pontos de Vida"><FaHeart color="#f85149" /> HP: {f.hp_atual}/{f.hp_max}</span>
                                    <span title="Pontos de Mana"><FaMagic color="#58a6ff" /> MP: {f.mp_atual}/{f.mp_max}</span>
                                    <span title="Inventário de Peso (IP)"><strong style={{ color: '#d4af37' }}>📦 IP:</strong> {f.ip_atual}/{f.pi_max}</span>
                                    <span title="Pontos de Fábula"><strong style={{ color: '#d5b8ff' }}>✨ Fábula:</strong> {f.fabula ?? 3}</span>

                                    <span className="nivel-tag" style={{ marginLeft: 'auto', background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        Nível {f.nivel || 1}
                                    </span>
                                </div>

                                {/* Área do QR Code com Botão de Download integrado */}
                                <div
                                    className="card-qrcode-container"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', padding: '8px 12px', background: 'rgba(13, 17, 23, 0.8)', borderRadius: '8px', border: '1px solid #30363d' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ background: '#fff', padding: '4px', borderRadius: '6px', display: 'flex' }}>
                                            <div ref={(el) => { if (el) qrRefs.current[f.id] = el; }}>
                                                <QRCodeSVG
                                                    value={urlFicha}
                                                    size={100}
                                                    fgColor="#0d0f18"
                                                    bgColor="#ffffff"
                                                    level="M"
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: 'bold' }}>QR Code do Crachá</span>
                                            <span style={{ fontSize: '10px', color: '#8b949e', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {f.jogador_token}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-secundario"
                                        onClick={(e) => baixarQRCode(f.nome_personagem, f.id, e)}
                                        title="Baixar imagem do QR Code para impressão"
                                        style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#21262d', color: '#d4af37', borderColor: 'rgba(212, 175, 55, 0.4)', cursor: 'pointer', zIndex: 5, position: 'relative' }}
                                    >
                                        <FaDownload /> Baixar QR
                                    </button>
                                </div>

                                {/* Ações do Card (Editar + Excluir) */}
                                <div className="card-actions" style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        className="btn-secundario"
                                        onClick={() => navigate(`/mestre/editar/${f.id}`)}
                                        style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#21262d', color: '#58a6ff', borderColor: 'rgba(88, 166, 255, 0.4)', cursor: 'pointer' }}
                                    >
                                        <FaEdit /> Editar Ficha
                                    </button>

                                    <button type="button" className="btn-del" onClick={(e) => handleDeletarFicha(f.id, e)}>
                                        <FaTrash /> Excluir Ficha
                                    </button>
                                </div>
                            </div>
                        );
                    })}
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