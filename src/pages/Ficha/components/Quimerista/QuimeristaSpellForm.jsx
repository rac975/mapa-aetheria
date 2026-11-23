import { useState } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import {
  ALCANCES_FEITICO,
  ALVOS_FEITICO,
  CONDICOES_FEITICO,
  obterOpcoesEspecies,
  inferirAlcanceFeitico,
  inferirAlvoFeitico,
  inferirBonusDanoFeitico,
  inferirCondicaoFeitico
} from '../../../../domain/fabula/chimeristRules';
import { Button } from '../../../../components/ui';
import styles from './ExibirQuimerista.module.css';

export default function QuimeristaSpellForm({
  feiticoInicial = null,
  onSalvar,
  onCancelar
}) {
  const isEdicao = Boolean(feiticoInicial);

  const [nome, setNome] = useState(feiticoInicial?.nome || '');
  const [custoMp, setCustoMp] = useState(feiticoInicial?.custo_mp ?? '');
  const [especie, setEspecie] = useState(feiticoInicial?.especie || 'monstro');
  const [alcance, setAlcance] = useState(() => inferirAlcanceFeitico(feiticoInicial));
  const [alvoTipo, setAlvoTipo] = useState(() => inferirAlvoFeitico(feiticoInicial).tipo);
  const [numeroAlvos, setNumeroAlvos] = useState(() => inferirAlvoFeitico(feiticoInicial).numeroAlvos || 2);
  const [bonusDano, setBonusDano] = useState(() => inferirBonusDanoFeitico(feiticoInicial));
  const [condicao, setCondicao] = useState(() => inferirCondicaoFeitico(feiticoInicial));
  const [descricao, setDescricao] = useState(feiticoInicial?.descricao || feiticoInicial?.efeito || '');

  const opcoesEspecies = obterOpcoesEspecies(especie);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onSalvar?.({
      ...(feiticoInicial || {}),
      nome: nome.trim(),
      custo_mp: custoMp !== '' ? String(custoMp).trim() : '',
      especie,
      alcance,
      alvo_tipo: alvoTipo,
      numero_alvos: alvoTipo === ALVOS_FEITICO.MULTI ? (parseInt(numeroAlvos, 10) || 2) : (alvoTipo === ALVOS_FEITICO.AREA ? null : 1),
      bonus_dano: Math.max(0, parseInt(bonusDano, 10) || 0),
      condicao: condicao || '',
      descricao: descricao.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formBox} aria-label={isEdicao ? 'Editar Feitiço' : 'Imitar Feitiço'}>
      <div className={styles.formTitle}>
        {isEdicao ? `Editar Feitiço Imitado: ${feiticoInicial.nome}` : 'Imitar Novo Feitiço (Imitação Mágica)'}
      </div>

      <div className={styles.formRow}>
        <div className={styles.inputGroupGrow}>
          <label className={styles.inputLabel}>Nome do Feitiço *</label>
          <input
            type="text"
            placeholder="Ex.: Sopro Gélido"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className={styles.inputName}
          />
        </div>

        <div className={styles.inputGroupSmall}>
          <label className={styles.inputLabel}>Custo PM</label>
          <input
            type="number"
            min="0"
            placeholder="PM"
            value={custoMp}
            onChange={(e) => setCustoMp(e.target.value)}
            className={styles.inputMp}
          />
        </div>

        <div className={styles.inputGroupMed}>
          <label className={styles.inputLabel}>Espécie Copiada</label>
          <select
            value={especie}
            onChange={(e) => setEspecie(e.target.value)}
            className={styles.selectField}
          >
            {opcoesEspecies.map((esp) => (
              <option key={esp.id} value={esp.id}>
                {esp.icone} {esp.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.inputGroupMed}>
          <label className={styles.inputLabel}>Alcance</label>
          <select
            value={alcance}
            onChange={(e) => setAlcance(e.target.value)}
            className={styles.selectField}
          >
            <option value={ALCANCES_FEITICO.DISTANCIA}>🏹 À Distância</option>
            <option value={ALCANCES_FEITICO.CORPO_A_CORPO}>⚔️ Corpo a Corpo</option>
            <option value={ALCANCES_FEITICO.PESSOAL}>👤 Pessoal (Você)</option>
          </select>
        </div>

        <div className={styles.inputGroupMed}>
          <label className={styles.inputLabel}>Alvo / Área</label>
          <select
            value={alvoTipo}
            onChange={(e) => setAlvoTipo(e.target.value)}
            className={styles.selectField}
          >
            <option value={ALVOS_FEITICO.UNICO}>🎯 Alvo Único</option>
            <option value={ALVOS_FEITICO.MULTI}>👥 Múltiplos Alvos</option>
            <option value={ALVOS_FEITICO.AREA}>💥 Em Área (Todos)</option>
            <option value={ALVOS_FEITICO.PESSOAL}>👤 Pessoal</option>
          </select>
        </div>

        {alvoTipo === ALVOS_FEITICO.MULTI && (
          <div className={styles.inputGroupSmall}>
            <label className={styles.inputLabel}>Qtd Alvos</label>
            <input
              type="number"
              min="2"
              max="10"
              value={numeroAlvos}
              onChange={(e) => setNumeroAlvos(Math.max(2, parseInt(e.target.value, 10) || 2))}
              className={styles.inputMp}
            />
          </div>
        )}

        <div className={styles.inputGroupSmall}>
          <label className={styles.inputLabel}>+Dano</label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={bonusDano}
            onChange={(e) => setBonusDano(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className={styles.inputMp}
            title="Bônus adicional em dano causado pelo feitiço"
          />
        </div>

        <div className={styles.inputGroupMed}>
          <label className={styles.inputLabel}>Condição Aplicada</label>
          <select
            value={condicao}
            onChange={(e) => setCondicao(e.target.value)}
            className={styles.selectField}
          >
            <option value="">-- Nenhuma --</option>
            {CONDICOES_FEITICO.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icone} {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.inputGroupFull}>
        <label className={styles.inputLabel}>Descrição & Efeito do Feitiço</label>
        <textarea
          rows={2}
          placeholder="Ex.: Causa [RA + 10] de dano de veneno. Cada criatura atingida fica Envenenada."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={styles.inputTextarea}
        />
      </div>

      <div className={styles.formActions}>
        <Button type="button" variant="ghost" size="sm" onClick={onCancelar}>
          <FaTimes size={11} /> Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm">
          <FaSave size={11} /> {isEdicao ? 'Salvar Feitiço' : 'Memorizar Feitiço'}
        </Button>
      </div>
    </form>
  );
}
