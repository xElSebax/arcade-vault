"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GameTouchMap,
  TouchAction,
  VirtualButton,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";
import { EMPTY_VIRTUAL_INPUT } from "@/lib/games/touch-controls/types";

const PULSE_ACTIONS = new Set<TouchAction>(["fire", "rotate", "hard_drop"]);
const PULSE_DEBOUNCE_MS = 90;
const HOLD_REPEAT_DELAY_MS = 500;
const MOUSE_AFTER_TOUCH_SUPPRESS_MS = 1200;

function isPulseAction(action: TouchAction): boolean {
  return PULSE_ACTIONS.has(action);
}

function isHoldButton(map: GameTouchMap, button: VirtualButton): boolean {
  const action = map[button];
  return action !== null && !isPulseAction(action);
}

const ACTION_LABELS: Record<"a" | "b", string> = {
  a: "A",
  b: "B",
};

const DPAD_ARIA: Record<"up" | "down" | "left" | "right", string> = {
  up: "Arriba",
  down: "Abajo",
  left: "Izquierda",
  right: "Derecha",
};

const DPAD_ROTATION: Record<"up" | "down" | "left" | "right", number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

function DpadArrow({
  direction,
}: {
  direction: "up" | "down" | "left" | "right";
}) {
  return (
    <span
      className="virtual-controls__arrow"
      style={{ transform: `rotate(${DPAD_ROTATION[direction]}deg)` }}
      aria-hidden="true"
    >
      ↑
    </span>
  );
}

interface VirtualGameControlsProps {
  map: GameTouchMap;
  disabled?: boolean;
  onInputChange: (state: VirtualInputState) => void;
  onActionPulse: (action: TouchAction) => void;
  controlsLabel?: string;
}

