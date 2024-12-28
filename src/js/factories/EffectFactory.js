import BaseFactory from './BaseFactory';
import PlayerEffect from '../models/PlayerEffects/PlayerEffect';

export default class EffectFactory extends BaseFactory {
    constructor() {
        super();
    }

    // Override to enforce PlayerEffect validation
    register(typeName, classRef) {
        if (!(classRef.prototype instanceof PlayerEffect)) {
            throw new Error(
                `Cannot register "${typeName}". It must be a subclass of PlayerEffect.`
            );
        }
        super.register(typeName, classRef); // Call the base method for registration
    }

    // Custom method for creating effects from JSON
    createEffectFromJSON(json) {
        const { type, args } = json;     
        // Convert the array of objects into an array of values, preserving the order
        const resolvedArgs = args.map(argObj => Object.values(argObj)[0]);

        return this.create(type, ...resolvedArgs); // Spread the arguments in the correct order
    }
}
