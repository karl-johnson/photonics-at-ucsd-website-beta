// Warns (on `npm run dev` and `npm run build`) when a diagram master has changed since it was
// converted, or was never converted. Only reads files; conversion is done by `npm run diagrams`.
import { fileURLToPath } from 'node:url';
import { diagramStatus, findMasters } from '../../scripts/diagram-status.mjs';

export default function diagramCheck() {
  return {
    name: 'diagram-check',
    hooks: {
      'astro:config:setup': ({ config, logger }) => {
        const root = fileURLToPath(config.root);
        for (const master of findMasters(root)) {
          const status = diagramStatus(master);
          if (status.state !== 'ok') logger.warn(status.message);
        }
      },
    },
  };
}
