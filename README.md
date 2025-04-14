
# KeyGuard Vault Keeper

KeyGuard Vault Keeper is a secure password management application that helps you store and organize your credentials in an encrypted format. All your sensitive data is encrypted with a master password that only you know, ensuring your information remains private and secure.

## Project info

**URL**: https://lovable.dev/projects/aeeab6e3-fbd6-4861-b38f-5a35732b64b8

## Features

- **Secure Password Storage**: All passwords are encrypted using AES-256 encryption
- **SQLite Database**: Credentials stored in a browser-based SQLite database
- **Master Password**: Single password to access all your credentials
- **Security Questions**: Set up security questions for master password recovery
- **Password Organization**: Categorize passwords for easier management
- **Search Functionality**: Quickly find the credentials you need
- **Password Generator**: Create strong, unique passwords
- **Export Options**: Securely export your data when needed
- **Auto-Lock**: Automatically locks your vault after a period of inactivity

![Dashboard Screenshot](https://i.imgur.com/LZHtN2x.png)

## How it works

1. **Setup**: Create a master password to encrypt your vault
2. **Security Questions**: Set up recovery questions in case you forget your master password
3. **Add Credentials**: Store website logins, credit cards, secure notes, and more
4. **Access Anytime**: Unlock your vault with your master password whenever you need to access your credentials
5. **Search & Filter**: Easily find credentials by searching or filtering by categories

![Password Management](https://i.imgur.com/dUvSg2N.png)

## Technical Details

KeyGuard Vault Keeper uses SQL.js, a JavaScript SQL database engine that runs entirely in the browser. This provides the following benefits:

- **Local SQLite Database**: All data is stored in a SQLite database in your browser
- **No Server Required**: The application runs entirely in your browser
- **Exportable Database**: You can export your database for backup purposes
- **Importable Database**: You can import a previously exported database

### Database Structure

The application uses a SQLite database with the following structure:

```sql
-- Settings table for master password hash and security questions
CREATE TABLE vault_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Passwords table for encrypted credentials
CREATE TABLE vault_passwords (
  id TEXT PRIMARY KEY,
  data TEXT
);
```

All data in the database is encrypted using AES-256 encryption with the master password as the key. The master password itself is never stored - only a hash of it is saved for verification.

![Security Settings](https://i.imgur.com/JmrjFE3.png)

## Setup Instructions

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher (included with Node.js)

### Windows Setup

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd keyguard-vault-keeper

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

### macOS Setup

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd keyguard-vault-keeper

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

### Linux Setup

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd keyguard-vault-keeper

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

## Building for Production

To create an optimized production build:

```sh
npm run build
```

The build files will be located in the `dist` directory.

## Web Hosting Options

You can host KeyGuard Vault Keeper using various services:

### Lovable Hosting (Easiest)

1. Open [Lovable](https://lovable.dev/projects/aeeab6e3-fbd6-4861-b38f-5a35732b64b8)
2. Click on Share -> Publish
3. Your app will be hosted on a Lovable subdomain

### Custom Domain with Lovable

1. Navigate to Project > Settings > Domains in Lovable
2. Click Connect Domain
3. Follow the instructions to connect your custom domain

### Alternative Hosting Options

You can also deploy the built application to:

- **Netlify**: Connect your GitHub repository or manually upload the `dist` directory
- **Vercel**: Connect your repository and configure the build settings
- **GitHub Pages**: Upload the `dist` directory to a GitHub Pages branch
- **Firebase Hosting**: Use Firebase CLI to deploy the `dist` directory

## Important Note About Data Storage

KeyGuard Vault Keeper uses a browser-based SQLite database (via SQL.js) to store your credentials. While this provides the benefit of not requiring a server, it's important to understand:

1. The data is stored in your browser's storage (as a SQLite database)
2. To access your vault from different devices or browsers, you'll need to export your database and import it elsewhere
3. For true multi-device synchronization, consider using the app with a cloud storage solution for your exported database file

![Database Export](https://i.imgur.com/P3wjQYm.png)

## Data Migration

KeyGuard Vault Keeper includes automatic migration from the previous localStorage-based storage to the new SQLite database:

- If you've used a previous version of the app, your data will be automatically migrated to the SQLite database
- The migration happens once when you first log in to the new version
- After migration, all operations will use the SQLite database

## How to edit this project

There are several ways of editing your application.

### Use Lovable

Simply visit the [Lovable Project](https://lovable.dev/projects/aeeab6e3-fbd6-4861-b38f-5a35732b64b8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

### Use your preferred IDE

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Edit a file directly in GitHub

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

### Use GitHub Codespaces

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Technology Stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- CryptoJS for encryption
- SQL.js for browser-based SQLite storage
