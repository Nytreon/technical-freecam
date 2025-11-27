import { system, world } from "@minecraft/server"
import {} from "./command.js"

const lastForwardTap = new Map(); 
const forwardButtonState = new Map(); 
export const playerMap = {};
const doubleTapWindow = 5; 
let currentTick = 0; 
const sneakTapTimes = new Map(); 
const sneakTapWindow = 10; 

system.runInterval(() => {
    currentTick++;
})

function addToMap(player) {
    let map = {};
    map = player;
    map.pos = player.location;
    map.fastFly = false;
    map.chunkState = "§aLoaded";
    map.toggleView = 0
    playerMap[player.name] = map;
}

function removeFromMap(player) {
    if (!playerMap[player.name]) return;
    delete playerMap[player.name];
}

world.afterEvents.playerButtonInput.subscribe((eventData) => {
    if (eventData.button === "Sneak") {
        const { player } = eventData;
        const playerId = player.id;
        let tapTimes = sneakTapTimes.get(playerId) || [];
        tapTimes.push(currentTick);
        tapTimes = tapTimes.filter(t => currentTick - t <= sneakTapWindow);
        sneakTapTimes.set(playerId, tapTimes);

        if (tapTimes.length >= 6) {
            toggleFreecam(player)
            sneakTapTimes.set(playerId, []);
        }
    }
});

function toggleMovement(player, mode) {
    const cmd = "inputpermission set @s"
    const e = "enabled"
    const d = "disabled"
    if (mode) {
        player.runCommand(`${cmd} lateral_movement ${d}`);
        player.runCommand(`${cmd} jump ${d}`);
        player.runCommand(`${cmd} sneak ${d}`);
    } else {
        player.runCommand(`${cmd} lateral_movement ${e}`);
        player.runCommand(`${cmd} jump ${e}`);
        player.runCommand(`${cmd} sneak ${e}`);
    }
}

export function toggleFreecam(player) {
    if (!playerMap[player.name]) {
        addToMap(player)
        toggleMovement(player, 1)
    }
    else if (playerMap[player.name]) {
        removeFromMap(player)
        toggleMovement(player, 0)
        system.runTimeout(() => {
            player.runCommand("camera @s clear");
        }, 2);
    }
}
export function toggleCameraView(player) {
    const playerObj = playerMap[player.name]
    if (playerObj) {
        if (playerObj.toggleView) {
            toggleMovement(player, 1) 
            playerMap[player.name].toggleView = 0
        } else {
            toggleMovement(player, 0) 
            system.runTimeout(() => {
                player.runCommand("camera @s clear");
            }, 2);
            playerMap[player.name].toggleView = 1
        }
    } else {
        throw new Error("You were not in freecam.")
    }
}

function translateValue(rot) {
    return {
        h: -Math.atan2(rot.x, rot.z) * 180 / Math.PI,
        v: -rot.y * 90,
    }
}

async function getChunkState(player, pos) {
    const dimension = player.dimension;
    const block = dimension.getBlock({ x: pos.x, y: 0, z: pos.z });
    const playerLocation = {x: Math.round(player.location.x), y: 0, z: Math.round(player.location.z)}
    try {
        block.typeId
        return 1;
    } catch {
        const entity = dimension.spawnEntity("minecraft:small_fireball", playerLocation) 
        entity.teleport({x: pos.x, y: -1000, z: pos.z})
        return await new Promise(resolve => {
            system.runTimeout(() => {
                try {
                    entity.remove();
                    resolve(0);
                } catch {

                    resolve(-1);
                }
            }, 1);
        });
    }
}

async function updateChunkDetails(player, pos) {
    if (pos != undefined) { 
        playerMap[player.name].chunkState = await getChunkStateString(player, pos);
    }
}



export function updateCamPos(player, pos) {
    playerMap[player.name].pos = pos;
    system.runTimeout(() => {
        updateChunkDetails(player, pos)
    }, 1)
}

export async function getChunkStateString(player, pos) {
    const rawState = await getChunkState(player, pos)
    let state;
    switch (rawState.toString()) {
    case "1":
        state = "§aLoaded"
        break;
    case "0":
        state = "§eUnloaded"
        break
    case "-1":
        state = "§4Invalid"
        break
    }
    return state;
}

