import {
  FaMusic,
  FaBookOpen,
  FaVolumeUp,
  FaCheck,
  FaShieldAlt,
  FaBolt,
  FaMagic,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Card, Button, Badge } from '../../../../components/ui';
import { useVirtuoso } from './useVirtuoso';
import VirtuosoRepertorioModal from './VirtuosoRepertorioModal';
import styles from './ExibirVirtuoso.module.css';

export default function ExibirVirtuoso(props) {
  const {
    volumes, catalogoEscalas, catalogoTons,
    nivelVirtuoso, nvMagicanto, nvBarreiraSonora, nvHarmonia, nvVibrato, nvCantoSereia,
    limiteMagicanto, escalasAprendidas, tonsAprendidos, escalasDisponiveis, tonsDisponiveis,
    volumeKey, setVolumeKey, escalaKey, setEscalaKey, tomKey, setTomKey,
    escalaSelecionada, tomSelecionado, custoAtual, previewValores,
    temMusicaTema, musicaTemaAtiva, setMusicaTemaAtiva, escalaMusicaTema, setEscalaMusicaTema,
    temTrilhaEpica, trilhaEpicaModo, setTrilhaEpicaModo,
    alvoFracoEhInimigo, setAlvoFracoEhInimigo,
    nvHipercognicao, temFocoCognitivoAlvo, setTemFocoCognitivoAlvo, unicoAlvoFoco, setUnicoAlvoFoco,
    temArmaArcanaEquipada, isModalOpen, setIsModalOpen,
    feedback, erroMsg, ultimoVersoResumo, handleSalvarRepertorio, handleCantarVerso
  } = useVirtuoso(props);

  const totalAprendidos = escalasAprendidas.length + tonsAprendidos.length;

  return (
    <Card variant="ether" className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaMusic /> Maestro Arcano — Virtuoso (Cantor)
        </div>
        <div className={styles.headerActions}>
          {nvMagicanto > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
              <FaBookOpen /> Repertório ({totalAprendidos}/{limiteMagicanto.totalItens})
            </Button>
          )}
          <Badge variant="pm" size="md">Nível {nivelVirtuoso}</Badge>
        </div>
      </div>

      {/* Badges Passivas e Sinergias */}
      <div className={styles.badgesRow}>
        {nvBarreiraSonora > 0 && (
          <Badge variant="gold" size="sm">
            <FaShieldAlt /> Barreira Sonora: -{nvBarreiraSonora} Dano Físico (Médio/Forte)
          </Badge>
        )}
        {nvVibrato > 0 && (
          <Badge variant="core" size="sm">
            <FaBolt /> Vibrato: Ataque Livre RA=0 (Fraco/Médio)
          </Badge>
        )}
        {nvHarmonia > 0 && (
          <Badge variant={temArmaArcanaEquipada ? 'ether' : 'default'} size="sm">
            Harmonia NP {nvHarmonia}: {temArmaArcanaEquipada ? `+${nvHarmonia} Dano / +${nvHarmonia} PM` : 'Requer Arma Arcana'}
          </Badge>
        )}
        {nvCantoSereia > 0 && (
          <Badge variant="ether" size="sm">
            <FaMagic /> Canto da Sereia (Ritualismo)
          </Badge>
        )}
      </div>

      {/* Compositor de Verso */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaVolumeUp /> Compositor de Versos (Magicanto {nvMagicanto > 0 ? `NP ${nvMagicanto}` : ''})
          </span>
          <Badge variant="pm" size="sm">
            Custo: {custoAtual.custoPm} PM{custoAtual.custoFabula > 0 ? ` + ${custoAtual.custoFabula} PF` : ''}
          </Badge>
        </div>

        {nvMagicanto === 0 ? (
          <div className={styles.emptyBox}>
            Adquira níveis na habilidade <strong>Magicanto</strong> para aprender Escalas (Chaves) e Tons e compor Versos.
          </div>
        ) : escalasDisponiveis.length === 0 || tonsDisponiveis.length === 0 ? (
          <div className={styles.emptyBox}>
            <span>Escolha suas Escalas e Tons aprendidos ({totalAprendidos}/{limiteMagicanto.totalItens}) no repertório para cantar Versos.</span>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <FaBookOpen /> Configurar Repertório
            </Button>
          </div>
        ) : (
          <div className={styles.composerBody}>
            <div className={styles.volumeRow}>
              {volumes.map((vol) => (
                <button
                  key={vol.key}
                  type="button"
                  onClick={() => setVolumeKey(vol.key)}
                  className={`${styles.volumeBtn} ${volumeKey === vol.key ? styles.volumeBtnActive : ''}`}
                >
                  <span>{vol.nome}</span>
                  <span className={styles.volumeCost}>{vol.custoPm} PM</span>
                </button>
              ))}
            </div>

            <div className={styles.selectsRow}>
              <select value={escalaSelecionada?.key || escalaKey} onChange={(e) => setEscalaKey(e.target.value)} className={styles.select}>
                {escalasDisponiveis.map((esc) => (
                  <option key={esc.key} value={esc.key}>
                    Escala: {esc.nome} ({esc.tipo_dano} • {esc.condicao} • {esc.atributo} • {esc.recuperacao})
                  </option>
                ))}
              </select>

              <select value={tomSelecionado?.key || tomKey} onChange={(e) => setTomKey(e.target.value)} className={styles.select}>
                {tonsDisponiveis.map((tom) => (
                  <option key={tom.key} value={tom.key}>Tom: {tom.nome}</option>
                ))}
              </select>

              <Button variant="primary" size="sm" onClick={handleCantarVerso}>
                <FaMusic /> Cantar Verso (-{custoAtual.custoPm} PM)
              </Button>
            </div>

            <div className={styles.optionsRow}>
              {nvHarmonia > 0 && volumeKey === 'fraco' && (
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={alvoFracoEhInimigo} onChange={(e) => setAlvoFracoEhInimigo(e.target.checked)} />
                  Alvo do Verso Fraco é inimigo (Harmonia)
                </label>
              )}
              {nvHipercognicao > 0 && (
                <>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={temFocoCognitivoAlvo} onChange={(e) => setTemFocoCognitivoAlvo(e.target.checked)} />
                    Alveja Foco Cognitivo (-{nvHipercognicao} PM)
                  </label>
                  {temFocoCognitivoAlvo && (
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={unicoAlvoFoco} onChange={(e) => setUnicoAlvoFoco(e.target.checked)} />
                      Único alvo (-{nvHipercognicao * 2} PM)
                    </label>
                  )}
                </>
              )}
              {temMusicaTema && (
                <div className={styles.inlineGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={musicaTemaAtiva} onChange={(e) => setMusicaTemaAtiva(e.target.checked)} />
                    Música Tema Ativa
                  </label>
                  <select value={escalaMusicaTema} onChange={(e) => setEscalaMusicaTema(e.target.value)} className={styles.selectCompact}>
                    <option value="">Escala da Música Tema...</option>
                    {escalasDisponiveis.map((esc) => (
                      <option key={esc.key} value={esc.key}>{esc.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              {temTrilhaEpica && (volumeKey === 'medio' || volumeKey === 'forte') && (
                <select value={trilhaEpicaModo} onChange={(e) => setTrilhaEpicaModo(e.target.value)} className={styles.selectCompact}>
                  <option value="nenhum">Trilha Épica: Desligada</option>
                  <option value="dobrar_pm">Trilha Épica: Dobrar PM</option>
                  <option value="ponto_fabula">Trilha Épica: 1 PF</option>
                </select>
              )}
            </div>

            <div className={styles.previewBox}>
              <div className={styles.previewMeta}>
                <strong>Alvos ({custoAtual.volumeObj.nome}):</strong> {custoAtual.volumeObj.alvos}
              </div>
              <div className={styles.previewTexto}>
                <strong>Efeito ({escalaSelecionada?.nome} + {tomSelecionado?.nome}):</strong> {previewValores.textoResolvido}
              </div>
              {previewValores.danoCalculado !== null && (
                <Badge variant="crise" size="sm">Dano Calculado: {previewValores.danoCalculado} ({previewValores.tipoDano})</Badge>
              )}
              {previewValores.curaCalculada !== null && (
                <Badge variant="pv" size="sm">Recuperação: {previewValores.curaCalculada} {previewValores.recuperacaoTipo}</Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {erroMsg && <div className={styles.erroBox}><FaExclamationTriangle /> {erroMsg}</div>}
      {feedback && <div className={styles.feedbackBox}><FaCheck /> {feedback}</div>}

      <div className={styles.printOnly}>
        <div><strong>Escalas Aprendidas:</strong> {escalasDisponiveis.map((e) => e.nome).join(', ') || 'Nenhuma'}</div>
        <div><strong>Tons Aprendidos:</strong> {tonsDisponiveis.map((t) => t.nome).join(', ') || 'Nenhum'}</div>
        {ultimoVersoResumo && <div><strong>Último Verso:</strong> {ultimoVersoResumo.titulo} — {ultimoVersoResumo.texto}</div>}
      </div>

      {isModalOpen && (
        <VirtuosoRepertorioModal
          onClose={() => setIsModalOpen(false)}
          catalogoEscalas={catalogoEscalas}
          catalogoTons={catalogoTons}
          escalasIniciais={escalasAprendidas}
          tonsIniciais={tonsAprendidos}
          nvMagicanto={nvMagicanto}
          totalPermitido={limiteMagicanto.totalItens}
          onSalvar={handleSalvarRepertorio}
        />
      )}
    </Card>
  );
}
