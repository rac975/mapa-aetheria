import { useState } from 'react';
import { FaVolumeUp, FaVolumeMute, FaMusic, FaDatabase, FaServer, FaSync, FaCog } from 'react-icons/fa';
import { audioService } from '../../services/audioService';
import './SettingsPage.css';

export default function SettingsPage({ isMestre, onClose }) {
  const [state, setState] = useState(() => audioService.getState());
  const [dbStatus] = useState('Conectado');

  const updateState = (updater) => {
    updater();
    setState(audioService.getState());
  };

  const handleForcarAtualizacao = () => {
    window.location.reload();
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2><FaCog/> Configurações & Sistema</h2>
          <button type="button" className="btn-fechar" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* Seção de Áudio (Visível para todos) */}
          <div className="settings-section">
            <h3><FaVolumeUp /> Controles de Áudio & Trilha Sonora</h3>
            
            <div className="setting-item-row">
              <button
                type="button"
                className={`btn-music-toggle ${state.musicaAtiva ? 'ativo' : ''}`}
                onClick={() => updateState(() => audioService.setMusicaAtiva(!state.musicaAtiva))}
                title="Ligar/Desligar Trilha Sonora"
              >
                <FaMusic /> {state.musicaAtiva ? 'Música Ligada' : 'Música Desligada'}
              </button>
            </div>

            <div className="setting-item">
              <label>Volume da Trilha Sonora (Música): {Math.round(state.musicVolume * 100)}%</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={state.isMuted ? 0 : state.musicVolume} 
                onChange={(e) => updateState(() => audioService.setMusicVolume(parseFloat(e.target.value)))} 
              />
            </div>

            <div className="setting-item">
              <label>Volume dos Efeitos Sonoros (SFX): {Math.round(state.sfxVolume * 100)}%</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={state.isMuted ? 0 : state.sfxVolume} 
                onChange={(e) => updateState(() => audioService.setSfxVolume(parseFloat(e.target.value)))} 
              />
            </div>

            <div className="setting-item checkbox-row">
              <label>
                <input 
                  type="checkbox" 
                  checked={state.isMuted} 
                  onChange={(e) => updateState(() => audioService.setIsMuted(e.target.checked))} 
                />
                <FaVolumeMute /> Silenciar Todo o Áudio (Mute Geral)
              </label>
            </div>
          </div>

          {/* Seção de Dados e Sistema (Visível APENAS se isMestre for true) */}
          {isMestre && (
            <div className="settings-section">
              <h3><FaDatabase /> Dados & Ferramentas de Mestre</h3>
              
              <div className="setting-info-row">
                <span>Status do Banco (Supabase):</span>
                <strong className="status-online"><FaServer /> {dbStatus}</strong>
              </div>

              <div className="setting-actions">
                <button type="button" className="btn-acao-mestre" onClick={handleForcarAtualizacao}>
                  <FaSync /> Recarregar Dados do Mapa / Cache
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button type="button" className="btn-salvar" onClick={onClose}>Salvar e Fechar</button>
        </div>
      </div>
    </div>
  );
}