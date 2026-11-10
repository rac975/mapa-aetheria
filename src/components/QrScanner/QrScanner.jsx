import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { FaTimes } from 'react-icons/fa';

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
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            zIndex: 1000
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: '#161b22',
                border: '1px solid #332914',
                borderRadius: '12px',
                padding: '15px',
                boxShadow: '0 8px 24px rgba(0,0,0,.8)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <span style={{ color: '#d4af37', fontWeight: 'bold' }}>
                        Scanner de Crachá
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: '#da3633',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <FaTimes />
                    </button>
                </div>

                <div
                    id="reader-camera-container"
                    style={{
                        background: '#0d0f18',
                        minHeight: '320px',
                        border: '1px solid #30363d',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}
                />

                <div style={{
                    marginTop: '12px',
                    textAlign: 'center',
                    color: '#d4af37',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}>
                    {status}
                </div>
            </div>
        </div>
    );
}