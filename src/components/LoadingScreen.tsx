import { Screen } from '@/components/Screen';
import { LoadingState } from '@/components/StateViews';

export function LoadingScreen() {
  return (
    <Screen scroll={false}>
      <LoadingState />
    </Screen>
  );
}
