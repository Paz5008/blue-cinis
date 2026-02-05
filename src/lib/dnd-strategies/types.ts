import { Block } from '@/types/cms';
import { DragMeta } from '@/components/dashboard/editor/types';

export interface DropActionContext {
    setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
    setDirty: (dirty: boolean) => void;
    setSelectedChild: (selected: any) => void;
    setSelectedIndex: (index: number | null) => void;
    setLiveStatus: (status: string) => void;
}

export type { DragMeta };