function displayChunkState(player) {
    const camPos = playerMap[player.name]?.pos
    const state = playerMap[player.name]?.chunkState;
    const x = camPos.x.toFixed(4);
    const y = camPos.y.toFixed(4);
    const z = camPos.z.toFixed(4);
    player.runCommand(`title @s actionbar §7Chunk state: ${state} \n§7Pos: ${x} ${y} ${z}`)
}

export function teleportPlayerToCamera(player) {
    if (playerMap[player.name]) {
        const pos = playerMap[player.name].pos;
        player.runCommand(`tp @s ${pos.x} ${pos.y} ${pos.z}`)
    } else {
        throw new Error("You are not in freecam.")
    }
}

function handleRelativeDirection(player, direction, distance) {
    const currentPos = playerMap[player.name]?.pos
    const dir = player.getViewDirection();
    const newPos = { x: currentPos.x, y: currentPos.y, z: currentPos.z };
    switch (direction) {
    case "f":
        newPos.x += dir.x * distance;
        newPos.z += dir.z * distance;
        break;
    case "b":
        newPos.x -= dir.x * distance;
        newPos.z -= dir.z * distance;
        break;
    case "l":
        newPos.x += -dir.z * distance;
        newPos.z += dir.x * distance;
        break;
    case "r":
        newPos.x += dir.z * distance;
        newPos.z += -dir.x * distance;
        break;
    case "u":
        newPos.y += distance;
        break;
    default:
        newPos.y -= distance;
    }
    updateCamPos(player, newPos);
    updateChunkDetails(player, newPos)
}

let fcinterval = system.runInterval(() => {

    let players = world.getAllPlayers()

    for (let i = 0; i < players.length; i++) {
        const player = players[i]
        if (playerMap[player.name] == 0) continue;
        const dirRaw = player.getViewDirection();
        const dir = translateValue(dirRaw)

        if (playerMap[player.name]) {
            
            if (playerMap[player.name].toggleView) {
                continue;
            }

            const movementSpeed = playerMap[player.name].fastFly ? 8 : 2;
            let movementVector = player.inputInfo.getMovementVector();
            const isForwardPressed = movementVector.y > 0;

            let camPos = playerMap[player.name]?.pos


            player.runCommand(`camera @s set minecraft:free ease 0.15 linear pos ${camPos.x} ${camPos.y} ${camPos.z} rot ${dir.v} ${dir.h}`);
            displayChunkState(player);


            if (isForwardPressed && !forwardButtonState.get(player.name)) {
                forwardButtonState.set(player.name, true); 

                const lastTap = lastForwardTap.get(player.name) || 0;
                const timeSinceLastTap = currentTick - lastTap;

                if (timeSinceLastTap > 0 && timeSinceLastTap <= doubleTapWindow) {
                    playerMap[player.name].fastFly = true;
                }

                lastForwardTap.set(player.name, currentTick);
            }
            if (!isForwardPressed && forwardButtonState.get(player.name)) {
                forwardButtonState.set(player.name, false); 
            }

            if (movementVector.y === 0 && movementVector.x === 0 &&
                player.inputInfo.getButtonState("Sneak") !== "Pressed" &&
                playerMap[player.name].fastFly) {
                playerMap[player.name].fastFly = false;
            }

            // Forwards
            if (movementVector.y > 0 && playerMap[player.name]) {
                handleRelativeDirection(player, "f", 0.4 * movementSpeed);
            }

            // Backwards
            if (movementVector.y < 0 && playerMap[player.name]) {
                handleRelativeDirection(player, "b", 0.4 * movementSpeed);
            }

            // Right
            if (movementVector.x < 0 && playerMap[player.name]) {
                handleRelativeDirection(player, "l", 0.4 * movementSpeed);
            }
            // Left
            if (movementVector.x > 0 && playerMap[player.name]) {
                handleRelativeDirection(player, "r", 0.4 * movementSpeed);
            }

            // Up
            let jumpControl = player.inputInfo.getButtonState("Jump");
            if (jumpControl === "Pressed" && playerMap[player.name]) {
                handleRelativeDirection(player, "u", 0.4 * movementSpeed);

            }
            // Down
            let crouchControl = player.inputInfo.getButtonState("Sneak")
            if (crouchControl === "Pressed") {
                handleRelativeDirection(player, "d", 0.4 * movementSpeed);
            }

            if (!playerMap[player.name]) {
                forwardButtonState.delete(player.name);
                lastForwardTap.delete(player.name);
                system.clearRun(fcinterval);
            }
        }
    }
})

