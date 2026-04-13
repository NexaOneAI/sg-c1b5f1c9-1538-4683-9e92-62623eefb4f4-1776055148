-- Habilitar RLS en todas las tablas
ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "users_select_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para credit_wallets
CREATE POLICY "users_select_own_wallet" ON credit_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins_select_all_wallets" ON credit_wallets FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "admins_update_wallets" ON credit_wallets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Políticas para credit_transactions
CREATE POLICY "users_select_own_transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_usage_transactions" ON credit_transactions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND type = 'usage'
);
CREATE POLICY "admins_select_all_transactions" ON credit_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "admins_insert_transactions" ON credit_transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Políticas para subscriptions
CREATE POLICY "users_select_own_subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admins_select_all_subscriptions" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Políticas para payments
CREATE POLICY "users_select_own_payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins_select_all_payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "admins_update_payments" ON payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Políticas para projects
CREATE POLICY "users_select_own_projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_projects" ON projects FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "admins_select_all_projects" ON projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Políticas para project_versions
CREATE POLICY "users_select_own_versions" ON project_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);
CREATE POLICY "users_insert_own_versions" ON project_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);

-- Políticas para project_files
CREATE POLICY "users_select_own_files" ON project_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);
CREATE POLICY "users_insert_own_files" ON project_files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);
CREATE POLICY "users_update_own_files" ON project_files FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);
CREATE POLICY "users_delete_own_files" ON project_files FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);

-- Políticas para conversations
CREATE POLICY "users_select_own_conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para messages
CREATE POLICY "users_select_own_messages" ON messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para admin_settings
CREATE POLICY "public_read_settings" ON admin_settings FOR SELECT USING (true);
CREATE POLICY "admins_update_settings" ON admin_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "admins_insert_settings" ON admin_settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);