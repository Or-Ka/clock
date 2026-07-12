export type Cleanup = () => void;

export type LifecycleRegistry = {
  readonly add: (cleanup: Cleanup) => void;
  readonly destroy: () => void;
};

export function createLifecycleRegistry(): LifecycleRegistry {
  const cleanups: Cleanup[] = [];
  let destroyed = false;

  return {
    add(cleanup) {
      if (destroyed) {
        cleanup();
        return;
      }

      cleanups.push(cleanup);
    },

    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      for (const cleanup of [...cleanups].reverse()) {
        cleanup();
      }
      cleanups.length = 0;
    }
  };
}
