import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { FaTimes } from 'react-icons/fa';
import styles from './QrScanner.module.css';

export default function QrScannerModal({ onScanSuccess, onClose }) {
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);
  const [status, setStatus] = useState('Inicializando câmera...');

  useEffect(() => {
    const scannerId = 'reader-camera-container';
    let html5QrCode = null;

    const timer = setTimeout(async () => {
      try {
        setStatus('Solicitando permissão da câmera...');
        html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          async (decodedText) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            setStatus('QR Code detectado!');

            try {
              if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
              }
            } catch (err) {
              console.error('Erro ao parar scanner:', err);
            }

            onScanSuccess(decodedText);
          },
          () => {
            // Ignora falhas de quadro a quadro
          }
        );

        setStatus('Aponte para o crachá');
      } catch (err) {
        console.error('Falha ao iniciar câmera:', err);
        setStatus('Erro ao acessar a câmera');
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const scanner = scannerRef.current;
      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop()
            .then(() => scanner.clear())
            .catch((err) => console.warn('Aviso ao parar scanner no unmount:', err));
        } else {
          try {
            scanner.clear();
          } catch (err) {
            console.warn('Aviso ao limpar scanner:', err);
          }
        }
      }
    };
  }, [onScanSuccess]);

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
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

        <div id="reader-camera-container" className={styles.cameraContainer} />

        <div className={styles.status}>{status}</div>
      </div>
    </div>
  );
}
