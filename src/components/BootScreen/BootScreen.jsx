import { useState, useEffect, useRef } from 'react';
import './BootScreen.css';

export default function BootScreen({ onComplete }) {
  const [etapa, setEtapa] = useState(0);
  const [saindo, setSaindo] = useState(false);
  const terminalRef = useRef(null);

  const logs = [
    "INICIALIZANDO NÚCLEO ARCANO v3.5...",
    "ESTABELECENDO CONEXÃO SEGURA COM SUPABASE (SSL)...",
    "VERIFICANDO POLÍTICAS DE SEGURANÇA (RLS)... MESTRE AUTENTICADO.",
    "CARREGANDO TOPOGRAFIA DE AETHERIA (WEBP 6.60MB)...",
    "CÔMPONDO MELODIAS PARA TOCAR NO PLANO DE FUNDO...",
    "SINCRONIZANDO CRÔNICAS DA NUVEM...",
    "SISTEMA PRONTO. BEM-VINDO AO AETHERIAMAP."
  ];

  // Progresso em porcentagem baseado na etapa atual
  const progresso = Math.round(((etapa + 1) / logs.length) * 100);

  const finalizarBoot = () => {
    if (saindo) return;
    setSaindo(true);
    setTimeout(onComplete, 600);
  };

  useEffect(() => {
    const intervalo = setInterval(() => {
      setEtapa((prev) => {
        if (prev < logs.length - 1) {
          return prev + 1;
        } else {
          clearInterval(intervalo);
          setTimeout(() => {
            finalizarBoot();
          }, 800);
          return prev;
        }
      });
    }, 320);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line
  }, []);

  // Rola o terminal automaticamente para o final a cada novo log
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [etapa]);

  return (
    <div className={`boot-screen ${saindo ? 'fade-out' : ''}`}>
      {/* Efeito de scanline de monitor antigo */}
      <div className="boot-scanlines"></div>

      <div className="boot-content">
        <div className="boot-header">
          <div className="boot-spinner"></div>
          <div className="boot-title-wrapper">
            <h2>AETHERIA MAP // OS</h2>
            <span className="boot-subtitle">SECURE_KERNEL_ACTIVE</span>
          </div>
          <div className="boot-progress-badge">{progresso}%</div>
        </div>

        {/* Barra de progresso linear */}
        <div className="boot-progress-track">
          <div 
            className="boot-progress-fill" 
            style={{ width: `${progresso}%` }}
          ></div>
        </div>

        <div className="boot-terminal" ref={terminalRef}>
          {logs.slice(0, etapa + 1).map((log, index) => (
            <p key={index} className="boot-log-line">
              <span className="boot-prompt">&gt;</span> {log}
            </p>
          ))}
          {etapa < logs.length - 1 && (
            <div className="boot-cursor-line">
              <span className="boot-prompt">&gt;</span>
              <span className="boot-cursor">_</span>
            </div>
          )}
        </div>

        <div className="boot-footer">
          <span className="boot-hint">Pressione [ESPAÇO] ou clique para pular</span>
          <button className="boot-skip-btn" onClick={finalizarBoot}>
            PULAR BOOT
          </button>
        </div>
      </div>
    </div>
  );
}