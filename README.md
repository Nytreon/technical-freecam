# **Technical Freecam**
**A freecam for technical players**







# Features:

-No entity anchor

-Chunk state information

-Quality of life commands

-Complete freecam without loading chunks

-Allows you to add waypoints to teleport to so you only have to type a position once 

-Multiplayer supported


# Waypoints
 
 Waypoints allow you to set a point and then teleport your camera to it later without having to remember the coordinate. Waypoints are persistent and exist past relog.

 

# How to use

Crouch three times to enter freecam

Crouch three times to exit freecam

`/tpcam (position)` to teleport the camera to a given location

`/tocam` Teleport you to your freecam camera.

`/showstate (position)` to show a chunk's state at a given position

`/fc` toggles you between freecam and the default camera

`/fc switch` toggles you between freecam and the default camera but it saves your freecam position

`/waypoint add (waypoint name) (position)` adds a waypoint at the given position by the given name

`/waypoint remove (waypoint name)` removes a waypoint you created

`/waypoint list` lists your created waypoints

`/waypoint go (waypoint name)` teleports your freecam to a given waypoint

 

# Chunk States

The chunk states that are detected are

-Loaded: standard chunks in your simulation distance.

-Unloaded: Chunks outside your simulation distance but still exist.

-Invalid: Chunks that do not exist currently in memory.
