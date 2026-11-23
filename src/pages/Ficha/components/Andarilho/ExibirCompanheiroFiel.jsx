import React, { useState, useMemo } from 'react';
import { FaPaw, FaMagic, FaCog } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import { extrairValorDado } from '../../../../domain/fabula/classRules';
import { formatarPoderNpcParaExibicao } from '../../../../domain/fabula/npcRules';
import { Button, Badge } from '../../../../components/ui';
import CompanheiroStats from './CompanheiroStats';
import CompanheiroAtaqueItem from './CompanheiroAtaqueItem';
import CompanheiroFielCard from './CompanheiroFielCard';
import styles from './ExibirCompanheiroFiel.module.css';

const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

export default function ExibirCompanheiroFiel({
  companheiro,
  handleAjustarRecurso,
  fichaId,
  classes = [],
  isMestre = false,
  podeEditar = true,
  onAtualizarCompanheiro
}) {
  const [modoAtaqueState, setModoAtaqueState] = useState({});
  const [resultadosRolagem, setResultadosRolagem] = useState({});
  const [mostrarEditor, setMostrarEditor] = useState(false);

  const poderesFormatados = useMemo(() => {
    const lista = Array.isArray(companheiro?.poderes) ? companheiro.poderes : [];
    const vistos = new Set();
    const res = [];
    for (const p of lista) {
      if (!p) continue;
      const chave = String(p.nome || p.id || p).toLowerCase().trim();
      if (!vistos.has(chave)) {
        vistos.add(chave);
        res.push(formatarPoderNpcParaExibicao(p));
      }
    }
    return res;
  }, [companheiro]);

  const conjurarFeiticoCompanheiro = (feitico) => {
    const custo = parseInt(feitico.pm_custo || 0, 10);
    if (custo > 0 && handleAjustarRecurso) {
      handleAjustarRecurso('mp_atual', -custo);
    }
  };

  if (!companheiro) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}><FaPaw /> Companheiro Fiel</span>
        </div>
        <CompanheiroFielCard
          fichaId={fichaId}
          classes={classes}
          isMestre={isMestre}
          podeEditar={podeEditar}
          onCompanheiroAtualizado={onAtualizarCompanheiro}
        />
      </div>
    );
  }

  const executarRolagemAtaqueCompanheiro = (ataque, indexAtaque) => {
    const atributosComp = companheiro.atributos || { des: 'd8', ast: 'd6', vig: 'd8', von: 'd8' };
    const mapaAtributos = {
      'des': extrairValorDado(atributosComp.des),
      'ast': extrairValorDado(atributosComp.ast),
      'vig': extrairValorDado(atributosComp.vig),
      'von': extrairValorDado(atributosComp.von)
    };
    const attr1Key = (ataque.atributo_dado1 || 'des').toLowerCase();
    const attr2Key = (ataque.atributo_dado2 || 'vig').toLowerCase();
    const faces1 = mapaAtributos[attr1Key] || 8;
    const faces2 = mapaAtributos[attr2Key] || 8;
    const res1 = rolarDado(faces1);
    const res2 = rolarDado(faces2);
    const bonusPrecisaoBase = parseInt(companheiro.bonus_precisao || 5, 10) || 0;
    const modPrecisaoAtk = parseInt(ataque.bonus_precisao || 0, 10) || 0;
    const bonusPrecisao = bonusPrecisaoBase + modPrecisaoAtk;
    const testeAtaque = res1 + res2 + bonusPrecisao;

    let statusCritico = null;
    if (res1 === 1 && res2 === 1) statusCritico = 'Erro Crítico (Fumble)';
    else if (res1 === res2 && res1 >= 6) statusCritico = 'Sucesso Crítico!';

    const dadoMaisAlto = Math.max(res1, res2);
    const modoAtual = modoAtaqueState[indexAtaque] || 'normal';
    const isMulti = modoAtual === 'multi';
    const bonusOriginal = (ataque.bonus_dano !== undefined && ataque.bonus_dano !== null && ataque.bonus_dano !== '')
      ? (parseInt(ataque.bonus_dano, 10) || 0)
      : (parseInt(companheiro.bonus_dano || companheiro.nivel_poder || 5, 10) || 5);
    const bonusDanoFixo = isMulti ? 0 : bonusOriginal;
    const danoTotal = dadoMaisAlto + bonusDanoFixo;

    setResultadosRolagem(prev => ({
      ...prev,
      [indexAtaque]: {
        res1, res2, attr1Label: attr1Key.toUpperCase(), attr2Label: attr2Key.toUpperCase(),
        faces1, faces2, bonusPrecisao, testeAtaque, statusCritico, dadoMaisAlto,
        bonusOriginal, bonusDanoFixo, danoTotal, isMulti
      }
    }));
  };

  const alterarModoAtaque = (indexAtaque, modo) => {
    setModoAtaqueState(prev => ({ ...prev, [indexAtaque]: modo }));
  };

  const temPermissaoEdicao = podeEditar || isMestre;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>
          <FaPaw /> {companheiro.nome || 'Companheiro'}
        </span>
        <div className={styles.headerActions}>
          <Badge variant="ether" size="sm">
            Espécie: {companheiro.especie || 'Fera'} | Nível 5
          </Badge>
          {temPermissaoEdicao && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setMostrarEditor(!mostrarEditor)}
            >
              <FaCog /> {mostrarEditor ? 'Ver Dados de Combate' : 'Configurar / Editar'}
            </Button>
          )}
        </div>
      </div>

      {mostrarEditor ? (
        <CompanheiroFielCard
          fichaId={fichaId}
          classes={classes}
          isMestre={isMestre}
          podeEditar={podeEditar}
          onCompanheiroAtualizado={onAtualizarCompanheiro}
          companheiroInicial={companheiro}
        />
      ) : (
        <>
          <CompanheiroStats companheiro={companheiro} />

          {companheiro.tracos && companheiro.tracos.some(Boolean) && (
            <div className={styles.sectionBox}>
              <div className={styles.sectionTitle}>Traços</div>
              <div className={styles.traitsList}>
                {companheiro.tracos.filter(Boolean).map((traco, tIdx) => (
                  <div key={tIdx} className={styles.traitItem}>• {traco}</div>
                ))}
              </div>
            </div>
          )}

          {companheiro.ataques_basicos && companheiro.ataques_basicos.length > 0 && (
            <div className={styles.sectionBox}>
              <div className={styles.sectionTitle}>Ataques Básicos</div>
              <div className={styles.attacksList}>
                {companheiro.ataques_basicos.map((atk, aIdx) => (
                  <CompanheiroAtaqueItem
                    key={aIdx}
                    ataque={atk}
                    indexAtaque={aIdx}
                    modoAtual={modoAtaqueState[aIdx] || 'normal'}
                    onAlterarModo={alterarModoAtaque}
                    onRolarAtaque={executarRolagemAtaqueCompanheiro}
                    ultimaRolagem={resultadosRolagem[aIdx]}
                  />
                ))}
              </div>
            </div>
          )}

          {companheiro.feiticos && companheiro.feiticos.length > 0 && (
            <div>
              <div className={styles.sectionTitleSpells}><FaMagic /> Feitiços e Magias</div>
              <div className={styles.spellsList}>
                {companheiro.feiticos.map((f, fIdx) => (
                  <div key={fIdx} className={styles.spellCard}>
                    <div className={styles.spellHeader}>
                      <strong className={styles.spellName}>{f.nome}</strong>
                      <span className={styles.spellCost}>({f.pm_custo} PM)</span>
                    </div>
                    <div className={styles.spellDesc}>{f.descricao}</div>
                    <div>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => conjurarFeiticoCompanheiro(f)}
                      >
                        ✨ Conjurar (Gastar {f.pm_custo || 0} PM)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {poderesFormatados.length > 0 && (
            <div className={styles.sectionBox}>
              <div className={styles.sectionTitle}>
                <LuSparkles /> Poderes Especiais ({poderesFormatados.length})
              </div>
              <div className={styles.powersList}>
                {poderesFormatados.map((pod, pIdx) => (
                  <div key={pIdx} className={styles.powerCard}>
                    <div className={styles.powerHeader}>
                      <strong className={styles.powerName}>{pod.nome}</strong>
                      <div className={styles.powerBadges}>
                        {pod.tagsParametros.map((tag, tIdx) => (
                          <Badge key={tIdx} variant="ether" size="sm">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    {pod.descricao && <div className={styles.powerDesc}>{pod.descricao}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
