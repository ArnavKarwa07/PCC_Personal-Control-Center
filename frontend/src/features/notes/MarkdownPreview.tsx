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

  lines.forEach((line, index) => {
    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        renderedElements.push(
          <pre key={`code-${index}`}>
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushList(index);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
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

  flushList(lines.length);

  return <div className="pcc-notes-preview">{renderedElements}</div>;
};
