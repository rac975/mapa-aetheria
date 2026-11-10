// src/components/WelcomeAnimation/WelcomeAnimation.jsx
import { useEffect } from 'react';
import { LuSparkles } from 'react-icons/lu';
import './WelcomeAnimation.css';

export default function WelcomeAnimation({ nomePersonagem, onComplete }) {
  useEffect(() => {
    // A animação dura 2.5 segundos e depois chama a função para avançar de página
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="welcome-overlay">
      <div className="welcome-content">
        <LuSparkles className="welcome-sparkle-icon" />
        <h1 className="welcome-title">Bem-vindo a Aetheria</h1>
        <p className="welcome-hero-name">{nomePersonagem}</p>
        <div className="welcome-bar"></div>
      </div>
    </div>
  );
}