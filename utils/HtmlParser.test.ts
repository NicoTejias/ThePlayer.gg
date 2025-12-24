import { describe, it, expect } from 'vitest';
import { parseEventLinkHtml } from './HtmlParser';

describe('HtmlParser - parseEventLinkHtml', () => {
    it('should parse EventLink HTML content', async () => {
        const htmlContent = `
            <table>
                <tr>
                    <td>1</td>
                    <td>Patricio Roman</td>
                    <td>9</td>
                    <td>0.66</td>
                    <td>0.55</td>
                    <td>0.44</td>
                </tr>
            </table>
        `;

        // Mock File object
        const file = {
            text: async () => htmlContent
        } as File;

        const { results } = await parseEventLinkHtml(file);

        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
            rank: 1,
            name: 'Patricio Roman',
            points: 9,
            wins: 3,
            losses: 0,
            draws: 0
        });
    });

    it('should handle empty or invalid HTML', async () => {
        const file = {
            text: async () => '<div>No table here</div>'
        } as File;

        const { results } = await parseEventLinkHtml(file);
        expect(results).toHaveLength(0);
    });
});
