import { validateBlock, TextBlockSchema, ImageBlockSchema, ContainerBlockSchema } from '@/lib/validation/block-schemas';
import { contentPayloadSchema } from '@/lib/cms/validation';
import { z } from 'zod';

console.log('--- Starting Block Validation Verification ---');

// 1. Test Valid Text Block
const validTextBlock = {
    id: 'block-1',
    type: 'text',
    content: 'Hello World',
    style: { color: 'red', marginTop: '10px' }
};
const res1 = validateBlock(validTextBlock);
if (res1.success) {
    console.log('✅ Valid Text Block passed.');
} else {
    console.error('❌ Valid Text Block failed:', res1.error);
}

// 2. Test Invalid Image Block (missing src)
const invalidImageBlock = {
    id: 'block-2',
    type: 'image',
    // src missing
    altText: 'A decorative image',
    decorative: true
};
const res2 = validateBlock(invalidImageBlock);
if (!res2.success) {
    console.log('✅ Invalid Image Block failed as expected.');
} else {
    console.error('❌ Invalid Image Block passed unexpectedly.');
}

// 3. Test Unknown Properties Stripping
const blockWithExtras = {
    id: 'block-3',
    type: 'text',
    content: 'Clean me',
    unknownProp: 'should be gone', // Should be stripped
    style: {
        color: 'blue',
        badStyle: 'remove me' // Should be stripped if strict? Zod object default is strip unknown keys. 
        // Wait, blockStyleSchema is z.record(z.string(), ...) which constructs a record for ANY string key with specific values.
        // So 'badStyle' might NOT be stripped if it matches the value union.
        // But 'unknownProp' on the block itself SHOULD be stripped because baseBlockSchema is a closed object.
    }
};
const res3 = validateBlock(blockWithExtras);
if (res3.success) {
    // @ts-ignore
    if (res3.data.unknownProp === undefined) {
        console.log('✅ Unknown property "unknownProp" stripped.');
    } else {
        console.error('❌ Unknown property NOT stripped.');
    }
} else {
    console.error('❌ Stripping test failed to parse:', res3.error);
}

// 4. Test Recursive Container
const recursiveBlock = {
    id: 'container-1',
    type: 'container',
    children: [
        {
            id: 'child-1',
            type: 'text',
            content: 'I am a child'
        },
        {
            id: 'child-2',
            type: 'container',
            children: [
                {
                    id: 'grandchild-1',
                    type: 'image',
                    src: 'https://example.com/img.jpg',
                    altText: 'Grandchild',
                    decorative: false
                }
            ]
        }
    ]
};
const res4 = validateBlock(recursiveBlock);
if (res4.success) {
    console.log('✅ Recursive Container Block passed.');
} else {
    console.error('❌ Recursive Container Block failed:', res4.error);
}

// 5. Test contentPayloadSchema integration
const payload = {
    blocksData: {
        'b1': { id: 'b1', type: 'text', content: 'Payload Test' }
    },
    layout: {
        desktop: ['b1']
    }
};
const res5 = contentPayloadSchema.safeParse(payload);
if (res5.success) {
    console.log('✅ contentPayloadSchema passed.');
} else {
    console.error('❌ contentPayloadSchema failed:', res5.error);
}

console.log('--- Verification Complete ---');
