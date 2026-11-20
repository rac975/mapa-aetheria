import { useState, useEffect } from 'react';
import { FaStar, FaTrash, FaExchangeAlt } from 'react-icons/fa';
import { fichaService } from '../../../../services/fichaService';
import { Badge, Button } from '../../../../components/ui';
import styles from './VincularArcanoCard.module.css';

export default function VincularArcanoCard({ habilidade, aoAtualizarArcano }) {
  const [catalogo, setCatalogo] = useState([]);
  const [modoTroca, setModoTroca] = useState(false);

  useEffect(() => {
    let active = true;
    async function carregarCatalogo() {
      const { data, error } = await fichaService.getCatalogoArcanos();
      if (active && !error && data) {
        setCatalogo(data);
      }
    }
    carregarCatalogo();
    return () => { active = false; };
  }, []);

  const arcanoAtual = habilidade?.arcano_vinculado ||
    (Array.isArray(habilidade?.arcanos_vinculados) && habilidade.arcanos_vinculados[0]) ||
    null;

  const handleSelecionar = (e) => {
    const id = e.target.value;
    if (!id) return;
    const escolhido = catalogo.find((a) => String(a.id) === String(id));
    if (!escolhido) return;
    const listaExistente = Array.isArray(habilidade?.arcanos_vinculados) ? habilidade.arcanos_vinculados : [];
    const outros = listaExistente.filter((a) => (a.id || a.nome) !== (escolhido.id || escolhido.nome));
    const novaLista = [escolhido, ...outros];
    aoAtualizarArcano(escolhido, novaLista);
    setModoTroca(false);
  };

  const handleRemover = () => {
    aoAtualizarArcano(null, []);
    setModoTroca(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>
          <FaStar /> Vínculo Arcano da Alma
        </span>
        <div className={styles.controls}>
          {arcanoAtual && !modoTroca && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setModoTroca(true)}
                title="Trocar Arcano Vinculado"
              >
                <FaExchangeAlt size={10} /> Trocar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleRemover}
                title="Desvincular Arcano"
              >
                <FaTrash size={10} />
              </Button>
            </>
          )}
        </div>
      </div>

      {(!arcanoAtual || modoTroca) && (
        <select
          onChange={handleSelecionar}
          defaultValue=""
          className={styles.select}
        >
          <option value="" disabled>
            {modoTroca ? '-- Selecione o novo Arcano --' : '-- Escolha o Arcano Inicial --'}
          </option>
          {catalogo.map((arc) => (
            <option key={arc.id} value={arc.id}>
              {arc.nome} ({arc.dominios})
            </option>
          ))}
        </select>
      )}

      {arcanoAtual && (
        <div className={styles.arcanoInfo}>
          <div className={styles.arcanoNomeRow}>
            <span className={styles.arcanoNome}>{arcanoAtual.nome}</span>
            <Badge variant="ether" size="sm">Vinculado</Badge>
          </div>
          {arcanoAtual.dominios && (
            <div className={styles.arcanoDominios}>
              <strong>Domínios:</strong> {arcanoAtual.dominios}
            </div>
          )}
          {arcanoAtual.fundir && (
            <div className={styles.arcanoFundir}>
              <strong>Fundir:</strong> {arcanoAtual.fundir}
            </div>
          )}
        </div>
      )}

      {!arcanoAtual && !modoTroca && (
        <div className={styles.emptyAviso}>
          Nenhum Arcano vinculado inicialmente. Selecione um acima.
        </div>
      )}
    </div>
  );
}
