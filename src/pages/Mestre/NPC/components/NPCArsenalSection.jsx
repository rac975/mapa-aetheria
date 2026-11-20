import React from 'react';
import { FaShieldAlt, FaFistRaised, FaDice } from 'react-icons/fa';
import {
  formatarAtaqueBasicoNpc,
  formatarPoderNpcParaExibicao
} from '../../../../domain/fabula/npcRules';
import { Card, Badge } from '../../../../components/ui';
import styles from './NPCArsenalSection.module.css';

const TIPOS_DANO = [
  { key: 'fisico', label: 'Físico' },
  { key: 'fogo', label: 'Fogo' },
  { key: 'gelo', label: 'Gelo' },
  { key: 'raio', label: 'Raio' },
  { key: 'sombrio', label: 'Sombrio' },
  { key: 'luz', label: 'Luz' },
  { key: 'veneno', label: 'Veneno' },
  { key: 'terra', label: 'Terra' }
];

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

export default function NPCArsenalSection({ npc }) {
  return (
    <>
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

      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaShieldAlt /> Afinidades a Danos</h3>
        <div className={styles.afinidadesGrid}>
          {TIPOS_DANO.map(({ key, label }) => {
            const val = npc.afinidades?.[key];
            const badgeInfo = getAfinidadeBadge(val);
            return (
              <div key={key} className={styles.afinidadeItem}>
                <span className={styles.tipoDanoNome}>{label}</span>
                <Badge variant={badgeInfo.variant} size="sm">{badgeInfo.label}</Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaFistRaised /> Ataques Básicos</h3>
        {(!npc.ataques_basicos || npc.ataques_basicos.length === 0) ? (
          <p className={styles.emptyText}>Nenhum ataque básico cadastrado.</p>
        ) : (
          <div className={styles.ataquesList}>
            {npc.ataques_basicos.map((atk, i) => {
              const info = formatarAtaqueBasicoNpc(atk);
              return (
                <div key={i} className={styles.ataqueItem}>
                  <div className={styles.ataqueMainLine}>
                    <div>
                      <span className={styles.ataqueName}>{info.nome}</span>
                      <span className={styles.ataqueDado}>
                        【{info.attr1} + {info.attr2}】{info.modPrecisaoTexto}
                      </span>
                    </div>
                    <div className={styles.ataqueDanoInfo}>
                      【RA + {info.bonusDano}】 Dano {info.tipoDano.toUpperCase()}
                    </div>
                  </div>
                  {(info.condicao || info.efeito) && (
                    <div className={styles.ataqueExtraLine}>
                      {info.condicao && (
                        <Badge variant="crise" size="sm">Condição: {info.condicao}</Badge>
                      )}
                      {info.efeito && (
                        <p className={styles.ataqueEfeitoTexto}>✦ {info.efeito}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className={styles.poderesFeiticosGrid}>
        <Card variant="default">
          <h3 className={styles.sectionTitle}>Poderes Especiais</h3>
          {(!npc.poderes || npc.poderes.length === 0) ? (
            <p className={styles.emptyText}>Nenhum poder adquirido.</p>
          ) : (
            <ul className={styles.viewList}>
              {npc.poderes.map((p, i) => {
                const info = formatarPoderNpcParaExibicao(p);
                return (
                  <li key={i} className={styles.viewItem}>
                    <div className={styles.itemHeading}>
                      <strong className={styles.poderName}>{info.nome}</strong>
                      {info.tagsParametros.length > 0 && (
                        <div className={styles.poderTagsRow}>
                          {info.tagsParametros.map((tag, idx) => (
                            <Badge key={idx} variant="ether" size="sm">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p>{info.descricao}</p>
                  </li>
                );
              })}
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
    </>
  );
}
