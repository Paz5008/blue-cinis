import { Block } from '@/types/cms';
import { arrayMove } from '@dnd-kit/sortable';
import { DropActionContext, DragMeta } from './types';

export function moveContainerChild(
    activeMeta: Extract<DragMeta, { type: 'container-child' }>,
    overMeta: Extract<DragMeta, { type: 'container-child' }>,
    context: DropActionContext
) {
    let updated = false;
    context.setBlocks(prev => {
        const result = [...prev];
        const fromContainer = result[activeMeta.parentIndex] as any;
        const toContainer = result[overMeta.parentIndex] as any;
        if (!fromContainer || fromContainer.type !== 'container') return prev;
        if (!toContainer || toContainer.type !== 'container') return prev;

        if (activeMeta.parentIndex === overMeta.parentIndex) {
            const children: Block[] = Array.isArray(fromContainer.children) ? fromContainer.children : [];
            if (activeMeta.childIndex < 0 || activeMeta.childIndex >= children.length) return prev;
            const newChildren = arrayMove(children, activeMeta.childIndex, overMeta.childIndex);
            result[activeMeta.parentIndex] = { ...fromContainer, children: newChildren };
            updated = true;
            return result;
        }

        const fromChildren: Block[] = Array.isArray(fromContainer.children) ? [...fromContainer.children] : [];
        if (activeMeta.childIndex < 0 || activeMeta.childIndex >= fromChildren.length) return prev;
        const [moved] = fromChildren.splice(activeMeta.childIndex, 1);
        if (!moved) return prev;

        const toChildren: Block[] = Array.isArray(toContainer.children) ? [...toContainer.children] : [];
        const insertIndex = Math.max(0, Math.min(overMeta.childIndex, toChildren.length));
        toChildren.splice(insertIndex, 0, moved);

        result[activeMeta.parentIndex] = { ...fromContainer, children: fromChildren };
        result[overMeta.parentIndex] = { ...toContainer, children: toChildren };
        updated = true;
        return result;
    });

    if (updated) {
        context.setDirty(true);
        context.setSelectedChild(null);
        context.setLiveStatus('Bloc déplacé');
    }
}

export function moveContainerChildToRoot(
    activeMeta: Extract<DragMeta, { type: 'container-child' }>,
    overMeta: Extract<DragMeta, { type: 'root' }>,
    context: DropActionContext
) {
    let updated = false;
    context.setBlocks(prev => {
        const arr = [...prev];
        const fromContainer = arr[activeMeta.parentIndex] as any;
        if (!fromContainer || fromContainer.type !== 'container') return prev;

        const fromChildren: Block[] = Array.isArray(fromContainer.children) ? [...fromContainer.children] : [];
        if (activeMeta.childIndex < 0 || activeMeta.childIndex >= fromChildren.length) return prev;
        const [moved] = fromChildren.splice(activeMeta.childIndex, 1);
        if (!moved) return prev;

        arr[activeMeta.parentIndex] = { ...fromContainer, children: fromChildren };

        const insertAt = Math.max(0, Math.min(overMeta.index, arr.length));
        arr.splice(insertAt, 0, moved);
        updated = true;
        return arr;
    });

    if (updated) {
        context.setDirty(true);
        context.setSelectedChild(null);
        context.setSelectedIndex(null);
        context.setLiveStatus('Bloc déplacé vers la page');
    }
}

export function insertRootIntoContainer(
    activeMeta: Extract<DragMeta, { type: 'root' }>,
    overMeta: Extract<DragMeta, { type: 'container-child' }>,
    context: DropActionContext
) {
    let updated = false;
    let targetIndexAfterMove = -1;
    context.setBlocks(prev => {
        const arr = [...prev];
        if (activeMeta.index < 0 || activeMeta.index >= arr.length) return prev;
        const [moved] = arr.splice(activeMeta.index, 1);
        if (!moved) return prev;

        const targetIndex = overMeta.parentIndex - (activeMeta.index < overMeta.parentIndex ? 1 : 0);
        const container = arr[targetIndex] as any;
        if (!container || container.type !== 'container') {
            // rollback
            arr.splice(Math.max(0, Math.min(activeMeta.index, arr.length)), 0, moved);
            return prev;
        }
        const children: Block[] = Array.isArray(container.children) ? [...container.children] : [];
        const insertIndex = Math.max(0, Math.min(overMeta.childIndex, children.length));
        children.splice(insertIndex, 0, moved as Block);
        arr[targetIndex] = { ...container, children };
        updated = true;
        targetIndexAfterMove = targetIndex;
        return arr;
    });

    if (updated) {
        context.setDirty(true);
        if (targetIndexAfterMove >= 0) context.setSelectedIndex(targetIndexAfterMove);
        context.setSelectedChild(null);
        context.setLiveStatus('Bloc déplacé dans la section');
    }
}
