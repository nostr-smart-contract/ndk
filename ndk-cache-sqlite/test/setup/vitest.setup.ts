// Global test setup for ndk-cache-sqlite
import { beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Clean up test databases before and after each test
beforeEach(() => {
    cleanupTestDatabases();
});

afterEach(() => {
    cleanupTestDatabases();
});

function cleanupTestDatabases() {
    const testDbPattern = /test.*\.db$/;
    const currentDir = process.cwd();

    try {
        const files = fs.readdirSync(currentDir);
        for (const file of files) {
            if (testDbPattern.test(file)) {
                const filePath = path.join(currentDir, file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }
    } catch (e) {
        // Ignore cleanup errors
    }
}
