extends CharacterBody3D

@export var animation_frame = 0
var facing = 0
const FRAMES = 3
@export var SPEED = 5.0
@export var JUMP_VELOCITY = 4.5

# Get the gravity from the project settings to be synced with RigidBody nodes.
var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

func _physics_process(delta):
	# Add the gravity.
	if not is_on_floor():
		velocity.y -= gravity * delta

	# Handle Jump.
	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = JUMP_VELOCITY

	# Get the input direction and handle the movement/deceleration.
	# As good practice, you should replace UI actions with custom gameplay actions.
	var input_dir = Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var direction = ($SpringArm3D.transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	update_facing(input_dir)
	if direction:
		velocity.x = direction.x * SPEED
		velocity.z = direction.z * SPEED
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)
		velocity.z = move_toward(velocity.z, 0, SPEED)

	move_and_slide()

func update_facing(direction):
	# Start and Stop Animation based on input
	if direction != Vector2(0,0):
		$AnimationPlayer.play("walk")
	else:
		$AnimationPlayer.stop()
		animation_frame = 0
	
	# Set Facing and Horizontal Flip depending on input direction
	if direction.x == -1:
		$Sprite3D.flip_h = false
		facing = 2
	elif direction.x == 1:
		$Sprite3D.flip_h = true
		facing = 2
	elif direction.y == 1:
		facing = 0
	elif direction.y == -1:
		facing = 1
	
	# Update the frame dynamically for animation
	$Sprite3D.frame = animation_frame + (facing * FRAMES)

@export var movespeed := 128.0
@export var generator : Resource

@export var inventory_menu := NodePath()
@export var inventory_tooltip := NodePath()
@export var ground_items := NodePath()

var _mouse_pressed := false

func _ready():
	#if inventory_menu != null:
		#get_node(inventory_menu).hide()
	pass


func _unhandled_input(event):
	if event is InputEventMouseButton:
		_mouse_pressed = event.is_pressed()

	if event.is_action(&"ui_cancel") && event.is_pressed():
		get_node(inventory_menu).hide()

	if event.is_action(&"menu_inventory") && event.is_pressed():
		get_node(inventory_menu).visible = !get_node(inventory_menu).visible
		get_node(inventory_tooltip).visible = false


func _on_Generator_pressed():
	var item_manager = get_node(ground_items)
	for i in 8:
		for x in generator.get_items():
			item_manager.add_item(x, global_position + Vector3(0, 0.5, 0))


func _on_ItemPickup_body_entered(body : Node3D):
	print('>>> _on_ItemPickup_body_entered')
	print(body.name)
	print(body.get_groups())
	if body.is_in_group(&"ground_item") && !body.filter_hidden:
		print('try pickup')
		# Inventory? Inventory. Don't hard-code paths, kids.
#		area.try_pickup($"../../../Inventory/Inventory/Inventory".inventory)
		body.try_pickup(get_node(inventory_menu).main_inventory)
	else:
		print('no pickup')

func _on_inworld_inv_button_pressed(inventory_view, inventory_name):
		get_node(inventory_menu).open_inworld_inventory(inventory_view, inventory_name)


func _on_items_item_clicked(item_node : Node):
	_on_ItemPickup_body_entered(item_node)


func _on_area_3d_body_entered(body: Node3D) -> void:
	pass # Replace with function body.
