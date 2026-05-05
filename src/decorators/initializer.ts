const initSet = new Set<() => unknown>();

export function Initializer(): MethodDecorator {
    return (target, _key, descriptor) => {
        const prop = descriptor.value;
        if (typeof prop === 'function') {
            initSet.add(prop.bind(target));
        }
    };
}

export async function runInitializers() {
    await Promise.all(Array.from(initSet).map((fn) => fn()));
}
