import { useState, useEffect, memo } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { FaBookOpen } from 'react-icons/fa';
import styles from './LoadingScreen.module.css';

const FRASES_CORE = [
  'Sincronizando ressonância com o Núcleo de Aether...',
  'Verificando taxa de compatibilidade de Aether...',
  'Calibrando condutores arcanos das aeronaves...',
  'Decodificando cartografia topográfica dos Titãs...',
  'Sintonizando canais da rede de dados etéreos...',
  'Estabilizando matriz de ressonância elemental...',
  'Alinhando fluxo de mana com as correntes do Mar de Nuvens...',
  'Consultando registros arcanos na biblioteca de Fonsa Myma...'
];

const DICAS_LORE = [
  'Em Fabula Ultima, entrar em Crise (PV <= 50%) ativa habilidades heroicas poderosas!',
  'Os Titãs navegam pelo Mar de Nuvens servindo de refúgio e nação para os povos de Aetheria.',
  'Sucessos Críticos ocorrem ao rolar números iguais de 6 ou mais em ambos os dados.',
  'Gastar Pontos de Fábula permite invocar Laços e alterar o destino nos momentos cruciais.',
  'Cristais Núcleo ressoam apenas com indivíduos de determinação inabalável.',
  'Ao zerar seus Pontos de Vida (0 PV), você escolhe entre a Rendição ou o Sacrifício heroico.',
  'Projetos na Oficina permitem criar relíquias, veículos e invenções permanentes com materiais raros.'
];

/**
 * Componente visual de carregamento imersivo e de alto desempenho para o AetheriaMap.
 * Segue rigorosamente o Design System do projeto com estética Core-Crystal / Arcanotécnica.
 *
 * @param {Object} props
 * @param {boolean} [props.fullscreen=false] - Se deve cobrir a janela inteira (overlay)
 * @param {string} [props.mensagem] - Mensagem fixa opcional (se omitida, rotaciona frases)
 * @param {string} [props.subtitulo] - Subtítulo técnico opcional
 * @param {boolean} [props.showTip=true] - Se deve exibir as dicas de lore/regras
 * @param {'core'|'carmine'|'gold'} [props.variant='core'] - Variação cromática do núcleo
 * @param {string} [props.className=''] - Classes adicionais
 */
function LoadingScreen({
  fullscreen = false,
  mensagem,
  subtitulo,
  showTip = true,
  variant = 'core',
  className = ''
}) {
  const [indiceFrase, setIndiceFrase] = useState(0);
  const [indiceDica, setIndiceDica] = useState(0);
  const [animandoTexto, setAnimandoTexto] = useState(false);

  // Rotação suave de frases estilo Core-Crystal a cada 2.8s
  useEffect(() => {
    if (mensagem) return;

    const timer = setInterval(() => {
      setAnimandoTexto(true);
      setTimeout(() => {
        setIndiceFrase((prev) => (prev + 1) % FRASES_CORE.length);
        setAnimandoTexto(false);
      }, 250);
    }, 2800);

    return () => clearInterval(timer);
  }, [mensagem]);

  // Rotação de dicas de lore/regras a cada 5s
  useEffect(() => {
    if (!showTip) return;

    const timer = setInterval(() => {
      setIndiceDica((prev) => (prev + 1) % DICAS_LORE.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [showTip]);

  const fraseAtual = mensagem || FRASES_CORE[indiceFrase];
  const dicaAtual = DICAS_LORE[indiceDica];

  return (
    <div
      className={`${styles.container} ${fullscreen ? styles.fullscreen : styles.inline} ${
        styles[variant] || styles.core
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Grade etérea de fundo sutil */}
      <div className={styles.gridBackground} aria-hidden="true" />

      <div className={styles.content}>
        {/* Core Crystal animado central */}
        <div className={styles.coreWrapper} aria-hidden="true">
          <div className={styles.outerRing} />
          <div className={styles.middleRing} />
          <div className={styles.crystal}>
            <div className={styles.crystalInner}>
              <LuSparkles className={styles.crystalIcon} />
            </div>
          </div>
          <div className={styles.energyPulse} />
        </div>

        {/* Linha de status do núcleo */}
        <div className={styles.resonanceBar} aria-hidden="true">
          <span className={styles.resonanceTrack} />
        </div>

        {/* Mensagem e subtítulo */}
        <div className={styles.textWrapper}>
          <p className={`${styles.mensagem} ${animandoTexto ? styles.fade : ''}`}>
            {fraseAtual}
          </p>
          {subtitulo && <span className={styles.subtitulo}>{subtitulo}</span>}
        </div>

        {/* Dica de Lore ou Regra na parte inferior */}
        {showTip && (
          <div className={styles.tipBox} aria-hidden="true">
            <span className={styles.tipIcon}>
              <FaBookOpen />
            </span>
            <span className={styles.tipText}>{dicaAtual}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(LoadingScreen);
