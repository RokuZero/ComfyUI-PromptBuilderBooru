import { app } from '../../../scripts/app.js';

let presetsPromise = null;
let presetsData = null;

// Fetches and caches presets from a JSON file
// Uses a promise singleton to prevent duplicate network requests
// Resets to null on failure for future retries

function loadPresets() {
	if (presetsPromise === null) {
		presetsPromise = fetch('/extensions/ComfyUI-PromptBuilderBooru/presets.json?t=' + Date.now())
			.then(response => response.ok ? response.json() : Promise.reject())
			.then(data => presetsData = data)
			.catch(() => {
				presetsPromise = null;
				return null;
			});
	}

	return presetsPromise;
}

// Searches for a preset item by its name within a category
// Verifies that the presets data and the category both exist
// Iterates through the items and returns the match or null

function getItem(category, name) {
	if (!presetsData || !presetsData[category]) {
		return null;
	}

	const items = presetsData[category];

	for (const item of items) {
		if (item.name === name) {
			return item;
		}
	}

	return null;
}

// Collects widget values and retrieves their corresponding preset data
// Applies LoRA prompt overrides dynamically for specific categories if present
// Filters out empty values and joins all valid prompt parts with a comma

function buildPositivePrompt(node) {
	const modelName = node.widgets.find(w => w.name === 'model')?.value || '';
	const loraName = node.widgets.find(w => w.name === 'lora')?.value || '';
	const genderName = node.widgets.find(w => w.name === 'gender')?.value || '';
	const eyeColorName = node.widgets.find(w => w.name === 'eye_color')?.value || '';
	const hairColorName = node.widgets.find(w => w.name === 'hair_color')?.value || '';
	const hairStyleName = node.widgets.find(w => w.name === 'hair_style')?.value || '';
	const buildName = node.widgets.find(w => w.name === 'build')?.value || '';
	const featureName = node.widgets.find(w => w.name === 'feature')?.value || '';
	const featureExtraOneName = node.widgets.find(w => w.name === 'feature_extra_1')?.value || '';
	const featureExtraTwoName = node.widgets.find(w => w.name === 'feature_extra_2')?.value || '';
	const outfitName = node.widgets.find(w => w.name === 'outfit')?.value || '';
	const poseName = node.widgets.find(w => w.name === 'pose')?.value || '';
	const actionName = node.widgets.find(w => w.name === 'action')?.value || '';
	const actionExtraOneName = node.widgets.find(w => w.name === 'action_extra_1')?.value || '';
	const actionExtraTwoName = node.widgets.find(w => w.name === 'action_extra_2')?.value || '';
	const backgroundName = node.widgets.find(w => w.name === 'background')?.value || '';
	const compositionName = node.widgets.find(w => w.name === 'composition')?.value || '';
	const styleName = node.widgets.find(w => w.name === 'style')?.value || '';

	const modelItem = getItem('model', modelName);
	const loraItem = getItem('lora', loraName);
	const genderItem = getItem('gender', genderName);
	const eyeItem = getItem('eye_color', eyeColorName);
	const hairColorItem = getItem('hair_color', hairColorName);
	const hairStyleItem = getItem('hair_style', hairStyleName);
	const buildItem = getItem('build', buildName);
	const featureItem = getItem('feature', featureName);
	const featureExtraOneItem = getItem('feature', featureExtraOneName);
	const featureExtraTwoItem = getItem('feature', featureExtraTwoName);
	const outfitItem = getItem('outfit', outfitName);
	const poseItem = getItem('pose', poseName);
	const actionItem = getItem('action', actionName);
	const actionExtraOneItem = getItem('action', actionExtraOneName);
	const actionExtraTwoItem = getItem('action', actionExtraTwoName);
	const backgroundItem = getItem('background', backgroundName);
	const compositionItem = getItem('composition', compositionName);
	const styleItem = getItem('style', styleName);

	// applies LoRA prompt overrides dynamically

	let override = {};

	if (loraItem) {
		override = loraItem.override || {};
	}

	// starts assembling the positive prompt parts

	const parts = [];

	// model

	if (modelItem) {
		parts.push(modelItem.positive);
	}

	// gender

	if (typeof override.gender === 'string' && override.gender.length > 0) {
		parts.push(override.gender);
	} else if (genderItem) {
		parts.push(genderItem.value);
	}

	// appearance

	if (typeof override.appearance === 'string' && override.appearance.length > 0) {
		parts.push(override.appearance);
	} else {
		if (eyeItem) parts.push(eyeItem.value);
		if (hairColorItem) parts.push(hairColorItem.value);
		if (hairStyleItem) parts.push(hairStyleItem.value);
		if (buildItem) parts.push(buildItem.value);
		if (featureItem) parts.push(featureItem.value);
		if (featureExtraOneItem) parts.push(featureExtraOneItem.value);
		if (featureExtraTwoItem) parts.push(featureExtraTwoItem.value);
	}

	// outfit

	if (typeof override.outfit === 'string' && override.outfit.length > 0) {
		parts.push(override.outfit);
	} else if (outfitItem) {
		parts.push(outfitItem.value);
	}

	// pose

	if (typeof override.pose === 'string' && override.pose.length > 0) {
		parts.push(override.pose);
	} else if (poseItem) {
		parts.push(poseItem.value);
	}

	// action

	if (typeof override.action === 'string' && override.action.length > 0) {
		parts.push(override.action);
	} else {
		if (actionItem) parts.push(actionItem.value);
		if (actionExtraOneItem) parts.push(actionExtraOneItem.value);
		if (actionExtraTwoItem) parts.push(actionExtraTwoItem.value);
	}

	// background

	if (typeof override.background === 'string' && override.background.length > 0) {
		parts.push(override.background);
	} else if (backgroundItem) {
		parts.push(backgroundItem.value);
	}

	// composition

	if (typeof override.composition === 'string' && override.composition.length > 0) {
		parts.push(override.composition);
	} else if (compositionItem) {
		parts.push(compositionItem.value);
	}

	// style

	if (typeof override.style === 'string' && override.style.length > 0) {
		parts.push(override.style);
	} else if (styleItem) {
		parts.push(styleItem.value);
	}

	// filters and joins all elements into a single string

	return parts.filter(iter => iter && iter.trim()).join(', ');
}

