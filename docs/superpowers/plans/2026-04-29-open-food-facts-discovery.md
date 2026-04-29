# Open Food Facts Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-affiliate Open Food Facts discovery pipeline for product-check content.

**Architecture:** Extend the existing `deals` table and TypeScript `Deal` type with discovery metadata while preserving the existing affiliate flow. Add focused Open Food Facts normalization and discovery scoring modules with tests, then wire scripts, prompts, UI labels, and admin navigation around the new mode.

**Tech Stack:** Next.js 14, TypeScript, Supabase, Vitest, Groq, Playwright.

---

## Tasks

- [ ] Add DB migration and TypeScript fields for discovery metadata.
- [ ] Add Open Food Facts normalization tests and implementation.
- [ ] Add discovery scoring tests and implementation.
- [ ] Add Open Food Facts import script and npm command.
- [ ] Branch copy prompts and compliance disclosure for non-affiliate content.
- [ ] Update public/admin UI to hide price/buy language for discovery items.
- [ ] Add `/admin/pipeline`.
- [ ] Run tests and production build.
