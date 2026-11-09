import { useState, useEffect } from 'react';
import './BootScreen.css';

export default function BootScreen({ onComplete }) {
  const [etapa, setEtapa] = useState(0);
  const [saindo, setSaindo] = useState(false);

  const logs = [
    "INICIALIZANDO NÚCLEO ARCANO v3.5...",
    "ESTABELECENDO CONEXÃO SEGURA COM SUPABASE (SSL)...",
    "VERIFICANDO POLÍTICAS DE SEGURANÇA (RLS)... MESTRE AUTENTICADO.",
    "CARREGANDO TOPOGRAFIA DE AETHERIA (WEBP 6.60MB)...",
    "CÔMPONDO MELODIAS PARA TOCAR NO PLANO DE FUNDO...",
    "SINCRONIZANDO CRÔNICAS DA NUVEM...",
    "SISTEMA PRONTO. BEM-VINDO AO AETHERIAMAP."
  ];

  useEffect(() => {
    // Avança os logs em intervalos simulando um boot real
    const intervalo = setInterval(() => {
      setEtapa((prev) => {
        if (prev < logs.length - 1) {
          return prev + 1;
        } else {
          clearInterval(intervalo);
          // Inicia a animação de saída da tela de boot após o último log
          setTimeout(() => {
            setSaindo(true);
            setTimeout(onComplete, 600); // Remove o componente do DOM após o fade-out
          }, 800);
          return prev;
        }
      });
    }, 350);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className={`boot-screen ${saindo ? 'fade-out' : ''}`}>
      <div className="boot-content">
        <div className="boot-header">
          <div className="boot-spinner"></div>
            <h2>AETHERIA MAP // OS</h2>
        </div>
        <div className="boot-terminal">
          {logs.slice(0, etapa + 1).map((log, index) => (
            <p key={index} className="boot-log-line">
              <span className="boot-prompt">&gt;</span> {log}
            </p>
          ))}
          <span className="boot-cursor">_</span>
        </div>
      </div>
    </div>
  );
}