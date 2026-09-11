import { describe, expect, it } from 'bun:test';
import { applyTokens, markdownToHtml } from './markdown';

describe('markdownToHtml', () => {
    it('renders headings, emphasis, and lists', () => {
        const html = markdownToHtml(
            '# Fajr\n\nIt begins at **dawn** and ends at *sunrise*.\n\n- Starts: twilight\n- Ends: sunrise\n',
        );
        expect(html).toContain('<h1>Fajr</h1>');
        expect(html).toContain('<strong>dawn</strong>');
        expect(html).toContain('<em>sunrise</em>');
        expect(html).toContain('<li>Starts: twilight</li>');
        expect(html).toContain('<li>Ends: sunrise</li>');
    });

    it('renders block quotes', () => {
        expect(markdownToHtml('> Speak good or remain silent.')).toBe(
            '<blockquote>Speak good or remain silent.</blockquote>',
        );
    });

    it('escapes HTML in the source', () => {
        expect(markdownToHtml('# <script>')).toBe('<h1>&lt;script&gt;</h1>');
    });
});

describe('applyTokens', () => {
    it('fills {{time}} style placeholders', () => {
        expect(applyTokens('In at **{{time}}**.', { time: '05:12' })).toBe('In at **05:12**.');
    });

    it('drops unknown tokens', () => {
        expect(applyTokens('{{missing}}', {})).toBe('');
    });
});
