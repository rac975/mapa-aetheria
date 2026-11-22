-- =============================================================================
-- Migration: Coluna de Iniciativa na Ordem de Combate
-- Tabela: public.iniciativa_combate
-- Permite persistência de iniciativa calculada/manual para ordenação no combate.
-- =============================================================================

ALTER TABLE public.iniciativa_combate
  ADD COLUMN IF NOT EXISTS iniciativa INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.iniciativa_combate.iniciativa IS 'Valor de Iniciativa do combatente para ordenação da Ordem de Combate em Fabula Ultima';
