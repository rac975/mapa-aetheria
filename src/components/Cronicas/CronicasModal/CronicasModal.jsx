import './CronicasModal.css';

export default function CronicasModal({
  aberto,
  onClose,
  onSubmit,
  isEdicao,
  sessao, setSessao,
  data, setData,
  titulo, setTitulo,
  conteudo, setConteudo,
  tags, setTags,
  tagsDisponiveis
}) {
  if (!aberto) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cronica-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{isEdicao ? 'Editar Crônica' : 'Escrever Nova Crônica'}</h2>

        <form onSubmit={onSubmit}>
          <div className="form-group-row">
            <div className="form-group">
              <label>Sessão (ex: Sessão 01)</label>
              <input type="text" value={sessao} onChange={e => setSessao(e.target.value)} required placeholder="Sessão 01" />
            </div>
            <div className="form-group">
              <label>Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label>Título do Capítulo / Acontecimento</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required placeholder="Ex: A Queda da Cidadela" />
          </div>

          <div className="form-group">
            <label>Resumo / Conteúdo da Sessão</label>
            <textarea rows="6" value={conteudo} onChange={e => setConteudo(e.target.value)} required placeholder="Descreva os acontecimentos..." />
          </div>

          <div className="form-group">
            <label>Tags (separadas por vírgula)</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="ex: combate, lore, missao" />
            
            {tagsDisponiveis.length > 0 && (
              <div className="tags-sugestoes">
                <small>Tags existentes (clique para adicionar):</small>
                <div className="tags-chips">
                  {tagsDisponiveis.map((tagExistente, idx) => (
                    <button
                      type="button"
                      key={idx}
                      className="tag-chip"
                      onClick={() => {
                        const atuais = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                        if (!atuais.includes(tagExistente)) {
                          setTags([...atuais, tagExistente].join(', '));
                        }
                      }}
                    >
                      +{tagExistente}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn-salvar-cronica">Salvar na Nuvem</button>
        </form>
      </div>
    </div>
  );
}