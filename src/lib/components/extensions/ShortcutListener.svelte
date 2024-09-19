<script lang="ts" context="module">
	export enum ShortcutAction {
		Escape = 'Escape',

		Undo = 'Undo',
		Redo = 'Redo',
		Copy = 'Copy',
		Cut = 'Cut',
		Paste = 'Paste',
		Delete = 'Delete',

		SelectAll = 'Select All'
	}

	export type ActionListener = [ShortcutAction, () => void];

	export enum KeyState {
		DisableGridSnapping = 'Disable Grid Snapping',
		ModifySelectionRange = 'Modify Selection Range',
		ModifySelection = 'Modify Selection'
	}

	interface ListenerHandle {
		handle: (handler: () => void) => void;
	}

	export function listenTo(action: ShortcutAction) {
		let activeListener: ActionListener | undefined = undefined;

		return readable<ListenerHandle>(
			{
				handle: (handler) => {
					activeListener = [action, handler];
					actionListeners.push(activeListener);
				}
			},
			() => {
				return () => {
					actionListeners = actionListeners.filter((registered) => registered != activeListener);
				};
			}
		);
	}

	export function keyStateOf(keyState: KeyState): Readable<boolean> {
		return derived(activeKeyStates, (active) => active.includes(keyState));
	}

	export function derivedKeyStateModifySelection() {
		return derived(
			[keyStateOf(KeyState.ModifySelection), keyStateOf(KeyState.ModifySelectionRange)],
			([doModify, doModifyRange]) => {
				return doModify || doModifyRange;
			}
		);
	}

	let activeKeyStates = writable<KeyState[]>([]);
	let actionListeners: ActionListener[] = [];

	function handleAction(action: ShortcutAction) {
		for (const [handledAction, listener] of actionListeners) {
			if (handledAction === action) {
				listener();
			}
		}
	}
</script>

<script lang="ts">
	import { ShortcutManager } from '$lib/packages/shortcut-manager';
	import { derived, readable, writable, type Readable } from 'svelte/store';

	const shortcutManager = new ShortcutManager<ShortcutAction, KeyState>(handleAction);
	const activeManagerKeyStates = shortcutManager.activeKeyStates;

	$: {
		activeKeyStates.set($activeManagerKeyStates);
	}

	shortcutManager.bind('Escape', ShortcutAction.Escape);

	// See https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#editing_keys for reference
	shortcutManager.bind('Undo', ShortcutAction.Undo);
	shortcutManager.bind({ ctrl: 'z' }, ShortcutAction.Undo);

	shortcutManager.bind('Redo', ShortcutAction.Redo);
	shortcutManager.bind({ ctrl: 'y' }, ShortcutAction.Redo);
	shortcutManager.bind({ ctrlShift: 'z' }, ShortcutAction.Redo);

	shortcutManager.bind('Copy', ShortcutAction.Copy);
	shortcutManager.bind({ ctrl: 'c' }, ShortcutAction.Copy);

	shortcutManager.bind('Cut', ShortcutAction.Cut);
	shortcutManager.bind({ ctrl: 'x' }, ShortcutAction.Cut);

	shortcutManager.bind('Paste', ShortcutAction.Paste);
	shortcutManager.bind({ ctrl: 'v' }, ShortcutAction.Paste);

	shortcutManager.bind('Backspace', ShortcutAction.Delete);
	shortcutManager.bind('Delete', ShortcutAction.Delete);

	shortcutManager.bindState({ alt: true }, KeyState.DisableGridSnapping);
	shortcutManager.bindState({ shift: true }, KeyState.ModifySelectionRange);
	shortcutManager.bindState({ ctrl: true }, KeyState.ModifySelection);

	function isNativelyHandled(ev: KeyboardEvent) {
		const focusedElement = ev.target;

		return (
			focusedElement instanceof HTMLInputElement || focusedElement instanceof HTMLTextAreaElement
		);
	}
</script>

<svelte:window
	on:keydown={(ev) => {
		if (!isNativelyHandled(ev)) {
			shortcutManager.handleShortcutAction(ev);
			shortcutManager.updateKeyStates(ev, true);
		}
	}}
	on:keyup={(ev) => {
		shortcutManager.updateKeyStates(ev, false);
	}}
/>

<slot />
