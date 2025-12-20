# floimg-qr

QR code generator for floimg using the qrcode library.

## Installation

```bash
npm install @teamflojo/floimg @teamflojo/floimg-qr
```

## Usage

```typescript
import createClient from '@teamflojo/floimg';
import qr from '@teamflojo/floimg-qr';

const floimg = createClient();
floimg.registerGenerator(qr());

// Generate a QR code
const qrCode = await floimg.generate({
  generator: 'qr',
  params: {
    text: 'https://github.com/bcooke/floimg',
    width: 300,
    errorCorrectionLevel: 'H'
  }
});

// Save to filesystem or S3
const result = await floimg.save(qrCode, './output/qr-github.png');
// Or save to S3:
// const result = await floimg.save(qrCode, 's3://my-bucket/qr/github.png');
console.log(result.location);
```

## Examples

### Basic QR Code

```typescript
const qr = await floimg.generate({
  generator: 'qr',
  params: {
    text: 'Hello World!',
    width: 200
  }
});
```

### URL QR Code

```typescript
const qr = await floimg.generate({
  generator: 'qr',
  params: {
    text: 'https://example.com',
    width: 300,
    errorCorrectionLevel: 'H'  // High error correction
  }
});
```

### Custom Colors

```typescript
const qr = await floimg.generate({
  generator: 'qr',
  params: {
    text: 'Styled QR Code',
    width: 400,
    color: {
      dark: '#667eea',   // Purple
      light: '#ffffff'   // White background
    }
  }
});
```

### SVG Output

```typescript
const qr = await floimg.generate({
  generator: 'qr',
  params: {
    text: 'https://example.com',
    format: 'svg',
    width: 300
  }
});
```

### vCard Contact

```typescript
const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL:+1-555-1234
EMAIL:john@example.com
END:VCARD`;

const qr = await floimg.generate({
  generator: 'qr',
  params: {
    text: vcard,
    width: 350,
    errorCorrectionLevel: 'H'
  }
});
```

### WiFi Network

```typescript
const wifi = 'WIFI:T:WPA;S:MyNetwork;P:MyPassword;;';

const qr = await floimg.generate({
  generator: 'qr',
  params: {
    text: wifi,
    width: 300
  }
});
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | *required* | Text/URL to encode |
| `width` | number | 300 | Output width in pixels |
| `errorCorrectionLevel` | 'L'\|'M'\|'Q'\|'H' | 'M' | Error correction level |
| `margin` | number | 4 | Margin around QR code (in modules) |
| `color.dark` | string | '#000000' | Dark color |
| `color.light` | string | '#ffffff' | Light/background color |
| `format` | 'png'\|'svg' | 'png' | Output format |
| `version` | number | auto | QR code version (1-40) |
| `maskPattern` | number | auto | Mask pattern (0-7) |

## Error Correction Levels

- **L (Low)**: ~7% of codewords can be restored
- **M (Medium)**: ~15% of codewords can be restored (default)
- **Q (Quartile)**: ~25% of codewords can be restored
- **H (High)**: ~30% of codewords can be restored

Higher error correction allows QR codes to be read even if partially damaged, but requires more data.

## Configuration

```typescript
floimg.registerGenerator(qr({
  errorCorrectionLevel: 'H',  // Default to high error correction
  width: 400,                  // Default width
  margin: 5,                   // Default margin
  color: {
    dark: '#000000',
    light: '#ffffff'
  }
}));
```

## Use Cases

### Event Tickets

```typescript
const ticketData = JSON.stringify({
  event: 'Concert',
  seat: 'A12',
  code: 'ABC123'
});

const ticket = await floimg.generate({
  generator: 'qr',
  params: {
    text: ticketData,
    width: 300,
    errorCorrectionLevel: 'H'
  }
});
```

### Payment QR Codes

```typescript
const paymentUrl = 'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.01';

const payment = await floimg.generate({
  generator: 'qr',
  params: {
    text: paymentUrl,
    width: 350,
    errorCorrectionLevel: 'H'
  }
});
```

### App Store Links

```typescript
const appStore = 'https://apps.apple.com/app/id123456789';

const qr = await floimg.generate({
  generator: 'qr',
  params: {
    text: appStore,
    width: 250,
    margin: 6
  }
});
```

## QR Code Library Documentation

This generator uses the qrcode library directly. For advanced options:
- https://github.com/soldair/node-qrcode
- https://github.com/soldair/node-qrcode#qr-code-options

## Performance

- **Generation time**: ~5-50ms depending on data size
- **Memory**: Minimal (~1-5MB)
- **No external dependencies**: Pure Node.js

## Limitations

- Maximum data capacity depends on QR version and error correction level
- QR Version 40 with Low error correction can store ~2,953 bytes
- Higher error correction = less data capacity

## License

MIT

## See Also

- [floimg](https://github.com/bcooke/floimg) - Core library
- [qrcode](https://github.com/soldair/node-qrcode) - QR code library
