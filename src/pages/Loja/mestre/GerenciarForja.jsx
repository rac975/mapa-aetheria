import { FaHammer } from 'react-icons/fa';
import CriadorItensRaros from '../components/CriadorItensRaros';
import CriadorArmasPersonalizadas from '../components/CriadorArmasPersonalizadas';
import CriadorEquipamentoUnificado from '../components/CriadorEquipamentoUnificado';

export default function GerenciarForja({ ficha, recarregarDados }) {
    return (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <div style={{ marginBottom: '16px', borderBottom: '1px solid #30363d', paddingBottom: '12px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#d4af37', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                    <FaHammer /> Oficina do Mestre: Forja de Itens Raros
                </h3>
                <p style={{ margin: 0, color: '#8b949e', fontSize: '0.85rem' }}>
                    Crie armas, armaduras e acessórios mágicos customizados aplicando as regras do livro para alimentar o seu catálogo ou recompensar os heróis.
                </p>
            </div>

            {/* <CriadorItensRaros
                onCriado={() => {
                    if (recarregarDados) recarregarDados();
                }}
                ficha={ficha}
            />
            <CriadorArmasPersonalizadas
                onCriado={() => {
                    if (recarregarDados) recarregarDados();
                }}
                ficha={ficha}
            /> */}
            <CriadorEquipamentoUnificado
                onCriado={() => {
                    if (recarregarDados) recarregarDados();
                }}
                ficha={ficha}
            />
        </div>
    );
}