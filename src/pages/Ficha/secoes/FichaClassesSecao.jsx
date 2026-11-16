import { useState, useEffect } from 'react';
import { FaScroll, FaShieldAlt } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
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

export default function FichaClassesSecao({ fichaId, ficha, classes, handleAjustarRecurso, pvMaxCalculado, onAtivarGolpe }) {
  const [companheiro, setCompanheiro] = useState(null);
  const [magiasFicha, setMagiasFicha] = useState([]);

  const hpMaxCalculado = pvMaxCalculado || 30;
  const hpAtualReal = Number(ficha?.hp_atual ?? ficha?.pv_atual ?? hpMaxCalculado);

  const limiteCrise = Math.floor(hpMaxCalculado / 2);
  const emCrise = hpAtualReal <= limiteCrise;

  const temCompanheiroFiel = classes?.some(c =>
    (c.habilidades || []).some(h => (h.nome || '').toLowerCase().includes('companheiro fiel') && (parseInt(h.nivel) || 0) > 0)
  );

  // 1. Carregar Companheiro Fiel
  useEffect(() => {
    let active = true;

    async function carregarCompanheiro() {
      if (!fichaId || !temCompanheiroFiel) {
        setCompanheiro(null);
        return;
      }

      const { data, error } = await supabase
        .from('npcs_mestre')
        .select('*')
        .eq('personagem_id', fichaId)
        .eq('tipo_registro', 'companheiro')
        .maybeSingle();

      if (!active) return;

      if (!error && data) {
        setCompanheiro(data);
      } else {
        if (error) console.error("Erro ao carregar companheiro:", error.message);
        setCompanheiro(null);
      }
    }

    carregarCompanheiro();
    return () => { active = false; };
  }, [fichaId, temCompanheiroFiel]);

  // 2. Carregar Magias Normalizadas do Supabase (fichas_magias + catalogo_feiticos)
  useEffect(() => {
    let active = true;

    async function carregarMagias() {
      if (!fichaId) {
        setMagiasFicha([]);
        return;
      }

      const { data, error } = await supabase
        .from('fichas_magias')
        .select(`
id,
customizacoes,
catalogo_feiticos (
id,
nome,
classe,
uso,
ofensivo,
pm_custo,
pm_por_alvo,
max_alvos,
alvo,
duracao,
descricao
)
`)
        .eq('ficha_id', fichaId);

      if (!active) return;

      if (!error && data) {
        setMagiasFicha(data);
      } else {
        if (error) console.error("Erro ao carregar magias da ficha:", error.message);
        setMagiasFicha([]);
      }
    }

    carregarMagias();
    return () => { active = false; };
  }, [fichaId]);

  if (!classes || classes.length === 0) return null;

  return (
    <section className="ficha-card-section">
      <h3><FaScroll /> Classes, Habilidades e Magias</h3>

      {classes.map((c, i) => {
        const habilidadesAtivas = (c.habilidades || []).filter(h => (parseInt(h.nivel) || 0) > 0);

        const nomeClasse = (c.nome_classe || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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

        // Filtra as magias aprendidas que pertencem a esta classe específica
        const magiasDestaClasse = magiasFicha.filter(mf => {
          const classeMagia = (mf.catalogo_feiticos?.classe || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          return classeMagia === nomeClasse;
        });

        return (
          <div key={i} style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #30363d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d4af37', fontWeight: 'bold', fontSize: '1rem' }}>
              <span>{c.nome_classe || 'Classe sem Nome'}</span>
              <span>Nível {c.nivel || 1}</span>
            </div>

            {c.beneficios && (
              <div style={{ fontSize: '0.85rem', color: '#3fb950', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaShieldAlt size={12} /> <span>{c.beneficios}</span>
              </div>
            )}

            {ehInventor && <ExibirInventor fichaId={fichaId} ficha={c} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehLadino && <ExibirLadino fichaId={fichaId} ficha={c} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehAtirador && <ExibirAtirador fichaId={fichaId} ficha={c} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehElementalista && <ExibirElementalista ficha={c} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehQuimerista && <ExibirQuimerista fichaId={fichaId} ficha={c} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehFurioso && <ExibirFurioso ficha={c} handleAjustarRecurso={handleAjustarRecurso} emCriseGlobal={emCrise} />}
            {ehGuerreiroSombrio && <ExibirGuerreiroSombrio ficha={c} handleAjustarRecurso={handleAjustarRecurso} vigorValor={ficha?.vigor || 8} emCriseGlobal={emCrise} classes={classes} onAtivarGolpe={onAtivarGolpe} />}
            {ehOrador && <ExibirOrador ficha={ficha} classeObjeto={c} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehArcanista && <ExibirArcanista ficha={c} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehErudito && <ExibirErudito ficha={c} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehMestreArmas && <ExibirMestreArmas ficha={c} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehEntropista && <ExibirEntropista classeObjeto={c} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehEspiritualista && <ExibirEspiritualista classeObjeto={c} handleAjustarRecurso={handleAjustarRecurso} />}
            {ehGuardiao && <ExibirGuardiao ficha={c} />}


            {/* Habilidades */}
            {habilidadesAtivas.length > 0 && (
              <div style={{ marginTop: '8px', paddingLeft: '10px', borderLeft: '2px solid #d4af37' }}>
                <div style={{ fontSize: '0.75rem', color: '#58a6ff', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '2px' }}>
                  Habilidades
                </div>
                {habilidadesAtivas.map((h, hIdx) => {
                  const ehCompanheiroFiel = (h.nome || '').toLowerCase().includes('companheiro fiel');

                  return (
                    <div key={hIdx} style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      <strong style={{ color: '#f0f6fc' }}>{h.nome}</strong>{' '}
                      <span style={{ color: '#d4af37' }}>(Nv. {h.nivel})</span>:{' '}
                      <span style={{ color: '#9da3af' }}>{h.descricao}</span>

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

            {/* Magias Aprendidas (vindas do catálogo via fichas_magias) */}
            {magiasDestaClasse.length > 0 && (
              <div style={{ marginTop: '8px', paddingLeft: '10px', borderLeft: '2px solid #58a6ff' }}>
                <div style={{ fontSize: '0.75rem', color: '#58a6ff', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '2px' }}>
                  Magias
                </div>
                {magiasDestaClasse.map((mf, mIdx) => {
                  const magia = mf.catalogo_feiticos;
                  if (!magia) return null;

                  return (
                    <div key={mIdx} style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      <strong style={{ color: '#f0f6fc' }}>{magia.nome}</strong>{' '}
                      <span style={{ color: '#3fb950' }}>(MP: {magia.pm_custo})</span>:{' '}
                      <span style={{ color: '#9da3af' }}>{magia.descricao}</span>
                      {mf.customizacoes?.anotacao && (
                        <div style={{ fontSize: '0.75rem', color: '#d4af37', fontStyle: 'italic' }}>
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
    </section>
  );
}