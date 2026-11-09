CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX projects_user_updated ON projects(user_id, updated_at DESC);

ALTER TABLE conversations ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;

INSERT INTO projects (id, user_id, name)
SELECT 'workspace-' || id, id, 'My workspace' FROM users;
UPDATE conversations SET project_id = 'workspace-' || user_id;
UPDATE documents SET project_id = 'workspace-' || user_id;

CREATE INDEX conversations_project_updated ON conversations(project_id, updated_at DESC);
CREATE INDEX documents_project_created ON documents(project_id, created_at DESC);
