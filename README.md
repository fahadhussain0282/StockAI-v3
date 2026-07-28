<div align="center">
  <h1>StockAI</h1>
  <p><strong>Enterprise AI Metadata Platform & Gateway</strong></p>
</div>

## Project Overview

StockAI is a professional enterprise-level platform that integrates multiple advanced AI models (Gemini, xAI, Groq) using a customized Enterprise AI Gateway. Designed to generate rich metadata, optimize SEO categorizations, and deploy sophisticated vector embeddings for superior semantic matching and search capabilities.

## Features

- **Enterprise AI Gateway:** Resilient and flexible API orchestration supporting Google Gemini, xAI, and Groq.
- **Robust SEO & Metadata Engine:** Automated title, category, illustration, and vector generation pipelines.
- **Secure Memory Stores:** Built-in membership and workspace data isolation and caching mechanisms.
- **High-Performance Frontend:** Powered by Vite, React, and TailwindCSS for a premium UX/UI experience.
- **Safe CI/CD & Deployment:** Automated deployment to Vercel connected directly via GitHub.

## Architecture

The system uses a React SPA via Vite layered on an Express/Node runtime. The AI Gateway acts as the orchestration layer:
- `src/core/ai/providers`: Standardized provider integrations.
- `src/core/seo`: Purpose-built AI engines for vector processing, metadata, and SEO handling.
- `src/core/teams/store`: Memory stores to manage workspace context and permissions.

## Installation

**Prerequisites:** Node.js v18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Configuration:
   Create a `.env.local` or `.env` file (never commit this) and provide the necessary API keys.
   ```env
   # Refer to Environment Variables section
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

The application relies on several secure tokens (Do not share or commit these):
- `GEMINI_API_KEY`: Key for Google Gemini integrations.
- `XAI_API_KEY`: Key for xAI integrations.
- `GROQ_API_KEY`: Key for Groq integrations.

*(For full required environment variables, refer to the local configuration setups.)*

## Deployment

This project is deployed to **Vercel** with continuous deployment from the main GitHub repository.
- Commits pushed to the main branch automatically trigger a production deployment.
- Strict CI checks (linting, typechecking) enforce safe builds.

## License

All rights reserved.

## Contributors

Enterprise DevOps & Full Stack Engineering Team.
