import { world, system } from "@minecraft/server"

const settingsKey = "tech_freecam"
let saved;

system.run( () => {
    const storedValues = world.getDynamicProperty(settingsKey)
    if (storedValues) {
        saved = JSON.parse(storedValues)   
    }
});

export function getStoredValues() {
    return saved;
}

export function setStoredValues(values) {
    world.setDynamicProperty(settingsKey, JSON.stringify(values)) 
}
