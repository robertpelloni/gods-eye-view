import { defaultSourceRoot } from './common/source-root.js';
import { handleHudSummary } from './openai/hud-summary.js';
import { createDebugLogHandler } from './openai/debug-log.js';
import { createRealtimeTokenHandler } from './openai/realtime.js';
import { createSpatialAnswerHandler } from './openai/spatial-answer.js';

/**
 * Vite plugin: OpenAI Realtime ephemeral client secret.
 *
 * Keeps the selected cloud credential server-side while the browser connects
 * to the Realtime API over WebRTC with a short-lived secret.
 */
function openAiRealtimeProxy({
  sourceRoot = defaultSourceRoot,
  annotationGuidance,
  realtime = {},
} = {}) {
  const oauthLogin = createCodexOAuthLogin(realtime);
  function install(middlewares) {
    middlewares.use('/api/openai/hud-summary', handleHudSummary);
    middlewares.use('/api/openai/spatial-answer', createSpatialAnswerHandler());

    middlewares.use(
      '/api/realtime/debug-log',
      sameSiteGated(createDebugLogHandler({ sourceRoot })),
    );

    middlewares.use(
      '/api/realtime/token',
      sameSiteGated(
        createRealtimeTokenHandler({ ...realtime, annotationGuidance }),
      ),
    );

    middlewares.use(
      '/api/realtime/oauth-status',
      sameSiteGated(createRealtimeOAuthStatusHandler({ oauthLogin })),
    );

    middlewares.use(
      '/api/realtime/oauth-login',
      sameSiteGated(createRealtimeOAuthLoginHandler({ oauthLogin })),
    );
  }

  return {
    name: 'openai-realtime-proxy',
    configureServer(server) {
      install(server.middlewares);
      server.httpServer?.once('close', oauthLogin.dispose);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
      server.httpServer?.once('close', oauthLogin.dispose);
    },
    closeBundle: oauthLogin.dispose,
  };
}

export { openAiRealtimeProxy };
