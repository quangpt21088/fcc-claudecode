# HERMES AGENT - DANH SÁCH SKILLS

**Tổng số: 299 skills**

Mỗi skill được mô tả chức năng chính bằng tiếng Việt để người đọc dễ hiểu.

---

## MỤC LỤC

1. [1. WORKFLOW & PLANNING](#1-workflow-and-planning) — 67 skills
2. [2. CODE DEVELOPMENT](#2-code-development) — 31 skills
3. [3. TESTING & QA](#3-testing-and-qa) — 8 skills
4. [4. CODE QUALITY & REVIEW](#4-code-quality-and-review) — 18 skills
5. [5. GIT & GITHUB](#5-git-and-github) — 13 skills
6. [6. DEPLOY & DEVOPS](#6-deploy-and-devops) — 41 skills
7. [7. SECURITY & RED TEAM](#7-security-and-red-team) — 5 skills
8. [8. RESEARCH & LEARNING](#8-research-and-learning) — 11 skills
9. [9. CONTENT & MEDIA](#9-content-and-media) — 23 skills
10. [10. AI AGENTS](#10-ai-agents) — 9 skills
11. [11. ML & AI](#11-ml-and-ai) — 19 skills
12. [12. TOOLS & UTILITIES](#12-tools-and-utilities) — 19 skills
13. [13. PRODUCTIVITY](#13-productivity) — 16 skills
14. [14. MCP SERVERS](#14-mcp-servers) — 3 skills
15. [15. EMAIL](#15-email) — 2 skills
16. [16. FINANCE](#16-finance) — 8 skills
17. [17. OTHER](#17-other) — 6 skills

---

## 1. WORKFLOW & PLANNING (67 skills)

### brainstorming

**Chức năng:** BẮT BUỘC dùng trước mọi việc sáng tao — tạo feature, build component, thêm chức năng. Khám phá ý định user, requirements và design trước khi implement.

### executing-plans

**Chức năng:** Thực thi implementation plan trong session riêng với review checkpoints.

### writing-plans

**Chức năng:** Viết implementation plan chi tiết cho task đa bước, trước khi chạm vào code.

### finishing-a-development-branch

**Chức năng:** Khi implementation xong, chọn cách integrate — merge, PR, hay cleanup.

### dispatching-parallel-agents

**Chức năng:** Giao việc song song cho nhiều agent độc lập không shared state.

### subagent-driven-development

**Chức năng:** Execute plans thông qua subagent với 2-stage review.

### using-superpowers

**Chức năng:** Hướng dẫn cách tìm và dùng skills. BẮT BUỘC invoke skill tool trước MỌI response.

### using-git-worktrees

**Chức năng:** Tạo isolated workspace khi làm feature mới bằng git worktrees.

### verification-before-completion

**Chức năng:** Verify trước khi claim work xong — phải chạy lệnh verify và confirm output.

### writing-skills

**Chức năng:** Viết skill mới, edit skill có sẵn, verify skill trước khi deploy.

### create-plans

**Chức năng:** Tạo hierarchical project plans cho solo agentic development.

### create-subagents

**Chức năng:** Tạo và cấu hình subagents cho việc delegation.

### create-hooks

**Chức năng:** Tạo hooks — PreToolUse, PostToolUse, Stop, SessionStart, v.v.

### create-agent-skills

**Chức năng:** Tạo/refine skills với structure đúng format.

### strategic-compact

**Chức năng:** Context compaction strategy tại logical intervals thay vì auto-compact ngẫu nhiên.

### drift-analysis

**Chức năng:** Phát hiện plan drift — so sánh docs với code thực tế, tìm implementation gaps.

### validate-delivery

**Chức năng:** Verify task hoàn thành — chạy tests, build, requirement checks với pass/fail.

### project-flow-ops

**Chức năng:** Quản lý execution flow giữa GitHub và Linear — triage issues, link work.

### search-first

**Chức năng:** Research trước khi code — tìm existing tools, libraries, patterns.

### consult

**Chức năng:** Cross-tool AI consultation — hỏi ý kiến AI khác (Gemini, Codex, v.v.).

### handoff

**Chức năng:** Compact conversation thành handoff document cho agent khác pick up.

### prototype

**Chức năng:** Build throwaway prototype trước khi commit một design.

### to-issues

**Chức năng:** Break plan thành independently-grabbable issues trên issue tracker.

### to-prd

**Chức năng:** Tạo PRD (Product Requirements Doc) từ conversation context.

### grill-me

**Chức năng:** Stress-test plan/design bằng câu hỏi liên tục cho đến khi rõ ràng.

### grill-with-docs

**Chức năng:** Challenge plan với domain model và documentation hiện có.

### zoom-out

**Chức năng:** Zoom out để hiểu broader context — làm sau khi làm quen code cụ thể.

### caveman

**Chức năng:** Ultra-compressed communication — giảm ~75% tokens, giữ technical accuracy.

### orchestrate-review

**Chức năng:** Multi-pass code review với parallel agents — code quality, security, performance.

### sync-docs

**Chức năng:** Sync documentation với code state — update changelog, fix stale docs.

### learn

**Chức năng:** Research bất kỳ topic nào và tạo learning guide + RAG-optimized indexes.

### deslop

**Chức năng:** Dọn dẹp AI slop code — xóa debug statements, ghost code, cleanup hygiene.

### repo-intel

**Chức năng:** Unified static analysis — git history intelligence, AST symbol mapping, project metadata.

### prompt-template-wizard

**Chức năng:** Tạo prompt template chi tiết, unambiguous cho features và bug fixes.

### parallel-execution-optimizer

**Chức năng:** Tăng tốc task bằng parallel work, batched calls, isolated worktrees.

### skill-scout

**Chức năng:** Tìm skill có sẵn (local, marketplace, GitHub, web) trước khi tạo mới.

### skill-comply

**Chức năng:** Kiểm tra agent có thực sự follow skills/rules không — auto-generate scenarios và report compliance.

### safety-guard

**Chức năng:** Ngăn thao tác destructive trên production systems khi chạy agents tự động.

### terminal-ops

**Chức năng:** Evidence-first repo execution workflow — chạy lệnh, check git state, debug CI.

### seo

**Chức năng:** Audit và implement SEO improvements — technical SEO, on-page, schema markup, Core Web Vitals.

### article-writing

**Chức năng:** Viết technical articles, blog posts, tutorials trong distinctive voice.

### debug-like-expert

**Chức năng:** Deep analysis debugging cho complex issues — methodical investigation protocol.

### improve-codebase-architecture

**Chức năng:** Tìm refactoring opportunities — consolidate tightly-coupled modules.

### scaffold-exercises

**Chức năng:** Tạo exercise directory structure với sections, problems, solutions.

### write-a-skill

**Chức năng:** Tạo skill mới với proper structure, progressive disclosure, bundled resources.

### setup-pre-commit

**Chức năng:** Setup Husky pre-commit hooks với lint-staged (Prettier), type checking, tests.

### migrate-to-shoehorn

**Chức năng:** Migrate test assertions sang @total-typescript/shoehorn.

### gitnexus-cli

**Chức năng:** GitNexus CLI — index repo, check status, clean index, generate wiki.

### gitnexus-debugging

**Chức năng:** Debug code dựa trên GitNexus knowledge graph.

### gitnexus-exploring

**Chức năng:** Explore codebase qua GitNexus interactive web UI.

### gitnexus-guide

**Chức năng:** Hướng dẫn sử dụng GitNexus — available tools, query knowledge graph.

### gitnexus-impact-analysis

**Chức năng:** Impact analysis — xem thay đổi ảnh hưởng đến phần nào của codebase.

### gitnexus-refactoring

**Chức năng:** Refactor code dựa trên GitNexus insights.

### cli-for-agents

**Chức năng:** Thiết kế CLI-friendly tools cho coding agents.

### execplan

**Chức năng:** Viết ExecPlan cho complex features hoặc significant refactors.

### docs

**Chức năng:** Update repository documentation để match current code state.

### maestro-dev

**Chức năng:** Development workflow cho maestroCLI — hexagonal architecture pattern.

### maestro-skill-author

**Chức năng:** Tạo/update/debug maestro built-in skills.

### maestro-v2-migration

**Chức năng:** Guide cho maestroCLI v2 architecture migration.

### maestro:agent-base

**Chức năng:** Base procedures cho tất cả mission agents.

### maestro:blueprint

**Chức năng:** Generate visual HTML blueprint và structured plan specs.

### maestro:conduct

**Chức năng:** Conductor mode — plan, decompose, dispatch sub-agents.

### maestro:define-mission-skills

**Chức năng:** Define và register custom skills cho Mission Control.

### maestro:mission-planning

**Chức năng:** Plan và structure new missions với milestones.

### maestro:scrutiny-validator

**Chức năng:** Run code scrutiny validation during mission checkpoints.

### maestro:user-testing-validator

**Chức năng:** Run user testing validation during mission checkpoints.

### prompt-leverage

**Chức năng:** Strengthen raw prompt thành execution-ready instruction set.

---

## 2. CODE DEVELOPMENT (31 skills)

### react-patterns

**Chức năng:** React 18/19 patterns — hooks discipline, server/client components, Suspense, error boundaries.

### react-performance

**Chức năng:** React/Next.js performance optimization — 70+ rules từ Vercel Engineering.

### react-testing

**Chức năng:** React component testing — RTL, Vitest/Jest, MSW mocking, axe accessibility.

### nextjs-turbopack

**Chức năng:** Next.js 16+ với Turbopack — incremental bundling, FS caching, dev speed.

### frontend-patterns

**Chức năng:** Frontend development patterns cho React, Next.js, state management, performance.

### api-design

**Chức năng:** REST API design — naming, status codes, pagination, versioning, rate limiting.

### backend-patterns

**Chức năng:** Backend architecture — API design, database optimization, Node.js/Express/Next.js.

### vite-patterns

**Chức năng:** Vite build tool — config, plugins, HMR, env, proxy, SSR, library mode.

### python-patterns

**Chức năng:** Pythonic idioms, PEP 8, type hints, best practices.

### python-testing

**Chức năng:** Python testing — pytest, TDD, fixtures, mocking, coverage.

### rust-patterns

**Chức năng:** Idiomatic Rust — ownership, error handling, traits, concurrency.

### rust-testing

**Chức năng:** Rust testing — unit, integration, async, property-based, TDD.

### code-generation

**Chức năng:** Generate code snippets, implement features, tạo boilerplate code.

### refactoring-javascript

**Chức năng:** Refactor JS codebases — split monolithic files, add persistence, modernize patterns.

### react-typescript-setup

**Chức năng:** Setup, fix, migrate React + TypeScript projects.

### static-html-webapp

**Chức năng:** Build static HTML/CSS/JS web apps với Vite + Tailwind CSS v4.

### spike

**Chức năng:** Throwaway experiments để validate idea trước khi build.

### code-wiki

**Chức năng:** Generate wiki docs + Mermaid diagrams cho bất kỳ codebase.

### codebase-inspection

**Chức năng:** Inspect codebase — LOC, languages, file ratios.

### rest-graphql-debug

**Chức năng:** Debug REST/GraphQL APIs — status codes, auth, schemas.

### node-inspect-debugger

**Chức năng:** Debug Node.js qua --inspect + Chrome DevTools Protocol.

### jupyter-live-kernel

**Chức năng:** Iterative Python qua live Jupyter kernel.

### page-agent

**Chức năng:** Embed in-page AI copilot vào web app — natural language UI control.

### anthropic-frontend-design

**Chức năng:** Tạo production-grade frontend interfaces với high design quality.

### openai-frontend-design

**Chức năng:** Frontend design với AI-generated concept và faithful implementation.

### popular-web-designs

**Chức năng:** 54 real design systems (Stripe, Linear, Vercel) as HTML/CSS.

### sketch

**Chức năng:** Throwaway HTML mockups — 2-3 design variants để compare.

### claude-design

**Chức năng:** Design one-off HTML artifacts — landing, deck, prototype.

### design-md

**Chức năng:** Author/validate/export DESIGN.md token spec files.

### concept-diagrams

**Chức năng:** Flat SVG diagrams cho education và visualization.

### architecture-diagram

**Chức năng:** Dark-themed SVG architecture/cloud/infra diagrams.

---

## 3. TESTING & QA (8 skills)

### tdd

**Chức năng:** Test-driven development — red-green-refactor loop.

### tdd-workflow

**Chức năng:** TDD với 80%+ coverage — unit, integration, E2E tests.

### test-driven-development

**Chức năng:** Enforce RED-GREEN-REFACTOR, tests trước code.

### pre-commit

**Chức năng:** Code quality checks và tests trước mỗi commit.

### bug-fix

**Chức năng:** Fix bugs với test-first approach để prevent regressions.

### new-feature

**Chức năng:** Develop features với TDD approach.

### dogfood

**Chức năng:** Exploratory QA — tìm bugs, evidence, báo cáo chi tiết.

### adversarial-ux-test

**Chức năng:** Roleplay difficult user để tìm UX pain points, lọc genuine issues.

---

## 4. CODE QUALITY & REVIEW (18 skills)

### systematic-debugging

**Chức năng:** 4-phase root cause debugging — understand bugs trước khi fix.

### diagnose

**Chức năng:** Disciplined diagnosis loop — reproduce, minimise, hypothesise, instrument, fix.

### full-audit

**Chức năng:** Chạy 11 audit agents song song, consolidate findings với fix-planner.

### requesting-code-review

**Chức năng:** Pre-commit review — security scan, quality gates, auto-fix.

### receiving-code-review

**Chức năng:** Xem code review feedback với technical rigor — không blind agreement.

### review-pr

**Chức năng:** Review PR cho bugs, regressions, missing tests, risky changes.

### triage

**Chức năng:** Triage issues qua state machine driven by triage roles.

### performance-audit

**Chức năng:** Comprehensive performance audit cho applications.

### production-audit

**Chức năng:** Local-evidence production readiness audit cho shipped apps.

### security-review

**Chức năng:** Security checklist — auth, user input, secrets, API endpoints, payment.

### differential-review

**Chức năng:** Security-focused differential review cho PRs, commits, diffs.

### insecure-defaults

**Chức năng:** Phát hiện fail-open insecure defaults — hardcoded secrets, weak auth.

### sharp-edges

**Chức năng:** Error-prone APIs, dangerous configurations, footgun designs.

### fp-check

**Chức năng:** Verify suspected bugs — eliminate false positives, produce verdicts.

### compound-engineering

**Chức năng:** Compound engineering patterns.

### workspace-surface-audit

**Chức năng:** Audit active repo, MCP servers, plugins — recommend highest-value workflows.

### code-quality-review

**Chức năng:** Comprehensive code quality review.

### verification-loop

**Chức năng:** Comprehensive verification system cho sessions.

---

## 5. GIT & GITHUB (13 skills)

### git-workflow

**Chức năng:** Git workflow patterns — branching, commit conventions, merge vs rebase.

### git-guardrails-claude-code

**Chức năng:** Block dangerous git commands bằng Claude Code hooks.

### clean-gone-branches

**Chức năng:** Xóa local branches đã bị xóa khỏi remote.

### commit-staged

**Chức năng:** Commit staged files với conventional commit messages.

### create-pr

**Chức năng:** Tạo pull request theo project standards — title, description, reviewers.

### resolve-pr-comments

**Chức năng:** Address PR review comments, fix valid concerns, draft responses.

### update-pr-summary

**Chức năng:** Update PR title và description dựa trên complete changeset.

### github-auth

**Chức năng:** GitHub auth setup — HTTPS tokens, SSH keys, gh CLI login.

### github-code-review

**Chức năng:** PR review với inline comments qua gh hoặc REST API.

### github-issues

**Chức năng:** Create, triage, label, assign GitHub issues.

### github-pr-workflow

**Chức năng:** PR lifecycle — branch, commit, open, CI, merge.

### github-repo-management

**Chức năng:** Clone/create/fork repos, manage remotes, releases.

### git-cleanup

**Chức năng:** Safely cleanup local git branches và worktrees.

---

## 6. DEPLOY & DEVOPS (41 skills)

### release-prep

**Chức năng:** Full audit + fixes + deploy validation cho production release.

### pre-deploy

**Chức năng:** Validate build, environment, dependencies trước khi deploy.

### cloudflare-deploy

**Chức năng:** Cloudflare Workers, Pages, KV, R2, AI — comprehensive platform.

### dokploy-deploy

**Chức năng:** Self-hosted deployment với Dokploy.

### docker-management

**Chức năng:** Manage Docker containers, images, volumes, networks, Compose stacks.

### inference-sh-cli

**Chức năng:** Chạy 150+ AI apps qua inference.sh CLI.

### pinggy-tunnel

**Chức năng:** Zero-install localhost tunnels qua SSH.

### webhook-subscriptions

**Chức năng:** Event-driven agent runs via webhooks.

### dockerfile-generator

**Chức năng:** Generate production-ready Dockerfiles với security và optimization.

### dockerfile-validator

**Chức năng:** Validate Dockerfiles cho security và best practices.

### terraform-generator

**Chức năng:** Generate Terraform .tf HCL — resources, modules, providers.

### terraform-validator

**Chức năng:** Validate Terraform configs với tflint, checkov.

### ansible-generator

**Chức năng:** Generate Ansible playbooks, roles, tasks, handlers.

### ansible-validator

**Chức năng:** Validate, lint, test Ansible playbooks và roles.

### helm-generator

**Chức năng:** Generate Helm charts — Chart.yaml, values.yaml, templates.

### helm-validator

**Chức năng:** Validate Helm charts — templates, schemas, CRDs.

### k8s-debug

**Chức năng:** Debug Kubernetes pods, CrashLoopBackOff, DNS, networking, storage.

### k8s-yaml-generator

**Chức năng:** Generate K8s manifests — Deployment, Service, ConfigMap, Ingress.

### k8s-yaml-validator

**Chức năng:** Validate K8s YAML resources — syntax, schema, dry-run.

### jenkinsfile-generator

**Chức năng:** Generate Jenkinsfiles — declarative, scripted, shared libraries.

### jenkinsfile-validator

**Chức năng:** Validate Jenkins pipelines và shared libraries.

### gitlab-ci-generator

**Chức năng:** Generate .gitlab-ci.yml pipelines, stages, jobs.

### gitlab-ci-validator

**Chức năng:** Validate .gitlab-ci.yml configurations.

### github-actions-generator

**Chức năng:** Generate GitHub Actions workflows và custom actions.

### github-actions-validator

**Chức năng:** Validate GitHub Actions workflows với actionlint.

### terragrunt-generator

**Chức năng:** Generate Terragrunt HCL files — root.hcl, stacks, multi-env.

### terragrunt-validator

**Chức năng:** Validate Terragrunt configurations.

### makefile-generator

**Chức năng:** Generate Makefiles với .PHONY targets và build automation.

### makefile-validator

**Chức năng:** Validate Makefiles và .mk files.

### logql-generator

**Chức năng:** Generate LogQL queries cho Grafana Loki.

### loki-config-generator

**Chức năng:** Generate Grafana Loki server configurations.

### promql-generator

**Chức năng:** Generate PromQL queries, alerting rules.

### promql-validator

**Chức năng:** Validate PromQL queries, detect anti-patterns.

### fluentbit-generator

**Chức năng:** Generate Fluent Bit log pipeline configs.

### fluentbit-validator

**Chức năng:** Validate Fluent Bit configurations.

### azure-pipelines-generator

**Chức năng:** Generate Azure DevOps pipeline YAML.

### azure-pipelines-validator

**Chức năng:** Validate Azure DevOps pipelines.

### bash-script-generator

**Chức năng:** Generate production-ready Bash scripts.

### bash-script-validator

**Chức năng:** Validate Bash/Shell scripts qua ShellCheck.

### kanban-orchestrator

**Chức năng:** Decomposition playbook cho Kanban orchestrator profile.

### kanban-worker

**Chức năng:** Pitfalls và edge cases cho Hermes Kanban workers.

---

## 7. SECURITY & RED TEAM (5 skills)

### 1password

**Chức năng:** 1Password CLI setup — enable desktop app, sign in, read/inject secrets.

### oss-forensics

**Chức năng:** Supply chain investigation, evidence recovery, forensic analysis cho GitHub repos.

### sherlock

**Chức năng:** OSINT username search across 400+ social networks.

### godmode

**Chức năng:** Jailbreak LLMs — Parseltongue, GODMODE, ULTRAPLINIAN (red teaming).

### constant-time-analysis

**Chức năng:** Detect timing side-channel vulnerabilities trong cryptographic code.

---

## 8. RESEARCH & LEARNING (11 skills)

### arxiv

**Chức năng:** Search arXiv papers theo keyword, author, category, ID.

### blogwatcher

**Chức năng:** Monitor blogs và RSS/Atom feeds.

### duckduckgo-search

**Chức năng:** Free web search — no API key needed.

### parallel-cli

**Chức năng:** Agent-native web search, extraction, deep research.

### scrapling

**Chức năng:** Web scraping — HTTP fetching, stealth browser, Cloudflare bypass.

### domain-intel

**Chức năng:** Passive domain reconnaissance — subdomain, SSL, WHOIS, DNS.

### gitnexus-explorer

**Chức năng:** Index codebase với GitNexus và serve interactive knowledge graph.

### llm-wiki

**Chức năng:** Karpathy's LLM Wiki — build/query interlinked markdown knowledge base.

### osint-investigation

**Chức năng:** Public-records OSINT — SEC, USAspending, sanctions, court records.

### polymarket

**Chức năng:** Query Polymarket — markets, prices, orderbooks, history.

### drug-discovery

**Chức năng:** Pharmaceutical research — ChEMBL, Lipinski, ADMET profiles.

---

## 9. CONTENT & MEDIA (23 skills)

### humanizer

**Chức năng:** Strip AI-isms, add real voice vào text.

### ascii-art

**Chức năng:** ASCII art — pyfiglet, cowsay, boxes, image-to-ascii.

### ascii-video

**Chức năng:** Convert video/audio thành colored ASCII MP4/GIF.

### pixel-art

**Chức năng:** Pixel art với era palettes (NES, Game Boy, PICO-8).

### p5js

**Chức năng:** p5.js sketches — generative art, shaders, interactive, 3D.

### excalidraw

**Chức năng:** Hand-drawn Excalidraw JSON diagrams (arch, flow, sequence).

### baoyu-infographic

**Chức năng:** Infographics — 21 layouts x 21 styles.

### baoyu-comic

**Chức năng:** Knowledge comics — educational, biography, tutorial.

### baoyu-article-illustrator

**Chức năng:** Article illustrations — type × style × palette consistency.

### manim-video

**Chức năng:** Manim CE animations — 3Blue1Brown math/algo videos.

### hyperframes

**Chức năng:** HTML video compositions, animated title cards, social overlays.

### meme-generation

**Chức năng:** Generate meme images với Pillow.

### gif-search

**Chức năng:** Search/download GIFs từ Tenor.

### heartmula

**Chức năng:** Suno-like song generation từ lyrics.

### songsee

**Chức năng:** Audio spectrograms — mel, chroma, MFCC.

### spotify

**Chức năng:** Spotify — play, search, queue, manage playlists.

### youtube-content

**Chức năng:** YouTube transcripts thành summaries, threads, blogs.

### kanban-video-orchestrator

**Chức năng:** Multi-agent video production pipeline.

### touchdesigner-mcp

**Chức năng:** Control TouchDesigner — real-time visuals, 36 native tools.

### blender-mcp

**Chức năng:** Control Blender — 3D objects, materials, animations, bpy code.

### comfyui

**Chức năng:** Generate images, video, audio với ComfyUI workflows.

### ideation

**Chức năng:** Generate project ideas through creative constraints.

### songwriting-and-ai-music

**Chức năng:** Songwriting craft và Suno AI music prompts.

---

## 10. AI AGENTS (9 skills)

### claude-code

**Chức năng:** Delegate coding to Claude Code CLI — features, PRs.

### codex

**Chức năng:** Delegate coding to OpenAI Codex CLI — features, PRs.

### opencode

**Chức năng:** Delegate coding to OpenCode CLI — features, PR review.

### blackbox

**Chức năng:** Delegate to Blackbox AI CLI — multi-model judge.

### grok

**Chức năng:** Delegate to xAI Grok Build CLI — features, PRs.

### hermes-agent

**Chức năng:** Configure, extend, contribute to Hermes Agent itself.

### kanban-codex-lane

**Chức năng:** Codex CLI as isolated Kanban implementation lane.

### honcho

**Chức năng:** Configure Honcho memory — cross-session user modeling, dialectic reasoning.

### antigravity-cli

**Chức năng:** Operate Antigravity CLI — plugins, auth, sandbox.

---

## 11. ML & AI (19 skills)

### huggingface-hub

**Chức năng:** HuggingFace CLI — search/download/upload models, datasets.

### huggingface-accelerate

**Chức năng:** Simplest distributed training API — 4 lines cho multi-GPU.

### huggingface-tokenizers

**Chức năng:** Fast tokenizers — Rust-based, 1GB in <20s.

### pytorch-lightning

**Chức năng:** High-level PyTorch — Trainer class, automatic distributed training.

### dspy

**Chức năng:** DSPy — declarative LM programs, auto-optimize prompts, RAG.

### instructor

**Chức năng:** Extract structured data from LLM với Pydantic validation.

### guidance

**Chức năng:** Control LLM output với regex và grammars.

### llama-cpp

**Chức năng:** llama.cpp local GGUF inference + HF Hub model discovery.

### clip

**Chức năng:** OpenAI CLIP — vision-language, zero-shot image classification.

### llava

**Chức năng:** Large Language and Vision Assistant — image-based conversations.

### stable-diffusion-image-generation

**Chức năng:** Text-to-image với Stable Diffusion.

### segment-anything-model

**Chức năng:** SAM — zero-shot image segmentation.

### chroma

**Chức năng:** Open-source embedding database cho AI applications.

### pinecone

**Chức năng:** Managed vector database cho production AI.

### qdrant-vector-search

**Chức năng:** High-performance vector similarity search.

### modal-serverless-gpu

**Chức năng:** Serverless GPU cloud cho ML workloads.

### peft-fine-tuning

**Chức năng:** Parameter-efficient fine-tuning — LoRA, QLoRA.

### weights-and-biases

**Chức năng:** W&B — log ML experiments, sweeps, model registry.

### sparse-autoencoder-training

**Chức năng:** Train Sparse Autoencoders với SAELens.

---

## 12. TOOLS & UTILITIES (19 skills)

### agent-skills-supabase

**Chức năng:** Chạy Supabase Management API SQL — query records, schema changes.

### agent-skills-postgres

**Chức năng:** Read-only SQL queries trên PostgreSQL.

### agent-skills-gh-review

**Chức năng:** Review backend PRs qua gh CLI.

### agent-skills-trello

**Chức năng:** Quản lý Trello boards, lists, cards.

### agent-skills-svg

**Chức năng:** Tạo, edit, validate SVG graphics chất lượng cao.

### agent-skills-prompt-wizard

**Chức năng:** Tạo prompt template chi tiết, unambiguous.

### tavily-usage

**Chức năng:** Web search API cho research tasks.

### web-performance-optimization

**Chức năng:** Phân tích Core Web Vitals và tối ưu page load.

### vercel-react-best-practices

**Chức năng:** React/Next.js performance guidelines từ Vercel Engineering.

### web-asset-generator

**Chức năng:** Generate favicons, PWA icons, OG images.

### codebase-to-course

**Chức năng:** Chuyển đổi codebase thành interactive HTML course.

### trello

**Chức năng:** Quản lý Trello boards, lists, cards.

### supabase

**Chức năng:** Run Supabase Management API SQL.

### supabase-cli

**Chức năng:** Supabase CLI cho local dev và project management.

### supabase-js

**Chức năng:** Supabase JS SDK — client-side queries, auth, storage.

### supabase-postgres-best-practices

**Chức năng:** Postgres performance optimization từ Supabase.

### read-only-postgres

**Chức năng:** Read-only SQL queries trên PostgreSQL.

### read-only-gh-pr-review

**Chức năng:** Review backend PRs qua gh CLI.

### svg-creator

**Chức năng:** Tạo SVG icons/graphics chất lượng cao.

---

## 13. PRODUCTIVITY (16 skills)

### airtable

**Chức năng:** Airtable REST API — records CRUD, filters, upserts.

### notion

**Chức năng:** Notion API — pages, databases, markdown.

### linear

**Chức năng:** Linear — manage issues, projects, teams via GraphQL.

### google-workspace

**Chức năng:** Gmail, Calendar, Drive, Docs, Sheets via gws CLI.

### shopify

**Chức năng:** Shopify GraphQL APIs — products, orders, customers.

### nano-pdf

**Chức năng:** Edit PDF text/typos/titles.

### ocr-and-documents

**Chức năng:** Extract text từ PDFs/scans.

### maps

**Chức năng:** Geocode, POIs, routes, timezones via OpenStreetMap.

### powerpoint

**Chức năng:** Create/read/edit .pptx decks.

### teams-meeting-pipeline

**Chức năng:** Teams meeting summary pipeline.

### telephony

**Chức năng:** Twilio phone capabilities — SMS, calls.

### obsidian

**Chức năng:** Read, search, create, edit notes trong Obsidian vault.

### openhue

**Chức năng:** Điều khiển Philips Hue lights, scenes, rooms.

### yuanbao

**Chức năng:** Yuanbao groups — @mention users, query info.

### one-three-one-rule

**Chức năng:** Decision-making framework — 1 problem, 3 options, 1 recommendation.

### openclaw-migration

**Chức năng:** Migrate OpenClaw customizations sang Hermes Agent.

---

## 14. MCP SERVERS (3 skills)

### native-mcp

**Chức năng:** MCP client — connect servers, register tools (stdio/HTTP).

### fastmcp

**Chức năng:** Build MCP servers với FastMCP Python SDK.

### mcporter

**Chức năng:** List, configure, auth, call MCP servers/tools.

---

## 15. EMAIL (2 skills)

### himalaya

**Chức năng:** IMAP/SMTP email từ terminal.

### agentmail

**Chức năng:** Agent-owned email inbox via AgentMail.

---

## 16. FINANCE (8 skills)

### 3-statement-model

**Chức năng:** Xây dựng 3-statement financial models (IS, BS, CF) trong Excel.

### comps-analysis

**Chức năng:** Comparable company analysis cho valuation.

### dcf-model

**Chức năng:** DCF valuation models với WACC, terminal value.

### lbo-model

**Chức năng:** Leveraged buyout models cho PE analysis.

### merger-model

**Chức năng:** Accretion/dilution merger models.

### excel-author

**Chức năng:** Tạo Excel workbooks headless với openpyxl.

### pptx-author

**Chức năng:** Tạo PowerPoint decks headless.

### stocks

**Chức năng:** Stock quotes, history, crypto prices.

---

## 17. OTHER (6 skills)

### evm

**Chức năng:** Read-only EVM client cho 8 blockchain chains.

### hyperliquid

**Chức năng:** Hyperliquid prediction market data.

### solana

**Chức năng:** Query Solana blockchain — wallets, tokens, NFTs.

### pokemon-player

**Chức năng:** Play Pokemon qua headless emulator.

### fitness-nutrition

**Chức năng:** Gym workout planner và nutrition tracker.

### neuroskill-bci

**Chức năng:** BCI wearable integration — cognitive/emotional state monitoring.

---
