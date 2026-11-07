import { resolve } from "node:path";
import { defineConfig } from "vite";

const root = process.cwd();

export default defineConfig({
  root,
  plugins: [
    {
      name: "brasaland-demo-route",
      enforce: "post",
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          const [pathname, query] = (request.url ?? "").split("?", 2);
          if (pathname === "/demo" || pathname === "/demo/") {
            request.url = `/src/index.html${query ? `?${query}` : ""}`;
          }
          next();
        });
      },
      generateBundle(_options, bundle) {
        const demoPage = bundle["src/index.html"];
        if (demoPage?.type === "asset") {
          this.emitFile({
            type: "asset",
            fileName: "demo/index.html",
            source: demoPage.source,
          });
          delete bundle["src/index.html"];
        }
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        landing: resolve(root, "index.html"),
        application: resolve(root, "application.html"),
        demo: resolve(root, "src/index.html"),
      },
    },
  },
});