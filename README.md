# RAI Components 

This project contains several React components for use in RelationalAI frontend applications such as the Console, the documentation site, and the RelationalAI VS Code extension.

## Developer Setup

This directory is structured as a pnpm monorepo with two packages:

- `packages/demo`. A simple example of how to use the React components.
- `packages/knowledge-graph-explorer`. A graph visualization of a RelationalAI database that lets you explore the knowledge graph.

To get started, do `pnpm install` and then `pnpm dev` from the root directory of the project. This will start a development server for the demo app, and it will recompile the other packages when an  source files are saved.