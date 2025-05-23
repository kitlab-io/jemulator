extends Node

@export var dialogue_runner: Node
@export var dialogue_canvas: CanvasLayer

func _ready() -> void:
	#dialogue_runner.onDialogueComplete += on_dialogue_complete
	dialogue_runner.onDialogueComplete.connect(on_dialogue_complete)
	
	dialogue_canvas.hide()
	
func on_dialogue_complete() -> void:
	print("on_dialogue_complete")
	hide_canvas()

func hide_canvas() -> void:
	print("hide_canvas")
	dialogue_canvas.hide()
