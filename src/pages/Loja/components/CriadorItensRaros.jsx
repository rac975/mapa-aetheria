import React from 'react';
import CriadorEquipamentoUnificado from './CriadorEquipamentoUnificado';

/**
 * Wrapper de retrocompatibilidade para a Oficina de Itens Raros.
 * Redireciona para o CriadorEquipamentoUnificado modular.
 */
export default function CriadorItensRaros({ ficha, onCriado }) {
    return <CriadorEquipamentoUnificado ficha={ficha} onCriado={onCriado} />;
}
