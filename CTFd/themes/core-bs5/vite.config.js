const { resolve } = require("path");
const { defineConfig } = require("vite");
const copy = require("rollup-plugin-copy");

module.exports = defineConfig({
  base: "/themes/core-bs5/static/",
  resolve: {
    alias: {
      "~": resolve(__dirname, "./node_modules/"),
      core: resolve(__dirname, "../core/assets/js/"),
    }
  },
  build: {
    manifest: true,
    outDir: "static",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // CSS (flattened for CTFd expectations)
        "core-style": resolve(__dirname, "assets/css/core.scss"),
        "fonts": resolve(__dirname, "assets/css/fonts.scss"),
        "main": resolve(__dirname, "assets/css/main.scss"),
        "challenge-board": resolve(__dirname, "assets/css/challenge-board.scss"),
        "codemirror": resolve(__dirname, "assets/css/codemirror.scss"),

        // JS core utilities
        "core": resolve(__dirname, "assets/js/CTFd.js"),
        "helpers": resolve(__dirname, "assets/js/helpers.js"),
        "utils": resolve(__dirname, "assets/js/utils.js"),
        "api": resolve(__dirname, "assets/js/api.js"),
        "config": resolve(__dirname, "assets/js/config.js"),
        "patch": resolve(__dirname, "assets/js/patch.js"),
        "fetch": resolve(__dirname, "assets/js/fetch.js"),
        "events": resolve(__dirname, "assets/js/events.js"),
        "times": resolve(__dirname, "assets/js/times.js"),
        "graphs": resolve(__dirname, "assets/js/graphs.js"),
        "styles": resolve(__dirname, "assets/js/styles.js"),
        "ezq": resolve(__dirname, "assets/js/ezq.js"),
        "vendor.bundle": resolve(__dirname, "assets/js/vendor.js"),

        // JS Pages (mapped under js/pages/)
        "pages/main": resolve(__dirname, "assets/js/pages/main.js"),
        "pages/challenges": resolve(__dirname, "assets/js/pages/challenges.js"),
        "pages/notifications": resolve(__dirname, "assets/js/pages/notifications.js"),
        "pages/scoreboard": resolve(__dirname, "assets/js/pages/scoreboard.js"),
        "pages/settings": resolve(__dirname, "assets/js/pages/settings.js"),
        "pages/setup": resolve(__dirname, "assets/js/pages/setup.js"),
        "pages/style": resolve(__dirname, "assets/js/pages/style.js"),
        "pages/stats": resolve(__dirname, "assets/js/pages/stats.js"),
        "pages/events": resolve(__dirname, "assets/js/pages/events.js"),
        "pages/teams/private": resolve(__dirname, "assets/js/pages/teams/private.js"),
      },

      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name.startsWith("pages/")) {
            return "js/[name].min.js"; // puts pages in js/pages/
          }
          return "js/[name].min.js";   // core scripts
        },
        chunkFileNames: "js/[name].min.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "css/[name].min.css";
          }
          return "assets/[name].[ext]";
        },
      },

      plugins: [
        copy({
          targets: [
            {
              src: "node_modules/@fortawesome/fontawesome-free/webfonts/**/*",
              dest: "static/webfonts",
            },
            {
              src: "node_modules/@fontsource/lato/files/**/*400*-normal*",
              dest: "static/webfonts",
            },
            {
              src: "node_modules/@fontsource/lato/files/**/*700*-normal*",
              dest: "static/webfonts",
            },
            {
              src: "node_modules/@fontsource/raleway/files/**/*500*-normal*",
              dest: "static/webfonts",
            },
            {
              src: "node_modules/@ctfdio/ctfd-js/assets/images/**",
              dest: "static/img",
            },
            {
              src: "node_modules/@ctfdio/ctfd-js/assets/sounds/**",
              dest: "static/sounds",
            },
          ],
          hook: "writeBundle",
          copyOnce: true,
          flatten: true,
        }),
      ],
    },
  },
});
