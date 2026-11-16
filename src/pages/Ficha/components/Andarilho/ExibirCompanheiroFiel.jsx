import React, { useState } from 'react';
import { FaPaw, FaMagic } from 'react-icons/fa';
import { extrairValorDado } from '../../../../domain/fabula/classRules';
import { Button, Badge } from '../../../../components/ui';
import CompanheiroStats from './CompanheiroStats';
import CompanheiroAtaqueItem from './CompanheiroAtaqueItem';
import styles from './ExibirCompanheiroFiel.module.css';

const rolarDado = (faces) => Math.floor(Math.random() * faces) + 1;

export default function ExibirCompanheiroFiel({ companheiro, handleAjustarRecurso }) {
  const [modoAtaqueState, setModoAtaqueState] = useState({});
  const [resultadosRolagem, setResultadosRolagem] = useState({});

  const conjurarFeiticoCompanheiro = (feitico) => {
    const custo = parseInt(feitico.pm_custo || 0, 10);
    if (custo > 0 && handleAjustarRecurso) {
      handleAjustarRecurso('mp_atual', -custo);
    }
  };

  if (!companheiro) {
    return (
      <div className={styles.warningBox}>
        ⚠️ Habilidade ativa, mas a ficha detalhada do companheiro ainda não foi criada ou salva no painel do Mestre/NPCs.
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

    const bonusPrecisao = parseInt(companheiro.bonus_precisao || 5, 10);
    const testeAtaque = res1 + res2 + bonusPrecisao;

    let statusCritico = null;
    if (res1 === 1 && res2 === 1) {
      statusCritico = 'Erro Crítico (Fumble)';
    } else if (res1 === res2 && res1 >= 6) {
      statusCritico = 'Sucesso Crítico!';
    }

    const dadoMaisAlto = Math.max(res1, res2);
    const modoAtual = modoAtaqueState[indexAtaque] || 'normal';
    const isMulti = modoAtual === 'multi';

    const bonusOriginal = parseInt(companheiro.bonus_dano || companheiro.nivel_poder || 5, 10);
    const bonusDanoFixo = isMulti ? 0 : bonusOriginal;
    const danoTotal = dadoMaisAlto + bonusDanoFixo;

    setResultadosRolagem(prev => ({
      ...prev,
      [indexAtaque]: {
        res1,
        res2,
        attr1Label: attr1Key.toUpperCase(),
        attr2Label: attr2Key.toUpperCase(),
        faces1,
        faces2,
        bonusPrecisao,
        testeAtaque,
        statusCritico,
        dadoMaisAlto,
        bonusOriginal,
        bonusDanoFixo,
        danoTotal,
        isMulti
      }
    }));
  };

  const alterarModoAtaque = (indexAtaque, modo) => {
    setModoAtaqueState(prev => ({ ...prev, [indexAtaque]: modo }));
  };

  return (
    <div className={styles.container}>
      {/* Título do Companheiro */}
      <div className={styles.header}>
        <span className={styles.title}>
          <FaPaw /> {companheiro.nome || 'Companheiro'}
        </span>
        <Badge variant="ether" size="sm">
          Espécie: {companheiro.especie || 'Fera'} | Nível 5
        </Badge>
      </div>

      {/* Atributos e Estatísticas */}
      <CompanheiroStats companheiro={companheiro} />

      {/* Traços */}
      {companheiro.tracos && companheiro.tracos.some(Boolean) && (
        <div className={styles.sectionBox}>
          <div className={styles.sectionTitle}>Traços</div>
          <div className={styles.traitsList}>
            {companheiro.tracos.filter(Boolean).map((traco, tIdx) => (
              <div key={tIdx} className={styles.traitItem}>
                • {traco}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ataques Básicos */}
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

      {/* Feitiços e Magias */}
      {companheiro.feiticos && companheiro.feiticos.length > 0 && (
        <div>
          <div className={styles.sectionTitleSpells}>
            <FaMagic /> Feitiços e Magias
          </div>
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
    </div>
  );
}
