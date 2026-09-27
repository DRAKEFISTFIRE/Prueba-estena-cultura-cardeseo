import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: "npm --prefix frontend run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true
    }
  ]
});