export function VirtualGameControls({
  map,
  disabled = false,
  onInputChange,
  onActionPulse,
  controlsLabel,
}: VirtualGameControlsProps) {
  const holdStateRef = useRef<VirtualInputState>({ ...EMPTY_VIRTUAL_INPUT });
  const pointerButtonsRef = useRef<Map<number, VirtualButton>>(new Map());
  const onInputChangeRef = useRef(onInputChange);
  const mapRef = useRef(map);
  const disabledRef = useRef(disabled);
  const suppressMouseUntilRef = useRef(0);
  const lastPulseAtRef = useRef<Partial<Record<VirtualButton, number>>>({});
  const holdDelayTimersRef = useRef<Map<VirtualButton, number>>(new Map());
  const onActionPulseRef = useRef(onActionPulse);
  const [activeVisual, setActiveVisual] = useState<VirtualInputState>({
    ...EMPTY_VIRTUAL_INPUT,
  });

  useEffect(() => {
    onInputChangeRef.current = onInputChange;
  }, [onInputChange]);

  useEffect(() => {
    onActionPulseRef.current = onActionPulse;
  }, [onActionPulse]);

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const emitHoldState = useCallback(() => {
    onInputChangeRef.current({ ...holdStateRef.current });
  }, []);

  const setVisual = useCallback((button: VirtualButton, active: boolean) => {
    setActiveVisual((prev) => {
      if (prev[button] === active) {
        return prev;
      }

      return { ...prev, [button]: active };
    });
  }, []);

  const clearHoldTimer = useCallback((button: VirtualButton) => {
    const timerId = holdDelayTimersRef.current.get(button);
    if (timerId === undefined) {
      return;
    }

    window.clearTimeout(timerId);
    holdDelayTimersRef.current.delete(button);
  }, []);

  const clearAllHoldTimers = useCallback(() => {
    for (const timerId of holdDelayTimersRef.current.values()) {
      window.clearTimeout(timerId);
    }
    holdDelayTimersRef.current.clear();
  }, []);

  const startHoldRepeatDelay = useCallback(
    (button: VirtualButton) => {
      clearHoldTimer(button);

      const timerId = window.setTimeout(() => {
        holdDelayTimersRef.current.delete(button);
        if (disabledRef.current) {
          return;
        }

        if (!holdStateRef.current[button]) {
          holdStateRef.current[button] = true;
          emitHoldState();
        }
      }, HOLD_REPEAT_DELAY_MS);

      holdDelayTimersRef.current.set(button, timerId);
    },
    [clearHoldTimer, emitHoldState],
  );

  const firePulse = useCallback((button: VirtualButton, action: TouchAction) => {
    const now = performance.now();
    const lastPulse = lastPulseAtRef.current[button] ?? 0;
    if (now - lastPulse < PULSE_DEBOUNCE_MS) {
      return;
    }

    lastPulseAtRef.current[button] = now;
    onActionPulseRef.current(action);
  }, []);

  const releaseHoldButton = useCallback(
    (button: VirtualButton) => {
      clearHoldTimer(button);
      setVisual(button, false);

      if (!isHoldButton(mapRef.current, button)) {
        return;
      }

      if (!holdStateRef.current[button]) {
        return;
      }

      holdStateRef.current[button] = false;
      emitHoldState();
    },
    [clearHoldTimer, emitHoldState, setVisual],
  );

  const releasePointer = useCallback(
    (pointerId: number) => {
      const button = pointerButtonsRef.current.get(pointerId);
      if (button === undefined) {
        return;
      }

      pointerButtonsRef.current.delete(pointerId);
      releaseHoldButton(button);
    },
    [releaseHoldButton],
  );

  const releaseAllPointers = useCallback(() => {
    const tracked = Array.from(pointerButtonsRef.current.values());
    pointerButtonsRef.current.clear();
    clearAllHoldTimers();

    let holdChanged = false;
    for (const button of tracked) {
      setVisual(button, false);
      if (isHoldButton(mapRef.current, button) && holdStateRef.current[button]) {
        holdStateRef.current[button] = false;
        holdChanged = true;
      }
    }

    if (holdChanged) {
      emitHoldState();
    }
  }, [clearAllHoldTimers, emitHoldState, setVisual]);

  const isGhostMouse = useCallback((event: { pointerType: string }) => {
    return (
      event.pointerType === "mouse" &&
      performance.now() < suppressMouseUntilRef.current
    );
  }, []);

  const pressButton = useCallback(
    (button: VirtualButton, pointerId: number, pointerType: string) => {
      if (disabledRef.current) {
        return;
      }

      const action = mapRef.current[button];
      if (!action) {
        return;
      }

      if (pointerType === "touch" || pointerType === "pen") {
        suppressMouseUntilRef.current =
          performance.now() + MOUSE_AFTER_TOUCH_SUPPRESS_MS;
      }

      pointerButtonsRef.current.set(pointerId, button);
      setVisual(button, true);
      firePulse(button, action);

      if (!isPulseAction(action)) {
        startHoldRepeatDelay(button);
      }
    },
    [firePulse, setVisual, startHoldRepeatDelay],
  );

  useEffect(() => {
    const handlePointerEnd = (event: PointerEvent) => {
      if (isGhostMouse(event)) {
        return;
      }

      releasePointer(event.pointerId);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      suppressMouseUntilRef.current =
        performance.now() + MOUSE_AFTER_TOUCH_SUPPRESS_MS;

      if (event.touches.length === 0) {
        releaseAllPointers();
      }
    };

    window.addEventListener("pointerup", handlePointerEnd, true);
    window.addEventListener("pointercancel", handlePointerEnd, true);
    window.addEventListener("touchend", handleTouchEnd, true);
    window.addEventListener("touchcancel", handleTouchEnd, true);

    return () => {
      window.removeEventListener("pointerup", handlePointerEnd, true);
      window.removeEventListener("pointercancel", handlePointerEnd, true);
      window.removeEventListener("touchend", handleTouchEnd, true);
      window.removeEventListener("touchcancel", handleTouchEnd, true);
      releaseAllPointers();
      onInputChangeRef.current({ ...EMPTY_VIRTUAL_INPUT });
    };
  }, [isGhostMouse, releaseAllPointers, releasePointer]);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    releaseAllPointers();
    onInputChangeRef.current({ ...EMPTY_VIRTUAL_INPUT });
  }, [disabled, releaseAllPointers]);

  const handlePointerDown = useCallback(
    (button: VirtualButton) => (event: React.PointerEvent<HTMLButtonElement>) => {
      if (isGhostMouse(event)) {
        return;
      }

      pressButton(button, event.pointerId, event.pointerType);
    },
    [isGhostMouse, pressButton],
  );

  const displayedActive = disabled ? EMPTY_VIRTUAL_INPUT : activeVisual;

  const renderButton = (button: VirtualButton, className = "") => {
    const action = map[button];
    const isInactive = action === null;
    const isPressed = displayedActive[button];
    const isAction = button === "a" || button === "b";
    const isDpad =
      button === "up" ||
      button === "down" ||
      button === "left" ||
      button === "right";

    const ariaLabel = isAction
      ? action ?? `Botón ${ACTION_LABELS[button]} sin uso`
      : action ?? `${DPAD_ARIA[button]} sin uso`;

    return (
      <button
        key={button}
        type="button"
        className={[
          "virtual-controls__btn",
          isAction ? "virtual-controls__btn--action" : "virtual-controls__btn--dpad",
          button === "a" ? "virtual-controls__btn--a" : "",
          button === "b" ? "virtual-controls__btn--b" : "",
          isInactive ? "virtual-controls__btn--inactive" : "",
          isPressed ? "virtual-controls__btn--pressed" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={ariaLabel}
        aria-disabled={isInactive || disabled}
        disabled={isInactive || disabled}
        onPointerDown={handlePointerDown(button)}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => event.preventDefault()}
      >
        {isDpad ? (
          <DpadArrow direction={button} />
        ) : (
          ACTION_LABELS[button]
        )}
      </button>
    );
  };

  return (
    <div
      className="virtual-controls"
      aria-label={controlsLabel ?? "Controles virtuales"}
    >
      <div className="virtual-controls__dpad">
        <div className="virtual-controls__dpad-up">{renderButton("up")}</div>
        <div className="virtual-controls__dpad-mid">
          {renderButton("left")}
          {renderButton("down")}
          {renderButton("right")}
        </div>
      </div>
      <div className="virtual-controls__actions">
        {renderButton("a")}
        {renderButton("b")}
      </div>
    </div>
  );
}
