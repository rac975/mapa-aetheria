import { useState, useEffect } from 'react';
import { FaScroll, FaShieldAlt, FaCrown } from 'react-icons/fa';
import { npcService } from '../../../services/npcService';
import { fichaService } from '../../../services/fichaService';
import { Badge, Card } from '../../../components/ui';
import { NIVEL_DOMINIO_CLASSE, calcularLimitePoderesHeroicos } from '../../../domain/fabula/heroicAndQuirksRules';
import styles from './FichaClassesSecao.module.css';

import ExibirCompanheiroFiel from '../components/Andarilho/ExibirCompanheiroFiel';
import ExibirInventor from '../components/Inventor/ExibirInventor';
import ExibirLadino from '../components/Ladino/ExibirLadino';
import ExibirAtirador from '../components/Atirador/ExibirAtirador';
import ExibirGuardiao from '../components/Guardiao/ExibirGuardiao';
import ExibirMestreArmas from '../components/MestreArmas/ExibirMestreArmas';
import ExibirArcanista from '../components/Arcanista/ExibirArcanista';
import ExibirErudito from '../components/Erudito/ExibirErudito';
import ExibirQuimerista from '../components/Quimerista/ExibirQuimerista';
import ExibirFurioso from '../components/Furioso/ExibirFurioso';
import ExibirGuerreiroSombrio from '../components/GuerreiroSombrio/ExibirGuerreiroSombrio';
import ExibirElementalista from '../components/Elementalista/ExibirElementalista';
import ExibirEntropista from '../components/Entropista/ExibirEntropista';
import ExibirEspiritualista from '../components/Espiritualista/ExibirEspiritualista';
import ExibirOrador from '../components/Orador/ExibirOrador';
import ExibirEsper from '../components/Esper/ExibirEsper';
import ExibirMutante from '../components/Mutante/ExibirMutante';
import ExibirPiloto from '../components/Piloto/ExibirPiloto';

