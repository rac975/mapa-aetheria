class AudioService {
  constructor() {
    if (AudioService.instance) {
      return AudioService.instance;
    }
    AudioService.instance = this;

    const baseUrl = import.meta.env.BASE_URL || '/';

    // Criação dos elementos de áudio em memória (Singleton)
    this.bgMusic = new Audio(`${baseUrl}assets/audio/bg/bg-ambient.mp3`);
    this.bgMusic.loop = true;

    this.sfxClick = new Audio(`${baseUrl}assets/audio/sfx/sfx-click.wav`);
    this.sfxHover = new Audio(`${baseUrl}assets/audio/sfx/sfx-hover.wav`);

    // Carrega estados iniciais do localStorage
    this.musicVolume = parseFloat(localStorage.getItem('aetheria_music_volume') ?? '0.4');
    this.sfxVolume = parseFloat(localStorage.getItem('aetheria_sfx_volume') ?? '0.5');
    this.isMuted = JSON.parse(localStorage.getItem('aetheria_is_muted') ?? 'false');
    this.musicaAtiva = JSON.parse(localStorage.getItem('aetheria_musica_ativa') ?? 'false');

    this.applyVolumes();

    // Se a música estava ativa, tenta iniciar (com tratamento de autoplay do browser)
    if (this.musicaAtiva && !this.isMuted) {
      this.bgMusic.play().catch(() => {
        this.musicaAtiva = false;
        localStorage.setItem('aetheria_musica_ativa', 'false');
      });
    }

    // Configura ouvintes globais para cliques e hovers
    this.setupGlobalListeners();
  }

  applyVolumes() {
    const effectiveMusicVol = this.isMuted ? 0 : this.musicVolume;
    this.bgMusic.volume = effectiveMusicVol;
  }

  setMusicVolume(vol) {
    this.musicVolume = vol;
    localStorage.setItem('aetheria_music_volume', vol);
    this.applyVolumes();
  }

  setSfxVolume(vol) {
    this.sfxVolume = vol;
    localStorage.setItem('aetheria_sfx_volume', vol);
  }

  setIsMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('aetheria_is_muted', JSON.stringify(muted));
    this.applyVolumes();
    
    // Se mutou, pausa a música se estiver tocando
    if (muted && !this.bgMusic.paused) {
      this.bgMusic.pause();
    } else if (!muted && this.musicaAtiva && this.bgMusic.paused) {
      this.bgMusic.play().catch(() => {});
    }
  }

  setMusicaAtiva(ativa) {
    this.musicaAtiva = ativa;
    localStorage.setItem('aetheria_musica_ativa', JSON.stringify(ativa));

    if (ativa && !this.isMuted) {
      this.bgMusic.play().catch(() => {
        this.musicaAtiva = false;
        localStorage.setItem('aetheria_musica_ativa', 'false');
      });
    } else {
      this.bgMusic.pause();
    }
  }

  playClick() {
    if (this.isMuted || this.sfxVolume === 0) return;
    this.sfxClick.currentTime = 0;
    this.sfxClick.volume = this.sfxVolume;
    this.sfxClick.play().catch(() => {});
  }

  playHover() {
    if (this.isMuted || this.sfxVolume === 0) return;
    this.sfxHover.currentTime = 0;
    this.sfxHover.volume = this.sfxVolume * 0.4;
    this.sfxHover.play().catch(() => {});
  }

  setupGlobalListeners() {
    const handleGlobalClick = (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.map-titan')) {
        this.playClick();
      }
    };

    const handleGlobalMouseOver = (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.map-titan')) {
        this.playHover();
      }
    };

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('mouseover', handleGlobalMouseOver);
  }

  getState() {
    return {
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      isMuted: this.isMuted,
      musicaAtiva: this.musicaAtiva,
    };
  }
}

export const audioService = new AudioService();