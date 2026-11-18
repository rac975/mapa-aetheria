import React from 'react';
import { FaPlus, FaTrash, FaFistRaised, FaMagic, FaShieldAlt } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import { Card, Button } from '../../../../components/ui';
import styles from './NPCEditor.module.css';

const TIPOS_DANO = ['fisico', 'fogo', 'gelo', 'raio', 'sombrio', 'luz', 'veneno', 'terra'];
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
          <Button variant="secondary" size="sm" onClick={onAdicionarAtaque}>
            <FaPlus /> Adicionar Ataque
          </Button>
        </div>
        <div className={styles.ataquesList}>
          {npc.ataques_basicos?.map((atk, index) => (
            <div key={index} className={styles.ataqueItem}>
              <input
                type="text"
                className={styles.input}
                placeholder="Nome do Ataque"
                value={atk.nome || ''}
                onChange={(e) => onAtualizarAtaque(index, 'nome', e.target.value)}
              />
              <select
                className={styles.select}
                value={atk.atributo_dado1 || 'des'}
                onChange={(e) => onAtualizarAtaque(index, 'atributo_dado1', e.target.value)}
              >
                {['des', 'ast', 'vig', 'von'].map((a) => <option key={a} value={a}>{a.toUpperCase()}</option>)}
              </select>
              <select
                className={styles.select}
                value={atk.atributo_dado2 || 'vig'}
                onChange={(e) => onAtualizarAtaque(index, 'atributo_dado2', e.target.value)}
              >
                {['des', 'ast', 'vig', 'von'].map((a) => <option key={a} value={a}>{a.toUpperCase()}</option>)}
              </select>
              <input
                type="text"
                className={styles.input}
                placeholder="Tipo (ex: fisico)"
                value={atk.tipo_dano || ''}
                onChange={(e) => onAtualizarAtaque(index, 'tipo_dano', e.target.value)}
              />
              <Button variant="danger" size="sm" onClick={() => onRemoverAtaque(index)} title="Remover ataque">
                <FaTrash />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className={styles.poderesFeiticosGrid}>
        <Card variant="default">
          <h3 className={styles.sectionTitle}>
            Poderes Especiais ({npc.poderes?.length || 0} / {totalPoderesPermitidos} máx)
          </h3>
          <div className={styles.catalogoBonusText}>
            <LuSparkles /> Base da espécie ({poderesIniciaisEspecie}){' '}
            {poderesExtrasVulnerabilidade > 0 ? `+ ${poderesExtrasVulnerabilidade} bônus por vulnerabilidades` : ''}
          </div>
          <select
            className={styles.select}
            onChange={(e) => {
              const p = catalogoPoderes.find((item) => item.id === e.target.value);
              if (p) onAdicionarPoder(p);
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>Selecionar poder...</option>
            {catalogoPoderes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <div className={styles.listaScroll}>
            {npc.poderes?.map((p, i) => (
              <div key={i} className={styles.itemCatalogo}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{p.nome}</span>
                  <p className={styles.itemDesc}>{p.descricao}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => onRemoverPoder(i)} title="Remover poder">
                  <FaTrash />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="default">
          <h3 className={styles.sectionTitle}><FaMagic /> Feitiços e Magias</h3>
          <select
            className={styles.select}
            onChange={(e) => {
              const f = catalogoFeiticos.find((item) => item.id === e.target.value);
              if (f) onAdicionarFeitico(f);
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>Selecionar feitiço...</option>
            {catalogoFeiticos.map((f) => <option key={f.id} value={f.id}>{f.nome} ({f.pm_custo} PM)</option>)}
          </select>
          <div className={styles.listaScroll}>
            {npc.feiticos?.map((f, i) => (
              <div key={i} className={styles.itemCatalogo}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{f.nome} ({f.pm_custo} PM)</span>
                  <p className={styles.itemDesc}>{f.descricao}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => onRemoverFeitico(i)} title="Remover feitiço">
                  <FaTrash />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
