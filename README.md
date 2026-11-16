# Pacman React

A playable Pacman game built with React and Vite, deployed automatically with GitHub Actions.

## Run locally

    npm install
    npm run dev

## Build

    npm run build

## Deployment

Every push to `main` runs the CI (lint + build), then deploys `dist/` to the server over SSH/rsync.

Live site: http://IP_DU_SERVEUR
