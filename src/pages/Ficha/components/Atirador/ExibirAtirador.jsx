import React from 'react';
import { FaCrosshairs } from 'react-icons/fa';

export default function ExibirAtirador({ habilidadeAtirador }) {
    const nivelHab = parseInt(habilidadeAtirador?.nivel) || 0;
    const nomeHab = (habilidadeAtirador?.nome || '').toLowerCase();

    if (nivelHab === 0) return null;

    // Exemplo interativo para Olhos de Águia ou poderes específicos se desejar
    if (nomeHab.includes('olhos de aguia')) {
        const bonusDano = nivelHab * 3;
        return (
            <div style={{ marginTop: '8px', padding: '8px', background: '#21262d', borderRadius: '4px', fontSize: '0.8rem', borderLeft: '3px solid #58a6ff' }}>
                <span style={{ color: '#58a6ff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaCrosshairs /> Bônus Ativo de Olhos de Águia (Nv. {nivelHab})
                </span>
                <span style={{ color: '#c9d1d9' }}>
                    Próximo ataque à distância na cena causa <strong>+{bonusDano}</strong> de dano adicional.
                </span>
            </div>
        );
    }

    return null;
}