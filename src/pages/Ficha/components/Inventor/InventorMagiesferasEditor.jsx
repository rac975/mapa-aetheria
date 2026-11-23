import React, { useState, useEffect, useCallback } from 'react';
import { FaCircle, FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import { fichaService } from '../../../../services/fichaService';
import {
  extrairMagiesferasInventor
} from '../../../../domain/fabula/inventorRules';
import { useAlert } from '../../../../contexts/useAlert';
import styles from './InventorMagiesferasEditor.module.css';

export default function InventorMagiesferasEditor({
  fichaId,
  classes = [],
  nivelPersonagem = 5,
  onAtualizarClasses
}) {
  const { showAlert } = useAlert();
  const [catalogoFeiticos, setCatalogoFeiticos] = useState([]);
  const [disciplinaFiltro, setDisciplinaFiltro] = useState('todas');
  const [feiticoSelecionadoId, setFeiticoSelecionadoId] = useState('');
  const [salvando, setSalvando] = useState(false);

  const { limite, magiesferas } = extrairMagiesferasInventor({
    classes,
    ficha: { id: fichaId, nivel: nivelPersonagem }
  });

  const carregarCatalogo = useCallback(async () => {
    try {
      const { data, error } = await fichaService.getCatalogoFeiticosMagiesferas();
      if (!error && data) {
        setCatalogoFeiticos(data);
      }
    } catch (err) {
      console.error('Erro ao buscar feitiços para magiesferas:', err);
    }
  }, []);

  useEffect(() => {
    carregarCatalogo();
  }, [carregarCatalogo]);

  const feiticosFiltrados = catalogoFeiticos.filter((f) => {
    if (disciplinaFiltro === 'todas') return true;
    return (f.classe || '').toLowerCase() === disciplinaFiltro.toLowerCase();
  });

  const handleAdicionarMagiesfera = async () => {
    if (!feiticoSelecionadoId) {
      showAlert('Selecione um feitiço para armazenar na magiesfera.');
      return;
    }

    if (magiesferas.length >= limite) {
      showAlert(`Você atingiu o limite de ${limite} magiesferas para o seu nível.`);
      return;
    }

    const feitico = catalogoFeiticos.find((f) => String(f.id) === String(feiticoSelecionadoId));
    if (!feitico) return;

    const novaMagiesfera = {
      id: feitico.id,
      nome: feitico.nome,
      classe: feitico.classe || 'Elementalista',
      pm_custo: Number(feitico.pm_custo) || 10,
      custoPm: Number(feitico.pm_custo) || 10,
      descricao: feitico.descricao || '',
      alvo: feitico.alvo || '1 criatura',
      duracao: feitico.duracao || 'Instantânea',
      ofensivo: Boolean(feitico.ofensivo)
    };

    const novas = [...magiesferas, novaMagiesfera];
    setSalvando(true);
    try {
      const res = await fichaService.salvarMagiesferasInventor(fichaId, novas);
      if (res.sucesso) {
        setFeiticoSelecionadoId('');
        showAlert(`✨ Magiesfera com feitiço "${feitico.nome}" criada com sucesso!`);
        onAtualizarClasses?.();
      } else {
        showAlert('Erro ao salvar magiesfera.');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverMagiesfera = async (indexRemover) => {
    const novas = magiesferas.filter((_, idx) => idx !== indexRemover);
    setSalvando(true);
    try {
      const res = await fichaService.salvarMagiesferasInventor(fichaId, novas);
      if (res.sucesso) {
        showAlert('Magiesfera descarregada com sucesso.');
        onAtualizarClasses?.();
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>
            <FaCircle className={styles.sphereIcon} /> Magiesferas Tecnomágicas
          </span>
          <Badge variant={magiesferas.length >= limite ? 'crise' : 'ether'} size="sm">
            {magiesferas.length} / {limite} Esferas Ativas
          </Badge>
        </div>
        <p className={styles.ruleInfo}>
          <FaInfoCircle /> Dispositivos de armazenamento mágico. Ação de Inventário + 2 PI para acionar instantaneamente pagando os custos normais de PM. Não contam como magias aprendidas pelo herói.
        </p>
      </div>

      {magiesferas.length === 0 ? (
        <div className={styles.emptyCard}>
          Nenhuma magiesfera ativa. Adicione até {limite} magiesferas selecionando abaixo.
        </div>
      ) : (
        <div className={styles.spheresGrid}>
          {magiesferas.map((m, idx) => (
            <div key={`${m.id}_${idx}`} className={styles.sphereCard}>
              <div className={styles.sphereCardHeader}>
                <div className={styles.sphereCardTitle}>
                  <FaCircle className={styles.sphereSmallDot} />
                  <strong>{m.nome}</strong>
                </div>
                <div className={styles.sphereBadges}>
                  <Badge variant="ether" size="sm">{m.classe}</Badge>
                  <Badge variant="pm" size="sm">{m.custoPm} PM</Badge>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className={styles.removeBtn}
                    onClick={() => handleRemoverMagiesfera(idx)}
                    disabled={salvando}
                    title="Descarregar magiesfera"
                  >
                    <FaTrash size={10} />
                  </Button>
                </div>
              </div>
              <p className={styles.sphereDesc}>{m.descricao || 'Sem descrição.'}</p>
            </div>
          ))}
        </div>
      )}

      {magiesferas.length < limite && (
        <div className={styles.addSection}>
          <strong className={styles.addTitle}>Adicionar Nova Magiesfera</strong>
          <div className={styles.controlsRow}>
            <select
              className={styles.select}
              value={disciplinaFiltro}
              onChange={(e) => {
                setDisciplinaFiltro(e.target.value);
                setFeiticoSelecionadoId('');
              }}
            >
              <option value="todas">Todas as Disciplinas</option>
              <option value="elementalista">Elementalista</option>
              <option value="entropista">Entropista</option>
              <option value="espiritualista">Espiritualista</option>
            </select>

            <select
              className={styles.select}
              value={feiticoSelecionadoId}
              onChange={(e) => setFeiticoSelecionadoId(e.target.value)}
            >
              <option value="">Selecione o Feitiço...</option>
              {feiticosFiltrados.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} ({f.classe} • {f.pm_custo} PM)
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="core"
              size="sm"
              onClick={handleAdicionarMagiesfera}
              disabled={salvando || !feiticoSelecionadoId}
            >
              <FaPlus size={10} /> {salvando ? 'Salvando...' : 'Carregar Magiesfera'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
