import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaUserPlus, 
  FaTrash, 
  FaDice, 
  FaIdBadge, 
  FaDownload, 
  FaUser, 
  FaEdit 
} from 'react-icons/fa';
import { LuUsers, LuSparkles } from 'react-icons/lu';
import { QRCodeSVG } from 'qrcode.react';
import { fichaService } from '../../services/fichaService';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import { calcularStatusPersonagem } from '../../utils/calculosFicha';
import { Card, Button, Badge, Input, Modal, ResourceBar } from '../../components/ui';
import styles from './MestreFichasPage.module.css';

/**
 * Processa a ficha calculando os tetos reais de PV, PM e PI (Fabula Ultima)
 */
function processarFicha(ficha) {
  const itens = ficha.itens || [];
  const itensEquipados = itens.filter(i => i.stats_personalizados?.slot);

  const atributos = {
    destreza: ficha.destreza || 8,
    astucia: ficha.astucia || 8,
    vigor: ficha.vigor || 8,
    vontade: ficha.vontade || 8
  };

  const statusCalc = calcularStatusPersonagem(atributos, ficha.fichas_classes || [], itensEquipados);

  return {
    ...ficha,
    hp_max_real: statusCalc.pvMax,
    mp_max_real: statusCalc.mpMax,
    ip_max_real: statusCalc.piMax,
    pi_max_real: statusCalc.piMax
  };
}

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

    // Subscription em tempo real para sincronização instantânea de PV, PM, PI e dados da ficha
    const canalFichas = fichaService.subscribeFichasPersonagens((payload) => {
      if (payload?.eventType === 'UPDATE' && payload?.new) {
        setFichas((fichasAtuais) =>
          fichasAtuais.map((f) => {
            if (f.id === payload.new.id) {
              return processarFicha({
                ...f,
                ...payload.new
              });
            }
            return f;
          })
        );
      } else {
        carregarTodasFichas();
      }
    });

    return () => {
      fichaService.removeChannel(canalFichas);
    };
  }, []);

  async function carregarTodasFichas() {
    try {
      const fichasData = await fichaService.getFichasCompletasMestre();
      const fichasCompletas = (fichasData || []).map(processarFicha);
      setFichas(fichasCompletas);
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

    const { error } = await fichaService.criarFicha({
      nome_jogador: nomeJogador.trim(),
      nome_personagem: nomePersonagem.trim(),
      jogador_token: registroId.trim(),
      identidade: 'Herói de Aetheria',
      tema: 'Aventura',
      hp_atual: 30,
      hp_max: 30,
      mp_atual: 20,
      mp_max: 20,
      pi_atual: 6,
      ip_atual: 6,
      pi_max: 6,
      nivel: 1
    });

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
      await fichaService.deletarFicha(id);
      carregarTodasFichas();
    }
  };

  const baixarQRCode = (personagemNome, fichaId) => {
    const svgElement = qrRefs.current[fichaId];
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `QRCode_${personagemNome.replace(/\s+/g, '_')}.svg`;

      document.body.appendChild(downloadLink);
      downloadLink.click();

      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar o download do QR Code:', error);
    }
  };

  if (!isMestre) {
    return (
      <div className={styles.page}>
        <div className={styles.blockedContainer}>
          <FaShieldAlt className={styles.lockIcon} />
          <h2>Área Exclusiva do Mestre</h2>
          <p>Você precisa estar logado como Mestre para gerenciar os crachás e fichas da mesa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1><LuUsers /> Gestão de Fichas e Crachás</h1>
          <p>Visualize os dados dos heróis, baixe os QR Codes para crachás e gerencie a mesa.</p>
        </div>
        <Button variant="primary" onClick={() => setModalCriarAberto(true)}>
          <FaUserPlus /> Cadastrar Novo Crachá
        </Button>
      </header>

      {carregando ? (
        <p className={styles.loadingContainer}>Carregando fichas da mesa...</p>
      ) : fichas.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhuma ficha cadastrada na mesa ainda.</p>
          <Button variant="secondary" onClick={() => setModalCriarAberto(true)}>
            Cadastrar Primeira Ficha
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {fichas.map((f) => {
            const urlFicha = `https://rac975.github.io/mapa-aetheria/#/ficha/${f.id}`;
            const hpMaxFinal = f.hp_max_real || f.hp_max || 30;
            const mpMaxFinal = f.mp_max_real || f.mp_max || 20;
            const ipMaxFinal = f.pi_max_real || f.ip_max_real || f.pi_max || 6;
            const ipAtualFinal = f.pi_atual ?? f.ip_atual ?? ipMaxFinal;

            return (
              <Card
                key={f.id}
                variant="interactive"
                className={styles.characterCard}
                onClick={() => navigate(`/mestre/editar/${f.id}`)}
                title="Abrir ficha completa"
              >
                <div>
                  <div className={styles.cardTop}>
                    <div className={styles.cardAvatar}>
                      {f.avatar_url ? (
                        <img src={f.avatar_url} alt={f.nome_personagem} className={styles.avatarImage} />
                      ) : (
                        <FaUser className={styles.avatarIcon} />
                      )}
                    </div>
                    <div className={styles.characterMeta}>
                      <h3 className={styles.characterName}>{f.nome_personagem}</h3>
                      <span className={styles.playerName}>
                        Jogador: <strong>{f.nome_jogador || 'Não informado'}</strong>
                      </span>
                    </div>
                    <Badge variant="gold" size="sm">
                      <FaIdBadge /> #{f.jogador_token}
                    </Badge>
                  </div>

                  <div className={styles.middleSection}>
                    <p className={styles.identityText}>
                      {f.identidade || 'Sem peculiaridade informada'}
                    </p>

                    <div className={styles.classesBox}>
                      <span className={styles.classesLabel}>Classes:</span>
                      <div className={styles.classesList}>
                        {f.fichas_classes && f.fichas_classes.length > 0 ? (
                          f.fichas_classes.map((c, idx) => (
                            <Badge key={idx} variant="gold" size="sm">
                              {c.nome_classe} ({c.nivel}v)
                            </Badge>
                          ))
                        ) : (
                          <span className={styles.noClassesText}>Nenhuma classe informada</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.resourcesSection}>
                    <ResourceBar
                      type="pv"
                      current={f.hp_atual}
                      max={hpMaxFinal}
                      label="PV"
                    />
                    <ResourceBar
                      type="pm"
                      current={f.mp_atual}
                      max={mpMaxFinal}
                      label="PM"
                    />
                    <ResourceBar
                      type="pi"
                      current={ipAtualFinal}
                      max={ipMaxFinal}
                      label="IP"
                    />
                    <div className={styles.badgesRow}>
                      <Badge variant="ether" size="sm">
                        ✨ Fábula: {f.fabula ?? 3}
                      </Badge>
                      <Badge variant="gold" size="sm">
                        Nível {f.nivel || 1}
                      </Badge>
                    </div>
                  </div>

                  <div
                    className={styles.qrSection}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles.qrPreview}>
                      <div className={styles.qrSvgBox}>
                        <div ref={(el) => { if (el) qrRefs.current[f.id] = el; }}>
                          <QRCodeSVG
                            value={urlFicha}
                            size={72}
                            fgColor="#060d17"
                            bgColor="#ffffff"
                            level="M"
                          />
                        </div>
                      </div>
                      <div className={styles.qrTextInfo}>
                        <span className={styles.qrTitle}>QR Crachá</span>
                        <span className={styles.qrToken}>{f.jogador_token}</span>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        baixarQRCode(f.nome_personagem, f.id);
                      }}
                      title="Baixar SVG do QR Code para crachá físico"
                    >
                      <FaDownload /> Baixar QR
                    </Button>
                  </div>
                </div>

                <div
                  className={styles.cardActions}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="core"
                    size="sm"
                    onClick={() => navigate(`/mestre/editar/${f.id}`)}
                  >
                    <FaEdit /> Editar Ficha
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => handleDeletarFicha(f.id, e)}
                  >
                    <FaTrash /> Excluir
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Criar Crachá */}
      <Modal
        isOpen={modalCriarAberto}
        onClose={() => setModalCriarAberto(false)}
        title="Emitir Novo Crachá de Aetheria"
        size="md"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="secondary" onClick={() => setModalCriarAberto(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCriarFicha}>
              <LuSparkles /> Gerar Crachá
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCriarFicha} className={styles.modalForm}>
          <Input
            label="Nome do Jogador (Real)"
            placeholder="Ex: Rafael"
            value={nomeJogador}
            onChange={(e) => setNomeJogador(e.target.value)}
            required
          />

          <Input
            label="Nome do Personagem"
            placeholder="Ex: Cyrion"
            value={nomePersonagem}
            onChange={handleNomePersonagemChange}
            required
          />

          <div className={styles.inputWithAction}>
            <Input
              label="REGISTRO ID (Automático)"
              value={registroId}
              onChange={(e) => setRegistroId(e.target.value)}
              className={styles.inputFlex}
              required
            />
            <Button
              type="button"
              variant="secondary"
              className={styles.diceBtn}
              title="Gerar novo código aleatório"
              onClick={() => setRegistroId(gerarIdAutomatico(nomePersonagem))}
            >
              <FaDice />
            </Button>
          </div>
        </form>
      </Modal>

      <CustomAlert
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />
    </div>
  );
}
