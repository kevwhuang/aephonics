import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/e2e',
    webServer: {
        command: 'bun run preview',
        port: 4321,
        reuseExistingServer: true,
    },
});
