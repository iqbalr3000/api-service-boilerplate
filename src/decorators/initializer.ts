const initSet = new Set<() => unknown>();

export function Initializer(): MethodDecorator {
    return (target, _key, descriptor) => {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Initializer decorator can only be applied to methods');
        }
        initSet.add((descriptor.value as () => unknown).bind(target));
    };
}

export async function runInitializers() {
    await Promise.all(Array.from(initSet).map((fn) => fn()));
}
