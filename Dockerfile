# syntax=docker/dockerfile:1

# Shared by every stage, so dev and production never differ in Node, pnpm,
# system packages or Claude Code version.
FROM node:24-bookworm-slim AS base
ARG CLAUDE_CODE_VERSION=2.1.274
ENV CLAUDE_CONFIG_DIR=/home/node/.claude
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g corepack@latest "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
    && corepack enable \
    && mkdir -p /home/node/.claude /data \
    && chown node:node /home/node/.claude /data
WORKDIR /app

# What the devcontainer opens. Source is bind-mounted, nothing is copied in.
FROM base AS dev
RUN apt-get update \
    && apt-get install -y --no-install-recommends git openssh-client curl less zsh \
    && rm -rf /var/lib/apt/lists/*
ENV SHELL=/bin/zsh
USER node

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

# What Compose runs on the server.
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
CMD ["node", "dist/entrypoints/main.js"]
