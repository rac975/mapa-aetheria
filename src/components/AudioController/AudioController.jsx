import { useState, useRef, useEffect } from 'react';
import { FaVolumeMute, FaVolumeUp, FaMusic } from 'react-icons/fa';
import './AudioController.css';

export default function AudioController() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Lê do localStorage ou usa o padrão inicial
  const [musicVolume, setMusicVolume] = useState(() => {
    const salvo = localStorage.getItem('aetheria_music_volume');
    return salvo !== null ? parseFloat(salvo) : 0.4;
  });

  const [sfxVolume, setSfxVolume] = useState(() => {
    const salvo = localStorage.getItem('aetheria_sfx_volume');
    return salvo !== null ? parseFloat(salvo) : 0.5;
  });
  
  const [isMuted, setIsMuted] = useState(() => {
    const salvo = localStorage.getItem('aetheria_is_muted');
    return salvo !== null ? JSON.parse(salvo) : false;
  });

  const [musicaAtiva, setMusicaAtiva] = useState(() => {
    const salvo = localStorage.getItem('aetheria_musica_ativa');
    return salvo !== null ? JSON.parse(salvo) : false;
  });

  const bgMusicRef = useRef(null);
  const sfxClickRef = useRef(null);
  const sfxHoverRef = useRef(null);

  const baseUrl = import.meta.env.BASE_URL;

  // Salva as preferências no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('aetheria_music_volume', musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem('aetheria_sfx_volume', sfxVolume);
  }, [sfxVolume]);

  useEffect(() => {
    localStorage.setItem('aetheria_is_muted', isMuted);
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('aetheria_musica_ativa', musicaAtiva);
  }, [musicaAtiva]);

  // Se a música estava ativa ao recarregar a página, tenta dar play automaticamente
  useEffect(() => {
    if (musicaAtiva && bgMusicRef.current) {
      bgMusicRef.current.play().catch(() => {
        // Se o navegador bloquear o autoplay, atualiza o estado para falso
        setMusicaAtiva(false);
      });
    }
  }, []);

  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = isMuted ? 0 : musicVolume;
    }
  }, [musicVolume, isMuted]);

  const toggleMusica = () => {
    if (!bgMusicRef.current) return;
    if (musicaAtiva) {
      bgMusicRef.current.pause();
      setMusicaAtiva(false);
    } else {
      bgMusicRef.current.play().catch(() => { });
      setMusicaAtiva(true);
    }
  };

  const handleFabClick = () => {
    setIsMuted(!isMuted);
  };

  const tocarClick = () => {
    if (sfxClickRef.current && !isMuted) {
      sfxClickRef.current.currentTime = 0;
      sfxClickRef.current.volume = sfxVolume;
      sfxClickRef.current.play().catch(() => { });
    }
  };

  const tocarHover = () => {
    if (sfxHoverRef.current && !isMuted && sfxVolume > 0) {
      sfxHoverRef.current.currentTime = 0;
      sfxHoverRef.current.volume = sfxVolume * 0.4;
      sfxHoverRef.current.play().catch(() => { });
    }
  };

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.map-titan')) {
        tocarClick();
      }
    };

    const handleGlobalMouseOver = (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.map-titan')) {
        tocarHover();
      }
    };

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('mouseover', handleGlobalMouseOver);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('mouseover', handleGlobalMouseOver);
    };
  }, [isMuted, sfxVolume]);

  return (
    <div
      className="audio-controller-wrapper"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <audio ref={bgMusicRef} src={`${baseUrl}assets/audio/bg/bg-ambient.mp3`} loop />
      <audio ref={sfxClickRef} src={`${baseUrl}assets/audio/sfx/sfx-click.wav`} />
      <audio ref={sfxHoverRef} src={`${baseUrl}assets/audio/sfx/sfx-hover.wav`} />

      <div className={`audio-slider-panel ${isOpen ? 'open' : ''}`}>
        <div className="audio-control-group" title="Volume da Música de Fundo">
          <button
            className={`btn-music-toggle ${musicaAtiva ? 'ativo' : ''}`}
            onClick={toggleMusica}
            title="Ligar/Desligar Trilha Sonora"
          >
            <FaMusic />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : musicVolume}
            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
            className="volume-range"
          />
        </div>

        <div className="audio-control-group" title="Volume dos Efeitos Sonoros (SFX)">
          <span className="sfx-label">SFX</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : sfxVolume}
            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
            className="volume-range"
          />
        </div>
      </div>

      <div
        className={`audio-fab ${isMuted || (musicVolume === 0 && sfxVolume === 0) ? 'muted' : ''}`}
        onClick={handleFabClick}
        title={isMuted ? "Desmutar Áudio" : "Mutar Áudio"}
      >
        {isMuted || (musicVolume === 0 && sfxVolume === 0) ? (
          <FaVolumeMute />
        ) : (
          <FaVolumeUp className={musicaAtiva ? 'pulsando' : ''} />
        )}
      </div>
    </div>
  );
}