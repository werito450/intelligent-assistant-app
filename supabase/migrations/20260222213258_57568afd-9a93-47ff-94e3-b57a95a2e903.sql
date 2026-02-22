
-- Drop all restrictive policies and recreate as permissive

-- Conversations
DROP POLICY "Users can create conversations" ON public.conversations;
DROP POLICY "Users can delete own conversations" ON public.conversations;
DROP POLICY "Users can update own conversations" ON public.conversations;
DROP POLICY "Users can view own conversations" ON public.conversations;

CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Messages
DROP POLICY "Users can view own messages" ON public.messages;
DROP POLICY "Users can create messages" ON public.messages;
DROP POLICY "Users can delete own messages" ON public.messages;

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Users can create messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND owner_id = auth.uid()));
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- Profiles
DROP POLICY "Users can view own profile" ON public.profiles;
DROP POLICY "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles
DROP POLICY "Users can view own role" ON public.user_roles;
DROP POLICY "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User settings
DROP POLICY "Users can view own settings" ON public.user_settings;
DROP POLICY "Users can update own settings" ON public.user_settings;
DROP POLICY "Users can insert own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
