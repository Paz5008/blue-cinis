import type { Block } from '@/types/cms';

export function useQuickSections(props: any) {
    return {
        buildSectionBlocks: (section: any) => [] as Block[],
        quickSectionLookup: new Map<string, any>(),
        families: [] as any[]
    };
}
