# iGaia - Gaia Online Native Flash Client

A lightweight, frameless desktop client for **Gaia Online** that uses **real native Adobe Pepper Flash Player** (32.0.0.465) instead of Ruffle.

**Warning:** This client uses the discontinued Adobe Flash Player, which has known security vulnerabilities. Use **only** on Gaia Online and at your own risk. It is recommended to run it in a sandbox or virtual machine.

## Features

- True Native Flash support (Pepper Flash PPAPI)
- Custom draggable toolbar with quick Gaia links
- Frameless native-looking window
- Blocks navigation to non-Gaia sites for safety
- Works with old minigames and Flash content that Ruffle may struggle with
- Portable .exe available

## Requirements

- Windows 10 or 11 (64-bit)
- `pepflashplayer64.dll` (Flash 32.0.0.465 x64)

## Project Structure
iGaia/
├── main.js
├── index.html
├── preload.js
├── package.json
├── plugins/
│   └── pepflashplayer64.dll
├── gaia-icon.ico (optional)
└── README.md


## Installation & Build Instructions

### 1. Prerequisites

- Install **[Node.js](https://nodejs.org/)** (LTS version recommended)
- Place your `pepflashplayer64.dll` into the `plugins/` folder

### 2. Setup

```bash
# Clone or download the repository
git clone https://github.com/yourusername/iGaia.git
cd iGaia

# Install dependencies
npm install
```

### 3. Running in Development

```bash
npm start
```

### 4. Building the Standalone .exe

```bash
# Build Portable version (recommended - single file)
npm run dist:portable

# Or build Installer version
npm run dist
```

The output will be in the dist/ folder:

Portable: iGaia-Portable.exe
Installer: iGaia Setup 1.0.0.exe

## Dependencies

### Runtime/Build Dependencies

electron: 9.4.4 (required for Native Flash support)
electron-builder: ^24.13.3 (for packaging into .exe)

Both are listed in devDependencies in package.json.

# IMPORTANT SECURITY NOTE:

This porduct is only designed for use with GaiaOnline. Use outside of Gaia may result in your computer being attacked due to Vulnerabilities in Flash.
