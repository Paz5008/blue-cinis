export function validateBlock(block: any): any {
    if (!block || typeof block !== 'object' || !block.type) {
        return null;
    }
    return block;
}
