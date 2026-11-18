-- =============================================================================
-- Migration: Sistema de Mecânicas de Vilão (Chefes, Elites e Vilões Épicos)
-- Tabelas: public.npcs_mestre e public.iniciativa_combate
-- Suporta tipo_vilao, pontos_vilao, fases_chefao, acoes_por_turno e fase_atual.
-- =============================================================================

ALTER TABLE public.npcs_mestre
  ADD COLUMN IF NOT EXISTS tipo_vilao TEXT NOT NULL DEFAULT 'padrao',
  ADD COLUMN IF NOT EXISTS pontos_vilao INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fases_chefao JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS acoes_por_turno INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS fase_atual INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.npcs_mestre.tipo_vilao IS 'Escala de ameaça/vilania do NPC: padrao, elite, campeao, soberano';
COMMENT ON COLUMN public.npcs_mestre.pontos_vilao IS 'Pontos de Vilão (Ultima Points) para ativar habilidades especiais, reações e recuperação épica';
COMMENT ON COLUMN public.npcs_mestre.fases_chefao IS 'Lista de fases de combate do chefe (PV por fase, ações por turno, gatilhos e efeitos de transição)';
COMMENT ON COLUMN public.npcs_mestre.acoes_por_turno IS 'Quantidade de ações/turnos que o vilão executa por rodada (Multi-Ações)';
COMMENT ON COLUMN public.npcs_mestre.fase_atual IS 'Número da fase ativa atual do chefe (1-based)';

ALTER TABLE public.iniciativa_combate
  ADD COLUMN IF NOT EXISTS tipo_vilao TEXT NOT NULL DEFAULT 'padrao',
  ADD COLUMN IF NOT EXISTS pontos_vilao INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fases_chefao JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS acoes_por_turno INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS fase_atual INTEGER NOT NULL DEFAULT 1;
