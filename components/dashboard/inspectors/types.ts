import type { Block } from '@/types/cms';

export interface TextCommandApi {
    focus: () => void;
    apply: (command: string, value?: string) => void;
    setAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
}

export type InspectorTab = 'content' | 'settings' | 'styles';

export interface InspectorProps<T extends Block = Block> {
    block: T;
    onUpdate: (block: Block) => void;
    tab: InspectorTab;
    setMediaPicker: (options: { onSelect: (url: string) => void }) => void;
    textCommandApi?: TextCommandApi;
    oeuvreOptions?: { id: string; title: string; imageUrl?: string }[];
    pageKey?: string;
    isBanner?: boolean;
    device?: 'desktop' | 'mobile';
    setSelectedChild?: (sel: { parentId: string; childId: string } | null) => void;
}
