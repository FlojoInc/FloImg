import { Command } from "commander";

export const pluginsCommand = new Command("plugins")
  .description("Manage and view available imgflo plugins")
  .action(async () => {
    console.log("imgflo Plugins");
    console.log("==============\n");

    // Try to load each known plugin
    const knownPlugins = [
      {
        name: "imgflo-quickchart",
        generator: "quickchart",
        description: "Chart.js charts (bar, line, pie, etc.)",
        docs: "https://github.com/bcooke/imgflo/tree/main/packages/imgflo-quickchart",
      },
      {
        name: "imgflo-d3",
        generator: "d3",
        description: "D3 data visualizations (custom charts, complex viz)",
        docs: "https://github.com/bcooke/imgflo/tree/main/packages/imgflo-d3",
      },
      {
        name: "imgflo-mermaid",
        generator: "mermaid",
        description: "Mermaid diagrams (flowcharts, sequence, gantt)",
        docs: "https://github.com/bcooke/imgflo/tree/main/packages/imgflo-mermaid",
      },
      {
        name: "imgflo-qr",
        generator: "qr",
        description: "QR code generation",
        docs: "https://github.com/bcooke/imgflo/tree/main/packages/imgflo-qr",
      },
      {
        name: "imgflo-screenshot",
        generator: "screenshot",
        description: "Website screenshots (Playwright)",
        docs: "https://github.com/bcooke/imgflo/tree/main/packages/imgflo-screenshot",
      },
    ];

    console.log("Built-in generators:");
    console.log("  ✓ shapes    - Simple SVG shapes and gradients");
    console.log("  ✓ openai    - DALL-E image generation (requires API key)\n");

    console.log("Available plugin generators:");

    const installedPlugins: string[] = [];
    const notInstalledPlugins: string[] = [];

    for (const plugin of knownPlugins) {
      try {
        await import(plugin.name);
        console.log(`  ✓ ${plugin.generator.padEnd(12)} - ${plugin.description}`);
        installedPlugins.push(plugin.name);
      } catch {
        console.log(`  ✗ ${plugin.generator.padEnd(12)} - ${plugin.description} (not installed)`);
        notInstalledPlugins.push(plugin.name);
      }
    }

    if (notInstalledPlugins.length > 0) {
      console.log("\n💡 To install plugins:");
      console.log(`   npm install ${notInstalledPlugins.join(' ')}`);
      console.log("\n   Or install all at once:");
      console.log("   npm install imgflo-quickchart imgflo-d3 imgflo-mermaid imgflo-qr imgflo-screenshot");
    }

    console.log("\n📖 Documentation:");
    console.log("   https://github.com/bcooke/imgflo");
  });
