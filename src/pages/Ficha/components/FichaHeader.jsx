import { FaUser, FaArrowLeft, FaEdit, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function FichaHeader({
  ficha,
  id,
  isMestre,
  editando,
  setEditando,
  formData,
  formClasses,
  calcularNivelTotal,
  setFormData,
  setFormClasses,
  setFormMagias,
  setFormEquipamentos,
  classes,
  magias
}) {
  const navigate = useNavigate();
  const tokenJogadorSalvo = localStorage.getItem('aetheria_jogador_token');

  const ehJogadorLogado = !!tokenJogadorSalvo && !isMestre;

  const handleLogout = () => {
    localStorage.removeItem('aetheria_jogador_token');
    navigate('/ficha/login', { replace: true });
  };

  if (!ficha) return null;

  return (
    <header className="ficha-page-header">
      <div className="header-info-wrapper">
        {/* BOTÃO: Painel do Mestre */}
        {isMestre && id && (
          <button type="button" onClick={() => navigate('/mestre/fichas')} className="btn-secundario">
            <FaArrowLeft /> Painel do Mestre
          </button>
        )}

        <div className="ficha-avatar-container">
          {ficha?.avatar_url ? (
            <img src={ficha.avatar_url} alt={ficha?.nome_personagem || 'Herói'} />
          ) : (
            <FaUser size={28} color="#d4af37" />
          )}
        </div>

        <div className="ficha-header-text-group">
          <h1 className="nome_personagem_text">{ficha?.nome_personagem || 'Carregando...'}</h1>
          <div className="badge-nivel-wrapper">
            <span className="badge-nivel">
              Nível {editando ? calcularNivelTotal(formClasses) : (ficha?.nivel || 1)}
            </span>
            <span className="badge-nivel-meta">
              Zênite: {editando ? (formData?.zenit || 0) : (ficha?.zenit || 0)}z
            </span>
            <span className="badge-nivel-meta">
              EXP: {editando ? (formData?.exp || 0) : (formData?.exp || 0)}/10
            </span>
            <span className="badge-nivel-meta">
              Fábula: {editando ? (formData?.fabula || 3) : (ficha?.fabula || 3)}
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions-group">
        <button
          type="button"
          className={`btn-toggle-edit ${editando ? 'cancel' : ''}`}
          onClick={() => {
            setFormData(ficha);
            setFormClasses(classes);
            setFormMagias(magias);
            setFormEquipamentos(ficha?.equipamentos || []);
            setEditando(!editando);
          }}
        >
          {editando ? <><FaTimes /> Cancelar</> : <><FaEdit /> Editar Ficha</>}
        </button>

        {ehJogadorLogado && !editando && (
          <button
            type="button"
            className="btn-secundario"
            onClick={handleLogout}
            title="Desconectar crachá deste dispositivo"
          >
            <FaSignOutAlt /> Sair
          </button>
        )}
      </div>
    </header>
  );
}