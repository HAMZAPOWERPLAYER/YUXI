import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SettingsRow } from '@/components/SettingsRow';
import { Stack } from '@/components/Stack';
import { isValidReminderTime } from '@/features/settings/settingsModel';
import { useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';

export type ReminderTimeRowProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function timeToDate(value: string): Date {
  const [hour = '19', minute = '00'] = value.split(':');
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);
  return date;
}

function dateToTime(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

/** Reminder time row with a native time dialog (Android) or inline picker (iOS). */
export function ReminderTimeRow({ value, disabled = false, onChange }: ReminderTimeRowProps) {
  const t = useT();
  const theme = useAppTheme();
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setShow(false);
    if (event.type === 'set' && date) onChange(dateToTime(date));
  };

  const row = (
    <SettingsRow
      icon="time-outline"
      onPress={Platform.OS === 'web' || disabled ? undefined : () => setShow((current) => !current)}
      right={<AppText variant="label">{value}</AppText>}
      title={t('settings.reminderTime')}
    />
  );

  if (Platform.OS === 'web') return row;

  return (
    <Stack gap={0}>
      {row}
      {show ? (
        <Card padding={theme.spacing.sm}>
          <Stack gap={theme.spacing.xs}>
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              mode="time"
              onChange={handleChange}
              value={timeToDate(isValidReminderTime(value) ? value : '19:00')}
            />
            {Platform.OS === 'ios' ? (
              <Button
                label={t('common.done')}
                onPress={() => setShow(false)}
                size="sm"
                variant="secondary"
              />
            ) : null}
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}
