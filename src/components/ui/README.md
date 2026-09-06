# Admin UI kit

The CRM (`/admin`) is a light, quiet workspace: one accent, color only for state,
14 px body text, 40 px rows, one level of elevation. Everything under `/admin`
is scoped by the `.admin` class (see `globals.css`), which defines the tokens and
the Geist face. The marketing site is untouched.

## Tokens (Tailwind utilities)

| Role | Utilities |
|---|---|
| Page ground / panel / inset | `bg-ground` · `bg-surface` · `bg-surface-2` |
| Hairlines | `border-line` (default) · `border-line-strong` (controls) |
| Text | `text-ink` (primary) · `text-ink-2` (secondary) · `text-ink-3` (muted, labels) |
| Accent (interactive only) | `bg-accent` `text-accent-ink` `bg-accent-soft` |
| State | `text-good/bg-good-soft` · `text-warn/bg-warn-soft` · `text-bad/bg-bad-soft` |
| Type sizes | `text-sm` 14 body · `text-sub` 13 secondary · `text-xs` 12 labels only · `text-base` 16 section · `text-xl` 20 record title |
| Fonts | inherited Geist; `font-ui-mono` for ids/hashes |
| Radius | `rounded-lg` panels (8) · `rounded-[7px]` controls · `rounded-full` pills |
| Shadow | `shadow-pop` — only on menus, dialogs, slide-overs |

Never use `text-white`, `white/NN`, `glass-card`, `gradient-text`, `violet`,
`emerald`, `amber`, `rose`, `zinc`, `cyan` or any `text-[Npx]` below 12 px in
the admin. If something needs a color, it is a state → `StatusBadge` / `Badge`.

## Components (`@/components/ui`)

- `Button` / `ButtonLink` / `ButtonAnchor` — `variant` primary | secondary (default) | ghost | danger; `size` md | sm | icon | icon-sm; `loading`.
- `Badge tone dot size` and `StatusBadge kind value` (kinds: account, contract, onboarding, ticket, severity, channel, action, lead, subscription, invoice) + `TierBadge`. Tone maps live in `tones.ts`.
- `Panel` + `PanelHeader title count sub>{actions}` + `PanelBody` / `PanelRows` + `PanelRow` / `PanelFooter`.
- `Input`, `Textarea`, `Select`, `Label`, `Field label hint error`, `SearchInput` (filters as you type — no Search button).
- `Modal title description onClose footer size` — Escape, backdrop, focus handled.
- `SlideOver title sub onClose actions` — right-hand quick look.
- `DataTable columns rows rowKey rowHref loading empty*` + `NameCell`, `MutedCell`, `MoneyCell`. Rows are 40 px; the whole row is clickable when `rowHref` is set.
- `SectionHeader title count sub>{right-side controls}` — the anatomy of every list.
- `Segmented options value onChange` — filter switch. `Tabs items value onChange` — record page tabs.
- `EmptyState`, `Skeleton`, `PanelSkeleton`, `Kbd`.

## Page anatomy

```tsx
<PageHeader title={account.name} crumb={{ label: "Clients", href: "/admin/clients" }} actions={<Button>…</Button>} />
```
`PageHeader` (from `@/components/admin/PageHeader`) puts the name, breadcrumb and
actions in the top bar — pages never render their own `<h1>`. Page content is a
`flex flex-col gap-6` of sections, each `SectionHeader` + `Panel`/`DataTable`.

Record pages use `RecordShell` (`@/components/admin/RecordShell`): header with
name + status + key facts, `Tabs`, a main column and a 280 px right rail.
