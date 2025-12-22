import { createInterface } from "readline";

// Teal brand color for CLI output (RGB: 13, 148, 136)
const TEAL = "\x1b[38;2;13;148;136m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

/**
 * Interactive menu options
 */
interface MenuOption {
  key: string;
  label: string;
  description: string;
  command: string;
  example: string;
}

const MENU_OPTIONS: MenuOption[] = [
  {
    key: "1",
    label: "Generate QR Code",
    description: "Create a QR code from text or URL",
    command: "floimg qr",
    example: 'floimg qr "https://floimg.com" -o qr.png',
  },
  {
    key: "2",
    label: "Create Chart",
    description: "Generate bar, line, pie charts and more",
    command: "floimg chart",
    example: 'floimg chart bar --labels "A,B,C" --values "10,20,30"',
  },
  {
    key: "3",
    label: "Resize Image",
    description: "Resize an image to new dimensions",
    command: "floimg resize",
    example: "floimg resize input.jpg 800x600 -o output.jpg",
  },
  {
    key: "4",
    label: "Convert Format",
    description: "Convert between image formats (PNG, WebP, JPEG, etc.)",
    command: "floimg convert",
    example: "floimg convert input.png -o output.webp",
  },
  {
    key: "5",
    label: "Run Workflow",
    description: "Execute a YAML workflow file",
    command: "floimg run",
    example: "floimg run workflow.yaml",
  },
  {
    key: "6",
    label: "See All Commands",
    description: "View help for all available commands",
    command: "floimg --help",
    example: "floimg --help",
  },
];

/**
 * Display the interactive menu and handle user selection
 */
export async function showInteractiveMenu(): Promise<void> {
  console.log("");
  console.log("╭─────────────────────────────────────────────────────────╮");
  console.log("│                                                         │");
  console.log(`│   ${BOLD}${TEAL}floimg${RESET} - Universal Image Workflow Engine             │`);
  console.log("│                                                         │");
  console.log("╰─────────────────────────────────────────────────────────╯");
  console.log("");
  console.log(`${BOLD}What would you like to do?${RESET}`);
  console.log("");

  for (const option of MENU_OPTIONS) {
    console.log(`  ${TEAL}${option.key})${RESET} ${option.label}`);
    console.log(`     ${DIM}${option.description}${RESET}`);
  }

  console.log("");
  console.log(`  ${TEAL}q)${RESET} Quit`);
  console.log("");

  // Check if we're in a TTY
  if (!process.stdin.isTTY) {
    console.log("Run with a command, e.g.:");
    console.log('  floimg qr "https://example.com" -o qr.png');
    console.log("");
    console.log("Or see all options with: floimg --help");
    return;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question("Enter choice (1-6, or q): ", resolve);
  });
  rl.close();

  const choice = answer.trim().toLowerCase();

  if (choice === "q" || choice === "quit" || choice === "exit") {
    console.log("\nGoodbye!");
    return;
  }

  const selected = MENU_OPTIONS.find((o) => o.key === choice);

  if (!selected) {
    console.log("\nInvalid choice. Run floimg --help for all options.");
    return;
  }

  console.log("");
  console.log(`\x1b[1m${selected.label}\x1b[0m`);
  console.log("");
  console.log("Usage:");
  console.log(`  ${selected.command} [options]`);
  console.log("");
  console.log("Example:");
  console.log(`  ${selected.example}`);
  console.log("");
  console.log("For more options, run:");
  console.log(`  ${selected.command} --help`);
  console.log("");
}

/**
 * Check if we should show the interactive menu
 * (called when floimg is run with no arguments)
 */
export function shouldShowInteractiveMenu(args: string[]): boolean {
  // Show interactive menu if no command is provided
  // args[0] is 'node', args[1] is the script path
  // If there's a third argument, it's a command
  return args.length <= 2;
}
