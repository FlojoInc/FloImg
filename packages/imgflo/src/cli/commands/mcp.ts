import { Command } from "commander";
import { homedir } from "os";
import { join, resolve } from "path";
import { writeFile, mkdir, readFile } from "fs/promises";

export const mcpCommand = new Command("mcp")
  .description("MCP (Model Context Protocol) integration helpers");

mcpCommand
  .command("install")
  .description("Generate MCP configuration for Claude Code")
  .option("--global", "Install to global Claude Code config")
  .option("--output <path>", "Output path for MCP config snippet")
  .action(async (options) => {
    console.log("imgflo MCP Setup");
    console.log("================\n");

    // Get the path to the built MCP server
    // When imgflo is installed globally, use require.resolve to find it
    let serverPath: string;
    try {
      serverPath = require.resolve("imgflo/dist/mcp/server.js");
    } catch {
      // Fallback to local path if not found via require.resolve
      serverPath = resolve(join(process.cwd(), "node_modules/imgflo/dist/mcp/server.js"));
    }

    const mcpConfig = {
      mcpServers: {
        imgflo: {
          command: "node",
          args: [serverPath],
          env: {
            // These will be read from the user's environment or .env
            OPENAI_API_KEY: "${OPENAI_API_KEY}",
            AWS_ACCESS_KEY_ID: "${AWS_ACCESS_KEY_ID}",
            AWS_SECRET_ACCESS_KEY: "${AWS_SECRET_ACCESS_KEY}",
            AWS_REGION: "${AWS_REGION}",
            S3_BUCKET: "${S3_BUCKET}",
          },
        },
      },
    };

    if (options.output) {
      // Write to specified file
      await writeFile(options.output, JSON.stringify(mcpConfig, null, 2));
      console.log(`✓ MCP configuration written to: ${options.output}\n`);
    } else {
      // Just print to console
      console.log("Add this to your Claude Code MCP configuration:\n");
      console.log(JSON.stringify(mcpConfig, null, 2));
      console.log("\n");
    }

    console.log("📍 Claude Code MCP config locations:");
    console.log("   - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json");
    console.log("   - Windows: %APPDATA%\\Claude\\claude_desktop_config.json");
    console.log("   - Linux: ~/.config/claude/claude_desktop_config.json");

    console.log("\n💡 Next steps:");
    console.log("   1. Set up your credentials (AWS, OpenAI) in environment or .env");
    console.log("   2. Add the config above to your Claude Code config file");
    console.log("   3. Restart Claude Code");
    console.log("   4. Try: 'Create a QR code for https://example.com'");

    console.log("\n📖 Documentation:");
    console.log("   https://github.com/bcooke/imgflo/blob/main/packages/imgflo/docs/guides/MCP_SERVER.md");
  });

mcpCommand
  .command("test")
  .description("Test MCP server with inspector (opens browser)")
  .action(async () => {
    console.log("Starting MCP Inspector...\n");
    console.log("This will open a web interface to test imgflo's MCP tools.");
    console.log("Press Ctrl+C to stop.\n");

    const { spawn } = await import("child_process");

    // Get the path to the built MCP server
    let serverPath: string;
    try {
      serverPath = require.resolve("imgflo/dist/mcp/server.js");
    } catch {
      // Fallback to local path if not found via require.resolve
      serverPath = resolve(join(process.cwd(), "node_modules/imgflo/dist/mcp/server.js"));
    }

    const inspector = spawn("npx", ["@modelcontextprotocol/inspector", "node", serverPath], {
      stdio: "inherit",
      env: process.env,
    });

    inspector.on("close", (code) => {
      console.log(`\nMCP Inspector exited with code ${code}`);
    });
  });