export default function FichaClassesSecao({
  fichaId,
  ficha,
  classes,
  handleAjustarRecurso,
  pvMaxCalculado,
  onAtualizarMutante,
  onAtivarGolpe
}) {
  const [companheiro, setCompanheiro] = useState(null);
  const [magiasFicha, setMagiasFicha] = useState([]);

  const hpMaxCalculado = pvMaxCalculado || 30;
  const hpAtualReal = Number(ficha?.hp_atual ?? ficha?.pv_atual ?? hpMaxCalculado);
  const limiteCrise = Math.floor(hpMaxCalculado / 2);
  const emCrise = hpAtualReal <= limiteCrise;

  const temCompanheiroFiel = classes?.some(c =>
    (c.habilidades || []).some(h => (h.nome || '').toLowerCase().includes('companheiro fiel') && (parseInt(h.nivel, 10) || 0) > 0)
  );

  // 1. Carregar Companheiro Fiel via Service Layer
  useEffect(() => {
    let active = true;
    async function carregarCompanheiro() {
      if (!fichaId || !temCompanheiroFiel) {
        setCompanheiro(null);
        return;
      }
      try {
        const { data, error } = await npcService.getCompanheiroFielPorPersonagemId(fichaId);
        if (active) setCompanheiro(!error && data ? data : null);
      } catch (err) {
        console.error("Erro ao carregar companheiro:", err);
        if (active) setCompanheiro(null);
      }
    }
    carregarCompanheiro();
    return () => { active = false; };
  }, [fichaId, temCompanheiroFiel]);

  // 2. Carregar Magias Normalizadas do Supabase via Service Layer
  useEffect(() => {
    let active = true;
    async function carregarMagias() {
      if (!fichaId) {
        setMagiasFicha([]);
        return;
      }
      try {
        const data = await fichaService.getMagiasComCatalogoByFichaId(fichaId);
        if (active) setMagiasFicha(data || []);
      } catch (err) {
        console.error("Erro ao carregar magias da ficha:", err);
        if (active) setMagiasFicha([]);
      }
    }
    carregarMagias();
    return () => { active = false; };
  }, [fichaId]);

  if (!classes || classes.length === 0) return null;

  const totalDominadas = calcularLimitePoderesHeroicos(classes);

  return (
    <Card variant="default" className={styles.container}>
      <h3 className={styles.sectionHeader}>
        <FaScroll /> Classes, Habilidades e Magias
        {totalDominadas > 0 && (
          <Badge variant="core" size="sm">
            <FaCrown /> {totalDominadas} Dominada(s) (Nv. 10)
          </Badge>
        )}
      </h3>

      <div className={styles.classList}>
        {classes.map((c, i) => {
          const habilidadesAtivas = (c.habilidades || []).filter(h => (parseInt(h.nivel, 10) || 0) > 0);
          const nomeClasse = (c.nome_classe || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          const classeDominada = (parseInt(c.nivel, 10) || 0) >= NIVEL_DOMINIO_CLASSE;

          const ehInventor = nomeClasse.includes('inventor');
          const ehLadino = nomeClasse.includes('ladino');
          const ehAtirador = nomeClasse.includes('atirador');
          const ehGuardiao = nomeClasse.includes('guardiao');
          const ehMestreArmas = nomeClasse.includes('mestre de armas');
          const ehQuimerista = nomeClasse.includes('quimerista');
          const ehArcanista = nomeClasse.includes('arcanista');
          const ehErudito = nomeClasse.includes('erudito');
          const ehFurioso = nomeClasse.includes('furioso');
          const ehOrador = nomeClasse.includes('orador');
          const ehGuerreiroSombrio = nomeClasse.includes('guerreiro sombrio');
          const ehElementalista = nomeClasse.includes('elementalista');
          const ehEspiritualista = nomeClasse.includes('espiritualista');
          const ehEntropista = nomeClasse.includes('entropista');
          const ehEsper = nomeClasse.includes('esper');
          const ehMutante = nomeClasse.includes('mutant');
          const ehPiloto = nomeClasse.includes('pilot');

          const magiasDestaClasse = magiasFicha.filter(mf => {
            const classeMagia = (mf.catalogo_feiticos?.classe || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return classeMagia === nomeClasse;
          });

          return (
            <div key={i} className={styles.classCard}>
              <div className={styles.classTopBar}>
                <span className={styles.className}>{c.nome_classe || 'Classe sem Nome'}</span>
                <div className={styles.classTopBar}>
                  {classeDominada && <Badge variant="core" size="sm"><FaCrown /> Dominada</Badge>}
                  <Badge variant="gold" size="md">Nível {c.nivel || 1}</Badge>
                </div>
              </div>

              {c.beneficios && (
                <div className={styles.classBenefits}>
                  <FaShieldAlt /> <span>{c.beneficios}</span>
                </div>
              )}

              {/* Módulos Especiais de Classe */}
              {ehInventor && <ExibirInventor fichaId={fichaId} ficha={c} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehLadino && <ExibirLadino fichaId={fichaId} ficha={c} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehAtirador && <ExibirAtirador fichaId={fichaId} ficha={c} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehElementalista && <ExibirElementalista ficha={c} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehQuimerista && <ExibirQuimerista fichaId={fichaId} ficha={c} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehFurioso && <ExibirFurioso ficha={c} handleAjustarRecurso={handleAjustarRecurso} emCriseGlobal={emCrise} />}
              {ehGuerreiroSombrio && (
                <ExibirGuerreiroSombrio
                  ficha={c}
                  handleAjustarRecurso={handleAjustarRecurso}
                  vigorValor={ficha?.vigor || 8}
                  emCriseGlobal={emCrise}
                  classes={classes}
                  onAtivarGolpe={onAtivarGolpe}
                />
              )}
              {ehOrador && <ExibirOrador ficha={ficha} classeObjeto={c} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehArcanista && <ExibirArcanista ficha={c} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehErudito && <ExibirErudito ficha={c} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehMestreArmas && <ExibirMestreArmas ficha={c} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehEntropista && <ExibirEntropista classeObjeto={c} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehEspiritualista && <ExibirEspiritualista classeObjeto={c} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehGuardiao && <ExibirGuardiao ficha={c} />}
              {ehEsper && <ExibirEsper ficha={ficha} classe={c} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
              {ehMutante && (
                <ExibirMutante
                  ficha={ficha}
                  classe={c}
                  classes={classes}
                  handleAjustarRecurso={handleAjustarRecurso}
                  emCriseGlobal={emCrise}
                  pvMaxCalculado={hpMaxCalculado}
                  onAtualizarMutante={onAtualizarMutante}
                />
              )}
              {ehPiloto && <ExibirPiloto fichaId={fichaId || ficha?.id} ficha={ficha} classe={c} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}

              {/* Habilidades Oficiais */}
              {habilidadesAtivas.length > 0 && (
                <div className={styles.habilidadesBox}>
                  <div className={styles.subSectionTitle}>Habilidades</div>
                  {habilidadesAtivas.map((h, hIdx) => {
                    const ehCompanheiroFiel = (h.nome || '').toLowerCase().includes('companheiro fiel');
                    return (
                      <div key={hIdx} className={styles.habilidadeItem}>
                        <strong className={styles.habilidadeNome}>{h.nome}</strong>{' '}
                        <Badge variant="gold" size="sm" className={styles.habilidadeNivelBadge}>
                          Nv. {h.nivel}
                        </Badge>:{' '}
                        <span className={styles.habilidadeDescricao}>{h.descricao}</span>

                        {ehCompanheiroFiel && (
                          <ExibirCompanheiroFiel
                            companheiro={companheiro}
                            handleAjustarRecurso={handleAjustarRecurso}
                            fichaId={fichaId}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Magias Aprendidas da Classe */}
              {magiasDestaClasse.length > 0 && (
                <div className={styles.magiasBox}>
                  <div className={styles.subSectionTitle}>Magias</div>
                  {magiasDestaClasse.map((mf, mIdx) => {
                    const magia = mf.catalogo_feiticos;
                    if (!magia) return null;
                    return (
                      <div key={mIdx} className={styles.magiaItem}>
                        <strong className={styles.magiaNome}>{magia.nome}</strong>{' '}
                        <Badge variant="ether" size="sm">MP: {magia.pm_custo}</Badge>:{' '}
                        <span className={styles.magiaDescricao}>{magia.descricao}</span>
                        {mf.customizacoes?.anotacao && (
                          <div className={styles.magiaNota}>
                            Nota: {mf.customizacoes.anotacao}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
