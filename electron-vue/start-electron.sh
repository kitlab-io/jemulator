#!/bin/bash

# Shell script to launch the minimal Electron application with the correct environment variables
# This script should be run after starting the Vite dev servers with `npm run dev`

# Set colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print with colors
function print_cyan() { echo -e "${CYAN}$1${NC}"; }
function print_green() { echo -e "${GREEN}$1${NC}"; }
function print_yellow() { echo -e "${YELLOW}$1${NC}"; }
function print_red() { echo -e "${RED}$1${NC}"; }

# Set environment variables
export ELECTRON_IS_DEV=1
export NODE_ENV=development
export VITE_DEV_SERVER_URL=http://localhost:5173
export VITE_VUE_SERVER_URL=http://localhost:5173
export VITE_SVELTE_SERVER_URL=http://localhost:5174
export VITE_THREEJS_SERVER_URL=http://localhost:5175

print_cyan "Starting minimal Electron application with environment variables:"
print_yellow "VITE_DEV_SERVER_URL: $VITE_DEV_SERVER_URL"
print_yellow "VITE_VUE_SERVER_URL: $VITE_VUE_SERVER_URL"
print_yellow "VITE_SVELTE_SERVER_URL: $VITE_SVELTE_SERVER_URL"
print_yellow "VITE_THREEJS_SERVER_URL: $VITE_THREEJS_SERVER_URL"

# Change to the minimal-electron directory
cd "$(dirname "$0")/minimal-electron"

# Run Electron using npx
print_cyan "Launching minimal Electron application..."
npx electron .

# Store the exit code
EXIT_CODE=$?

# Exit with the same code as Electron
if [ $EXIT_CODE -ne 0 ]; then
  print_red "Electron process exited with code $EXIT_CODE"
else
  print_green "Electron process exited successfully"
fi

exit $EXIT_CODE
