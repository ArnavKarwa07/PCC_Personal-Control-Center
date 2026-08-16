import React from 'react';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  if (!content.trim()) {
    return (
      <div style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', padding: 'var(--space-4)' }}>
        No content to preview. Start writing on the left or switch to Edit mode.
      </div>
    );
  }

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let listItems: string[] = [];
  let tableBuffer: string[] = [];

  const formatInlineMarkdown = (text: string): string => {
    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline Code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${key}`}>
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const flushTable = (key: number) => {
    if (tableBuffer.length >= 2) {
      const parseRow = (rowStr: string) =>
        rowStr
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());

      const headerRow = parseRow(tableBuffer[0]);
      // Skip row 1 if it's a divider line like |---|---|
      const isDivider = (str: string) => /^[:\-\|\s]+$/.test(str.trim());
      const bodyStartIndex = isDivider(tableBuffer[1]) ? 2 : 1;
      const bodyRows = tableBuffer.slice(bodyStartIndex).map(parseRow);

      renderedElements.push(
        <div key={`table-wrapper-${key}`} className="pcc-markdown-table-wrapper">
          <table className="pcc-markdown-table">
            <thead>
              <tr>
                {headerRow.map((h, hIdx) => (
                  <th key={hIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(h) }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (tableBuffer.length === 1) {
      // Fallback as simple paragraph if not a valid table structure
      renderedElements.push(
        <p key={`table-fallback-${key}`} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(tableBuffer[0]) }} />
      );
    }
    tableBuffer = [];
  };

  const flushAll = (key: number) => {
    flushList(key);
    flushTable(key);
  };

  lines.forEach((line, index) => {
    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        renderedElements.push(
          <div key={`code-wrapper-${index}`} className="pcc-markdown-code-wrapper">
            <pre>
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushAll(index);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Markdown Table lines starting with '|'
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList(index);
      tableBuffer.push(line);
      return;
    } else if (tableBuffer.length > 0) {
      flushTable(index);
    }

    // Headers
    if (line.startsWith('# ')) {
      flushList(index);
      renderedElements.push(
        <h1 key={`h1-${index}`} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} />
      );
    } else if (line.startsWith('## ')) {
      flushList(index);
      renderedElements.push(
        <h2 key={`h2-${index}`} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(3)) }} />
      );
    } else if (line.startsWith('### ')) {
      flushList(index);
      renderedElements.push(
        <h3 key={`h3-${index}`} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(4)) }} />
      );
    } else if (line.startsWith('> ')) {
      flushList(index);
      renderedElements.push(
        <blockquote key={`quote-${index}`} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} />
      );
    } else if (line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ')) {
      flushList(index);
      const isChecked = line.trim().startsWith('- [x] ');
      const taskText = line.trim().slice(6);
      renderedElements.push(
        <div key={`check-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <input type="checkbox" checked={isChecked} readOnly style={{ accentColor: 'var(--color-accent)' }} />
          <span
            style={{
              textDecoration: isChecked ? 'line-through' : 'none',
              color: isChecked ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            }}
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(taskText) }}
          />
        </div>
      );
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      listItems.push(line.trim().slice(2));
    } else if (line.trim() === '') {
      flushList(index);
    } else {
      flushList(index);
      renderedElements.push(
        <p key={`p-${index}`} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
      );
    }
  });

  flushAll(lines.length);

  return <div className="pcc-notes-preview">{renderedElements}</div>;
};
