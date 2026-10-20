CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX conversations_user_updated ON conversations(user_id, updated_at DESC);

INSERT INTO conversations (id, user_id, title)
SELECT 'legacy-' || id, id, 'Earlier conversation' FROM users;

ALTER TABLE messages ADD COLUMN conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE;
UPDATE messages SET conversation_id = 'legacy-' || user_id WHERE conversation_id IS NULL;
CREATE INDEX messages_conversation_created ON messages(conversation_id, created_at ASC);
