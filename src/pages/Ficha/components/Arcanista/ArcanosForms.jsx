import React from 'react';

export default function ArcanosForms({
  modoAdicao,
  onFecharModo,
  catalogo,
  selecionadoCatalogo,
  setSelecionadoCatalogo,
  onVincularCatalogo,
  novoCustom,
  setNovoCustom,
  onVincularCustom
}) {
  if (!modoAdicao) return null;

  if (modoAdicao === 'catalogo') {
    return (
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', padding: '8px', background: '#0d1117', borderRadius: '4px', border: '1px solid #30363d', flexWrap: 'wrap' }}>
        <select
          value={selecionadoCatalogo}
          onChange={(e) => setSelecionadoCatalogo(e.target.value)}
          style={{ flex: 1, minWidth: '180px', background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }}
        >
          {catalogo.map((arc) => (
            <option key={arc.id} value={arc.id}>
              {arc.nome} ({arc.dominios})
            </option>
          ))}
        </select>
        <button type="button" onClick={onVincularCatalogo} style={{ padding: '5px 12px', fontSize: '0.78rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Vincular
        </button>
      </div>
    );
  }

  if (modoAdicao === 'custom') {
    return (
      <form onSubmit={onVincularCustom} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', padding: '8px', background: '#0d1117', borderRadius: '4px', border: '1px solid #30363d' }}>
        <input type="text" placeholder="Nome do Arcano" value={novoCustom.nome} onChange={(e) => setNovoCustom({ ...novoCustom, nome: e.target.value })} required style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }} />
        <input type="text" placeholder="Domínios (ex: sombra, segredos, noite)" value={novoCustom.dominios} onChange={(e) => setNovoCustom({ ...novoCustom, dominios: e.target.value })} style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }} />
        <textarea placeholder="Benefício ao Fundir" rows={2} value={novoCustom.fundir} onChange={(e) => setNovoCustom({ ...novoCustom, fundir: e.target.value })} required style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }} />
        <input type="text" placeholder="Nome do Efeito de Dispensa (opcional)" value={novoCustom.dispensar_nome} onChange={(e) => setNovoCustom({ ...novoCustom, dispensar_nome: e.target.value })} style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }} />
        <textarea placeholder="Efeito de Dispensa (opcional)" rows={2} value={novoCustom.dispensar_efeito} onChange={(e) => setNovoCustom({ ...novoCustom, dispensar_efeito: e.target.value })} style={{ background: '#161b22', color: '#f0f6fc', border: '1px solid #30363d', borderRadius: '4px', padding: '5px 8px', fontSize: '0.8rem' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button type="button" onClick={onFecharModo} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#21262d', color: '#8b949e', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
        </div>
      </form>
    );
  }

  return null;
}
