import { vi } from 'vitest';

/** lib/audit yerine geçer: testlerde denetim kaydı yazılmaz. */
export const writeAudit = vi.fn();

export function applyAuditDefaults() {
  writeAudit.mockResolvedValue(undefined);
}

applyAuditDefaults();
