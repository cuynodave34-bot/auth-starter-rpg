## Start the server (Expo dev server)

Follow these steps each time you want to run the app.

### 1) Install dependencies (first time or after updates)
```powershell
npm install
```

### 2) Navigate to the project directory and start the Expo dev server
```powershell
cd "C:\Users\Admin\OneDrive\TENSEI SLIME\auth-starter-rpg"
npm run start
```
This opens Expo DevTools. From there you can choose a platform, or use the commands below.

**Note:** Make sure you're in the correct directory (`auth-starter-rpg`) before running `npm run start`. The command will fail if run from the parent directory.

### 3) Launch on a target
- Web (in your browser):
```powershell
npm run web
```

- Android (Expo Go app or emulator):
```powershell
npm run android
```

- iOS (requires macOS):
```powershell
npm run ios
```

### Notes
- Node.js 18+ is recommended for Expo SDK 53.
- If you use environment variables, place them in a local file like `.env.local` (already git-ignored), then restart the server.

### Common troubleshooting
- Clear caches if the bundler behaves oddly:
```powershell
npx expo start -c
```

- If a port is in use, close the existing process or change the port:
```powershell
npx expo start --port 8082
```

- If the QR code doesn’t load in Expo Go, ensure your device and PC are on the same network, or switch the connection mode in DevTools (LAN/Tunnel).


