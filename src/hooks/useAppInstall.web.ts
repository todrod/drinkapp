import { useEffect, useState, useSyncExternalStore } from 'react';
import { createInstallController } from '../install/controller.web';
import type { AppInstall } from '../install/types';

const controller = createInstallController(window);

export function useAppInstall(enabled: boolean): AppInstall {
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [hintReady, setHintReady] = useState(false);
  const eligible = enabled && !snapshot.installed && snapshot.canSuggest && snapshot.hintDismissedUntil <= Date.now();
  useEffect(() => {
    setHintReady(false);
    if (!eligible) return;
    const timer = setTimeout(() => setHintReady(true), 10_000);
    return () => clearTimeout(timer);
  }, [eligible]);
  return { snapshot, showEntry: !snapshot.installed, hintVisible: eligible && hintReady,
    dismissHint: controller.dismissHint, requestInstall: controller.requestInstall };
}
