// Markdown-level conventions for demo pages (runs after remark-directive):
//   :::note[Title] … :::   → boxed NOTE callout
//   [ref](url)             → small mono "[ref]" citation link
// Any other `:name` text that remark-directive picked up by accident (e.g. "ratio 1:x")
// is turned back into plain text so writers never lose characters.
import { visit, SKIP } from 'unist-util-visit';

export default function remarkDemo() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (node.type === 'containerDirective' && node.name === 'note') {
        node.data = { ...node.data, hName: 'aside', hProperties: { className: ['note'] } };
        const label = node.children[0]?.data?.directiveLabel ? node.children[0] : null;
        if (label) {
          label.data = { ...label.data, hName: 'div', hProperties: { className: ['note-title'] } };
        } else {
          node.children.unshift({
            type: 'paragraph',
            data: { hName: 'div', hProperties: { className: ['note-title'] } },
            children: [],
          });
        }
        return;
      }

      if (
        (node.type === 'textDirective' || node.type === 'leafDirective' || node.type === 'containerDirective') &&
        parent &&
        typeof index === 'number'
      ) {
        // Unknown directive: restore it as text.
        const prefix = node.type === 'textDirective' ? ':' : node.type === 'leafDirective' ? '::' : ':::';
        const restored = [{ type: 'text', value: prefix + node.name }];
        if (node.type === 'textDirective' && node.children.length) {
          restored.push({ type: 'text', value: '[' }, ...node.children, { type: 'text', value: ']' });
        } else {
          restored.push(...node.children);
        }
        parent.children.splice(index, 1, ...restored);
        return [SKIP, index + restored.length];
      }

      if (
        node.type === 'link' &&
        node.children.length === 1 &&
        node.children[0].type === 'text' &&
        node.children[0].value.trim().toLowerCase() === 'ref'
      ) {
        node.children[0].value = '[ref]';
        node.data = { ...node.data, hProperties: { className: ['cite'] } };
      }
    });
  };
}
