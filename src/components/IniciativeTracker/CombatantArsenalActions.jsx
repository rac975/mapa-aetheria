import { FaCrosshairs, FaMagic, FaStar } from 'react-icons/fa';
import { Badge } from '../ui';
import styles from './CombatantArsenalActions.module.css';

export default function CombatantArsenalActions({
  combatente,
  perfil,
  onRolarDados,
  setDanoAplicado,
  setTipoDano,
  setCustoPm,
  setNotaLivre
}) {
  if (!combatente || !perfil) return null;

  const armas = perfil.armas || [];
  const magias = perfil.magias || [];
  const habilidades = perfil.habilidades || [];

  const handleRolarArma = async (arma) => {
    if (!onRolarDados) return;
    const res = await onRolarDados({
      combatente,
      perfil,
      categoria: 'arma',
      titulo: `Ataque: ${arma.nome}`,
      attr1: arma.attr1,
      attr2: arma.attr2,
      bonusTeste: Number(arma.bonusPrecisao) || 0,
      bonusDano: Number(arma.bonusDano) || 0,
      calcularDano: true,
      tipoDano: arma.tipoDano || 'fisico'
    });
    if (res) {
      if (res.danoTotal !== null) setDanoAplicado?.(res.danoTotal);
      if (arma.tipoDano) setTipoDano?.(arma.tipoDano);
      const tagVoador = arma.atingeVoadores ? ' • 🦅 Atinge Voadores' : '';
      setNotaLivre?.(
        `${arma.nome}: Precisão ${res.total} ${res.formulaDados} • RA ${res.hr}${res.statusCritico ? ` • ${res.statusCritico}` : ''}${tagVoador}`
      );
    }
  };

  const handleRolarMagia = async (magia) => {
    if (!onRolarDados) return;
    const custo = Number(magia.custoPm) || 0;
    const res = await onRolarDados({
      combatente,
      perfil,
      categoria: 'magia',
      titulo: `Conjurar: ${magia.nome}`,
      attr1: magia.attr1 || 'ast',
      attr2: magia.attr2 || 'von',
      bonusTeste: Number(magia.bonusPrecisao) || 0,
      bonusDano: Number(magia.bonusDano) || 0,
      calcularDano: Boolean(magia.ofensiva),
      tipoDano: magia.tipoDano || 'magico',
      custoPm: custo
    });
    if (res) {
      setCustoPm?.(custo);
      if (res.danoTotal !== null) setDanoAplicado?.(res.danoTotal);
      setNotaLivre?.(`${magia.nome}: ${res.total} ${res.formulaDados} • RA ${res.hr}`);
    }
  };

  const handleUsarHabilidade = (hab) => {
    const custo = Number(hab.custoPm) || 0;
    if (custo > 0) setCustoPm?.(custo);
    setNotaLivre?.(`Habilidade: ${hab.nome}${custo > 0 ? ` (${custo} PM)` : ''} • ${hab.descricao || ''}`);
  };

  return (
    <div className={styles.arsenalWrap} onClick={(e) => e.stopPropagation()}>
      {armas.length > 0 && (
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeading}>
            <FaCrosshairs /> Armas Equipadas
          </div>
          <div className={styles.itemsGrid}>
            {armas.map((arma) => (
              <button
                key={arma.id}
                type="button"
                className={styles.itemBtn}
                onClick={() => handleRolarArma(arma)}
                title={`Rolar ataque com ${arma.nome}`}
              >
                <div className={styles.itemTopLine}>
                  <span className={styles.itemTitle}>{arma.nome}</span>
                  <div className={styles.itemBadges}>
                    {arma.alcance === 'distancia' ? (
                      <Badge variant="ether" size="sm">Distância</Badge>
                    ) : (
                      <Badge variant="default" size="sm">CaC</Badge>
                    )}
                    {arma.atingeVoadores && <Badge variant="gold" size="sm">🦅</Badge>}
                    {arma.ehSegundaForma && <Badge variant="core" size="sm">2ª Forma</Badge>}
                  </div>
                </div>
                <div className={styles.itemSubLine}>
                  <span className={styles.itemFormula}>
                    [{arma.attr1.toUpperCase()}+{arma.attr2.toUpperCase()}
                    {arma.bonusPrecisao ? `+${arma.bonusPrecisao}` : ''}]
                  </span>
                  <span className={styles.itemDmg}>+{arma.bonusDano} ({arma.tipoDano})</span>
                </div>
                {arma.efeito && <div className={styles.itemDesc}>{arma.efeito}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {magias.length > 0 && (
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeading}>
            <FaMagic /> Conjurar / Feitiços & Arcanos
          </div>
          <div className={styles.itemsGrid}>
            {magias.map((magia) => (
              <button
                key={magia.id}
                type="button"
                className={`${styles.itemBtn} ${styles.itemBtnSpell}`}
                onClick={() => handleRolarMagia(magia)}
                title={`Conjurar feitiço ${magia.nome}`}
              >
                <div className={styles.itemTopLine}>
                  <span className={styles.itemTitle}>{magia.nome}</span>
                  <Badge variant="gold" size="sm">{magia.custoPm} PM</Badge>
                </div>
                <div className={styles.itemSubLine}>
                  <span className={styles.itemFormula}>
                    [{(magia.attr1 || 'ast').toUpperCase()}+{(magia.attr2 || 'von').toUpperCase()}
                    {magia.bonusPrecisao ? `+${magia.bonusPrecisao}` : ''}]
                  </span>
                  {magia.ofensiva && <span className={styles.itemDmg}>+{magia.bonusDano} Dano</span>}
                </div>
                {magia.descricao && <div className={styles.itemDesc}>{magia.descricao}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {habilidades.length > 0 && (
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeading}>
            <FaStar /> Habilidades Ativas
          </div>
          <div className={styles.itemsGrid}>
            {habilidades.map((hab) => (
              <button
                key={hab.id}
                type="button"
                className={`${styles.itemBtn} ${styles.itemBtnAbility}`}
                onClick={() => handleUsarHabilidade(hab)}
                title={`Usar habilidade ${hab.nome}`}
              >
                <div className={styles.itemTopLine}>
                  <span className={styles.itemTitle}>{hab.nome}</span>
                  {hab.nivel && <Badge variant="core" size="sm">Nv {hab.nivel}</Badge>}
                  {Number(hab.custoPm) > 0 && <Badge variant="gold" size="sm">{hab.custoPm} PM</Badge>}
                </div>
                {hab.descricao && <div className={styles.itemDesc}>{hab.descricao}</div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
