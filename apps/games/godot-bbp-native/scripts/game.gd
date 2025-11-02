extends Node2D

var innings := 3
var current_inning := 1

func _ready():
    print("Sandlot Sluggers native stub loaded. Extend this scene with gameplay logic.")

func reset_game():
    current_inning = 1
