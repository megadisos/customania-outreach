// App aparte, sin nada más en el proyecto: este middleware protege TODO el sitio.
import { panelMiddleware } from './lib/panel/middleware';

export const onRequest = panelMiddleware;
