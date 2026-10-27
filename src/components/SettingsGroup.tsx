import { type ReactNode } from 'react';

import { Card } from './Card';
import { Stack } from './Stack';

/** Card container for a group of SettingsRow children. */
export function SettingsGroup({ children }: { children: ReactNode }) {
  return (
    <Card padding={0}>
      <Stack gap={0}>{children}</Stack>
    </Card>
  );
}
