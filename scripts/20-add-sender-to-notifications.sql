ALTER TABLE notifications
ADD COLUMN sender_id UUID REFERENCES auth.users(id);
