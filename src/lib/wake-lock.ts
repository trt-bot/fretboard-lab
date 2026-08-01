/**
 * Screen Wake Lock — keeps the phone screen on while practicing.
 * Supported on iOS Safari/Chrome (WebKit) 16.4+ and modern desktop browsers.
 */

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (
    type: "release",
    listener: () => void,
    options?: { once?: boolean },
  ) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

let sentinel: WakeLockSentinelLike | null = null;
let desired = false;

function nav(): WakeLockNavigator {
  return navigator as WakeLockNavigator;
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

async function acquire(): Promise<boolean> {
  if (!desired) return false;
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    return false;
  }
  if (!isWakeLockSupported()) return false;

  if (sentinel && !sentinel.released) return true;

  try {
    const lock = await nav().wakeLock!.request("screen");
    sentinel = lock;
    lock.addEventListener(
      "release",
      () => {
        if (sentinel === lock) sentinel = null;
        if (desired && document.visibilityState === "visible") {
          void acquire();
        }
      },
      { once: true },
    );
    return true;
  } catch {
    // Permission denied, Low Power Mode, or unsupported context
    sentinel = null;
    return false;
  }
}

async function releaseHeld(): Promise<void> {
  const current = sentinel;
  sentinel = null;
  if (current && !current.released) {
    try {
      await current.release();
    } catch {
      // ignore
    }
  }
}

/**
 * Keep screen awake while `active` is true.
 * Returns cleanup that removes listeners and releases the lock when deactivated.
 */
export function attachWakeLock(active: boolean): () => void {
  desired = active;

  if (!active) {
    void releaseHeld();
    return () => {
      /* no-op */
    };
  }

  void acquire();

  const onVisibility = () => {
    if (!desired) return;
    if (document.visibilityState === "visible") {
      void acquire();
    }
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pageshow", onVisibility);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pageshow", onVisibility);
  };
}

/** Force-release on unmount */
export function stopWakeLock(): void {
  desired = false;
  void releaseHeld();
}
