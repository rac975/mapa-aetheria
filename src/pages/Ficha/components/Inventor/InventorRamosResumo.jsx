import React from 'react';
import { FaFlask, FaShieldAlt, FaMagic } from 'react-icons/fa';

export default function InventorRamosResumo({ ramoAlquimia, ramoInfusoes, ramoTecnomagia }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
            <div style={{ background: '#161b22', padding: '8px', borderRadius: '6px', border: '1px solid #30363d', fontSize: '0.75rem' }}>
                <div style={{ color: '#58a6ff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaFlask /> Alquimia
                </div>
                <div style={{ color: ramoAlquimia ? '#3fb950' : '#8b949e', marginTop: '2px', textTransform: 'uppercase' }}>
                    {ramoAlquimia || 'Não Adquirido'}
                </div>
            </div>

            <div style={{ background: '#161b22', padding: '8px', borderRadius: '6px', border: '1px solid #30363d', fontSize: '0.75rem' }}>
                <div style={{ color: '#d4af37', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaShieldAlt /> Infusões
                </div>
                <div style={{ color: ramoInfusoes ? '#3fb950' : '#8b949e', marginTop: '2px', textTransform: 'uppercase' }}>
                    {ramoInfusoes || 'Não Adquirido'}
                </div>
            </div>

            <div style={{ background: '#161b22', padding: '8px', borderRadius: '6px', border: '1px solid #30363d', fontSize: '0.75rem' }}>
                <div style={{ color: '#bc8cff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaMagic /> Tecnomagia
                </div>
                <div style={{ color: ramoTecnomagia ? '#3fb950' : '#8b949e', marginTop: '2px', textTransform: 'uppercase' }}>
                    {ramoTecnomagia || 'Não Adquirido'}
                </div>
            </div>
        </div>
    );
}
