-- =============================================================================
-- Migration: Colunas opcionais para dados específicos de classes Techno Fantasy
-- Tabela: fichas_personagens
-- Permite persistência direta na raiz da ficha caso o mestre/DBA deseje usar.
-- =============================================================================

ALTER TABLE fichas_personagens 
ADD COLUMN IF NOT EXISTS dados_veiculo JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dados_esper JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dados_mutante JSONB DEFAULT NULL;

COMMENT ON COLUMN fichas_personagens.dados_veiculo IS 'Configuração do Veículo Pessoal do Piloto (nome, chassi, módulos ativos e reserva)';
COMMENT ON COLUMN fichas_personagens.dados_esper IS 'Configurações de Foco Cognitivo e Relógio de Ondas Cerebrais da classe Esper';
COMMENT ON COLUMN fichas_personagens.dados_mutante IS 'Terioformas ativas e estado de Teriomorfose da classe Mutante';
