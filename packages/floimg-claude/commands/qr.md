---
description: Generate a QR code for a URL, text, or data
allowed-tools: Bash
---

# QR Code Generation

Generate a QR code for: "$ARGUMENTS"

## Instructions

1. **Extract the content** to encode from the user's request:
   - URL (https://...)
   - Plain text
   - WiFi credentials (format: `WIFI:T:WPA;S:NetworkName;P:Password;;`)
   - Contact info, email, phone, etc.

2. **Run the floimg CLI** to generate the QR code:

```bash
npx -y @teamflojo/floimg qr "CONTENT_HERE" -o ./qr-output.png
```

**Optional flags:**

- `--width 500` - Size in pixels (default 300)
- `--error-correction H` - Error correction level: L, M, Q, H (default M)
- `--format svg` - Output format: png or svg

3. **Report the result** to the user:
   - Confirm the file path where the QR code was saved
   - Mention what content is encoded
   - Offer to resize or save to a different location if needed

## Examples

**Simple URL:**

```bash
npx -y @teamflojo/floimg qr "https://floimg.com" -o ./qr-floimg.png
```

**WiFi credentials:**

```bash
npx -y @teamflojo/floimg qr "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;" -o ./wifi-qr.png
```

**High resolution with max error correction:**

```bash
npx -y @teamflojo/floimg qr "https://floimg.com" --width 500 --error-correction H -o ./qr-large.png
```

## Content Types

| Type       | Format                                  |
| ---------- | --------------------------------------- |
| URL        | `https://example.com`                   |
| Plain text | Any text string                         |
| WiFi       | `WIFI:T:WPA;S:NetworkName;P:Password;;` |
| Email      | `mailto:user@example.com`               |
| Phone      | `tel:+1234567890`                       |
| SMS        | `sms:+1234567890?body=Hello`            |

## Error Correction Levels

| Level | Recovery | Use When                     |
| ----- | -------- | ---------------------------- |
| L     | 7%       | Clean environments, max data |
| M     | 15%      | General use (recommended)    |
| Q     | 25%      | Some expected damage         |
| H     | 30%      | Logos/images will overlay    |
