extends Node

@export var dialogue_runner: DialogueRunner
#https://docs.godotengine.org/en/stable/classes/class_canvaslayer.html
@export var dialogue_canvas: CanvasLayer
@export var is_running: bool = false
@export var dialogue_start: String = "GDScriptIntegration"

#region node lifecycle
func _ready() -> void:
	#dialogue_runner.onDialogueComplete += on_dialogue_complete
	dialogue_runner.onDialogueComplete.connect(on_dialogue_complete)
	
	dialogue_canvas.hide()
	
func _process(delta: float) -> void:
	if Input.is_action_just_pressed("ui_toggle_dialogue"):
		print(">>> ui_toggle_dialogue")
		toggle_canvas()
		
#endregion

#region YarnSpinner actions
func run_dialogue(start_node:String):
	print("run_dialogue: %s" % start_node)
	is_running = true
	dialogue_runner.StartDialogue(start_node)

#endregion

#region signals / events
func on_dialogue_complete() -> void:
	print("on_dialogue_complete")
	is_running = false
	hide_canvas()

#endregion

#region UI actions
func hide_canvas() -> void:
	print("hide_canvas")
	dialogue_canvas.hide()
	
func show_canvas():
	print("show_canvas")
	dialogue_canvas.show()
	
	if !is_running:
		run_dialogue(dialogue_start)

func toggle_canvas():
	print("toggle_canvas")
	if dialogue_canvas.visible:
		hide_canvas()
	else:
		show_canvas()
#endregion
