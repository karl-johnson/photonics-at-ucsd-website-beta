// Warns (on `npm run dev` and `npm run build`) when a diagram master or source video clip has
// changed since it was converted, or was never converted. Only reads files; conversion is done by
// `npm run diagrams` and `npm run media`.
import { fileURLToPath } from 'node:url';
import { diagramStatus, findMasters } from '../../scripts/diagram-status.mjs';
import { clipStatus, findClips } from '../../scripts/media-status.mjs';

export default function assetCheck() {
  return {
    name: 'asset-check',
    hooks: {
      'astro:config:setup': ({ config, logger }) => {
        const root = fileURLToPath(config.root);
        const statuses = [...findMasters(root).map(diagramStatus), ...findClips(root).map(clipStatus)];
        for (const status of statuses) {
          if (status.state !== 'ok') logger.warn(status.message);
        }
      },
    },
  };
}
