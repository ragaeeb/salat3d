export function applyTokens(text: string, tokens: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => tokens[key] ?? '');
}

function inline(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export function markdownToHtml(markdown: string): string {
    const escaped = markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html: string[] = [];
    let inList = false;

    const closeList = () => {
        if (inList) {
            html.push('</ul>');
            inList = false;
        }
    };

    for (const raw of escaped.split('\n')) {
        const line = raw.trim();
        if (!line) {
            closeList();
            continue;
        }
        if (line.startsWith('# ')) {
            closeList();
            html.push(`<h1>${inline(line.slice(2))}</h1>`);
            continue;
        }
        if (line.startsWith('## ')) {
            closeList();
            html.push(`<h2>${inline(line.slice(3))}</h2>`);
            continue;
        }
        if (line.startsWith('&gt; ')) {
            closeList();
            html.push(`<blockquote>${inline(line.slice(5))}</blockquote>`);
            continue;
        }
        if (line.startsWith('- ')) {
            if (!inList) {
                html.push('<ul>');
                inList = true;
            }
            html.push(`<li>${inline(line.slice(2))}</li>`);
            continue;
        }
        closeList();
        html.push(`<p>${inline(line)}</p>`);
    }
    closeList();
    return html.join('');
}
