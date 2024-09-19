import { get, readonly, writable } from 'svelte/store';

type KeyCode = string;

export type Shortcut =
	| KeyCode
	| {
			ctrl: KeyCode;
			shift?: never;
			ctrlShift?: never;
	  }
	| {
			ctrl?: never;
			shift: KeyCode;
			ctrlShift?: never;
	  }
	| {
			ctrl?: never;
			shift?: never;
			ctrlShift: KeyCode;
	  };

type LookupShortcut = {
	key: string;
	ctrl: boolean;
	shift: boolean;
};

interface KeyStateTrigger {
	key?: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
}

type ActionHandler<T> = (action: T) => void;

export class ShortcutManager<ACTION, STATE> {
	private readonly actionBindings: [LookupShortcut, ACTION][] = [];
	private readonly stateBindings: [KeyStateTrigger, STATE][] = [];

	private readonly activeStateStore = writable<STATE[]>([]);
	public readonly activeKeyStates = readonly(this.activeStateStore);

	constructor(private readonly actionHandler: ActionHandler<ACTION>) {}

	private static convertShortcutToLookup(shortcut: Shortcut): LookupShortcut {
		if (typeof shortcut === 'string') {
			return { key: shortcut.toLowerCase(), ctrl: false, shift: false };
		} else {
			const { ctrl, shift, ctrlShift } = shortcut;

			if (ctrl) {
				return { key: ctrl.toLowerCase(), ctrl: true, shift: false };
			} else if (shift) {
				return { key: shift.toLowerCase(), ctrl: false, shift: true };
			} else {
				return { key: ctrlShift!.toLowerCase(), ctrl: true, shift: true };
			}
		}
	}

	bind(shortcut: Shortcut, action: ACTION) {
		const lookupShortcut = ShortcutManager.convertShortcutToLookup(shortcut);

		this.actionBindings.push([lookupShortcut, action]);
	}

	bindState(trigger: KeyStateTrigger, state: STATE) {
		this.stateBindings.push([trigger, state]);
	}

	handleShortcutAction(ev: KeyboardEvent): boolean {
		if (!ev.key) return false;

		const keyNormalized = ev.key.toLowerCase();

		for (const [shortcut, action] of this.actionBindings) {
			if (
				shortcut.key === keyNormalized &&
				shortcut.ctrl == ev.ctrlKey &&
				shortcut.shift == ev.shiftKey
			) {
				this.actionHandler(action);
				ev.preventDefault();
				return true;
			}
		}

		return false;
	}

	updateKeyStates(ev: KeyboardEvent, isKeyDownEvent: boolean) {
		const activeStatesBeforeUpdate = get(this.activeStateStore);

		for (const [trigger, keyState] of this.stateBindings) {
			let isTriggerSatisfied = true;

			if (trigger.key !== undefined && trigger.key === ev.key) {
				// True when pressing the trigger key,
				// false when releasing the trigger key
				isTriggerSatisfied = isKeyDownEvent;
			}
			if (trigger.ctrl !== undefined) {
				isTriggerSatisfied &&= trigger.ctrl === ev.ctrlKey;
			}
			if (trigger.shift !== undefined) {
				isTriggerSatisfied &&= trigger.shift === ev.shiftKey;
			}
			if (trigger.alt !== undefined) {
				isTriggerSatisfied &&= trigger.alt === ev.altKey;
			}

			const isCurrentlyActive = activeStatesBeforeUpdate.includes(keyState);

			if (isTriggerSatisfied && !isCurrentlyActive) {
				this.activeStateStore.update((states) => [...states, keyState]);
				ev.preventDefault();
			} else if (!isTriggerSatisfied && isCurrentlyActive) {
				this.activeStateStore.update((states) =>
					states.filter((activeState) => activeState !== keyState)
				);
				ev.preventDefault();
			}
		}
	}
}
