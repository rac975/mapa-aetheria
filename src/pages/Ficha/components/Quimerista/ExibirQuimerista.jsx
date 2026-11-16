import React, { useState } from 'react';
import { FaDragon, FaPlus, FaTrash } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';
import { Button } from '../../../../components/ui';
import styles from './ExibirQuimerista.module.css';

export default function ExibirQuimerista({ fichaId, ficha, classes, handleAjustarRecurso }) {
  const [magiasImitadas, setMagiasImitadas] = useState(() => ficha?.magias_imitadas || []);
  const [atributoEscolhido, setAtributoEscolhido] = useState(() => ficha?.atributo_quimerista || 'AST + VON');
  const [mostrarForm, setMostrarForm] = useState(false);

  const [novaMagia, setNovaMagia] = useState({
    nome: '',
    custo_mp: '',
    especie: 'fera',
    descricao: '',
  });

  const habs = ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvImitacao = getNivel('imitacao magica');
  const nvConsumir = getNivel('consumir');
  const nvPatogenese = getNivel('patogenese');
  const nvLingua = getNivel('lingua das feras');

  // Limite de feitiços memorizados: NP + 2 (se não tiver Imitação Mágica, limite é 0 ou 2)
  const limiteFeiticos = nvImitacao > 0 ? nvImitacao + 2 : 2;

  const salvarNoBanco = async (novasMagias, novoAtributo) => {
    setMagiasImitadas(novasMagias);
    if (!fichaId || !classes) return;

    const classesAtualizadas = classes.map((c) => {
      const norm = (c.nome_classe || '').toLowerCase();
      if (norm.includes('quimerista')) {
        return {
          ...c,
          magias_imitadas: novasMagias,
          atributo_quimerista: novoAtributo !== undefined ? novoAtributo : atributoEscolhido,
        };
      }
      return c;
    });

    const { error } = await fichaService.atualizarClassesPersonagem(fichaId, classesAtualizadas);
    if (error) console.error('Erro ao salvar dados do Quimerista:', error.message);
  };

  const alterarAtributo = (e) => {
    const val = e.target.value;
    setAtributoEscolhido(val);
    salvarNoBanco(magiasImitadas, val);
  };

  const adicionarMagia = (e) => {
    e.preventDefault();
    if (!novaMagia.nome.trim()) return;

    if (magiasImitadas.length >= limiteFeiticos) {
      alert(`⛔ Você já atingiu o limite de ${limiteFeiticos} feitiços memorizados (NP + 2). Esqueça um feitiço antigo para adicionar um novo.`);
      return;
    }

    const atualizadas = [...magiasImitadas, { ...novaMagia, id: `quim-${Date.now()}` }];
    salvarNoBanco(atualizadas);
    setNovaMagia({ nome: '', custo_mp: '', especie: 'fera', descricao: '' });
    setMostrarForm(false);
  };

  const removerMagia = (idx) => {
    if (!window.confirm('Esquecer este feitiço de Quimerista?')) return;
    const atualizadas = magiasImitadas.filter((_, i) => i !== idx);
    salvarNoBanco(atualizadas);
  };

  const usarConsumir = () => {
    const recuperacao = nvConsumir * 2;
    if (recuperacao <= 0) return;
    if (window.confirm(`Recuperar ${recuperacao} PM com a habilidade Consumir (NP × 2)?`)) {
      if (handleAjustarRecurso) handleAjustarRecurso('mp_atual', recuperacao);
    }
  };

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.title}>
          <FaDragon /> Grimório Quimérico
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          <FaPlus size={10} /> Imitar Feitiço ({magiasImitadas.length}/{limiteFeiticos})
        </Button>
      </div>

      {/* Configuração de Atributos Oficiais de Magia */}
      <div className={styles.attributeConfig}>
        <span className={styles.attributeLabel}>Atributos de Magia/Quimerismo:</span>
        <select
          value={atributoEscolhido}
          onChange={alterarAtributo}
          className={styles.attributeSelect}
        >
          <option value="AST + VON">AST + VON (Astúcia + Vontade)</option>
          <option value="VIG + VON">VIG + VON (Vigor + Vontade)</option>
        </select>
      </div>

      {/* Resumo de Habilidades Passivas */}
      <div className={styles.passivasRow}>
        {nvConsumir > 0 && (
          <button
            type="button"
            onClick={usarConsumir}
            className={styles.passivaConsumir}
            title="Clique para recuperar PM"
          >
            ⚡ Consumir: Recuperar <strong>+{nvConsumir * 2} PM</strong>
          </button>
        )}
        {nvPatogenese > 0 && (
          <span className={styles.passivaPatogenese}>
            🧪 Patogênese ativa (envenena espécie correspondente)
          </span>
        )}
        {nvLingua > 0 && (
          <span className={styles.passivaLingua}>
            🗣️ Língua das Feras
          </span>
        )}
      </div>

      {/* Formulário para Adicionar Feitiço Imitado */}
      {mostrarForm && (
        <form onSubmit={adicionarMagia} className={styles.formBox}>
          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Nome do Feitiço Imitado"
              value={novaMagia.nome}
              onChange={(e) => setNovaMagia({ ...novaMagia, nome: e.target.value })}
              required
              className={styles.inputName}
            />
            <input
              type="number"
              placeholder="MP"
              value={novaMagia.custo_mp}
              onChange={(e) => setNovaMagia({ ...novaMagia, custo_mp: e.target.value })}
              className={styles.inputMp}
            />
            <select
              value={novaMagia.especie}
              onChange={(e) => setNovaMagia({ ...novaMagia, especie: e.target.value })}
              className={styles.selectEspecie}
            >
              <option value="fera">Fera</option>
              <option value="monstro">Monstro</option>
              <option value="planta">Planta</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Descrição / Efeito do feitiço"
            value={novaMagia.descricao}
            onChange={(e) => setNovaMagia({ ...novaMagia, descricao: e.target.value })}
            className={styles.inputDesc}
          />
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMostrarForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Memorizar
            </Button>
          </div>
        </form>
      )}

      {/* Lista de Feitiços Imitados */}
      {magiasImitadas.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum feitiço imitado memorizado ainda. Use <strong>Imitação Mágica</strong> para registrar feitiços aprendidos de feras, monstros ou plantas.
        </div>
      ) : (
        <div className={styles.spellsList}>
          {magiasImitadas.map((mag, idx) => (
            <div key={mag.id || idx} className={styles.spellCard}>
              <div className={styles.spellHeader}>
                <div>
                  <strong className={styles.spellName}>{mag.nome}</strong>
                  <span className={styles.spellMp}>(MP: {mag.custo_mp || '—'})</span>
                  <span className={styles.spellSpecies}>[{mag.especie}]</span>
                </div>
                <button
                  type="button"
                  onClick={() => removerMagia(idx)}
                  className={styles.deleteBtn}
                  title="Esquecer feitiço"
                >
                  <FaTrash size={11} />
                </button>
              </div>
              {mag.descricao && <div className={styles.spellDesc}>{mag.descricao}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
