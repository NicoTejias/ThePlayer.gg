import { describe, it, expect } from 'vitest';
import { parseEventLinkText } from './TextParser';

describe('TextParser - parseEventLinkText', () => {
    it('should correctly parse standard EventLink text format', () => {
        const text = `1   Patricio Roman   9   0.66   0.55   0.44   3-0-0\n2   Carlos Torrico   6   0.55   0.44   0.33   2-1-0`;
        const { results } = parseEventLinkText(text);

        expect(results).toHaveLength(2);
        expect(results[0]).toEqual({
            rank: 1,
            name: 'Patricio Roman',
            points: 9,
            wins: 3,
            losses: 0,
            draws: 0
        });
        expect(results[1].name).toBe('Carlos Torrico');
        expect(results[1].wins).toBe(2);
    });

    it('should handle names with spaces and special characters', () => {
        const text = `1   "Morales U, Carlos"   12   0.77   0.66   0.55   4-0-0`;
        const { results } = parseEventLinkText(text);

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('"Morales U, Carlos"');
        expect(results[0].points).toBe(12);
        expect(results[0].wins).toBe(4);
    });

    it('should return empty array for invalid text', () => {
        const text = `This is not a valid standings list`;
        const { results } = parseEventLinkText(text);
        expect(results).toHaveLength(0);
    });
});
