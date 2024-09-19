import type { Action } from 'svelte/action';
import { tooltipContainerID } from './ModalProvider.svelte';
import Tooltip, { TOOLTIP_TRANSITION_OUT_MS, type TooltipProps } from './Tooltip.svelte';

export const tooltip: Action<HTMLElement, TooltipProps> = (node, props) => {
	const tooltipContainer = document.getElementById(tooltipContainerID)!;

	let tooltipComponent: Tooltip | undefined;

	function onMouseEnter() {
		tooltipComponent?.$destroy();

		tooltipComponent = new Tooltip({
			target: tooltipContainer,
			props: {
				props,
				boundingRect: node.getBoundingClientRect()
			}
		});
	}

	function destroyAfterFadeOut() {
		const activeTooltip = tooltipComponent;
		if (activeTooltip) {
			activeTooltip.$set({
				isDestroyed: true
			});

			// Increased delay to counter asynchronicity
			const destructionDelay = TOOLTIP_TRANSITION_OUT_MS + 200;

			setTimeout(() => {
				activeTooltip.$destroy();
			}, destructionDelay);
		}
	}

	function onMouseLeave() {
		destroyAfterFadeOut();
	}

	function setAriaTooltip(value: string | null) {
		node.ariaLabel = value;
	}

	function initializeOnMove() {
		window.removeEventListener('mousemove', initializeOnMove);

		setAriaTooltip(props.label);
		node.addEventListener('mouseenter', onMouseEnter);
		node.addEventListener('mouseleave', onMouseLeave);
	}

	window.addEventListener('mousemove', initializeOnMove);

	return {
		update: (props) => {
			setAriaTooltip(props.label);
			tooltipComponent?.$set({ props });
		},
		destroy: () => {
			node.removeEventListener('mouseenter', onMouseEnter);
			node.removeEventListener('mouseleave', onMouseLeave);

			setAriaTooltip(null);
			destroyAfterFadeOut();
		}
	};
};
