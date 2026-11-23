import { useState, useMemo } from 'react';
import { FaDragon, FaPlus } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';
import {
  extrairMagiasQuimerista,
  extrairAtributoQuimerista,
  sincronizarQuimeristaNaHabilidade
} from '../../../../domain/fabula/coreClassRules';
import { normalizarFeiticoQuimerista } from '../../../../domain/fabula/chimeristRules';
import { Button } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import QuimeristaSpellForm from './QuimeristaSpellForm';
import QuimeristaSpellCard from './QuimeristaSpellCard';
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

  const [modoEdicao, setModoEdicao] = useState({ aberto: false, magia: null, index: null });
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
    salvarNoBanco(magiasImitadas, e.target.value);
  };

  const handleSalvarFeitico = (dadosFeitico) => {
    if (modoEdicao.index !== null && modoEdicao.index >= 0) {
      // Modo Edição
      const atualizadas = [...magiasImitadas];
      atualizadas[modoEdicao.index] = normalizarFeiticoQuimerista(dadosFeitico, modoEdicao.index);
      salvarNoBanco(atualizadas);
      setModoEdicao({ aberto: false, magia: null, index: null });
    } else {
      // Modo Criação
      if (magiasImitadas.length >= limiteFeiticos) {
        setAlerta({
          isOpen: true,
          type: 'warning',
          title: 'Limite de Feitiços',
          message: `Limite de ${limiteFeiticos} feitiços memorizados (NP + 2) atingido.`
        });
        return;
      }
      const nova = normalizarFeiticoQuimerista(dadosFeitico, magiasImitadas.length);
      salvarNoBanco([...magiasImitadas, nova]);
      setModoEdicao({ aberto: false, magia: null, index: null });
    }
  };

  const handleRemoverFeitico = (idx) => {
    const magiaParaRemover = magiasImitadas[idx];
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Esquecer Feitiço',
      message: `Deseja realmente esquecer o feitiço "${magiaParaRemover?.nome || 'Imitado'}"?`,
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            if (modoEdicao.aberto) {
              setModoEdicao({ aberto: false, magia: null, index: null });
            } else if (magiasImitadas.length >= limiteFeiticos) {
              setAlerta({
                isOpen: true,
                type: 'warning',
                title: 'Limite de Feitiços',
                message: `Limite de ${limiteFeiticos} feitiços memorizados atingido.`
              });
            } else {
              setModoEdicao({ aberto: true, magia: null, index: null });
            }
          }}
        >
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

      {modoEdicao.aberto && (
        <QuimeristaSpellForm
          feiticoInicial={modoEdicao.magia}
          onSalvar={handleSalvarFeitico}
          onCancelar={() => setModoEdicao({ aberto: false, magia: null, index: null })}
        />
      )}

      {magiasImitadas.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum feitiço imitado memorizado ainda. Use <strong>Imitação Mágica</strong> para registrar feitiços aprendidos de feras, monstros ou plantas.
        </div>
      ) : (
        <div className={styles.spellsList}>
          {magiasImitadas.map((mag, idx) => (
            <QuimeristaSpellCard
              key={mag.id || idx}
              magia={mag}
              index={idx}
              onEditar={(m, i) => setModoEdicao({ aberto: true, magia: m, index: i })}
              onRemover={handleRemoverFeitico}
            />
          ))}
        </div>
      )}

      <CustomAlert
        isOpen={alerta.isOpen}
        type={alerta.type}
        title={alerta.title}
        message={alerta.message}
        onConfirm={alerta.onConfirm}
        onClose={fecharAlerta}
      />
    </div>
  );
}
