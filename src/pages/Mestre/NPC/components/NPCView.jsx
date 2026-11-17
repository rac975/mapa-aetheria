import React from 'react';
import { 
  FaShieldAlt, 
  FaMagic, 
  FaHeart, 
  FaDice, 
  FaDragon, 
  FaCrosshairs, 
  FaFistRaised 
} from 'react-icons/fa';
import { Card, Badge, ResourceBar } from '../../../../components/ui';
import { clampRecursoNpc, extrairHpMax, extrairMpMax } from '../../../../domain/fabula/npcRules';
import styles from './NPCView.module.css';

const TIPOS_DANO = [
  { key: 'fisico', label: 'Físico' },
  { key: 'fogo', label: 'Fogo' },
  { key: 'gelo', label: 'Gelo' },
  { key: 'raio', label: 'Raio' },
  { key: 'sombrio', label: 'Sombrio' },
  { key: 'luz', label: 'Luz' },
  { key: 'veneno', label: 'Veneno' },
  { key: 'terra', label: 'Terra' },
];

export default function NPCView({ npc, onUpdate }) {
  // Bônus de dano por nível oficial do Fabula Ultima
  const bonusDanoNivel = npc.nivel >= 60 ? 15 : npc.nivel >= 40 ? 10 : npc.nivel >= 20 ? 5 : 0;
  const bonusPrecisaoMagia = Math.floor(npc.nivel / 10);

  const maxPv = extrairHpMax(npc);
  const maxPm = extrairMpMax(npc);
  const pvAtual = clampRecursoNpc(
    npc.pv_atual !== undefined ? npc.pv_atual : (npc.hp_atual !== undefined ? npc.hp_atual : maxPv),
    maxPv,
    0
  );
  const pmAtual = clampRecursoNpc(
    npc.pm_atual !== undefined ? npc.pm_atual : (npc.mp_atual !== undefined ? npc.mp_atual : maxPm),
    maxPm,
    0
  );

  function ajustarStat(campo, delta) {
    const isHp = campo === 'pv_atual' || campo === 'hp_atual';
    const isMp = campo === 'pm_atual' || campo === 'mp_atual';
    const teto = isHp ? maxPv : isMp ? maxPm : 9999;
    const valorAtual = isHp ? pvAtual : isMp ? pmAtual : (Number(npc[campo]) || 0);
    const novo = clampRecursoNpc(valorAtual + delta, teto, 0);

    const updates = { [campo]: novo };
    if (isHp) {
      updates.pv_atual = novo;
      updates.hp_atual = novo;
    } else if (isMp) {
      updates.pm_atual = novo;
      updates.mp_atual = novo;
    }

    onUpdate({ ...npc, ...updates });
  }

  function handleManualChange(campo, valorInput) {
    const isHp = campo === 'pv_atual' || campo === 'hp_atual';
    const isMp = campo === 'pm_atual' || campo === 'mp_atual';
    const teto = isHp ? maxPv : isMp ? maxPm : 9999;
    const num = valorInput === '' ? 0 : parseInt(valorInput, 10);
    const novo = isNaN(num) ? 0 : clampRecursoNpc(num, teto, 0);

    const updates = { [campo]: novo };
    if (isHp) {
      updates.pv_atual = novo;
      updates.hp_atual = novo;
    } else if (isMp) {
      updates.pm_atual = novo;
      updates.mp_atual = novo;
    }

    onUpdate({ ...npc, ...updates });
  }

  function getAfinidadeBadge(valor) {
    switch (valor?.toLowerCase()) {
      case 'vul':
        return { variant: 'crise', label: 'VUL' };
      case 'res':
        return { variant: 'ether', label: 'RES' };
      case 'imu':
        return { variant: 'gold', label: 'IMU' };
      case 'abs':
        return { variant: 'core', label: 'ABS' };
      default:
        return { variant: 'default', label: '—' };
    }
  }

  function renderRankBadge() {
    switch (npc.rank?.toLowerCase()) {
      case 'elite':
        return <Badge variant="ether" size="md">ELITE</Badge>;
      case 'campeao':
        return (
          <Badge variant="crise" size="md">
            CAMPEÃO {npc.quantidade_soldados ? `(${npc.quantidade_soldados}x)` : ''}
          </Badge>
        );
      default:
        return <Badge variant="gold" size="md">SOLDADO</Badge>;
    }
  }

  return (
    <div className={styles.viewContainer}>
      {/* 1. Cabeçalho do Bestiário */}
      <Card variant="default">
        <div className={styles.headerCard}>
          <div className={styles.headerMain}>
            <div className={styles.titleRow}>
              <h1 className={styles.npcTitle}>{npc.nome}</h1>
              {renderRankBadge()}
            </div>
            <div className={styles.metaRow}>
              <Badge variant="default" size="sm">
                <FaDragon /> {npc.especie?.toUpperCase() || 'FERA'}
              </Badge>
              <Badge variant="ether" size="sm">
                Nível {npc.nivel}
              </Badge>
            </div>
          </div>

          <div className={styles.bonusBox}>
            <div className={styles.bonusItem}>
              <span><FaCrosshairs /> Bônus Testes:</span>
              <span className={styles.bonusValue}>+{bonusPrecisaoMagia}</span>
            </div>
            <div className={styles.bonusItem}>
              <span><FaFistRaised /> Bônus Dano:</span>
              <span className={styles.bonusValue}>+{bonusDanoNivel}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Traços da Criatura */}
      <Card variant="default">
        <h3 className={styles.sectionTitle}>Traços da Criatura</h3>
        <div className={styles.tracosGrid}>
          {npc.tracos?.map((traco, i) => (
            <div key={i} className={styles.tracoCard}>
              <span className={styles.tracoLabel}>Traço {i + 1}</span>
              <p className={styles.tracoText}>{traco || '—'}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Atributos Básicos */}
      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaDice /> Atributos</h3>
        <div className={styles.atributosGrid}>
          {['des', 'ast', 'vig', 'von'].map((attr) => (
            <div key={attr} className={styles.atributoCard}>
              <span className={styles.atributoLabel}>{attr.toUpperCase()}</span>
              <p className={styles.atributoValue}>{npc.atributos?.[attr] || 'd8'}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. PV, PM, Defesas e Iniciativa */}
      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaHeart /> Estatísticas de Combate</h3>
        <div className={styles.combatGrid}>
          {/* PV */}
          <div className={styles.resourceCard}>
            <ResourceBar
              type="pv"
              current={pvAtual}
              max={maxPv}
              label="PONTOS DE VIDA"
            />
            <div className={`${styles.statControls} ${styles.noPrint}`}>
              <button type="button" onClick={() => ajustarStat('pv_atual', -5)} className={styles.statQuickBtn}>-5</button>
              <button type="button" onClick={() => ajustarStat('pv_atual', -1)} className={styles.statQuickBtn}>-1</button>
              <input
                type="number"
                min={0}
                max={maxPv}
                value={pvAtual}
                onChange={(e) => handleManualChange('pv_atual', e.target.value)}
                className={styles.statManualInput}
                aria-label="Ajuste manual de PV atual"
              />
              <button type="button" onClick={() => ajustarStat('pv_atual', 1)} className={styles.statQuickBtn}>+1</button>
              <button type="button" onClick={() => ajustarStat('pv_atual', 5)} className={styles.statQuickBtn}>+5</button>
            </div>
          </div>

          {/* PM */}
          <div className={styles.resourceCard}>
            <ResourceBar
              type="pm"
              current={pmAtual}
              max={maxPm}
              label="PONTOS DE MANA"
            />
            <div className={`${styles.statControls} ${styles.noPrint}`}>
              <button type="button" onClick={() => ajustarStat('pm_atual', -5)} className={styles.statQuickBtn}>-5</button>
              <button type="button" onClick={() => ajustarStat('pm_atual', -1)} className={styles.statQuickBtn}>-1</button>
              <input
                type="number"
                min={0}
                max={maxPm}
                value={pmAtual}
                onChange={(e) => handleManualChange('pm_atual', e.target.value)}
                className={styles.statManualInput}
                aria-label="Ajuste manual de PM atual"
              />
              <button type="button" onClick={() => ajustarStat('pm_atual', 1)} className={styles.statQuickBtn}>+1</button>
              <button type="button" onClick={() => ajustarStat('pm_atual', 5)} className={styles.statQuickBtn}>+5</button>
            </div>
          </div>

          {/* Defesa */}
          <div className={styles.statCardCenter}>
            <span className={styles.statTitle}><FaShieldAlt /> Defesa</span>
            <p className={styles.statNumberLarge}>{npc.defesa}</p>
          </div>

          {/* Defesa Mágica */}
          <div className={styles.statCardCenter}>
            <span className={styles.statTitle}><FaMagic /> Def. Mág.</span>
            <p className={styles.statNumberLarge}>{npc.defesa_magica}</p>
          </div>

          {/* Iniciativa */}
          <div className={styles.statCardCenter}>
            <span className={styles.statTitle}>Iniciativa</span>
            <p className={styles.statNumberLarge}>{npc.iniciativa ?? 0}</p>
          </div>
        </div>
      </Card>

      {/* 5. Afinidades Elementares */}
      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaShieldAlt /> Afinidades a Danos</h3>
        <div className={styles.afinidadesGrid}>
          {TIPOS_DANO.map(({ key, label }) => {
            const val = npc.afinidades?.[key];
            const badgeInfo = getAfinidadeBadge(val);

            return (
              <div key={key} className={styles.afinidadeItem}>
                <span className={styles.tipoDanoNome}>{label}</span>
                <Badge variant={badgeInfo.variant} size="sm">
                  {badgeInfo.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 6. Ataques Básicos */}
      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaFistRaised /> Ataques Básicos</h3>
        {(!npc.ataques_basicos || npc.ataques_basicos.length === 0) ? (
          <p className={styles.emptyText}>Nenhum ataque básico cadastrado.</p>
        ) : (
          <div className={styles.ataquesList}>
            {npc.ataques_basicos.map((atk, i) => (
              <div key={i} className={styles.ataqueItem}>
                <div>
                  <span className={styles.ataqueName}>{atk.nome}</span>
                  <span className={styles.ataqueDado}>
                    【{atk.atributo_dado1?.toUpperCase()} + {atk.atributo_dado2?.toUpperCase()}】
                    {atk.bonus_precisao ? ` + ${atk.bonus_precisao}` : ''}
                  </span>
                </div>
                <div className={styles.ataqueDanoInfo}>
                  【RA + {atk.bonus_dano || 0}】 Dano {atk.tipo_dano?.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 7. Poderes e Feitiços */}
      <div className={styles.poderesFeiticosGrid}>
        <Card variant="default">
          <h3 className={styles.sectionTitle}>Poderes Especiais</h3>
          {(!npc.poderes || npc.poderes.length === 0) ? (
            <p className={styles.emptyText}>Nenhum poder adquirido.</p>
          ) : (
            <ul className={styles.viewList}>
              {npc.poderes.map((p, i) => (
                <li key={i} className={styles.viewItem}>
                  <div className={styles.itemHeading}>
                    <strong className={styles.poderName}>{p.nome}</strong>
                  </div>
                  <p>{p.descricao}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="default">
          <h3 className={styles.sectionTitle}>Feitiços e Magias</h3>
          {(!npc.feiticos || npc.feiticos.length === 0) ? (
            <p className={styles.emptyText}>Nenhum feitiço conhecido.</p>
          ) : (
            <ul className={styles.viewList}>
              {npc.feiticos.map((f, i) => (
                <li key={i} className={styles.viewItem}>
                  <div className={styles.itemHeading}>
                    <strong className={styles.feiticoName}>{f.nome}</strong>
                    <Badge variant="pm" size="sm">{f.pm_custo} PM</Badge>
                  </div>
                  <p>{f.descricao}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
