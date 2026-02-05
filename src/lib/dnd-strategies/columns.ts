import { Block } from '@/types/cms';
import { DropActionContext, DragMeta } from './types';

export function moveBlockIntoColumns(
    blockId: string,
    columnsChildId: string,
    columnIndex: number,
    activeMeta: DragMeta | null,
    context: DropActionContext
) {
    let updated = false;
    let targetContainerIndex = -1;

    context.setBlocks(prev => {
        const arr = [...prev];
        let moved: Block | null = null;

        if (activeMeta?.type === 'root') {
            if (activeMeta.index < 0 || activeMeta.index >= arr.length) return prev;
            [moved] = arr.splice(activeMeta.index, 1);
        } else if (activeMeta?.type === 'container-child') {
            const cont = arr[activeMeta.parentIndex] as any;
            if (!cont || cont.type !== 'container') return prev;
            const children: Block[] = Array.isArray(cont.children) ? [...cont.children] : [];
            if (activeMeta.childIndex < 0 || activeMeta.childIndex >= children.length) return prev;
            [moved] = children.splice(activeMeta.childIndex, 1);
            if (!moved) return prev;
            arr[activeMeta.parentIndex] = { ...cont, children };
        }
        // Note: Moving from one column to another is not fully implemented in the original monolithic function
        // but the logic here handles grabbing the block from root or container-child source.

        if (!moved) return prev;

        const targetIdx = arr.findIndex((b: any) => b.id === columnsChildId);
        if (targetIdx === -1) {
            // Rollback if target not found (simplistic rollback: only for root source context?)
            // Actually if we fail to insert, we lose data if we don't rollback properly.
            // But the original code didn't have robust rollback for all cases.
            // We'll mimic original behavior: if target missing, return prev (which effectively cancels drop but might be buggy if splice happened)
            // Ideally we would clone deep at start, then return clone or prev.
            // The current implementation spreads array so it is a partial clone.
            // If we return prev here, the splice on 'arr' is discarded.
            return prev;
        }
        const targetBlock = arr[targetIdx] as any;
        if (targetBlock.type !== 'columns' || !Array.isArray(targetBlock.columns)) return prev;
        const newCols = [...targetBlock.columns];
        if (!Array.isArray(newCols[columnIndex])) newCols[columnIndex] = [];
        newCols[columnIndex] = [...newCols[columnIndex], moved as Block];
        arr[targetIdx] = { ...targetBlock, columns: newCols };
        targetContainerIndex = targetIdx;
        updated = true;
        return arr;
    });

    if (updated) {
        context.setDirty(true);
        if (targetContainerIndex >= 0) context.setSelectedIndex(targetContainerIndex);
        context.setSelectedChild(null);
        context.setLiveStatus('Bloc déplacé dans la colonne');
    }
}
