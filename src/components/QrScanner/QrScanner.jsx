import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { playerSessionService } from '../../services/playerSessionService';
import styles from './QrScanner.module.css';

const CONSTRAINTS_CAMERA = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  facingMode: 'environment'
};

const SCANNER_COMPONENTS = {
  torch: true,
  zoom: true,
  finder: true
};

function tocarSomSucesso() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(784, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {
    // Silencia caso bloqueado pelo navegador
  }
}

export default function QrScannerModal({ onScanSuccess, onClose }) {
  const navigate = useNavigate();
  const scannedRef = useRef(false);
  const timeoutRef = useRef(null);
  const [status, setStatus] = useState('Aponte para o crachá do herói');
  const [scanSucesso, setScanSucesso] = useState(false);
  const [erroCamera, setErroCamera] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleScan = useCallback(
    (detectedCodes) => {
      if (scannedRef.current) return;

      const rawValue = Array.isArray(detectedCodes)
        ? detectedCodes[0]?.rawValue
        : detectedCodes?.rawValue || detectedCodes;

      if (!rawValue || typeof rawValue !== 'string') return;

      const credencial = playerSessionService.extrairCredencial(rawValue);
      if (credencial.tipo === 'invalido') {
        setStatus('Código não reconhecido como crachá de Aetheria.');
        return;
      }

      scannedRef.current = true;
      setScanSucesso(true);
      setStatus(
        credencial.token
          ? `Crachá identificado: ${credencial.token}`
          : 'Crachá identificado com sucesso!'
      );

      tocarSomSucesso();

      timeoutRef.current = setTimeout(() => {
        if (typeof onScanSuccess === 'function') {
          onScanSuccess(rawValue, credencial);
        } else {
          const rotaAlvo = credencial.token ? `/f/${credencial.token}` : `/ficha/${credencial.id}`;
          navigate(rotaAlvo);
          onClose?.();
        }
      }, 350);
    },
    [navigate, onClose, onScanSuccess]
  );

  const handleError = useCallback((error) => {
    console.warn('Aviso no leitor QR:', error);
    setErroCamera(true);
    setStatus('Não foi possível acessar a câmera. Verifique as permissões.');
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={`${styles.card} ${scanSucesso ? styles.cardSucesso : ''}`}>
        <div className={styles.header}>
          <span className={styles.title}>Scanner de Crachá</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar scanner"
          >
            <FaTimes />
          </button>
        </div>

        <div className={`${styles.cameraContainer} ${scanSucesso ? styles.cameraSucesso : ''}`}>
          {!erroCamera && (
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={CONSTRAINTS_CAMERA}
              components={SCANNER_COMPONENTS}
              scanDelay={250}
              sound={false}
              classNames={{
                container: styles.scannerContainer,
                video: styles.scannerVideo
              }}
            />
          )}

          {scanSucesso && (
            <div className={styles.feedbackOverlay}>
              <FaCheckCircle className={styles.feedbackIcon} />
            </div>
          )}

          {erroCamera && (
            <div className={styles.erroBox}>
              <FaExclamationTriangle className={styles.erroIcon} />
              <p>Erro ao inicializar câmera de alta resolução.</p>
            </div>
          )}
        </div>

        <div className={`${styles.status} ${scanSucesso ? styles.statusSucesso : ''}`}>
          {scanSucesso && <FaCheckCircle className={styles.statusInlineIcon} />}
          <span>{status}</span>
        </div>
      </div>
    </div>
  );
}
