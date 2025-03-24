# CopperX

## Overview

CopperX is a Telegram bot that provides a convenient interface to the CopperX financial services platform. The bot allows users to manage their wallets, make transfers, check balances, and perform other financial operations directly from Telegram.

## Prerequisites

- Node 20.x or higher
- PNPM package manager
- Mysql/MariaDb database
- Telegram Bot Token (from Botfather)
- CopperX API Base Url

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Jonathanthedeveloper/copperx.git
cd copperx
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Add Configuration

> Create a .env file in the root directory with the following variables:

```env
# Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Database Configuration
DATABASE_HOST=<your_database_host>
DATABASE_PORT=3306
DATABASE_NAME=<your_database_name>
DATABASE_USER=<your_database_username>
DATABASE_PASSWORD=<your_database_password>

# CopperX API Configuration
COPPERX_API_URL=https://api.copperx.io

# Optional Configuration
PORT=3000
NODE_ENV=development
```

### 4. Running the Bot

#### a. Development Mode

```bash
# start bot with hot-reload
pnpm start:dev
```

#### b. Production Mode

```bash
# Build the application
pnpm build

# Start in production mode
pnpm start:prod
```

## Documentation

For detailed command reference, please refer to the [Command Reference](COMMAND_REFERENCE.md)
