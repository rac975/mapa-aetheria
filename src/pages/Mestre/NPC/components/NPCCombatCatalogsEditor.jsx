import React from 'react';
import { FaPlus, FaTrash, FaFistRaised, FaShieldAlt } from 'react-icons/fa';
import { CONDICOES_APLICAVEIS_NPC } from '../../../../domain/fabula/npcRules';
import { Card, Button } from '../../../../components/ui';
import NPCPoderesEspeciaisEditor from './NPCPoderesEspeciaisEditor';
import NPCFeiticosEditor from './NPCFeiticosEditor';
import styles from './NPCEditor.module.css';

const TIPOS_DANO = ['fisico', 'fogo', 'gelo', 'raio', 'sombrio', 'luz', 'veneno', 'terra'];
const TIPOS_DANO_ATAQUE = ['fisico', 'fogo', 'gelo', 'raio', 'ar', 'terra', 'veneno', 'sombrio', 'luz'];
const TIPOS_AFINIDADE = [
  { label: 'Normal', valor: '' },
  { label: 'Vulnerável (vul)', valor: 'vul' },
  { label: 'Resistente (res)', valor: 'res' },
  { label: 'Imune (imu)', valor: 'imu' },
  { label: 'Absorve (abs)', valor: 'abs' }
];

export default function NPCCombatCatalogsEditor({
  npc,
  isCompanheiro = false,
  totalPoderesPermitidos = 2,
  poderesIniciaisEspecie = 2,
  poderesExtrasVulnerabilidade = 0,
  catalogoPoderes = [],
  catalogoFeiticos = [],
  onUpdateNpc,
  onAdicionarAtaque,
  onAtualizarAtaque,
  onRemoverAtaque,
  onAdicionarPoder,
  onAtualizarPoder,
  onRemoverPoder,
  onAdicionarFeitico,
  onRemoverFeitico
}) {
  const afinidadesSeguras = npc.afinidades || {};

  return (
    <>
      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaShieldAlt /> Afinidades a Danos & Traços</h3>
        <div className={styles.afinidadesGrid}>
          {TIPOS_DANO.map((tipo) => (
            <div key={tipo} className={styles.fieldWrapper}>
              <label className={styles.label}>{tipo}</label>
              <select
                className={styles.select}
                value={afinidadesSeguras[tipo] || ''}
                onChange={(e) => onUpdateNpc({ ...npc, afinidades: { ...afinidadesSeguras, [tipo]: e.target.value } })}
              >
                {TIPOS_AFINIDADE.map((af) => (
                  <option key={af.valor} value={af.valor}>{af.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className={styles.tracosGrid}>
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              type="text"
              className={styles.input}
              placeholder={`Traço ${index + 1}`}
              value={npc.tracos?.[index] || ''}
              onChange={(e) => {
                const novosTracos = [...(npc.tracos || ['', '', '', ''])];
                novosTracos[index] = e.target.value;
                onUpdateNpc({ ...npc, tracos: novosTracos });
              }}
            />
          ))}
        </div>
      </Card>

      <Card variant="default">
        <div className={styles.sectionHeaderFlex}>
          <h3>
            <FaFistRaised /> Ataques Básicos{' '}
            {isCompanheiro && `(${(npc.ataques_basicos || []).length}/2 Máximo)`}
          </h3>
          <Button type="button" variant="secondary" size="sm" onClick={onAdicionarAtaque}>
            <FaPlus /> Adicionar Ataque
          </Button>
        </div>
        <div className={styles.ataquesList}>
          {npc.ataques_basicos?.map((atk, index) => (
            <div key={index} className={styles.ataqueItem}>
              <div className={styles.ataqueLinhaTopo}>
                <div className={styles.fieldWrapper}>
                  <label className={styles.label}>Nome do Ataque</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Ex: Garra Flamejante"
                    value={atk.nome || ''}
                    onChange={(e) => onAtualizarAtaque(index, 'nome', e.target.value)}
                  />
                </div>
                <div className={styles.fieldWrapper}>
                  <label className={styles.label}>Alcance</label>
                  <select
                    className={styles.select}
                    value={atk.alcance || 'corpo_a_corpo'}
                    onChange={(e) => onAtualizarAtaque(index, 'alcance', e.target.value)}
                  >
                    <option value="corpo_a_corpo">⚔️ Corpo a Corpo</option>
                    <option value="distancia">🏹 À Distância</option>
                  </select>
                </div>
                <div className={styles.fieldWrapper}>
                  <label className={styles.label}>Atributo 1</label>
                  <select
                    className={styles.select}
                    value={atk.atributo_dado1 || 'des'}
                    onChange={(e) => onAtualizarAtaque(index, 'atributo_dado1', e.target.value)}
                  >
                    {['des', 'ast', 'vig', 'von'].map((a) => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className={styles.fieldWrapper}>
                  <label className={styles.label}>Atributo 2</label>
                  <select
                    className={styles.select}
                    value={atk.atributo_dado2 || 'vig'}
                    onChange={(e) => onAtualizarAtaque(index, 'atributo_dado2', e.target.value)}
                  >
                    {['des', 'ast', 'vig', 'von'].map((a) => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className={styles.fieldWrapper}>
                  <label className={styles.label}>Tipo de Dano</label>
                  <select
                    className={styles.select}
                    value={atk.tipo_dano || 'fisico'}
                    onChange={(e) => onAtualizarAtaque(index, 'tipo_dano', e.target.value)}
                  >
                    {TIPOS_DANO_ATAQUE.map((t) => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                    {atk.tipo_dano && !TIPOS_DANO_ATAQUE.includes(atk.tipo_dano) && (
                      <option value={atk.tipo_dano}>{atk.tipo_dano.toUpperCase()}</option>
                    )}
                  </select>
                </div>
                <Button type="button" variant="danger" size="sm" onClick={() => onRemoverAtaque(index)} title="Remover ataque">
                  <FaTrash />
                </Button>
              </div>

              <div className={styles.ataqueLinhaDetalhes}>
                <div className={styles.fieldWrapper}>
                  <label className={styles.label}>Mod. Precisão</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={atk.bonus_precisao ?? 0}
                    onChange={(e) => onAtualizarAtaque(index, 'bonus_precisao', parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div className={styles.fieldWrapper}>
                  <label className={styles.label}>Bônus Dano</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={atk.bonus_dano ?? 5}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      onAtualizarAtaque(index, 'bonus_dano', isNaN(val) ? 0 : val);
                    }}
                  />
                </div>
                <div className={styles.fieldWrapper}>
                  <label className={styles.label}>Condição (Opcional)</label>
                  <select
                    className={styles.select}
                    value={atk.condicao || ''}
                    onChange={(e) => onAtualizarAtaque(index, 'condicao', e.target.value)}
                  >
                    <option value="">Nenhuma</option>
                    {CONDICOES_APLICAVEIS_NPC.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.fieldWrapper}>
                  <label className={styles.label}>Efeito Especial</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Ex: Aplica Lento, Multi (2)..."
                    value={atk.efeito || ''}
                    onChange={(e) => onAtualizarAtaque(index, 'efeito', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className={styles.poderesFeiticosGrid}>
        <NPCPoderesEspeciaisEditor
          poderes={npc.poderes || []}
          totalPoderesPermitidos={totalPoderesPermitidos}
          poderesIniciaisEspecie={poderesIniciaisEspecie}
          poderesExtrasVulnerabilidade={poderesExtrasVulnerabilidade}
          catalogoPoderes={catalogoPoderes}
          onAdicionarPoder={onAdicionarPoder}
          onAtualizarPoder={onAtualizarPoder}
          onRemoverPoder={onRemoverPoder}
        />

        <NPCFeiticosEditor
          feiticos={npc.feiticos || []}
          catalogoFeiticos={catalogoFeiticos}
          onAdicionarFeitico={onAdicionarFeitico}
          onRemoverFeitico={onRemoverFeitico}
        />
      </div>
    </>
  );
}
