ALTER TABLE content_records ADD COLUMN live_updated_at TEXT;
UPDATE content_records SET live_updated_at=published_at WHERE live_revision_id IS NOT NULL;
