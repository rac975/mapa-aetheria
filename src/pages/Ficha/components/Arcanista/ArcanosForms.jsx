import React from 'react';
import { Button } from '../../../../components/ui';
import styles from './ArcanosForms.module.css';

export default function ArcanosForms({
  modoAdicao,
  onFecharModo,
  catalogo,
  selecionadoCatalogo,
  setSelecionadoCatalogo,
  onVincularCatalogo,
  novoCustom,
  setNovoCustom,
  onVincularCustom
}) {
  if (!modoAdicao) return null;

  if (modoAdicao === 'catalogo') {
    return (
      <div className={styles.catalogoContainer}>
        <select
          value={selecionadoCatalogo}
          onChange={(e) => setSelecionadoCatalogo(e.target.value)}
          className={styles.select}
        >
          {catalogo.map((arc) => (
            <option key={arc.id} value={arc.id}>
              {arc.nome} ({arc.dominios})
            </option>
          ))}
        </select>
        <Button type="button" variant="primary" size="sm" onClick={onVincularCatalogo}>
          Vincular
        </Button>
      </div>
    );
  }

  if (modoAdicao === 'custom') {
    return (
      <form onSubmit={onVincularCustom} className={styles.customForm}>
        <input
          type="text"
          placeholder="Nome do Arcano"
          value={novoCustom.nome}
          onChange={(e) => setNovoCustom({ ...novoCustom, nome: e.target.value })}
          required
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Domínios (ex: sombra, segredos, noite)"
          value={novoCustom.dominios}
          onChange={(e) => setNovoCustom({ ...novoCustom, dominios: e.target.value })}
          className={styles.input}
        />
        <textarea
          placeholder="Benefício ao Fundir"
          rows={2}
          value={novoCustom.fundir}
          onChange={(e) => setNovoCustom({ ...novoCustom, fundir: e.target.value })}
          required
          className={styles.textarea}
        />
        <input
          type="text"
          placeholder="Nome do Efeito de Dispensa (opcional)"
          value={novoCustom.dispensar_nome}
          onChange={(e) => setNovoCustom({ ...novoCustom, dispensar_nome: e.target.value })}
          className={styles.input}
        />
        <textarea
          placeholder="Efeito de Dispensa (opcional)"
          rows={2}
          value={novoCustom.dispensar_efeito}
          onChange={(e) => setNovoCustom({ ...novoCustom, dispensar_efeito: e.target.value })}
          className={styles.textarea}
        />
        <div className={styles.formActions}>
          <Button type="button" variant="ghost" size="sm" onClick={onFecharModo}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Salvar
          </Button>
        </div>
      </form>
    );
  }

  return null;
}
