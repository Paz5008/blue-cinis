/**
 * AI Collaboration Demo File
 * This file contains demo @paz comments to test the Rubber Duck system.
 */

// @paz: crée une fonction qui génère un ID unique pour les messages inter-IA
export function generateMessageId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
// Example utility functions
export function formatTimestamp(date: Date): string {
    return date.toISOString();
}

export function truncateMessage(msg: string, maxLength = 100): string {
    return msg.length > maxLength ? msg.slice(0, maxLength) + '...' : msg;
}
