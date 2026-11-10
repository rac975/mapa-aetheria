import { useRef } from 'react';
import { FaPlus, FaScroll } from 'react-icons/fa';
import CronicasManager from '../../components/Cronicas/CronicasManager/CronicasManager';
import './CronicasPage.css';

export default function CronicasPage({ isMestre }) {
  const managerRef = useRef(null);

  return (
    <div className="cronicas-wrapper">
      <header className="cronicas-header">
        <div>
          <h1><FaScroll /> Crônicas de Aetheria</h1>
          <p>Os registros oficiais das campanhas na nuvem de Aetheria.</p>
        </div>
        {isMestre && (
          <button className="btn-nova-cronica" onClick={() => managerRef.current?.abrirModalCriacao()}>
            <FaPlus /> Nova Crônica
          </button>
        )}
      </header>

      <CronicasManager ref={managerRef} isMestre={isMestre} />
    </div>
  );
}