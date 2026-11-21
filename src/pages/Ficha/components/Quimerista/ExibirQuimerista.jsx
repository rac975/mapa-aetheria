import React, { useState, useMemo } from 'react';
import { FaDragon, FaPlus, FaTrash } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';
import {
  extrairMagiasQuimerista,
  extrairAtributoQuimerista,
  sincronizarQuimeristaNaHabilidade
} from '../../../../domain/fabula/coreClassRules';
import { Button } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import styles from './ExibirQuimerista.module.css';

export default function ExibirQuimerista({
  fichaId,
  ficha,
  classe,
  classes,
  handleAjustarRecurso,
  onAtualizarDadosClasse
}) {
  const [magiasLocais, setMagiasLocais] = useState(null);
  const [atributoLocal, setAtributoLocal] = useState(null);
  const [prevProps, setPrevProps] = useState({ classe, ficha });

  if (classe !== prevProps.classe || ficha !== prevProps.ficha) {
    setPrevProps({ classe, ficha });
    setMagiasLocais(null);
    setAtributoLocal(null);
  }

  const magiasFromProps = useMemo(() => extrairMagiasQuimerista(classe, ficha), [classe, ficha]);
  const magiasImitadas = magiasLocais !== null ? magiasLocais : magiasFromProps;

  const atributoFromProps = useMemo(() => extrairAtributoQuimerista(classe, ficha), [classe, ficha]);
  const atributoEscolhido = atributoLocal !== null ? atributoLocal : atributoFromProps;

  const [mostrarForm, setMostrarForm] = useState(false);
  const [novaMagia, setNovaMagia] = useState({ nome: '', custo_mp: '', especie: 'fera', descricao: '' });
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const habs = classe?.habilidades || ficha?.habilidades || [];
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
  const limiteFeiticos = nvImitacao > 0 ? nvImitacao + 2 : 2;

  const fecharAlerta = () => setAlerta({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const salvarNoBanco = async (novasMagias, novoAtributo) => {
    const attrFinal = novoAtributo !== undefined ? novoAtributo : atributoEscolhido;
    setMagiasLocais(novasMagias);
    if (novoAtributo !== undefined) setAtributoLocal(novoAtributo);

    const idReal = fichaId || ficha?.id;
    if (!idReal) return;

    if (onAtualizarDadosClasse) {
      onAtualizarDadosClasse(
        (c) => (c.nome_classe || '').toLowerCase().includes('quimerista'),
        (c) => {
          const dados = { magias_imitadas: novasMagias, atributo_quimerista: attrFinal };
          return {
            ...c,
            magias_imitadas: novasMagias,
            atributo_quimerista: attrFinal,
            dados_quimerista: dados,
            habilidades: sincronizarQuimeristaNaHabilidade(c.habilidades, dados)
          };
        }
      );
    }

    const { error } = await fichaService.salvarDadosQuimerista(
      idReal,
      { magiasImitadas: novasMagias, atributoEscolhido: attrFinal },
      classes
    );
    if (error) console.error('Erro ao salvar dados do Quimerista:', error.message);
  };

  const alterarAtributo = (e) => {
    const val = e.target.value;
    salvarNoBanco(magiasImitadas, val);
  };

  const adicionarMagia = (e) => {
    e.preventDefault();
    if (!novaMagia.nome.trim()) return;
    if (magiasImitadas.length >= limiteFeiticos) {
      setAlerta({
        isOpen: true,
        type: 'warning',
        title: 'Limite de Feitiços',
        message: `Limite de ${limiteFeiticos} feitiços memorizados (NP + 2) atingido.`
      });
      return;
    }
    salvarNoBanco([...magiasImitadas, { ...novaMagia, id: `quim-${Date.now()}` }]);
    setNovaMagia({ nome: '', custo_mp: '', especie: 'fera', descricao: '' });
    setMostrarForm(false);
  };

  const removerMagia = (idx) => {
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Esquecer Feitiço',
      message: 'Esquecer este feitiço memorizado pelo Quimerista?',
      onConfirm: () => salvarNoBanco(magiasImitadas.filter((_, i) => i !== idx))
    });
  };

  const usarConsumir = () => {
    const recuperacao = nvConsumir * 2;
    if (recuperacao <= 0) return;
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Consumir',
      message: `Recuperar +${recuperacao} PM (NP × 2) por causar dano com feitiço portando adaga, arma arcana ou malho?`,
      onConfirm: () => { if (handleAjustarRecurso) handleAjustarRecurso('mp_atual', recuperacao); }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}><FaDragon /> Grimório Quimérico</div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setMostrarForm(!mostrarForm)}>
          <FaPlus size={10} /> Imitar Feitiço ({magiasImitadas.length}/{limiteFeiticos})
        </Button>
      </div>

      <div className={styles.attributeConfig}>
        <span className={styles.attributeLabel}>Atributos de Magia/Quimerismo:</span>
        <select value={atributoEscolhido} onChange={alterarAtributo} className={styles.attributeSelect}>
          <option value="AST + VON">AST + VON (Astúcia + Vontade)</option>
          <option value="VIG + VON">VIG + VON (Vigor + Vontade)</option>
        </select>
      </div>

      <div className={styles.passivasRow}>
        {nvConsumir > 0 && (
          <button type="button" onClick={usarConsumir} className={styles.passivaConsumir} title="Clique para recuperar PM">
            ⚡ Consumir: Recuperar <strong>+{nvConsumir * 2} PM</strong>
          </button>
        )}
        {nvPatogenese > 0 && <span className={styles.passivaPatogenese}>🧪 Patogênese ativa (envenena espécie correspondente)</span>}
        {nvLingua > 0 && <span className={styles.passivaLingua}>🗣️ Língua das Feras</span>}
      </div>

      {mostrarForm && (
        <form onSubmit={adicionarMagia} className={styles.formBox}>
          <div className={styles.formRow}>
            <input type="text" placeholder="Nome do Feitiço Imitado" value={novaMagia.nome} onChange={(e) => setNovaMagia({ ...novaMagia, nome: e.target.value })} required className={styles.inputName} />
            <input type="number" placeholder="MP" value={novaMagia.custo_mp} onChange={(e) => setNovaMagia({ ...novaMagia, custo_mp: e.target.value })} className={styles.inputMp} />
            <select value={novaMagia.especie} onChange={(e) => setNovaMagia({ ...novaMagia, especie: e.target.value })} className={styles.selectEspecie}>
              <option value="fera">Fera</option>
              <option value="monstro">Monstro</option>
              <option value="planta">Planta</option>
            </select>
          </div>
          <input type="text" placeholder="Descrição / Efeito do feitiço" value={novaMagia.descricao} onChange={(e) => setNovaMagia({ ...novaMagia, descricao: e.target.value })} className={styles.inputDesc} />
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm">Memorizar</Button>
          </div>
        </form>
      )}

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
                  <strong className={styles.spellName}>{mag.nome}</strong>{' '}
                  <span className={styles.spellMp}>(MP: {mag.custo_mp || '—'})</span>{' '}
                  <span className={styles.spellSpecies}>[{mag.especie}]</span>
                </div>
                <button type="button" onClick={() => removerMagia(idx)} className={styles.deleteBtn} title="Esquecer feitiço">
                  <FaTrash size={11} />
                </button>
              </div>
              {mag.descricao && <div className={styles.spellDesc}>{mag.descricao}</div>}
            </div>
          ))}
        </div>
      )}

      <CustomAlert isOpen={alerta.isOpen} type={alerta.type} title={alerta.title} message={alerta.message} onConfirm={alerta.onConfirm} onClose={fecharAlerta} />
    </div>
  );
}
