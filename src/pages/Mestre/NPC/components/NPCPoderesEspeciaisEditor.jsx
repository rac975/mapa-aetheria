import React, { useState, useMemo } from 'react';
import { FaPlus, FaTrash, FaPen, FaCheck, FaTimes } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import {
  TIPOS_DANO_NPC,
  ESPECIES_ALVO_NPC,
  CONDICOES_APLICAVEIS_NPC,
  mesclarCatalogoPoderesNpc,
  identificarConfigParametroPoderNpc,
  construirPoderNpcEstruturado,
  formatarPoderNpcParaExibicao
} from '../../../../domain/fabula/npcRules';
import { Card, Button, Badge } from '../../../../components/ui';
import styles from './NPCEditor.module.css';

export default function NPCPoderesEspeciaisEditor({
  poderes = [],
  totalPoderesPermitidos = 2,
  poderesIniciaisEspecie = 2,
  poderesExtrasVulnerabilidade = 0,
  catalogoPoderes = [],
  onAdicionarPoder,
  onAtualizarPoder,
  onRemoverPoder
}) {
  const catalogoMesclado = useMemo(() => mesclarCatalogoPoderesNpc(catalogoPoderes), [catalogoPoderes]);

  const [poderEmConfiguracao, setPoderEmConfiguracao] = useState(null);
  const [indiceEditando, setIndiceEditando] = useState(null);
  const [formParams, setFormParams] = useState({
    nomeCustom: '',
    tipoDano1: '',
    tipoDano2: '',
    especieAlvo: '',
    condicaoAlvo: '',
    efeitoDetalhado: ''
  });

  const iniciarConfiguracao = (poderBase, idxEdicao = null) => {
    if (!poderBase) return;
    const config = identificarConfigParametroPoderNpc(poderBase);
    const paramsAtuais = poderBase.parametros || {};
    const danosAtuais = Array.isArray(paramsAtuais.tipos_dano) ? paramsAtuais.tipos_dano : [];

    setPoderEmConfiguracao(poderBase);
    setIndiceEditando(idxEdicao);
    setFormParams({
      nomeCustom: poderBase.nome || '',
      tipoDano1: danosAtuais[0] || (config.requerTiposDano ? 'Fogo' : ''),
      tipoDano2: danosAtuais[1] || (config.qtdTiposDano >= 2 ? 'Gelo' : ''),
      especieAlvo: paramsAtuais.especie_alvo || (config.requerEspecieAlvo ? 'Humanoide' : ''),
      condicaoAlvo: paramsAtuais.condicao_alvo || (config.requerCondicao ? 'Atordoado' : ''),
      efeitoDetalhado: paramsAtuais.efeito_detalhado || poderBase.descricao || ''
    });
  };

  const cancelarConfiguracao = () => {
    setPoderEmConfiguracao(null);
    setIndiceEditando(null);
  };

  const confirmarPoder = () => {
    if (!poderEmConfiguracao) return;
    const estruturado = construirPoderNpcEstruturado(poderEmConfiguracao, {
      ...formParams,
      usarSegundoDano: Boolean(formParams.tipoDano2)
    });

    if (indiceEditando !== null && onAtualizarPoder) {
      onAtualizarPoder(indiceEditando, estruturado);
    } else if (onAdicionarPoder) {
      onAdicionarPoder(estruturado);
    }
    cancelarConfiguracao();
  };

  return (
    <Card variant="default">
      <div className={styles.sectionHeaderFlex}>
        <h3>
          Poderes Especiais ({poderes.length} / {totalPoderesPermitidos} máx)
        </h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            iniciarConfiguracao({
              id: `custom_${Date.now()}`,
              nome: 'Novo Poder Especial',
              descricao: ''
            })
          }
        >
          <FaPlus /> Poder Customizado
        </Button>
      </div>

      <div className={styles.catalogoBonusText}>
        <LuSparkles /> Base da espécie ({poderesIniciaisEspecie}){' '}
        {poderesExtrasVulnerabilidade > 0 ? `+ ${poderesExtrasVulnerabilidade} bônus por vulnerabilidades` : ''}
      </div>

      <select
        className={styles.select}
        aria-label="Selecionar poder especial do catálogo"
        value=""
        onChange={(e) => {
          const val = e.target.value;
          const p = catalogoMesclado.find((item) => String(item.id) === val);
          if (p) iniciarConfiguracao(p, null);
        }}
      >
        <option value="" disabled>Selecionar poder do catálogo para configurar...</option>
        {catalogoMesclado.map((p, idx) => (
          <option key={p.id || idx} value={p.id}>{p.nome}</option>
        ))}
      </select>

      {poderEmConfiguracao && (
        <div className={styles.poderConfigBox}>
          <div className={styles.fieldWrapper}>
            <label className={styles.label}>Nome do Poder Especial</label>
            <input
              type="text"
              className={styles.input}
              value={formParams.nomeCustom}
              onChange={(e) => setFormParams({ ...formParams, nomeCustom: e.target.value })}
              placeholder="Ex: Resistência a Dano, Sopro Glacial..."
            />
          </div>

          <div className={styles.poderParamsGrid}>
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>1º Tipo de Dano (Opcional)</label>
              <select
                className={styles.select}
                value={formParams.tipoDano1}
                onChange={(e) => setFormParams({ ...formParams, tipoDano1: e.target.value })}
              >
                <option value="">-- Nenhum --</option>
                {TIPOS_DANO_NPC.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldWrapper}>
              <label className={styles.label}>2º Tipo de Dano (Opcional)</label>
              <select
                className={styles.select}
                value={formParams.tipoDano2}
                onChange={(e) => setFormParams({ ...formParams, tipoDano2: e.target.value })}
              >
                <option value="">-- Nenhum --</option>
                {TIPOS_DANO_NPC.map((t) => (
                  <option key={t} value={t} disabled={t === formParams.tipoDano1}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldWrapper}>
              <label className={styles.label}>Espécie Alvo (Opcional)</label>
              <select
                className={styles.select}
                value={formParams.especieAlvo}
                onChange={(e) => setFormParams({ ...formParams, especieAlvo: e.target.value })}
              >
                <option value="">-- Nenhuma --</option>
                {ESPECIES_ALVO_NPC.map((esp) => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldWrapper}>
              <label className={styles.label}>Condição Relacionada (Opcional)</label>
              <select
                className={styles.select}
                value={formParams.condicaoAlvo}
                onChange={(e) => setFormParams({ ...formParams, condicaoAlvo: e.target.value })}
              >
                <option value="">-- Nenhuma --</option>
                {CONDICOES_APLICAVEIS_NPC.map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.fieldWrapper}>
            <label className={styles.label}>Efeito / Descrição Detalhada</label>
            <input
              type="text"
              className={styles.input}
              value={formParams.efeitoDetalhado}
              onChange={(e) => setFormParams({ ...formParams, efeitoDetalhado: e.target.value })}
              placeholder="Descreva a mecânica, gatilho ou efeito do poder..."
            />
          </div>

          <div className={styles.poderActionsRow}>
            <Button type="button" variant="ghost" size="sm" onClick={cancelarConfiguracao}>
              <FaTimes /> Cancelar
            </Button>
            <Button type="button" variant="core" size="sm" onClick={confirmarPoder}>
              <FaCheck /> {indiceEditando !== null ? 'Salvar Alterações' : 'Confirmar Poder'}
            </Button>
          </div>
        </div>
      )}

      <div className={styles.listaScroll}>
        {poderes.map((p, i) => {
          const info = formatarPoderNpcParaExibicao(p);
          return (
            <div key={i} className={styles.itemCatalogo}>
              <div className={styles.itemInfo}>
                <span className={styles.itemTitle}>{info.nome}</span>
                {info.tagsParametros.length > 0 && (
                  <div className={styles.itemBadgesRow}>
                    {info.tagsParametros.map((tag, idx) => (
                      <Badge key={idx} variant="ether" size="sm">{tag}</Badge>
                    ))}
                  </div>
                )}
                <p className={styles.itemDesc}>{info.descricao}</p>
              </div>
              <div className={styles.itemActionsCol}>
                <Button type="button" variant="secondary" size="sm" onClick={() => iniciarConfiguracao(p, i)} title="Editar parâmetros do poder">
                  <FaPen />
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={() => onRemoverPoder(i)} title="Remover poder">
                  <FaTrash />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
