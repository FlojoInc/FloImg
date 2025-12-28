# Design Principles

The philosophy driving floimg's architecture and decisions.

---

## 1. Glue, Not the Engine

floimg orchestrates existing libraries rather than reimplementing them.

- **QuickChart** renders charts (we don't rebuild Chart.js)
- **Sharp** processes images (we don't rebuild ImageMagick)
- **Playwright** takes screenshots (we don't rebuild a browser)
- **OpenAI** generates AI images (we don't train models)

**Why:** These tools are mature, well-tested, and actively maintained. floimg's value is in the unified abstraction, not in recreating wheels.

---

## 2. Pass-Through Pattern

Accept native library formats directly. Don't abstract away the underlying tool.

```typescript
// floimg passes Chart.js config directly to QuickChart
await floimg.generate({
  generator: "quickchart",
  params: {
    type: "bar", // Chart.js type
    data: {
      /* pure Chart.js config */
    },
    options: {
      /* pure Chart.js options */
    },
  },
});
```

**Why:**

- Users can leverage existing Chart.js/Mermaid/D3 knowledge
- Full library capabilities are available, not a neutered subset
- Documentation from underlying libraries applies directly
- No need to learn floimg-specific abstractions for each generator

---

## 3. Opt-In Complexity

Install only what you need. The core package stays lean.

```bash
# Minimal: just core (shapes + OpenAI)
npm install floimg

# Add what you need
npm install floimg-quickchart   # +300KB for charts
npm install floimg-mermaid      # +2MB for diagrams
npm install floimg-screenshot   # +200MB for Playwright
```

**Why:**

- Core stays under 10MB
- No bloat from unused dependencies
- Heavy dependencies (Playwright: 200MB+) are isolated
- Plugins can be versioned and updated independently

---

## 4. Interface Agnostic

The same workflow works across all interfaces.

| Interface      | Same Workflow                                     |
| -------------- | ------------------------------------------------- |
| JavaScript SDK | `floimg.generate({...})`                          |
| CLI            | `floimg generate --generator qr --params '{...}'` |
| YAML           | `steps: [{ generate: {...} }]`                    |
| MCP            | `mcp__floimg__generate({...})`                    |

**Why:**

- Learn once, use everywhere
- Switch interfaces without rewriting logic
- Test locally (CLI), deploy in code (SDK), expose to LLMs (MCP)

---

## 5. LLM-Ready, Not LLM-Dependent

floimg works great with LLMs via MCP, but doesn't require them.

**With LLM (via MCP):**

> User: "Create a QR code for example.com"
> Claude: _calls floimg MCP tools automatically_

**Without LLM (direct code):**

```typescript
await floimg.generate({ generator: "qr", params: { text: "example.com" } });
```

**Why:**

- Developers can use floimg without AI infrastructure
- CI/CD pipelines don't need LLM calls
- Deterministic workflows for production reliability
- LLM integration is an option, not a requirement

---

## 6. Explicit Over Implicit

floimg doesn't guess. You specify what you want.

**What floimg does NOT do:**

- Infer image dimensions from context
- Guess output formats
- Assume default destinations
- Parse natural language in parameters

**What floimg does:**

- Execute exactly what you specify
- Return predictable results
- Fail fast with clear errors
- Provide sensible defaults only where documented

**Why:**

- Reproducible outputs
- Debuggable workflows
- No "magic" that breaks unexpectedly
- LLMs handle the ambiguity; floimg handles the execution

---

## 7. Composable Primitives

Every operation produces an ImageBlob that can feed into the next.

```typescript
const chart = await floimg.generate({...});      // → ImageBlob
const resized = await floimg.transform(chart, {...}); // → ImageBlob
const captioned = await floimg.transform(resized, {...}); // → ImageBlob
await floimg.save(captioned, 's3://...');        // → SaveResult
```

**Why:**

- Chain any number of operations
- No special "pipeline" syntax required
- Each step is independently testable
- Works naturally with async/await

---

## 8. Deterministic Execution

Same inputs always produce the same outputs.

```typescript
// This will always produce identical results
await floimg.generate({
  generator: "qr",
  params: { text: "hello", width: 300 },
});
```

**Why:**

- Reliable for production use
- Testable workflows
- Cache-friendly outputs
- Predictable behavior for LLM integrations

---

## 9. Open Source and Self-Hostable

floimg is MIT licensed, fully open source, and designed to run anywhere.

**Core commitment:**

- No vendor lock-in
- No required cloud services
- Run locally, on your server, in CI/CD, anywhere
- Full functionality without paying anyone

**Favoring free and open tools:**

| Generator    | Underlying Tool           | Cost              |
| ------------ | ------------------------- | ----------------- |
| `quickchart` | Chart.js (open source)    | Free              |
| `mermaid`    | Mermaid (open source)     | Free              |
| `qr`         | node-qrcode (open source) | Free              |
| `screenshot` | Playwright (open source)  | Free              |
| `shapes`     | SVG (standard)            | Free              |
| `openai`     | OpenAI API                | Paid (user's key) |

**Why:**

- Developers can build products without ongoing costs
- No surprise bills or rate limits from floimg
- Paid services (OpenAI, cloud storage) are opt-in and use your own credentials
- Community can contribute, fork, and extend freely

**The philosophy:** floimg helps you build awesome products. If you want to use paid services like OpenAI or AWS S3, that's your choice with your keys. The core workflows—charts, diagrams, QR codes, image transforms—cost nothing to run.

---

## Anti-Patterns We Avoid

| Anti-Pattern            | Why We Avoid It                     |
| ----------------------- | ----------------------------------- |
| Natural language params | Non-deterministic, LLM's job        |
| Over-abstraction        | Loses power of underlying libraries |
| Monolithic packages     | Forces unused dependencies          |
| Magic defaults          | Unpredictable behavior              |
| Tight LLM coupling      | Limits use without AI               |
| Required paid services  | Creates barriers to adoption        |
| Vendor lock-in          | Limits where you can run            |

---

## Standing on the Shoulders of Giants

FloImg exists because of these amazing tools. We wrap them, we don't replace them. We're grateful they exist.

| Plugin            | Powered By                                                                    | Why It's Amazing                  |
| ----------------- | ----------------------------------------------------------------------------- | --------------------------------- |
| floimg-quickchart | [Chart.js](https://www.chartjs.org/) via [QuickChart](https://quickchart.io/) | Powerful, flexible charting       |
| floimg-mermaid    | [Mermaid.js](https://mermaid.js.org/)                                         | Diagrams from text                |
| floimg-d3         | [D3.js](https://d3js.org/)                                                    | The gold standard for data viz    |
| floimg-screenshot | [Playwright](https://playwright.dev/)                                         | Reliable browser automation       |
| floimg-qr         | [qrcode](https://www.npmjs.com/package/qrcode)                                | Simple, effective QR generation   |
| floimg-openai     | [OpenAI DALL-E](https://openai.com/dall-e-3)                                  | State-of-the-art image generation |
| floimg-ollama     | [Ollama](https://ollama.ai/)                                                  | Local AI for everyone             |
| floimg-stability  | [Stability AI](https://stability.ai/)                                         | Stable Diffusion excellence       |
| floimg-replicate  | [Replicate](https://replicate.com/)                                           | Access to thousands of models     |
| Core transforms   | [Sharp](https://sharp.pixelplumbing.com/)                                     | Lightning-fast image processing   |

**Our commitment:** Every plugin passes through the full power of its underlying library. We don't abstract, limit, or neuter. Their docs are your docs.

---

## Related Documents

- [[Why-floimg-Exists]] — The problems these principles solve
- [[Workflow-Abstraction]] — Technical implementation of these principles
- [[Plugin-Architecture]] — How the plugin system embodies opt-in complexity
