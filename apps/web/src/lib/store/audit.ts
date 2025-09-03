import { loadJsonFile, saveJsonFile } from './index';
import { AuditEntry, AuditEntrySchema } from './schemas';

const AUDIT_FILE = 'audit.json';

export async function addAuditEntry(entry: AuditEntry): Promise<void> {
  const data = await loadJsonFile<AuditEntry>(AUDIT_FILE);
  const entries = data.map(item => AuditEntrySchema.parse(item));
  entries.push(entry);
  await saveJsonFile(AUDIT_FILE, entries);
}