import { ClonerOrchestrator } from './cloner-orchestrator'

// Use globalThis to persist the instance across module reloads in development
const globalForOrchestrator = globalThis as unknown as {
    clonerOrchestrator: ClonerOrchestrator | undefined
}

export const getOrchestrator = (): ClonerOrchestrator => {
    if (!globalForOrchestrator.clonerOrchestrator) {
        console.log('Creating new ClonerOrchestrator instance')
        globalForOrchestrator.clonerOrchestrator = new ClonerOrchestrator()
    } else {
        // console.log('Reusing existing ClonerOrchestrator instance')
    }
    return globalForOrchestrator.clonerOrchestrator
}
