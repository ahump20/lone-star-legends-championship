extends Node

func _ready():
    var button = get_parent().get_node("Button")
    button.pressed.connect(_on_start)

func _on_start():
    get_tree().change_scene_to_file("res://scenes/Game.tscn")
