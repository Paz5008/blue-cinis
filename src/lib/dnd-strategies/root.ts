import { arrayMove } from '@dnd-kit/sortable';
import { DropActionContext } from './types';

export function moveRootBlock(
    fromIndex: number,
    toIndex: number,
    context: DropActionContext
) {
    context.setBlocks(prev => {
        return arrayMove(prev, fromIndex, toIndex);
    });
    context.setDirty(true);
}
