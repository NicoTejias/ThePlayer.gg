-- =============================================================================
-- FIX CRÍTICO: Escalada de privilegios vía profiles
-- =============================================================================
-- PROBLEMA: la política "Users can update own profile" (USING auth.uid()=id,
-- sin WITH CHECK) permite que un usuario modifique CUALQUIER columna de su
-- propio perfil, incluida `role`. Como muchas tablas confían en
-- profiles.role = 'admin', un usuario puede auto-promoverse a admin (o juez,
-- o aprobarse como tienda) con un simple UPDATE desde la API y la anon key.
--
-- SOLUCIÓN: trigger BEFORE UPDATE que prohíbe cambiar columnas sensibles
-- (role, judge_role, judge_status, creator_status, is_content_creator, status).
--
-- Distingue automáticamente 3 contextos, SIN parchear las funciones RPC:
--   * Funciones SECURITY DEFINER (approve_store, admin_ban_user, etc.): corren
--     como su dueño (postgres), no como authenticated/anon -> se permiten.
--     [Estas funciones YA validan internamente que el llamador sea admin].
--   * Admins reales (email del JWT, o la fila YA era admin) -> se permiten.
--   * Cualquier otro UPDATE vía REST (authenticated/anon) -> se bloquea.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar TODO -> Run
-- Es idempotente (seguro reejecutar).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
DECLARE
  v_email text;
  v_is_admin boolean;
BEGIN
  -- (1) Operaciones que NO vienen directo de la API REST de Supabase.
  -- PostgREST ejecuta como 'authenticated' o 'anon'. Una función SECURITY
  -- DEFINER corre como su dueño (postgres), así que current_user es distinto.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- (2) Admin real: por email del token, o porque la fila YA era admin
  -- (OLD.role, no NEW.role -> imposible burlarlo en el mismo UPDATE).
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_is_admin := (v_email = ANY (ARRAY[
    'nicotejias@gmail.com',
    'nicolas.tejias@gmail.com',
    'hugocastro.arts@gmail.com'
  ])) OR (OLD.role = 'admin');

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- (3) Resto de usuarios: prohibido tocar columnas de rol/privilegios.
  IF NEW.role               IS DISTINCT FROM OLD.role
     OR NEW.judge_role         IS DISTINCT FROM OLD.judge_role
     OR NEW.judge_status       IS DISTINCT FROM OLD.judge_status
     OR NEW.creator_status     IS DISTINCT FROM OLD.creator_status
     OR NEW.is_content_creator IS DISTINCT FROM OLD.is_content_creator
     OR NEW.status             IS DISTINCT FROM OLD.status
  THEN
    RAISE EXCEPTION 'No tienes permiso para modificar campos de rol o privilegios';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Limpieza: política SELECT duplicada (cosmético).
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

NOTIFY pgrst, 'reload config';
