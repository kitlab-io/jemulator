let's create a 3D building system and simulation system in Godot that allows the user to create a device like a remote control car or a robot, then simulate the device's operation.

for the building system, create a new root scene that allows the player to add components like wheels, a body, and a motor from a library and positioining them in 3D space with gizmos to translate, rotate, and scale them controlled by the mouse and keyboard.
components must have a name, type, and transform properties, and a visual model.
provide a panel view for the player to search for and add components to their creation.
use primitive 3D shapes for the components' visual model and provide a view to precisely edit the transform properties of a selected components and the change the visual model of the component to another 3d model later.
the player should be able to save and load their creation's component data and a device name and type to a json file in the user data application folder.
create a sample save file for a remote control car at godot/sample_user_data for the player to load and test the building system.

for the simulation system, create a separate scence for spawning and simulating the operation of a device. 
provide a panel view for the player to search for and add saved devices from the user data application folder to the scene.
when instantiating a device, use the component data to create the device in 3D space and parent all the components with relative position to a new root node.
also add interactivity or physics simulation scripts to components per their type. for example, a wheel type or a body type component should have a physics simulation scripts. for this implementation, use the built-in VehicleWheel3D and VehicleBody3D respectively to simulate the physics of these components. but also provide parameters/interface for replacing the built-in physics simulation scripts with custom scripts.
add a main script to the root node referencing all the interactive components and their scripts so the player can control the device by sending events to the main script/root node.
the main device script should route events to the appropriate component scripts. for example, for root device type of car, the main script should route car throttle and steering events to the scripts of child components of type wheel.
in the simuation scene provide a panel view for the player to select a device instance to control, see the keyboard and mouse input bindings to the main script of the selected device, received/routed events to the component scripts, and the physics simulation state of appropriate components. 

overall, add any scripts created to godot/yarnspinner/scripts and comment the code to explain what each part does and how to extend the building and simulation systems.
add any root scenes created to godot/yarnspinner/scenes.
add any prefabs or components created to godot/yarnspinner/components.

finally, create a summary and instructions for the player to use the building system and simulation system in godot/_docs/building_system.md and godot/_docs/simulation_system.md.