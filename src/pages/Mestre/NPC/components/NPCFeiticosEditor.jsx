import React, { useState } from 'react';
import { FaMagic, FaTrash } from 'react-icons/fa';
import { Card, Button, Badge } from '../../../../components/ui';
import styles from './NPCEditor.module.css';

export default function NPCFeiticosEditor({
  feiticos = [],
  catalogoFeiticos = [],
  onAdicionarFeitico,
  onRemoverFeitico
}) {
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  const feiticosFiltrados = catalogoFeiticos.filter((f) => {
    if (categoriaFiltro === 'todas') return true;
    if (categoriaFiltro === 'comuns') return !f.classe;
    return (f.classe || '').toLowerCase() === categoriaFiltro.toLowerCase();
  });

  const handleSelectFeitico = (e) => {
    const feiticoId = e.target.value;
    if (!feiticoId) return;
    const f = catalogoFeiticos.find((item) => String(item.id) === String(feiticoId));
    if (f) {
      onAdicionarFeitico({
        id: f.id,
        nome: f.nome,
        classe: f.classe || null,
        isMagiaClasse: Boolean(f.classe),
        pm_custo: Number(f.pm_custo) || 10,
        descricao: f.descricao || '',
        ofensivo: Boolean(f.ofensivo),
        alvo: f.alvo || '',
        duracao: f.duracao || ''
      });
    }
    e.target.value = '';
  };

  return (
    <Card variant="default">
      <h3 className={styles.sectionTitle}>
        <FaMagic /> Feitiços & Magias de Classe
      </h3>

      <div className={styles.filtroFeiticosRow}>
        <select
          className={styles.select}
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          aria-label="Filtrar categoria de feitiços"
        >
          <option value="todas">Todas as Categorias</option>
          <option value="comuns">Feitiços Comuns de NPC</option>
          <option value="elementalista">Magias de Classe: Elementalista</option>
          <option value="entropista">Magias de Classe: Entropista</option>
          <option value="espiritualista">Magias de Classe: Espiritualista</option>
        </select>

        <select
          className={styles.select}
          onChange={handleSelectFeitico}
          defaultValue=""
          aria-label="Selecionar feitiço para adicionar"
        >
          <option value="" disabled>Adicionar feitiço...</option>
          {feiticosFiltrados.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome} {f.classe ? `[${f.classe}]` : '[Comum]'} ({f.pm_custo} PM)
            </option>
          ))}
        </select>
      </div>

      <div className={styles.listaScroll}>
        {feiticos.length === 0 ? (
          <p className={styles.emptyText}>Nenhum feitiço vinculado ao NPC.</p>
        ) : (
          feiticos.map((f, i) => (
            <div key={`${f.id || i}_${i}`} className={styles.itemCatalogo}>
              <div className={styles.itemInfo}>
                <div className={styles.itemHeaderFlex}>
                  <span className={styles.itemTitle}>{f.nome}</span>
                  <div className={styles.feiticoBadgesRow}>
                    {f.classe && <Badge variant="ether" size="sm">{f.classe}</Badge>}
                    <Badge variant="pm" size="sm">{f.pm_custo} PM</Badge>
                  </div>
                </div>
                <p className={styles.itemDesc}>{f.descricao}</p>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onRemoverFeitico(i)}
                title="Remover feitiço"
              >
                <FaTrash />
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
