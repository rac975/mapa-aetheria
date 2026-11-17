import React, { useState, useEffect } from 'react';
import { FaStar, FaPlus, FaBook } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';
import { calcularBonusEscalaArcanista } from '../../../../domain/fabula/classRules';
import { calcularInvocacaoArcano } from '../../../../domain/fabula/coreClassRules';
import { calcularNivelTotal } from '../../../../domain/fabula/characterProgression';
import { Button } from '../../../../components/ui';
import CustomAlert from '../../../../components/CustomAlert/CustomAlert';
import ArcanoAtivoPainel from './ArcanoAtivoPainel';
import ArcanosForms from './ArcanosForms';
import ArcanosLista from './ArcanosLista';
import styles from './ExibirArcanista.module.css';

export default function ExibirArcanista({ fichaId, ficha, classe, classes, emCriseGlobal = false, handleAjustarRecurso }) {
  const [catalogo, setCatalogo] = useState([]);
  const [arcanosVinculados, setArcanosVinculados] = useState(() => classe?.arcanos_vinculados || ficha?.arcanos_vinculados || []);
  const [arcanoAtivoIdx, setArcanoAtivoIdx] = useState(null);
  const [simularCrise, setSimularCrise] = useState(false);
  const [modoAdicao, setModoAdicao] = useState(null);
  const [selecionadoCatalogo, setSelecionadoCatalogo] = useState('');
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const [novoCustom, setNovoCustom] = useState({ nome: '', dominios: '', fundir: '', dispensar_nome: '', dispensar_efeito: '' });

  useEffect(() => {
    let active = true;
    async function carregarCatalogo() {
      const { data, error } = await fichaService.getCatalogoArcanos();
      if (active && !error && data) {
        setCatalogo(data);
        if (data.length > 0) setSelecionadoCatalogo(data[0].id);
      }
    }
    carregarCatalogo();
    return () => { active = false; };
  }, []);

  const nivelTotal = calcularNivelTotal(classes) || 5;
  const bonusEscalaNivel = calcularBonusEscalaArcanista(nivelTotal);

  const habs = classe?.habilidades || ficha?.habilidades || [];
  const getNivel = (termo) => {
    const h = habs.find((item) =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nvEmergencial = getNivel('arcano emergencial');
  const nvCirculo = getNivel('circulo arcano');
  const nvRegeneracao = getNivel('regeneracao arcana');
  const emCriseEfetivo = Boolean(emCriseGlobal || simularCrise);
  const { custoPm: custoInvocacao, curaRegeneracao } = calcularInvocacaoArcano({
    nvArcanoEmergencial: nvEmergencial,
    nvRegeneracaoArcana: nvRegeneracao,
    emCrise: emCriseEfetivo
  });

  const fecharAlerta = () => setAlerta({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const salvarNoBanco = async (novaLista) => {
    setArcanosVinculados(novaLista);
    const idReal = fichaId || ficha?.id;
    if (!idReal || !classes) return;
    const classesAtualizadas = classes.map((c) =>
      (c.nome_classe || '').toLowerCase().includes('arcanista') ? { ...c, arcanos_vinculados: novaLista } : c
    );
    const { error } = await fichaService.atualizarClassesPersonagem(idReal, classesAtualizadas);
    if (error) console.error('Erro ao salvar Arcanos vinculados:', error.message);
  };

  const vincularDoCatalogo = () => {
    const item = catalogo.find((a) => a.id === selecionadoCatalogo);
    if (!item) return;
    if (arcanosVinculados.some((a) => a.nome === item.nome)) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Arcano Duplicado', message: 'Este Arcano já está vinculado!' });
      return;
    }
    salvarNoBanco([...arcanosVinculados, item]);
    setModoAdicao(null);
  };

  const vincularCustom = (e) => {
    e.preventDefault();
    if (!novoCustom.nome.trim()) return;
    salvarNoBanco([...arcanosVinculados, { ...novoCustom, id: `custom-${Date.now()}` }]);
    setNovoCustom({ nome: '', dominios: '', fundir: '', dispensar_nome: '', dispensar_efeito: '' });
    setModoAdicao(null);
  };

  const removerVinculo = (idx) => {
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: 'Remover Vínculo Arcano',
      message: 'Deseja remover este Arcano da lista vinculada?',
      onConfirm: () => {
        salvarNoBanco(arcanosVinculados.filter((_, i) => i !== idx));
        if (arcanoAtivoIdx === idx) setArcanoAtivoIdx(null);
      }
    });
  };

  const invocarArcano = (idx) => {
    if (arcanoAtivoIdx !== null) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Arcano Ativo', message: 'Dispense o Arcano atual antes de invocar outro.' });
      return;
    }
    const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
    if (mpAtual < custoInvocacao) {
      setAlerta({ isOpen: true, type: 'warning', title: 'PM Insuficiente', message: `Invocar requer ${custoInvocacao} PM (você possui ${mpAtual} PM).` });
      return;
    }
    const arcano = arcanosVinculados[idx];
    const msgCura = curaRegeneracao > 0 ? ` e recuperar ${curaRegeneracao} PV (Regeneração Arcana)` : '';
    setAlerta({
      isOpen: true,
      type: 'confirm',
      title: `Invocar ${arcano.nome}`,
      message: `Gastar ${custoInvocacao} PM para invocar ${arcano.nome}${msgCura}?`,
      onConfirm: () => {
        if (handleAjustarRecurso) {
          if (custoInvocacao > 0) handleAjustarRecurso('mp_atual', -custoInvocacao);
          if (curaRegeneracao > 0) handleAjustarRecurso('hp_atual', curaRegeneracao);
        }
        setArcanoAtivoIdx(idx);
      }
    });
  };

  const dispensarArcano = (voluntario = true) => {
    setArcanoAtivoIdx(null);
    if (voluntario && nvCirculo > 0) {
      setAlerta({
        isOpen: true,
        type: 'info',
        title: 'Círculo Arcano Ativo',
        message: `Após resolver o efeito de dispensa, você pode lançar um Feitiço grátis sem usar ação (custo até ${nvCirculo * 5} PM, pagando seu custo em PM).`
      });
    }
  };

  const arcanoAtivo = arcanoAtivoIdx !== null ? arcanosVinculados[arcanoAtivoIdx] : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}><FaStar /> Grimório de Arcanos</div>
        <div className={styles.headerActions}>
          {nvEmergencial > 0 && !emCriseGlobal && (
            <Button type="button" variant={simularCrise ? 'danger' : 'ghost'} size="sm" onClick={() => setSimularCrise(!simularCrise)}>
              {simularCrise ? `Em Crise (-${nvEmergencial * 5} PM)` : 'Simular Crise'}
            </Button>
          )}
          {nvEmergencial > 0 && emCriseGlobal && (
            <Button type="button" variant="danger" size="sm" disabled>
              Crise Ativa (-{nvEmergencial * 5} PM)
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => setModoAdicao(modoAdicao === 'catalogo' ? null : 'catalogo')}>
            <FaBook size={10} /> + Catálogo
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setModoAdicao(modoAdicao === 'custom' ? null : 'custom')}>
            <FaPlus size={10} /> + Custom
          </Button>
        </div>
      </div>

      <div className={styles.resumoGrid}>
        <span className={styles.resumoItem}>Invocação: <strong>{custoInvocacao} PM</strong></span>
        {nvRegeneracao > 0 && <span className={styles.resumoItemGreen}>Regeneração: <strong>+{curaRegeneracao} PV</strong> ao invocar</span>}
        {bonusEscalaNivel > 0 && <span className={styles.resumoItemGold}>Dano de Dispensa (Nv. {nivelTotal}): <strong>+{bonusEscalaNivel}</strong></span>}
      </div>

      <ArcanoAtivoPainel arcanoAtivo={arcanoAtivo} onDispensar={dispensarArcano} />
      <ArcanosForms
        modoAdicao={modoAdicao}
        onFecharModo={() => setModoAdicao(null)}
        catalogo={catalogo}
        selecionadoCatalogo={selecionadoCatalogo}
        setSelecionadoCatalogo={setSelecionadoCatalogo}
        onVincularCatalogo={vincularDoCatalogo}
        novoCustom={novoCustom}
        setNovoCustom={setNovoCustom}
        onVincularCustom={vincularCustom}
      />
      <ArcanosLista
        arcanosVinculados={arcanosVinculados}
        arcanoAtivoIdx={arcanoAtivoIdx}
        custoInvocacao={custoInvocacao}
        onInvocarArcano={invocarArcano}
        onRemoverVinculo={removerVinculo}
      />

      <CustomAlert isOpen={alerta.isOpen} type={alerta.type} title={alerta.title} message={alerta.message} onConfirm={alerta.onConfirm} onClose={fecharAlerta} />
    </div>
  );
}
