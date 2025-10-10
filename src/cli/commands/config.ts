import { Command } from "commander";
import { saveGlobalConfig, loadConfig } from "../../config/loader.js";
import { join } from "path";
import { homedir } from "os";

export const configCommand = new Command("config")
  .description("Manage imgflo configuration")
  .addCommand(
    new Command("set")
      .description("Set a configuration value")
      .argument("<key>", "Configuration key (e.g., s3.bucket, s3.region)")
      .argument("<value>", "Configuration value")
      .action(async (key: string, value: string) => {
        try {
          const config = await loadConfig();

          // Parse the key path (e.g., "s3.bucket" -> store.s3.bucket)
          const parts = key.split(".");

          if (parts[0] === "s3") {
            if (!config.store) config.store = {};
            if (!config.store.s3) config.store.s3 = { default: "s3" };

            if (parts[1] === "bucket") {
              (config.store.s3 as any).bucket = value;
            } else if (parts[1] === "region") {
              (config.store.s3 as any).region = value;
            } else {
              (config.store.s3 as any)[parts[1]] = value;
            }

            if (!config.store.default) {
              config.store.default = "s3";
            }
          } else if (parts[0] === "openai") {
            if (!config.ai) config.ai = {};
            if (!config.ai.openai) config.ai.openai = {};

            if (parts[1] === "apiKey" || parts[1] === "key") {
              (config.ai.openai as any).apiKey = value;
            } else {
              (config.ai.openai as any)[parts[1]] = value;
            }

            if (!config.ai.default) {
              config.ai.default = "openai";
            }
          } else {
            console.error(`Unknown configuration key: ${key}`);
            console.error('Valid keys: s3.bucket, s3.region, openai.apiKey');
            process.exit(1);
          }

          await saveGlobalConfig(config);
          console.log(`✓ Configuration saved: ${key} = ${value.includes('key') || value.includes('secret') ? '***' : value}`);
          console.log(`  Location: ${join(homedir(), ".imgflo", "config.json")}`);
        } catch (error) {
          console.error("Error saving configuration:", error instanceof Error ? error.message : error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command("get")
      .description("Get a configuration value")
      .argument("[key]", "Configuration key (omit to show all)")
      .action(async (key?: string) => {
        try {
          const config = await loadConfig();

          if (!key) {
            console.log("Current configuration:");
            console.log(JSON.stringify(config, null, 2));
            return;
          }

          const parts = key.split(".");
          let value: any = config;

          for (const part of parts) {
            if (value && typeof value === 'object') {
              value = value[part];
            } else {
              value = undefined;
              break;
            }
          }

          if (value !== undefined) {
            console.log(`${key} = ${JSON.stringify(value, null, 2)}`);
          } else {
            console.log(`Configuration key not found: ${key}`);
          }
        } catch (error) {
          console.error("Error reading configuration:", error instanceof Error ? error.message : error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command("init")
      .description("Initialize imgflo configuration interactively")
      .action(async () => {
        console.log("imgflo configuration setup");
        console.log("=========================\n");

        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const question = (prompt: string): Promise<string> => {
          return new Promise((resolve) => {
            rl.question(prompt, resolve);
          });
        };

        try {
          const config: any = {};

          console.log("S3 Configuration (optional - press Enter to skip):");
          const s3Bucket = await question("  S3 Bucket name: ");
          if (s3Bucket) {
            const s3Region = await question("  S3 Region [us-east-1]: ") || "us-east-1";
            config.store = {
              default: "s3",
              s3: {
                bucket: s3Bucket,
                region: s3Region
              }
            };
          }

          console.log("\nOpenAI Configuration (optional - press Enter to skip):");
          const openaiKey = await question("  OpenAI API Key: ");
          if (openaiKey) {
            config.ai = {
              default: "openai",
              openai: {
                apiKey: openaiKey
              }
            };
          }

          if (Object.keys(config).length === 0) {
            console.log("\nNo configuration provided. Exiting.");
            rl.close();
            return;
          }

          await saveGlobalConfig(config);

          console.log("\n✓ Configuration saved to:", join(homedir(), ".imgflo", "config.json"));
          console.log("\nYou can now use imgflo without setting environment variables!");
          console.log("\nTry it:");
          console.log("  imgflo generate --provider svg --params '{\"type\":\"gradient\"}' --out test.svg");

          rl.close();
        } catch (error) {
          rl.close();
          console.error("\nError during configuration:", error instanceof Error ? error.message : error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command("path")
      .description("Show configuration file location")
      .action(() => {
        console.log("Configuration file locations (in order of priority):");
        console.log("  1. ./imgflo.config.ts (current directory)");
        console.log("  2. ./.imgflorc.json (current directory)");
        console.log("  3. ~/.imgflo/config.json (global)");
        console.log("  4. Environment variables");
        console.log("\nGlobal config location:", join(homedir(), ".imgflo", "config.json"));
      })
  );
