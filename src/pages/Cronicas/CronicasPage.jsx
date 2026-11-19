import { useRef } from 'react';
import { FaPlus, FaScroll } from 'react-icons/fa';
import { LoadingScreen } from '../../components/ui';
import { useCronicas } from '../../hooks/useCronicas';
import CronicasManager from '../../components/Cronicas/CronicasManager/CronicasManager';
import './CronicasPage.css';

export default function CronicasPage({ isMestre }) {
  const managerRef = useRef(null);
  const {
    cronicas,
    setCronicas,
    tagsDisponiveis,
    carregandoInicial,
    carregandoPontual,
    salvarCronica,
    excluirCronica
  } = useCronicas();

  if (carregandoInicial) {
    return (
      <div className="cronicas-wrapper cronicas-loading-page">
        <LoadingScreen
          mensagem="Sincronizando crônicas e memoriais de Aetheria..."
          subtitulo="Memória da Campanha"
        />
      </div>
    );
  }

  return (
    <div className="cronicas-wrapper">
      <header className="cronicas-header">
        <div>
          <h1><FaScroll /> Crônicas de Aetheria</h1>
          <p>Os registros oficiais das campanhas na nuvem de Aetheria.</p>
        </div>
        {isMestre && (
          <button
            type="button"
            className="btn-nova-cronica"
            onClick={() => managerRef.current?.abrirModalCriacao()}
          >
            <FaPlus /> Nova Crônica
          </button>
        )}
      </header>

      <CronicasManager
        ref={managerRef}
        isMestre={isMestre}
        cronicas={cronicas}
        setCronicas={setCronicas}
        tagsDisponiveis={tagsDisponiveis}
        carregandoPontual={carregandoPontual}
        onSalvarCronica={salvarCronica}
        onExcluirCronica={excluirCronica}
      />
    </div>
  );
}
