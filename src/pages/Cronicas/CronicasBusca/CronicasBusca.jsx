import { FaSearch } from 'react-icons/fa';
import './CronicasBusca.css';

export default function CronicaBusca({ termoBusca, setTermoBusca }) {
  return (
    <div className="cronicas-busca-container">
      <div className="busca-input-wrapper">
        <FaSearch className="busca-icon" />
        <input
          type="text"
          placeholder="Buscar por título, sessão, conteúdo ou tag..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="cronicas-busca-input"
        />
      </div>
    </div>
  );
}