import { useState, useEffect } from 'react';
import { FaScroll, FaShieldAlt, FaCrown } from 'react-icons/fa';
import { npcService } from '../../../services/npcService';
import { fichaService } from '../../../services/fichaService';
import { Badge, Card } from '../../../components/ui';
import { NIVEL_DOMINIO_CLASSE, calcularLimitePoderesHeroicos } from '../../../domain/fabula/heroicAndQuirksRules';
import styles from './FichaClassesSecao.module.css';

import ExibirCompanheiroFiel from '../components/Andarilho/ExibirCompanheiroFiel';
import FichaClasseModuloEspecial from './components/FichaClasseModuloEspecial';

export default function FichaClassesSecao({
  fichaId,
  ficha,
  classes,
  atributosAtuais = {},
  itensEquipados = [],
  handleAjustarRecurso,
  pvMaxCalculado,
  temArmaduraMarcial = false,
  reducaoCustoPi = 0,
  nivelTotal = 5,
  onAtualizarMutante,
  onAtualizarDadosClasse,
  onElevarAtributoTemporario,
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
              <FichaClasseModuloEspecial
                classe={c}
                fichaId={fichaId}
                ficha={ficha}
                classes={classes}
                atributosAtuais={atributosAtuais}
                itensEquipados={itensEquipados}
                handleAjustarRecurso={handleAjustarRecurso}
                hpMaxCalculado={hpMaxCalculado}
                emCrise={emCrise}
                temArmaduraMarcial={temArmaduraMarcial}
                reducaoCustoPi={reducaoCustoPi}
                nivelTotal={nivelTotal}
                onAtualizarMutante={onAtualizarMutante}
                onAtualizarDadosClasse={onAtualizarDadosClasse}
                onElevarAtributoTemporario={onElevarAtributoTemporario}
                onAtivarGolpe={onAtivarGolpe}
              />

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
