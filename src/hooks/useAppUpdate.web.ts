import { useSyncExternalStore } from 'react';
import { createUpdateController } from '../updates/controller.web';
import type { AppUpdate } from '../updates/types';

const controller = createUpdateController(window);

export function useAppUpdate(): AppUpdate {
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  return { snapshot, dismiss: controller.dismiss, apply: controller.apply, check: controller.check };
}
