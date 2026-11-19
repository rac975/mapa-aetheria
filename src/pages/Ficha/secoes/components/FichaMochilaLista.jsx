import { FaBoxOpen, FaTimes } from 'react-icons/fa';
import { Card, Button, Badge } from '../../../../components/ui';
import { getItemCategoryIcon, formatarNomeSlot } from './FichaEquiparModal';
import styles from './FichaMochilaLista.module.css';

export default function FichaMochilaLista({
  itensInventario = [],
  onDesequipar,
  onEquipar,
  onDeletar
}) {
  return (
    <Card variant="default">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <FaBoxOpen /> Mochila & Inventário ({itensInventario.length})
        </h3>
      </div>

      {itensInventario.length === 0 ? (
        <p className={styles.mochilaVazia}>Sua mochila está vazia.</p>
      ) : (
        <div className={styles.mochilaLista}>
          {itensInventario.map((item) => {
            const estaEquipado = !!item.stats_personalizados?.slot;
            const categoryMeta = getItemCategoryIcon(item);
            return (
              <div key={item.id} className={styles.mochilaItem}>
                <div className={styles.mochilaItemDetails}>
                  <div className={`${styles.itemIconWrapperSmall} ${categoryMeta.className}`}>
                    {categoryMeta.icon}
                  </div>
                  <span className={styles.mochilaItemNome}>{item.nome}</span>
                  {item.tipo && <Badge variant="gold" size="sm">{item.tipo}</Badge>}
                  <Badge variant={estaEquipado ? 'core' : 'default'} size="sm">
                    {estaEquipado ? `Equipado (${formatarNomeSlot(item.stats_personalizados.slot)})` : 'Na Mochila'}
                  </Badge>
                </div>
                <div className={styles.mochilaItemActions}>
                  {estaEquipado ? (
                    <Button type="button" variant="danger" size="sm" onClick={() => onDesequipar(item)}>
                      Desequipar
                    </Button>
                  ) : (
                    <Button type="button" variant="core" size="sm" onClick={() => onEquipar(item)}>
                      Equipar
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => onDeletar(item)} title="Descartar item">
                    <FaTimes />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
