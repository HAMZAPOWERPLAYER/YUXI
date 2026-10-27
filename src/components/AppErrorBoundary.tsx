import { router } from 'expo-router';
import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';
import { logEvent } from '@/utils/logger';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { Mascot } from './Mascot';

type FallbackProps = {
  error: Error;
  onRestart: () => void;
};

export function AppErrorFallback({ error, onRestart }: FallbackProps) {
  const t = useT();
  const theme = useAppTheme();

  const restart = () => {
    onRestart();
    try {
      router.replace('/');
    } catch {
      // If navigation itself failed, resetting the boundary is still useful.
    }
  };

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Mascot expression="thinking" size={180} />
      <AppText accessibilityRole="alert" align="center" variant="title">
        {t('errors.title')}
      </AppText>
      <AppText align="center" color="textMuted" variant="body">
        {t('errors.body')}
      </AppText>
      {__DEV__ ? (
        <Card tone="surface2">
          <AppText color="textMuted" variant="caption">
            {error.message}
          </AppText>
        </Card>
      ) : null}
      <Button label={t('errors.restart')} onPress={restart} icon="refresh" />
    </View>
  );
}

type Props = PropsWithChildren<{
  source?: string;
}>;

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logEvent('error', `Unhandled UI error in ${this.props.source ?? 'app'}`, {
      componentStack: info.componentStack,
      message: error.message,
      stack: error.stack,
    });
  }

  private restart = (): void => {
    this.setState({ error: null });
  };

  override render() {
    if (this.state.error) {
      return <AppErrorFallback error={this.state.error} onRestart={this.restart} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
});
