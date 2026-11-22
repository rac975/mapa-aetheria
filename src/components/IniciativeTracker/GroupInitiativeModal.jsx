import { useState, useMemo } from 'react';
import { FaBolt, FaDice, FaCrown, FaHeart, FaCheck, FaTimes, FaUsers } from 'react-icons/fa';
import { Button, Badge } from '../ui';
import {
  calcularNdIniciativaInimigos,
  extrairForcaLacoComLider,
  executarTesteGrupoIniciativa,
  ND_TESTE_APOIO
} from '../../domain/fabula/combatGroupInitiativeRules';
import { extrairModificadorIniciativaHeroi } from '../../domain/fabula/combatInitiativeRules';
import styles from './GroupInitiativeModal.module.css';

export default function GroupInitiativeModal({
  isOpen, onClose, participantes = [], npcsDisponiveis = [], obterPerfilRolagem, onAplicarResultado
}) {
  const herois = useMemo(() => (participantes || []).filter((p) => p.tipo === 'heroi'), [participantes]);
  const infoNd = useMemo(
    () => calcularNdIniciativaInimigos(participantes, npcsDisponiveis),
    [participantes, npcsDisponiveis]
  );

  const [liderId, setLiderId] = useState('');
  const [apoiadoresAtivos, setApoiadoresAtivos] = useState({});
  const [lacosOverride, setLacosOverride] = useState({});
  const [resultadoGrupo, setResultadoGrupo] = useState(null);

  if (!isOpen) return null;

  const liderObj = herois.find((h) => String(h.id) === String(liderId)) || herois[0] || null;
  const perfilLider = liderObj && obterPerfilRolagem ? obterPerfilRolagem(liderObj) : null;
  const modIniLider = liderObj ? extrairModificadorIniciativaHeroi(liderObj, perfilLider?.ficha, perfilLider) : 0;
  const candidatosApoio = herois.filter((h) => String(h.id) !== String(liderObj?.id));

  const handleRolarTesteGrupo = () => {
    if (!liderObj) return;
    const listaApoiadores = candidatosApoio
      .filter((ap) => apoiadoresAtivos[String(ap.id)] !== false)
      .map((ap) => {
        const perfilAp = obterPerfilRolagem ? obterPerfilRolagem(ap) : null;
        const lacoAuto = extrairForcaLacoComLider(perfilAp?.ficha, liderObj.nome);
        const lacoVal = lacosOverride[String(ap.id)] !== undefined ? Number(lacosOverride[String(ap.id)]) : lacoAuto;
        return { combatente: ap, perfil: perfilAp, ficha: perfilAp?.ficha || null, forcaLacoOverride: lacoVal };
      });

    const res = executarTesteGrupoIniciativa({
      lider: liderObj, perfilLider, fichaLider: perfilLider?.ficha || null,
      apoiadores: listaApoiadores, ndInimigos: infoNd.ndLider
    });
    setResultadoGrupo(res);
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleCluster}>
            <FaBolt className={styles.headerIcon} />
            <div>
              <h3 className={styles.title}>Teste em Grupo de Iniciativa — [DES + AST]</h3>
              <p className={styles.subtitle}>Líder vs Maior Iniciativa Inimiga • Apoiadores vs ND {ND_TESTE_APOIO}</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar"><FaTimes /></button>
        </div>

        <div className={styles.ndBanner}>
          <div className={styles.ndMain}>
            <span className={styles.ndLabel}>ND DO TESTE DO LÍDER (MAIOR INICIATIVA INIMIGA):</span>
            <strong className={styles.ndValue}>ND {infoNd.ndLider}</strong>
            <span className={styles.ndEnemyName}>({infoNd.maiorInimigoNome})</span>
          </div>
          {infoNd.iniciativasInimigos.length > 0 && (
            <div className={styles.enemyPills}>
              {infoNd.iniciativasInimigos.map((ini) => (
                <span key={ini.id} className={styles.enemyPill}>{ini.nome}: <strong>INI {ini.iniciativa}</strong> (Ficha)</span>
              ))}
            </div>
          )}
        </div>

        {herois.length === 0 ? (
          <p className={styles.emptyNotice}>Adicione pelo menos um Herói à cena para realizar o Teste em Grupo.</p>
        ) : (
          <div className={styles.bodyGrid}>
            <div className={styles.sectionBox}>
              <h4 className={styles.sectionTitle}><FaCrown /> 1. Selecionar Líder do Grupo</h4>
              <div className={styles.heroList}>
                {herois.map((h) => {
                  const perf = obterPerfilRolagem ? obterPerfilRolagem(h) : null;
                  const mod = extrairModificadorIniciativaHeroi(h, perf?.ficha, perf);
                  const isLider = String(h.id) === String(liderObj?.id);
                  return (
                    <button
                      key={h.id} type="button"
                      className={`${styles.heroSelectBtn} ${isLider ? styles.heroSelectBtnActive : ''}`}
                      onClick={() => { setLiderId(String(h.id)); setResultadoGrupo(null); }}
                    >
                      <span className={styles.heroName}>{h.nome}</span>
                      <span className={styles.heroStats}>
                        d{perf?.atributosAtuais?.des || 8}+d{perf?.atributosAtuais?.ast || 8} • Mod. INI: <strong>{mod >= 0 ? `+${mod}` : mod}</strong>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.sectionBox}>
              <h4 className={styles.sectionTitle}>
                <FaUsers /> 2. Personagens Apoiadores (ND {ND_TESTE_APOIO} • +1 por sucesso + Maior Laço)
              </h4>
              {candidatosApoio.length === 0 ? (
                <p className={styles.smallMuted}>Nenhum outro herói na cena para atuar como apoiador.</p>
              ) : (
                <div className={styles.supportersList}>
                  {candidatosApoio.map((ap) => {
                    const perf = obterPerfilRolagem ? obterPerfilRolagem(ap) : null;
                    const mod = extrairModificadorIniciativaHeroi(ap, perf?.ficha, perf);
                    const lacoAuto = extrairForcaLacoComLider(perf?.ficha, liderObj?.nome);
                    const lacoAtual = lacosOverride[String(ap.id)] !== undefined ? Number(lacosOverride[String(ap.id)]) : lacoAuto;
                    const ativo = apoiadoresAtivos[String(ap.id)] !== false;
                    return (
                      <div key={ap.id} className={`${styles.supporterRow} ${!ativo ? styles.supporterDisabled : ''}`}>
                        <label className={styles.supporterCheckLabel}>
                          <input
                            type="checkbox" checked={ativo}
                            onChange={(e) => {
                              setApoiadoresAtivos((prev) => ({ ...prev, [String(ap.id)]: e.target.checked }));
                              setResultadoGrupo(null);
                            }}
                          />
                          <span className={styles.heroName}>{ap.nome}</span>
                          <span className={styles.heroStats}>
                            (d{perf?.atributosAtuais?.des || 8}+d{perf?.atributosAtuais?.ast || 8}, Mod {mod >= 0 ? `+${mod}` : mod})
                          </span>
                        </label>
                        <div className={styles.bondControl}>
                          <FaHeart className={styles.bondIcon} /> Laço c/ Líder:
                          <select
                            className={styles.bondSelect} value={lacoAtual}
                            onChange={(e) => {
                              setLacosOverride((prev) => ({ ...prev, [String(ap.id)]: Number(e.target.value) }));
                              setResultadoGrupo(null);
                            }}
                          >
                            {[0, 1, 2, 3, 4, 5, 6].map((v) => <option key={v} value={v}>+{v}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {resultadoGrupo && (
          <div className={`${styles.resultBox} ${resultadoGrupo.heroisVenceram ? styles.resultWin : styles.resultLose}`}>
            <div className={styles.vereditoHeader}>
              <strong>{resultadoGrupo.veredito}</strong>
              {resultadoGrupo.isCritico && <Badge variant="gold" size="sm">🌟 SUCESSO CRÍTICO (OPORTUNIDADE!)</Badge>}
              {resultadoGrupo.isFumble && <Badge variant="crise" size="sm">💀 FALHA CRÍTICA (OPORTUNIDADE!)</Badge>}
            </div>
            <p className={styles.resultFormula}>
              Líder <strong>{resultadoGrupo.liderNome}</strong>: [{resultadoGrupo.d1}+{resultadoGrupo.d2}]
              {' '} + Mod ({modIniLider >= 0 ? `+${modIniLider}` : modIniLider}) + Apoio (+{resultadoGrupo.bonusApoiadores})
              {' '} + Maior Laço (+{resultadoGrupo.maiorForcaLaco}) = <strong>{resultadoGrupo.totalLider}</strong> vs <strong>ND {resultadoGrupo.ndInimigos}</strong>
            </p>
            {resultadoGrupo.resultadosApoiadores.length > 0 && (
              <div className={styles.supportResultsRow}>
                {resultadoGrupo.resultadosApoiadores.map((r) => (
                  <span key={r.id} className={`${styles.supResultPill} ${r.sucesso ? styles.supPass : styles.supFail}`}>
                    {r.nome}: [{r.d1}+{r.d2}]{r.modIniciativa >= 0 ? `+${r.modIniciativa}` : r.modIniciativa} = {r.total}
                    {' '} ({r.sucesso ? `✓ +1${r.forcaLacoAplicada > 0 ? ` | Laço +${r.forcaLacoAplicada}` : ''}` : '✗ Falhou'})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          {herois.length > 0 && (
            <Button variant="primary" size="sm" onClick={handleRolarTesteGrupo}>
              <FaDice /> {resultadoGrupo ? 'Rolar Novamente' : 'Rolar Teste em Grupo [DES + AST]'}
            </Button>
          )}
          {resultadoGrupo && (
            <Button variant="gold" size="sm" onClick={() => onAplicarResultado?.(resultadoGrupo)}>
              <FaCheck /> Aplicar ao Grupo ({resultadoGrupo.totalLider}) e Ordenar Fila
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
