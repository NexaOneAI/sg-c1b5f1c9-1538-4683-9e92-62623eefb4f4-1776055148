-- Solución 1: Hacer que el trigger se ejecute con permisos de superusuario (SECURITY DEFINER)
-- Esto bypasea RLS durante la ejecución del trigger

CREATE OR REPLACE FUNCTION public.auto_setup_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER  -- Esta es la clave: ejecuta como el dueño de la función
SET search_path = public
AS $$
DECLARE
  new_wallet_id uuid;
BEGIN
  -- 1. Insertar perfil
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    CASE 
      WHEN NEW.email = 'nexaapporg@gmail.com' THEN 'superadmin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Crear wallet con 100 créditos GRATIS
  INSERT INTO public.credit_wallets (user_id, balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO UPDATE SET balance = credit_wallets.balance + 100
  RETURNING id INTO new_wallet_id;

  -- 3. Registrar transacción de bono inicial
  IF new_wallet_id IS NOT NULL THEN
    INSERT INTO public.credit_transactions (
      wallet_id,
      user_id,
      amount,
      type,
      description,
      metadata
    )
    VALUES (
      new_wallet_id,
      NEW.id,
      100,
      'bonus',
      'Créditos de bienvenida',
      jsonb_build_object('source', 'registration_bonus', 'auto', true)
    );
  END IF;

  -- 4. Crear suscripción Free
  INSERT INTO public.subscriptions (user_id, plan_type, status, auto_renew)
  VALUES (NEW.id, 'free', 'active', false)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error pero no bloquear el registro
    RAISE WARNING 'Error en auto_setup_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_setup_new_user();