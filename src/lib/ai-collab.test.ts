/**
 * Demo test for Shadow TDD
 * When this file is saved, Shadow TDD should detect it
 * and trigger Paz to write the implementation in ai-collab.ts
 */

import { describe, it, expect } from 'vitest';
import { generateMessageId, formatTimestamp, truncateMessage } from './ai-collab';

describe('AI Collaboration Utils', () => {
    describe('generateMessageId', () => {
        it('should generate a unique string ID', () => {
            const id = generateMessageId();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(8);
        });

        it('should generate different IDs on each call', () => {
            const id1 = generateMessageId();
            const id2 = generateMessageId();
            expect(id1).not.toBe(id2);
        });
    });

    describe('formatTimestamp', () => {
        it('should format a date to ISO string', () => {
            const date = new Date('2025-01-01T12:00:00Z');
            const result = formatTimestamp(date);
            expect(result).toBe('2025-01-01T12:00:00.000Z');
        });
    });

    describe('truncateMessage', () => {
        it('should return full message if under limit', () => {
            const msg = 'Hello';
            expect(truncateMessage(msg, 100)).toBe('Hello');
        });

        it('should truncate and add ellipsis if over limit', () => {
            const msg = 'This is a very long message that should be truncated';
            const result = truncateMessage(msg, 20);
            expect(result).toBe('This is a very long ...');
            expect(result.length).toBe(23);
        });
    });
});
