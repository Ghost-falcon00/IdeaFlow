/**
 * MarkdownRenderer - نمایش Markdown در چت
 * پشتیبانی از: Bold, Italic, Headers, Lists, Tables, Code
 */

import './MarkdownRenderer.css';

function MarkdownRenderer({ content }) {
    if (!content) return null;

    // Parse markdown to HTML
    const parseMarkdown = (text) => {
        let html = text;

        // Escape HTML (security)
        html = html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Code blocks (```code```)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
            return `<pre class="md-code-block"><code>${code.trim()}</code></pre>`;
        });

        // Inline code (`code`)
        html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');

        // Bold (**text** or __text__)
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

        // Italic (*text* or _text_)
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');

        // Horizontal rule
        html = html.replace(/^---$/gm, '<hr class="md-hr" />');

        // Tables
        html = parseTable(html);

        // Unordered lists
        html = html.replace(/^[-*] (.+)$/gm, '<li class="md-li">$1</li>');
        html = html.replace(/(<li class="md-li">.*<\/li>\n?)+/g, '<ul class="md-ul">$&</ul>');

        // Numbered lists
        html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-li-num">$1</li>');
        html = html.replace(/(<li class="md-li-num">.*<\/li>\n?)+/g, '<ol class="md-ol">$&</ol>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>');

        // Paragraphs (double newline)
        html = html.replace(/\n\n/g, '</p><p class="md-p">');
        html = `<p class="md-p">${html}</p>`;

        // Single newlines to <br>
        html = html.replace(/\n/g, '<br />');

        // Clean up empty paragraphs
        html = html.replace(/<p class="md-p"><\/p>/g, '');
        html = html.replace(/<p class="md-p"><br \/>/g, '<p class="md-p">');

        return html;
    };

    const parseTable = (html) => {
        // Match table rows
        const tableRegex = /(\|.+\|[\r\n]+)+/g;

        return html.replace(tableRegex, (tableMatch) => {
            const rows = tableMatch.trim().split('\n').filter(r => r.trim());
            if (rows.length < 2) return tableMatch;

            let tableHtml = '<table class="md-table"><thead><tr>';

            // Header row
            const headers = rows[0].split('|').filter(c => c.trim());
            headers.forEach(h => {
                tableHtml += `<th>${h.trim()}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';

            // Skip separator row (|---|---|)
            const dataRows = rows.slice(2);

            dataRows.forEach(row => {
                if (row.includes('---')) return;
                tableHtml += '<tr>';
                const cells = row.split('|').filter(c => c.trim());
                cells.forEach(c => {
                    tableHtml += `<td>${c.trim()}</td>`;
                });
                tableHtml += '</tr>';
            });

            tableHtml += '</tbody></table>';
            return tableHtml;
        });
    };

    return (
        <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
        />
    );
}

export default MarkdownRenderer;
