import os
import json
import shutil

class PromptBuilderBooruNode:
	RETURN_TYPES = ("STRING", "STRING")
	RETURN_NAMES = ("positive", "negative")
	CATEGORY = "prompt_builder"
	FUNCTION = "process"
	OUTPUT_NODE = True

	@classmethod
	def INPUT_TYPES(cls):
		presets = cls.load_presets()
		categories = {
			"model": "model",
			"lora": "lora",
			"gender": "gender",
			"eye_color": "eye_color",
			"hair_color": "hair_color",
			"hair_style": "hair_style",
			"build": "build",
			"feature": "feature",
			"feature_extra_1": "feature",
			"feature_extra_2": "feature",
			"outfit": "outfit",
			"pose": "pose",
			"action": "action",
			"action_extra_1": "action",
			"action_extra_2": "action",
			"background": "background",
			"composition": "composition",
			"style": "style",
		}

		widgets = {
			"positive_display": ("STRING", {"multiline": True, "dynamicPrompts": True}),
			"negative_display": ("STRING", {"multiline": True, "dynamicPrompts": True}),
			"hint": ("STRING", {"multiline": True}),
		}

		for widget_name, preset_key in categories.items():
			items = presets.get(preset_key, [])
			name_values = [item["name"] for item in items]
			widgets[widget_name] = (name_values,)

		return {"required": widgets}

	@classmethod
	def load_presets(cls):
		current_dir = os.path.dirname(os.path.abspath(__file__))
		json_path = os.path.join(current_dir, "js", "presets.json")
		example_path = os.path.join(current_dir, "js", "presets.example.json")

		if not os.path.exists(json_path) and os.path.exists(example_path):
			shutil.copy2(example_path, json_path)

		try:
			with open(json_path, 'r', encoding='utf-8') as f:
				return json.load(f)
		except (FileNotFoundError, json.JSONDecodeError):
			return {}

	def process(self, positive_display, negative_display, **kwargs):
		return (positive_display, negative_display)

	@classmethod
	def IS_CHANGED(cls, **kwargs):
		import time
		return time.time()
