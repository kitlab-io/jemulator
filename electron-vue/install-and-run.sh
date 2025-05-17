#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Installing dependencies for JEmulator Multi-Renderer System...${NC}"

# Install npm dependencies
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Dependencies installed successfully!${NC}"
else
    echo -e "${RED}Error installing dependencies. Please check the error messages above.${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting the application...${NC}"

# Start the application
npm start

if [ $? -ne 0 ]; then
    echo -e "${RED}Error starting the application. Please check the error messages above.${NC}"
    exit 1
fi
