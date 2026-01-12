-- =====================================================
-- SISTEMA DE MONETIZACIÓN PARA CREADORES DE CONTENIDO
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Agregar campos de monetización a la tabla de aplicaciones
ALTER TABLE content_creator_applications
ADD COLUMN IF NOT EXISTS is_monetized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_rate DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_frequency TEXT DEFAULT 'per_content',
ADD COLUMN IF NOT EXISTS payment_notes TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_type TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_rut TEXT;

-- 2. Agregar campos de monetización al perfil del creador
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_monetized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_rate DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_frequency TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_type TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_rut TEXT;

-- 3. Crear tabla para registrar pagos realizados
CREATE TABLE IF NOT EXISTS creator_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT now(),
    payment_method TEXT,
    payment_reference TEXT,
    period_start DATE,
    period_end DATE,
    content_count INTEGER DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    processed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Políticas RLS para la tabla de pagos
ALTER TABLE creator_payments ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver y gestionar todos los pagos
CREATE POLICY "Admins can manage payments"
ON creator_payments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Creadores pueden ver sus propios pagos
CREATE POLICY "Creators can view own payments"
ON creator_payments FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- 5. Vista para resumen de pagos por creador
CREATE OR REPLACE VIEW creator_payment_summary AS
SELECT 
    p.id as creator_id,
    p.username,
    p.email,
    p.is_monetized,
    p.payment_rate,
    p.payment_frequency,
    p.payment_method,
    COALESCE(SUM(cp.amount), 0) as total_paid,
    COUNT(cp.id) as total_payments,
    MAX(cp.payment_date) as last_payment_date
FROM profiles p
LEFT JOIN creator_payments cp ON p.id = cp.creator_id AND cp.status = 'completed'
WHERE p.role = 'content_creator' AND p.is_monetized = true
GROUP BY p.id, p.username, p.email, p.is_monetized, p.payment_rate, p.payment_frequency, p.payment_method;

-- =====================================================
-- OPCIONES DE PAYMENT_METHOD:
-- - 'transfer' = Transferencia Bancaria
-- - 'paypal' = PayPal
-- - 'crypto' = Criptomonedas
-- - 'other' = Otro
--
-- OPCIONES DE PAYMENT_FREQUENCY:
-- - 'per_content' = Por contenido publicado
-- - 'weekly' = Semanal
-- - 'monthly' = Mensual
-- - 'per_view' = Por visualizaciones
-- =====================================================

-- Verificar cambios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%payment%' OR column_name LIKE '%monetiz%' OR column_name LIKE '%bank%';
