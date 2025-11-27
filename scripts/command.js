import { system, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";
import { updateCamPos, getChunkStateString, toggleFreecam, toggleCameraView, teleportPlayerToCamera, toggleZoom } from "./main.js"
import { Waypoints } from "./waypoint.js"

system.beforeEvents.startup.subscribe(e => {
    const { customCommandRegistry: reg } = e;

    reg.registerCommand({
        name: "fc:tpcam",
        description: "teleport camera",
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: [
            { name: "position", type: CustomCommandParamType.Location },
        ],
    }, (origin, pos) => {

        const player = origin.sourceEntity
        try {
            updateCamPos(player, pos);
        } catch {
            player.sendMessage("§cError ocurred, you may not be in freecam mode yet.")
        }

    });
});

system.beforeEvents.startup.subscribe(e => {
    const { customCommandRegistry: reg } = e;

    reg.registerCommand({
        name: "fc:showstate",
        description: "Shows a given chunks state.",
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: [
            { name: "position", type: CustomCommandParamType.Location },
        ],
    }, (origin, pos) => {
        system.run( async() => {
            const player = origin.sourceEntity;
            const chunkState = await getChunkStateString(player, pos)
            player.sendMessage(`Chunk State: ${chunkState}`);
        });
    });
});


system.beforeEvents.startup.subscribe(e => {
    const { customCommandRegistry: reg } = e;

    reg.registerCommand({
        name: "fc:waypoint",
        description: "Shows a given chunks state.",
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: [
            { name: "Action", type: CustomCommandParamType.String },
        ],
        optionalParameters: [
            { name: "waypoint Name", type: CustomCommandParamType.String },
            { name: "position", type: CustomCommandParamType.Location },
        ],
    }, (origin, action, pointName, pos) => {
        const player = origin.sourceEntity;
        if (!player) return {status: CustomCommandStatus.Failure}

        try {
            switch(action.toString()) {
                case "go":
                    Waypoints.tp(player, pointName)
                    break
                case "add":
                    Waypoints.add(player, pointName, pos)
                    break
                case "remove":
                    Waypoints.remove(player, pointName)
                    break
                case "list":
                    Waypoints.list(player)
                    break
                default:
                    player.sendMessage("§cUnknown action. Use: go/add/remove/list");
            }
            return {status: CustomCommandStatus.Success}
        } catch(error) {
            player.sendMessage(`§c${error}`)
        }
    });
});

system.beforeEvents.startup.subscribe(e => {
    const { customCommandRegistry: reg } = e;
    reg.registerCommand({
        name: "fc:fc",
        description: "Activate/Deactivate freecam mode.",
        permissionLevel: CommandPermissionLevel.Any,
        optionalParameters: [
            { name: "additional parameters", type: CustomCommandParamType.String },
        ],
    }, (origin, param) => {
        const player = origin.sourceEntity;
        try {
            system.run( () => {
                if (param === "switch") {
                    toggleCameraView(player)
                } else { 
                    toggleFreecam(player); 
                }
            });
        } catch(error) {
            player.sendMessage(`§c${error}`)
        }
    });
});


system.beforeEvents.startup.subscribe(e => {
    const { customCommandRegistry: reg } = e;

    reg.registerCommand({
        name: "fc:tocam",
        description: "Teleport you to your freecam camera.",
        permissionLevel: CommandPermissionLevel.Admin,
    }, (origin) => {
        system.run( () => {
            const player = origin.sourceEntity;
            try {
                teleportPlayerToCamera(player)
            } catch(error) {
                player.sendMessage(`§c${error}`)
            }
        });
    });
});

system.beforeEvents.startup.subscribe(e => {
    const { customCommandRegistry: reg } = e;

    reg.registerCommand({
        name: "fc:z",
        description: "Zooms in your FOV.",
        permissionLevel: CommandPermissionLevel.Admin,
    }, (origin) => {
        system.run( () => {
            const player = origin.sourceEntity;
            try {
                toggleZoom(player)
            } catch(error) {
                player.sendMessage(`§c${error}`)
            }
        });
    });
});