// Retrieves the negative prompt associated with the currently selected model
// Returns the negative prompt string or an empty string if not found

function buildNegativePrompt(node) {
	const modelName = node.widgets.find(w => w.name === 'model')?.value || '';
	const modelItem = getItem('model', modelName);
	return modelItem?.negative || '';
}

// Generates prompts and updates display widgets while respecting the overwrite flag
// Prevents overwriting text during node startup so saved workflow values are not lost
// Marks the ComfyUI canvas as dirty to trigger a visual layout redraw

function updatePromptDisplay(node, allowOverwriting) {
	const positiveWidget = node.widgets.find(w => w.name === 'positive_display');
	const negativeWidget = node.widgets.find(w => w.name === 'negative_display');

	if (allowOverwriting === false) {
		if (positiveWidget && positiveWidget.value && positiveWidget.value.trim().length > 0) {
			return;
		}
	}

	if (positiveWidget) {
		positiveWidget.value = buildPositivePrompt(node);
	}

	if (negativeWidget) {
		negativeWidget.value = buildNegativePrompt(node);
	}

	if (positiveWidget || negativeWidget) {
		node.setDirtyCanvas(true, true);
	}
}

// Looks up the hint text for the selected model from presets
// Updates the read-only hint widget display inside the node

function updateModelHint(node) {
	const hintWidget = node.widgets.find(w => w.name === 'hint');
	const modelName = node.widgets.find(w => w.name === 'model')?.value || '';
	const modelItem = getItem('model', modelName);
	hintWidget.value = modelItem && modelItem.hint ? modelItem.hint : '';
}

// Registers the extension to monitor node lifecycle events and auto-update widgets
// Initialized once during ComfyUI startup before the node configuration is loaded

app.registerExtension({
	name: 'PromptBuilderBooruNode.AutoUpdate',
	async nodeCreated(node) {
		if (node.comfyClass !== 'PromptBuilderBooruNode') {
			return;
		}

		const hintWidget = node.widgets.find(w => w.name === 'hint');
		const observedWidgets = [
			'model',
			'lora',
			'gender',
			'eye_color',
			'hair_color',
			'hair_style',
			'build',
			'feature',
			'feature_extra_1',
			'feature_extra_2',
			'outfit',
			'pose',
			'action',
			'action_extra_1',
			'action_extra_2',
			'background',
			'composition',
			'style'
		];

		if (hintWidget && hintWidget.inputEl) {
			hintWidget.inputEl.style.cursor = 'default';
			hintWidget.inputEl.style.opacity = 0.7;
			hintWidget.inputEl.readOnly = true;
		}

		await loadPresets();

		setTimeout(() => {
			updatePromptDisplay(node, false);
			updateModelHint(node);

			observedWidgets.forEach(widgetName => {
				const widget = node.widgets.find(w => w.name === widgetName);
				if (widget) {
					const origCallback = widget.callback;
					widget.callback = (value) => {
						if (origCallback) {
							origCallback.call(node, value);
						}

						if (widgetName === 'model') {
							updateModelHint(node);
						}

						updatePromptDisplay(node, true);
					};
				}
			});
		}, 200);
	}
});
