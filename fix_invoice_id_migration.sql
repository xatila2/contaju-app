-- --- CORREÇÃO CRÍTICA DE FATURA ---
-- O banco de dados estava esperando um ID do tipo UUID para a fatura.
-- O sistema usa um ID de texto (ex: "CARD_2025-01").
-- Isso impedia que as compras fossem salvas.

-- 1. Remover a restrição que exige que invoice_id aponte para a tabela de faturas (que não estamos usando do jeito padrão)
ALTER TABLE credit_card_transactions DROP CONSTRAINT IF EXISTS credit_card_transactions_invoice_id_fkey;

-- 2. Mudar o tipo da coluna para TEXTO para aceitar "ID_DO_CARTAO_DATA"
ALTER TABLE credit_card_transactions ALTER COLUMN invoice_id TYPE text;
