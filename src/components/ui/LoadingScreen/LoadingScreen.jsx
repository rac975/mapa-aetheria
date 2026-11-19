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

function LoadingScreen({
  fullscreen = false,
  subblock = false,
  mensagem,
  subtitulo,
  showTip = true,
  variant = 'core',
  className = ''
}) {
  const [indiceFrase, setIndiceFrase] = useState(0);
  const [indiceDica, setIndiceDica] = useState(0);
  const [animandoTexto, setAnimandoTexto] = useState(false);

  useEffect(() => {
    if (mensagem || subblock) return;

    const timer = setInterval(() => {
      setAnimandoTexto(true);
      setTimeout(() => {
        setIndiceFrase((prev) => (prev + 1) % FRASES_CORE.length);
        setAnimandoTexto(false);
      }, 250);
    }, 2800);

    return () => clearInterval(timer);
  }, [mensagem, subblock]);

  useEffect(() => {
    if (!showTip || subblock) return;

    const timer = setInterval(() => {
      setIndiceDica((prev) => (prev + 1) % DICAS_LORE.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [showTip, subblock]);

  if (subblock) {
    return (
      <div
        className={`${styles.subblockContainer} ${styles[variant] || styles.core} ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className={styles.subblockSpinner} aria-hidden="true">
          <div className={styles.subblockPulseRing} />
          <LuSparkles className={styles.subblockIcon} />
        </div>
        <p className={styles.subblockText}>{mensagem || 'Carregando dados...'}</p>
        {subtitulo && <span className={styles.subblockSubtitulo}>{subtitulo}</span>}
      </div>
    );
  }

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
      <div className={styles.gridBackground} aria-hidden="true" />

      <div className={styles.content}>
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

        <div className={styles.resonanceBar} aria-hidden="true">
          <span className={styles.resonanceTrack} />
        </div>

        <div className={styles.textWrapper}>
          <p className={`${styles.mensagem} ${animandoTexto ? styles.fade : ''}`}>
            {fraseAtual}
          </p>
          {subtitulo && <span className={styles.subtitulo}>{subtitulo}</span>}
        </div>

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
