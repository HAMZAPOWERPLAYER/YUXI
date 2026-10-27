import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { MascotExpression } from '@/theme/mascot';

import { AppText } from './AppText';
import { Button } from './Button';
import { Mascot } from './Mascot';
import { Stack } from './Stack';

export function LoadingState({ label }: { label?: string }) {
  const theme = useAppTheme();
  const t = useT();
  return (
    <View style={styles.center}>
      <Stack align="center" gap={theme.spacing.md}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <AppText variant="body" color="textMuted" align="center">
          {label ?? t('common.loading')}
        </AppText>
      </Stack>
    </View>
  );
}

export type StateViewProps = {
  title: string;
  body?: string;
  expression?: MascotExpression;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: 'refresh' | 'play' | 'arrow-forward';
};

function StateView({
  title,
  body,
  expression = 'sleepy',
  actionLabel,
  onAction,
  actionIcon,
}: StateViewProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.center}>
      <Stack align="center" gap={theme.spacing.md} style={styles.content}>
        <Mascot expression={expression} size={160} />
        <AppText variant="heading" align="center">
          {title}
        </AppText>
        {body ? (
          <AppText variant="body" color="textMuted" align="center">
            {body}
          </AppText>
        ) : null}
        {actionLabel && onAction ? (
          <Button
            icon={actionIcon}
            label={actionLabel}
            onPress={onAction}
            variant="secondary"
            style={styles.action}
          />
        ) : null}
      </Stack>
    </View>
  );
}

export function EmptyState(props: StateViewProps) {
  return <StateView {...props} />;
}

export type ErrorStateProps = Omit<StateViewProps, 'title' | 'body' | 'expression'> & {
  title?: string;
  body?: string;
};

export function ErrorState({ title, body, actionLabel, onAction, actionIcon }: ErrorStateProps) {
  const t = useT();
  return (
    <StateView
      actionIcon={actionIcon ?? 'refresh'}
      actionLabel={actionLabel ?? t('common.retry')}
      body={body ?? t('errors.loadBody')}
      expression="thinking"
      onAction={onAction}
      title={title ?? t('errors.loadTitle')}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 320,
    paddingVertical: 24,
  },
  content: {
    width: '100%',
  },
  action: {
    marginTop: 8,
    maxWidth: 280,
  },
});
