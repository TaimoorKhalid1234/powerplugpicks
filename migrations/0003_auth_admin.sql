-- Better Auth admin plugin is used only for protected server-side invitation creation.
ALTER TABLE user ADD COLUMN banned INTEGER DEFAULT 0;
ALTER TABLE user ADD COLUMN banReason TEXT;
ALTER TABLE user ADD COLUMN banExpires INTEGER;
ALTER TABLE session ADD COLUMN impersonatedBy TEXT;
