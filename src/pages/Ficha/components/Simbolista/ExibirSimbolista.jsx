import {
  FaPaintBrush,
  FaBookOpen,
  FaCheck,
  FaTrash,
  FaExclamationTriangle,
  FaMagic,
  FaEye,
  FaPlus
} from 'react-icons/fa';
import { Card, Button, Badge, Input } from '../../../../components/ui';
import { useSimbolista } from './useSimbolista';
import SimbolistaCatalogoModal from './SimbolistaCatalogoModal';
import styles from './ExibirSimbolista.module.css';

export default function ExibirSimbolista(props) {
  const {
    catalogoSimbolos, nivelSimbolista, nvSimbolismo, nvSimbolosMagicos, nvToquePessoal,
    nvConexaoSimbolica, nvMiragem, maxAprendidos, maxAtivos, limitePmMagicos,
    danoProibicao, custoPiAtual, simbolosAprendidos, simbolosDisponiveis, simbolosAtivos,
    simboloSelecionado, simboloSelecionadoKey, handleSelecionarSimboloKey,
    escolhaOpcao, setEscolhaOpcao, modoAplicacao, setModoAplicacao, nomeAlvo, setNomeAlvo,
    seloRitualTexto, temSelosRituais, temTelaEmBranco, temMiraArcana,
    isModalOpen, setIsModalOpen, feedback, erroMsg,
    handleSalvarAprendidosModal, handleCriarSimbolo, handleDestruirSimbolo, handleSalvarSeloRitual
  } = useSimbolista(props);

  const opcoesSimbolo = simboloSelecionado?.opcoes_escolha || [];

  return (
    <Card variant="default" className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaPaintBrush /> Tecelão de Sigilos — Simbolista
        </div>
        <div className={styles.headerActions}>
          {nvSimbolismo > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
              <FaBookOpen /> Símbolos ({simbolosAprendidos.length}/{maxAprendidos})
            </Button>
          )}
          <Badge variant="pi" size="md">Nível {nivelSimbolista}</Badge>
        </div>
      </div>

      {/* Passivas e Poderes de Suporte */}
      <div className={styles.badgesRow}>
        {nvToquePessoal > 0 && (
          <Badge variant="gold" size="sm">Toque Pessoal: +{nvToquePessoal} Dano/Cura PV/PM</Badge>
        )}
        {nvSimbolosMagicos > 0 && (
          <Badge variant="pm" size="sm">Símbolos Mágicos: Feitiços ≤ {limitePmMagicos} PM</Badge>
        )}
        {nvConexaoSimbolica > 0 && (
          <Badge variant="ether" size="sm"><FaEye /> Conexão Simbólica (2 dias)</Badge>
        )}
        {nvMiragem > 0 && (
          <Badge variant="ether" size="sm"><FaMagic /> Miragem (Ritualismo)</Badge>
        )}
        {temMiraArcana && (
          <Badge variant="core" size="sm">Mira Arcana (+5 Dano / Crítico)</Badge>
        )}
        {temTelaEmBranco && (
          <Badge variant="core" size="sm">Tela em Branco (5–30 PM)</Badge>
        )}
      </div>

      {/* Criador / Aplicador de Símbolos */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaPaintBrush /> Criar e Aplicar Símbolo {nvSimbolismo > 0 ? `(Ativos: ${simbolosAtivos.length}/${maxAtivos})` : ''}
          </span>
          <Badge variant="pi" size="sm">Custo: {custoPiAtual} PI</Badge>
        </div>

        {nvSimbolismo === 0 ? (
          <div className={styles.emptyBox}>
            Adquira níveis na habilidade <strong>Simbolismo</strong> para aprender e criar sigilos (2 por NP).
          </div>
        ) : simbolosDisponiveis.length === 0 ? (
          <div className={styles.emptyBox}>
            <span>Nenhum símbolo aprendido ainda ({simbolosAprendidos.length}/{maxAprendidos}).</span>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <FaBookOpen /> Escolher Símbolos no Catálogo
            </Button>
          </div>
        ) : (
          <div className={styles.creatorBody}>
            <div className={styles.selectsRow}>
              <select
                value={simboloSelecionado?.key || simboloSelecionadoKey}
                onChange={(e) => handleSelecionarSimboloKey(e.target.value)}
                className={styles.select}
              >
                {simbolosDisponiveis.map((s) => (
                  <option key={s.key} value={s.key}>{s.nome}</option>
                ))}
              </select>

              {simboloSelecionado?.requer_escolha && opcoesSimbolo.length > 0 && (
                <select
                  value={opcoesSimbolo.includes(escolhaOpcao) ? escolhaOpcao : opcoesSimbolo[0]}
                  onChange={(e) => setEscolhaOpcao(e.target.value)}
                  className={styles.selectCompact}
                >
                  {opcoesSimbolo.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              )}

              <select value={modoAplicacao} onChange={(e) => setModoAplicacao(e.target.value)} className={styles.selectCompact}>
                <option value="proprio">Aplicar em Si Mesmo</option>
                <option value="aliado">Aplicar em Aliado</option>
                <option value="ataque_livre">Ataque Livre (Inimigos)</option>
              </select>

              {modoAplicacao !== 'proprio' && (
                <Input
                  placeholder={modoAplicacao === 'aliado' ? 'Nome do aliado...' : 'Nome do(s) inimigo(s)...'}
                  value={nomeAlvo}
                  onChange={(e) => setNomeAlvo(e.target.value)}
                />
              )}

              <Button variant="primary" size="sm" onClick={() => handleCriarSimbolo()}>
                <FaPlus /> Criar Símbolo (-{custoPiAtual} PI)
              </Button>
            </div>

            {simboloSelecionado && (
              <div className={styles.previewBox}>
                <div>{simboloSelecionado.descricao}</div>
                {simboloSelecionado.key === 'simbolo_proibicao' && (
                  <Badge variant="crise" size="sm">Perda no seu nível atual: {danoProibicao} PV e {danoProibicao} PM</Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Símbolos Ativos na Cena */}
      {simbolosAtivos.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Símbolos Ativos em Cena ({simbolosAtivos.length}/{maxAtivos})</span>
          </div>
          <div className={styles.activeGrid}>
            {simbolosAtivos.map((sa) => (
              <div key={sa.id} className={styles.activeCard}>
                <div className={styles.activeCardTop}>
                  <div>
                    <div className={styles.activeName}>{sa.nome} {sa.escolha ? `(${sa.escolha})` : ''}</div>
                    <div className={styles.activeTarget}>Alvo: {sa.alvoNome}</div>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDestruirSimbolo(sa.id)} title="Destruir símbolo (0 ações)">
                    <FaTrash />
                  </Button>
                </div>
                <div className={styles.activeDesc}>{sa.efeitoResumido || sa.descricao}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selos Rituais (Poder Heróico) */}
      {temSelosRituais && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}><FaMagic /> Selo Ritual Armazenado (≤ 60 PM)</span>
            {seloRitualTexto && (
              <Button variant="ghost" size="sm" onClick={() => handleSalvarSeloRitual('')}>
                Ativar / Limpar Selo
              </Button>
            )}
          </div>
          <Input
            placeholder="Descreva o ritual armazenado e seu gatilho..."
            value={seloRitualTexto}
            onChange={(e) => handleSalvarSeloRitual(e.target.value)}
          />
        </div>
      )}

      {erroMsg && <div className={styles.erroBox}><FaExclamationTriangle /> {erroMsg}</div>}
      {feedback && <div className={styles.feedbackBox}><FaCheck /> {feedback}</div>}

      <div className={styles.printOnly}>
        <div><strong>Símbolos Aprendidos:</strong> {simbolosDisponiveis.map((s) => s.nome).join(', ') || 'Nenhum'}</div>
        {simbolosAtivos.length > 0 && (
          <div><strong>Ativos:</strong> {simbolosAtivos.map((s) => `${s.nome}${s.escolha ? ` (${s.escolha})` : ''} → ${s.alvoNome}`).join(' | ')}</div>
        )}
      </div>

      {isModalOpen && (
        <SimbolistaCatalogoModal
          onClose={() => setIsModalOpen(false)}
          catalogoSimbolos={catalogoSimbolos}
          simbolosIniciais={simbolosAprendidos}
          maxAprendidos={maxAprendidos}
          nvSimbolismo={nvSimbolismo}
          onSalvar={handleSalvarAprendidosModal}
        />
      )}
    </Card>
  );
}
