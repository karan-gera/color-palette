import path from "path"
import fs from "fs"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: "/color-palette/",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "serve-landing",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = (req.url ?? "").split("?")[0]
          if (url === "/color-palette/landing" || url === "/color-palette/landing/") {
            res.setHeader("Content-Type", "text/html")
            res.end(fs.readFileSync(path.resolve(__dirname, "public/landing/index.html"), "utf-8"))
            return
          }
          next()
        })
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
