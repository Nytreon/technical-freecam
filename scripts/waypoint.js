import { system } from "@minecraft/server"
import { playerMap, updateCamPos } from "./main.js"
import { getStoredValues, setStoredValues } from "./storageManager.js";

class WaypointManager {
    constructor() {
        this.data = {};
    }
    ensurePlayer(player) {
        if (!this.data[player.name]) {
            this.data[player.name] = {};
        }
    }
    list(player) {
        this.ensurePlayer(player);
        const points = this.data[player.name];
        if (Object.keys(points).length === 0) {
            player.sendMessage("You have no waypoints.");
            return;
        }
        for (const [name, point] of Object.entries(points)) {
            player.sendMessage(`§a${name} : §f${JSON.stringify(point)}`);
        }
    }
    add(player, pointName, pos) {
        this.ensurePlayer(player);
        if (this.data[player.name][pointName]) throw new Error("Waypoint already exists.");
        this.data[player.name][pointName] = pos;
        setStoredValues(this.data);
        player.sendMessage(`Waypoint '${pointName}' §aadded§r.`);
    }
    remove(player, pointName) {
        this.ensurePlayer(player);
        const points = this.data[player.name];
        if (points[pointName]) {
            delete points[pointName];
            setStoredValues(this.data);
            player.sendMessage(`Waypoint '${pointName}' §4removed§r.`);
        } else {
            throw new Error("That waypoint does not exist.");
        }
    }
    get(player, pointName) {
        this.ensurePlayer(player);
        return this.data[player.name][pointName] || null;
    }
    tp(player, pointName) {
        const pos = this.get(player, pointName);
        const playerObj = playerMap[player.name];
        if (!playerObj) {
            throw new Error("You must be in freecam to use waypoints.");
        }
        if (!pos) {
            throw new Error(`Waypoint '${pointName}' does not exist.`);
        }
        updateCamPos(player, pos);
    }
}

export const Waypoints = new WaypointManager();

system.runTimeout(() => {
    const storedValues = getStoredValues();
    if (storedValues) {
        Waypoints.data = storedValues;
    }
}, 1);

