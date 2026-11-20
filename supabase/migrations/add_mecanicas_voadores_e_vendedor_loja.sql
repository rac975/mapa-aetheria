-- =============================================================================
-- Migration: Suporte a mecânicas de criaturas voadoras e vendedor/atendente de lojas
-- Tabelas: public.lojas, public.npcs_mestre e public.iniciativa_combate
-- =============================================================================

ALTER TABLE public.lojas
  ADD COLUMN IF NOT EXISTS vendedor TEXT DEFAULT NULL;

COMMENT ON COLUMN public.lojas.vendedor IS 'Nome do NPC vendedor ou atendente responsável pelo estabelecimento';

ALTER TABLE public.npcs_mestre
  ADD COLUMN IF NOT EXISTS voador BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.npcs_mestre.voador IS 'Indica se a criatura/NPC é voadora (não pode ser atingida por ataques corpo a corpo padrão)';

ALTER TABLE public.iniciativa_combate
  ADD COLUMN IF NOT EXISTS voador BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.iniciativa_combate.voador IS 'Flag indicando se o combatente na cena é voador';
