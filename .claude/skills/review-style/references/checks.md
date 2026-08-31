# Check catalogue

Worked through in Phase 2, kept open through Phase 5. Section marks (§) are `AGENTS.md`.

Each check says what to look for and — where it matters — how to tell a defect from a
deliberate decision. **A style is allowed to be unusual. It is not allowed to be broken.**

---

## 1. CSS validity

| Check | Notes |
| --- | --- |
| Unbalanced braces, stray semicolons, unclosed comments | One unclosed `{` silently kills the rest of the file. Count braces before anything else |
| Unknown properties and misspellings | `colour`, `font-weigth`, `alignt-items` |
| Invalid values | `border: 1px solid` with no colour is valid; `margin: 10` is not |
| Missing unit on a non-zero length | `top: 50` never applies |
| `url()` targets that do not exist | Resolve against **`theme/`** for CSS (§3). List `theme/img/` and match every `url()` |
| Shorthand clobbering a longhand set earlier in the same block | `background-color` then `background:` wipes it |
| `@media` that can never match | `(min-width: 900px) and (max-width: 600px)` |
| Selectors the compatibility target may not support | `:has()`, `:is()`, `@container`. Present in this style already, so the target is modern — but flag a new one |
| Duplicated selector blocks | Later wins entirely. Check whether the earlier one has a reason to exist |
| `!important` with no comment naming the inline style it fights | §9. Missing comment = defect |
| Colour format | Lowercase hex, three or six digits, or a `:root` var (§1). A three-digit hex is fine as long as it is a valid one (`#fff`, `#c00`); `#FFF`, `#DDEBF8`, `red`, `rgb(…)` for opaque colours are all house-style violations |
| Indentation, one declaration per line, 4 spaces | §1 |

**Overridden declarations inside one block** are the most common dead code in a style:

```css
.nav-button-right {
    background: #005fcc;                          /* dead: overridden two lines below */
    background: url(img/arrow-left-01.svg) …;
}
```

**Orphan declarations** are the second most common: a `background-position` on an element
that has no `background-image`, a `transition` on a property nothing changes, a `z-index`
on a `position: static` element, a `flex` child of a non-flex parent. Each is inert. Each
is also a *clue* that something was removed and its companion was left behind — say which
you think it is.

---

## 2. Specificity and the cascade (§10)

Load order is `bootstrap → idevice css → exe_effects.css → exe_atools.css → base.css →
your style.css`. Yours is last, so equal specificity wins.

- **`!important` used for an ordinary override** is a defect: it was never needed, and it
  makes the next override harder. Test by removing it.
- **A class rule trying to override an id rule.** `#siteFooter a` cannot be beaten by
  `.exe-content a:hover`. When the base uses an id, your states must use the same id. Grep
  `contents/*/libs/**/*.css` for id selectors on anything you recolour.
- **`base.css` claims `:hover` and `:focus` on content links at low specificity.** Recolour
  a link without listing its states and the base keeps them — the link changes colour but
  its hover does not. Every recoloured link needs `:hover`, `:focus` and `:visited`
  considered explicitly.
- **`base.css` beats `exe_effects.css`.** A component that looks wrong out of the box is
  often the cascade, not the component.
- **`exe_effects.css` pairs a background with a colour on the current pagination chip**, and
  a style rule for every pagination link ties on specificity and loads later, so it takes the
  colour and leaves the background. **§11 below** — check it in every style.
- **Two of your own rules at equal specificity: the later wins entirely, not per-value.**
  Where one property carries two meanings at once — two markers packed into one
  `box-shadow` — only a combined selector declaring both works.

---

## 3. JavaScript

| Check | Notes |
| --- | --- |
| Syntax errors, unreachable code, unused functions and variables | An unused function may be an API for a future flag — ask before removing |
| Handlers bound to selectors that match nothing | Apply the typo rule in `SKILL.md`. Never delete on your own judgement. Its closed-identifier exception covers the other half: a misspelled id the style both writes and reads can be renamed — grep, count the sites, rename them all at once, no browser check |
| `.html()`, `.attr()`, `.offset()` on an empty jQuery set | jQuery tolerates most calls on an empty set, but `.html()` returns `undefined` and the next `.replace()` **throws**, killing everything after it |
| Native DOM on a possibly-absent element | `document.querySelector(x).classList` throws on `null`. jQuery does not; raw DOM does |
| `localStorage` read or write without `try/catch` | §9. It **throws** in a sandboxed iframe or with third-party cookies off. In SCORM/IMS that is not an edge case, it is Safari's default |
| Parse-time code touching `<body>` | A script running before `</head>` cannot read the format classes of §7 — `<body>` does not exist yet |
| Parse-time and `init()` out of sync | If one sets a class before first paint, the other must be able to undo it where the feature does not apply |
| Hardcoded interface text | §9. Use `$exe_i18n` — exports are translated. Keys: `menu`, `search`, `more`, `mode_toggler`, `teacher_mode`, `hide`, `download`, `block`, `toggleContent`, and the rest in `libs/common_i18n.js` |
| A URL rewritten by hand | §9. `$exeExport.setUrlParam(href, name, value)` sets one parameter keeping the rest and the fragment; `null` removes it. See below |
| A key read from `$exe_i18n` that the export does not define | Gives `undefined` in the UI. Grep `libs/common_i18n.js` |
| Feature applied in a format where it cannot work | A dark-mode toggle inside an LMS iframe. §7: an intermittent control is worse than no control — disable it for that format rather than letting the browser decide |
| Global namespace pollution | One object (`myTheme`) is the convention. A bare `var x` at top level can collide with the application's |
| Guard flags that can deadlock | An "in progress" boolean that a failing animation callback never clears freezes the control for good |
| `$(window).width()` compared to a number | Must match a CSS breakpoint exactly, or behaviour and layout switch at different widths. **Reading the breakpoint back from the CSS instead — `$('#siteNav').css('float') == 'none'` — is the better pattern and not a finding**: it cannot drift |
| jQuery API removed in the bundled version | Check the version first: `contents/*/libs/jquery/`. `.bind()`, `.delegate()`, `.size()` are *deprecated* in jQuery 3 and still work; they are removed in 4. Deprecated-but-working is a suggestion, not a defect — say which it is |
| Markup built by the JS | The page must stay readable with JS off (§9). Check that no content is *only* reachable through injected markup |
| Quote style | Single quotes (§1) |

**Query parameters are a shared channel, and hand-rolled URL surgery breaks it.** A style
that carries its own state across navigation — `nav=false` for a collapsed menu is the
usual one — rewrites links the application generated. Through those links also travel
`exe-teacher`, `q`, `print` and the four xAPI credentials. The three broken patterns, all
of which survive a casual test because the sample content has no other parameters:

```js
e.href = ref.split('?')[0];                    // drops every parameter AND the fragment
e.href = ref + (cond ? '&' : '?') + 'nav=false';  // guesses the separator; a second '?'
window.location = this.href + '?nav=false';    // lands inside the fragment if there is a #ancla
```

All three are replaced by `$exeExport.setUrlParam(getAttribute('href'), 'nav', value)`,
with `value` `null` to remove. Use `getAttribute('href')`, not the `.href` property, which
absolutises the export's relative links. Detection belongs to `URLSearchParams`:
`new URLSearchParams(location.search).get('nav') === 'false'`, not `indexOf('nav=false')`,
which also matches `?xnav=false` and a fragment that happens to contain the text.

It is a pattern several styles inherited from one another, so **check it even when the
style looks tidy**, and check the removal branch as well as the addition — dropping the
query silently breaks LMS tracking and teacher mode, and nothing on screen says so.

**Injected markup must be accessible.** A `<button>` the style builds needs an accessible
name (visible text, or a visually-hidden `<span>`, or `aria-label` from `$exe_i18n`), and a
toggle needs `aria-expanded` kept in sync. A `<div>` with a click handler is not a button:
it is not focusable and not operable from the keyboard (WCAG 2.1.1). Clipping the label with
`clip: rect(1px 1px 1px 1px)` keeps it available to a screen reader — `display: none` does
not.

**Then check the hiding actually reaches it.** A class the JS writes onto injected markup —
`class="sr-av"`, `class="sr-only"`, `class="visually-hidden"` — only hides the label if a
rule matches *that element*. Two ways it silently fails: the class is defined nowhere, or
it is defined **scoped to another component** (`#eXeAtools .sr-av` does not reach a button
outside the accessibility toolbar). The style's own hidden-text rule usually lists selectors
one by one, so a newly injected control is easy to leave off the list. The symptom is a
label rendered on top of an icon button, which the browser makes obvious and static reading
does not — flag it as a candidate and confirm it in Phase 6.

---

## 4. Accessibility, at the level agreed in Phase 0

Thresholds (§13): body text and links **4.5:1** (AAA: 7:1); large text ≥24px or ≥19px bold
**3:1** (AAA: 4.5:1); icons, borders, focus rings and any non-text graphic that carries
meaning **3:1** — that last one has no AAA step.

- **Measure against the real surface, never against white.** A colour that clears AA on
  `#ffffff` by a small margin fails on a tinted panel, and tinted panels are everywhere:
  box heads, footer, message blocks, the highlighted menu link, the search bar. Enumerate
  every background colour the style declares and test the text and links that land on each.
- **Author content is not white** (§8). Authors tint things.
- **Focus must be visible and must survive.** The application's stylesheets set
  `outline: none` in several places. Where an outline is removed, a real ring must replace
  it: `outline: 2px solid <accent>; outline-offset: 2px` on `:focus-visible`. A text
  underline alone does not satisfy 2.4.11. **`currentColor` is not safe for a ring** — on a
  filled control the text is white and a white ring on a white page is no ring.
  ⚠️ **The five effects are the exception: `exe_effects.css` draws their rings itself now**
  and the style only sets `--exe-fx-focus-color`. Writing the rules by hand there is
  redundant, and `outline: none` on an FX control is a defect. **§11 below**.
- **Underlines are required for links among prose** (1.4.1); not required for standalone
  controls in a bar of their own.
- **Colour must never be the only signal.** A rule plus an icon is fine; a hue alone is not.
- **Disabled controls** are exempt from contrast, not from being perceivable. `opacity: .3`
  is not a good default, and `filter: grayscale(1)` stacked on top of a low opacity puts a
  control below any threshold at all.
- **Hidden-text technique.** `clip: rect(1px 1px 1px 1px)` with `position: absolute` is the
  convention here. `width: 0`/`height: 0`, `display: none` and `visibility: hidden` remove
  it from the accessibility tree — a button labelled that way has no name.
- **Touch targets** ≥ 24×24 CSS px (2.5.8). Measure the button, not the icon inside it.
- **Reduced motion.** Any `transition` or `animation` over ~200ms should be disabled under
  `@media (prefers-reduced-motion: reduce)` (2.3.3 is AAA, but the media query costs three
  lines and the omission is worth a suggestion at any level).
- **Zoom to 200%** at 1280px, and **text-spacing overrides** (1.4.12): fixed heights on
  anything containing text will clip. `min-height` is safe; `height` is not.

---

## 5. Optional elements (§8)

The table in §8 is the list. The test is the same for each: **does the style look finished
with the element and without it?**

- `.package-subtitle` absent → does the header keep its padding, or collapse?
- `.page-counter` absent → does whatever was positioned around it reflow? **The single-page
  format never carries one** — the whole project is one document, so there is nothing to
  count. Do not report it as unverified there, and do not write rules that expect it.
- `#teacher-mode-toggler-wrapper` — injected by the app, never in the HTML. A rule like
  `body:has(#teacher-mode-toggler-wrapper) .package-title { padding-right: 100px }` is the
  correct pattern. A bare `padding-right` on `.package-title` is not.
- `#packageLicense` — its class carries *which* licence (`cc-by-sa`, `cc-0`…). Styling one
  variant and not the others leaves the rest unstyled. Check the sprite offsets for each.
- `#siteUserFooter` — arbitrary author HTML, **including links**. The footer link colour
  must clear the threshold **on the footer surface**, not on the page background.
- `.box-toggle` / `.box-icon` / `.box.no-header` — the four-way combination is the classic
  breakage. `contents/web/html/box-options.html` exercises it; use that page, not invented
  markup.
- `#siteNav`, `.nav-buttons`, `#siteLogos` — website only. Anything positioned relative to
  them needs a fallback in the other two formats.
- `#siteLogos` in particular: styles that ship a logo band and styles that do not are both
  normal. If the CSS reserves space for it unconditionally, single-page and SCORM get a gap.
- `.exe-fx`, `.exe-dl`, `.exe-block-*`, `.exe-attachment-link` — only if the author used
  them. §9: some read a colour out of your CSS and write it back inline. Setting `color` on
  the container is the intended door; remember the prose inside then needs its colour back.

---

## 6. Dark mode (§12)

Only if the style has one. Which implementation decides the checks.

**Filter-based** (`filter: invert() hue-rotate()` on `html`):

- The round trip is **not** an identity — saturated colours clip irreversibly. Verify with
  numbers.
- Two regimes coexist: outside a re-inverted element write the *source* colour; inside one
  write the colour you want to *see*. Confusing them is the easy mistake — and the reason a
  dark-mode block full of light greys can be correct.
- **Light hairlines are the usual casualty.** A pale border returns nearly black; an
  outlined control loses its outline and falls under the 3:1 of 1.4.11. Check every border
  and every icon.
- Images, photographs and logos shift colour. `:is(img, video, iframe)` re-inversion is the
  standard patch — check the exception list covers every image-bearing element, including
  CSS `background-image` icons, which the `img` selector does **not** reach.
- A `filter` applies to the whole subtree and cannot be undone by a child.
- Do not rely on `popover`/top-layer to escape an ancestor filter.

**Variable-based** (`:root` palette reassigned under `html.dark-mode`):

- Every variable used in light mode has a dark counterpart — a missing one silently keeps
  the light value.
- Contrast re-measured in dark, all of it. Dark surfaces fail differently.
- `prefers-color-scheme` honoured, or deliberately not.

**Both:**

- The toggle only makes unambiguous sense on the website format (§7).
- Stored preference is per origin — everything on `localhost` shares it. A preview that
  comes up dark unasked is the stored key, not a CSS bug.
- The toggle must have an accessible name and a state (`aria-pressed`), and must be
  keyboard-operable.
- With `localStorage` unavailable the toggle should be **absent**, not present-and-broken.
- **Dark mode prints.** Browsers apply `filter` when printing, so a reader who prints with
  dark mode on gets an inverted page — a black sheet. `@media print` must switch it off.
  Nothing warns you: the screen looks right.
- **Switching it off means every filter, not just the one on `html`.** A filter-based dark
  mode also carries re-inversions (`:is(img, video, iframe)`, a licence badge, a top bar).
  Those exist to *cancel* the global filter. Reset only the global one and they stop
  cancelling and start inverting for real: the photographs and the logo come out negative,
  which is worse than what you set out to fix. List every re-inverted selector in the print
  reset.

---

## 7. Images and sprites (§3, §11)

- **Where each one resolves is not uniform.** `url()` in the CSS → `theme/img/` (root,
  visible immediately). `src` written by `style.js` → `contents/*/theme/img/`. `src` in the
  exported HTML → `contents/*/theme/icons/`. An image that "did not change" is usually this,
  not a cache miss.
- **Sprite cell grids are a contract.** A sprite is addressed by pixel offset at several
  `background-size` values at once. Changing the cell size moves every icon in the style.
- **`mask-image` does not work over `file://`** (§5) — the icon simply disappears. Exports
  are opened from disk all the time. Use `background-image`.
- Icons should be flat ink on transparency: only those survive a `filter` predictably.
- Deliver at 3× displayed size; check the displayed size, not the file.
- **iDevice icons that do not load are a workspace artefact, not a style defect.** The
  exported HTML asks for `theme/icons/<name>.png` using the name of the iDevice the author
  picked; the folder served comes from whatever style was bundled into the export. Editing a
  style against content exported with a different one breaks that agreement by definition, so
  it happens with every style. Two separate mismatches, often at once: the naming convention
  (`eng_aprenderaprender.png` vs `udl_eng_aprenderaprender.svg` vs the generic `info.png`)
  and the extension (an SVG never loads into `<img src="*.png">`). **Report it once, in one
  line, and stop there** — never rename, convert or move a style's icons to match one export.
  That would make the style wrong for every other project. Tracked in the repository's
  `TODO.md` as an application-side problem.
- Images referenced nowhere are dead weight in the `.zip` — report, do not delete
  unilaterally (an icon may be for an iDevice absent from *this* project).

---

## 8. The three formats (§7)

Every export carries `exe-export` plus one format class: `exe-web-site`, `exe-single-page`,
`exe-scorm` (+ `exe-scorm12`), `exe-ims`, `exe-epub`/`exe-epub3`.

Design targets the default; the **website** is the exception — it is the only one with a top
bar, a navigation menu and a logo band.

- A rule written for the website but not scoped to `.exe-web-site` leaks into the other two.
  Look for fixed positioning, `margin-left` compensations for the menu, and `padding-top`
  for the top bar.
- **Single page** is used for printing — `@media print` is part of the deliverable, not a
  nicety. Check that fixed bars, togglers and the page counter are hidden, that link URLs
  are exposed, that margins reset, and that nothing forces a background the printer must
  render.
- **`@media print` adds no specificity, so its position in the file decides whether it
  works.** A print rule loses to any screen rule that is more specific, and to an equally
  specific one written later. Both are common: a `.exe-content` print reset beaten by a
  `.exe-export .exe-content` screen rule, or a dark-mode print reset placed above the
  dark-mode block it is meant to undo. Read every print declaration against what already
  matches the same element — an inert print rule looks identical to a correct one.
  A style may legitimately need **more than one `@media print` block** for this reason;
  that is not duplication to clean up.
- **SCORM/IMS** live in an LMS iframe. The host brings its own surroundings and usually its
  own dark mode. `localStorage` is third-party storage there.
- `<html>` carries `id="exe-index"` on the index page — useful for targeting the home page,
  and the reason relative paths differ by one level between index and the rest.
- The style must not leak into the eXeLearning editor interface: content rules scoped to
  `.exe-content` (§8). Rules targeting `body[installation-type]` or `#node-content-container`
  are deliberately *for* the editor — do not "clean" them away.

---

## 9. Source code blocks

Two unrelated renderings, and the style must leave both usable. `code-*.html` in the web
export exercises them.

| Markup | Comes from | Surface |
| --- | --- | --- |
| `.pre-code > div > pre > code` | `base.css` | `#112c4a`, text `#e7ecf1`, `font-size: 12px` |
| `.highlighted-code.language-*` | Prism (`libs/exe_highlighter/`) | `#f5f2f0`, text `#000` |
| `.highlighted-code.code-style-2` | Prism, Okaidia | `#272822`, text `#f8f8f2` |

`language-*` and `line-numbers` sit on the **outer div**, not on `<pre>`. Prism copies them
onto `pre`/`code` at runtime, so every `pre[class*=language-]` rule only applies after the
JS has run — reading the HTML will not show you the element you are styling (§9).

1. **Monospace must survive.** A style setting `font-family` on `.exe-content` does *not*
   reach `pre`/`code`: the UA and Bootstrap rules match those elements directly and beat
   inheritance. Verify rather than assume, and verify it **with the eXe atools fonts on**
   too — `body.exe-atools-od`, `-ah` and `-mo` each set a family on `.exe-content`, and a
   reader may have any of them active. A style that sets `font-family` on `pre`, `code` or
   `*` breaks alignment in every code block; that is a defect.
2. **The two blocks must compute the same `font-size`.** This is the check that catches
   real breakage. `base.css` pins `.pre-code` to an absolute `12px` (Bootstrap's `pre
   { font-size: 87.5% }` then drops it to **10.5px**), while Prism uses a relative
   `font-size: 1em`. So the moment a style scales prose — a presentation mode with
   `.idevice_node.text { font-size: 1.2em }` is the usual case — the highlighted block
   grows and the plain one does not, and the same code appears at two sizes on one page.
   Measure both; do not eyeball one.
3. **Line numbers desync silently.** `.line-numbers-rows` is absolutely positioned and
   inherits `line-height` from `pre`. Setting `line-height` or `font-size` on `code` alone,
   or on one of the two and not the other, slides the numbers out of register a little more
   with every line. Compare the computed `line-height` of `pre` and of `.line-numbers-rows`.
4. **`white-space: pre` is load-bearing.** A global `word-break`, `overflow-wrap` or
   `white-space: pre-wrap` reflows code and breaks both the numbering and the indentation.
   Long lines are meant to scroll inside `pre` (`overflow: auto`), which is the correct
   answer to WCAG 1.4.10 for code — a horizontal scrollbar on the block is not a finding, a
   horizontal scrollbar on the **document** is.
5. **`tab-size`.** Prism sets `4`; the plain block inherits the browser default `8`. Same
   file, two indentations.
6. **Print.** Both dark surfaces carry near-white text, and browsers drop backgrounds unless
   asked. Printed, `#e7ecf1` and `#f8f8f2` land on white paper and the code vanishes. Check
   it by flipping the print blocks to `all` (Phase 6.7). `print-color-adjust: exact` fixes
   it without touching a single colour.
7. **Prism's palette is not the style's.** Several default-theme tokens fail AA on `#f5f2f0`
   — punctuation and line numbers `#999999` at 2.56:1, `string` 3.08:1, `function` 3.59:1,
   `comment` 3.64:1, `keyword` 4.47:1. They ship with eXeLearning, the dark `code-style-2`
   theme passes, and repainting them is a change to the general presentation of every code
   block. **Standing decision: never repaint them.** Report the numbers once and leave the
   tokens exactly as eXeLearning ships them — this is settled, not a question to re-open each
   review.

---

## 10. Things that look like defects and are not

Check before reporting. Reporting a deliberate decision as a bug wastes the user's time and
makes the real findings harder to see.

| Looks wrong | Often correct because |
| --- | --- |
| Light colours inside a dark-mode block | Filter-based dark mode inverts them (§12) |
| A rule for `body[installation-type]` or `#node-content-container` | Targets the eXeLearning editor, not the export |
| A selector matching nothing in `contents/` | §8 optional element, absent from *this* project |
| An identifier that looks misspelled | It may be the canonical upstream name inherited from the base style — `#searchBarTogger` is real. Grep the other styles and `libs/` before touching it |
| No `@font-face`, no `fonts/`, no dark mode, no `style.js` | A minimal style. Absence is only a finding when something in the style refers to it |
| `compatibility` below the current eXeLearning version | States which version the style targets; it is not a defect to be bumped |
| A duplicated block differing only in `z-index` | Two states of the same control (`.siteNav-off` and not) |
| An iDevice icon that does not load | Name or extension mismatch between what the export asks for and what the style ships — a workspace artefact, never a style defect (§7) |
| `filter: invert(1)` on an icon | Recolouring flat ink — the cheap, intended technique (AGENTS.md §11) |
| No `:focus-visible` rule for tabs, pagination or the accordion | `exe_effects.css` owns those rings now; the style only sets `--exe-fx-focus-color` (§11 below) |
| A rule using `.fx-carousel-pagination` with no link styling in it | Still needed for the prev/next arrows' position and size; only the *link* rules are duplication (§11 below) |
| `clip: rect(1px 1px 1px 1px)` twice, with and without commas | Deliberate legacy-syntax fallback |
| `!important` in `@media print` | Print overrides frequently need it; still wants its comment |
| `display: block !important` on the search box | Fighting an inline style from the application's JS (§9) |
| A `100vh` with a `calc()` subtracting a bar height | Sticky-footer arithmetic; check the number matches the bar, do not remove it |

---

## 11. Effects (FX) — what `exe_effects.css` now owns

Upstream PR **exelearning/exelearning#2344** («Improve the presentation and accessibility of
the effects», CSS only, `exe_effects.js` untouched) moved the focus rings and the underline
policy of the five effects **into `exe_effects.css`**. Work a style did by hand before is now
either redundant or actively wrong.

The styles bundled with eXeLearning (`base`, `universal`, `flux`, `neo`, `nova`, `zen`) are
already adapted, and the PR ships a test suite that keeps them that way. **This section is for
the styles the user hands you**, which are not covered by it.

### First: does this content set even have it?

```bash
grep -c "exe-fx-focus-color" contents/*/libs/exe_effects/exe_effects.css
```

**Three non-zero counts, or the section does not apply.** A `0` means the exports predate the
PR: the style still has to draw its own rings, and everything below turns into a suggestion
for when the content is re-exported. Say which case you are in — never apply this against an
old export set and leave the style with no focus indicator at all.

Every effect is wrapped in `<div class="exe-fx exe-…">`, and the new rules are scoped to
`.exe-fx`.

### The ring is a custom property now, not a rule

`exe_effects.css` draws it on `:focus-visible` for tabs, pagination, accordion titles,
`.fx-timeline-expand` and both timeline headings:

```css
outline: 2px solid var(--exe-fx-focus-color, #1a1a1a);
outline-offset: 2px;
```

| Check | What to do |
| --- | --- |
| The style writes its own `:focus-visible` outline for `.fx-tabs a`, `.fx-pagination a`, `.fx-carousel-pagination a`… | **Redundant.** Replace the lot with `.exe-content { --exe-fx-focus-color: <accent>; }` |
| The style sets no `--exe-fx-focus-color` | The ring falls back to `#1a1a1a`. Legible, but off-palette — worth setting |
| `outline: none` / `outline: 0` on anything matching `.fx-`, `.exe-accordion`, `.exe-tabs`, `.exe-paginated`, `.exe-carousel`, `.exe-timeline` | **Defect.** It suppresses the ring the sheet now guarantees. The PR's test asserts no bundled style does this |
| The ring painted with `box-shadow` | The sheet deliberately never uses `box-shadow` for the ring, so a style can keep painting the *control* with one and both coexist. Do not take that channel over |
| `overflow: hidden` or `auto` on an FX container in the style | Clips the ring. The PR removed exactly that from `.fx-tabs` and `.fx-carousel-pagination` (clearfix `:after` instead) and added `.js .exe-accordion:has(.fx-accordion-title:focus-visible){overflow:visible}` |

⚠️ **Measure the ring against the page background, not against the control.** `outline` is
drawn *outside* the box, over whatever is behind it. Threshold 3:1 (§13).

### ⚠️ The current-page chip — the trap worth checking in every style

`exe_effects.css` pairs a background and a colour on the current pagination item:

```css
.fx-pagination .fx-current a{background:#333;color:#fff}
```

A style rule that recolours **every** pagination link —
`.exe-content .fx-pagination a { color: … }` — matches the chip too, at equal specificity and
loading later, so it **repaints the text and leaves the dark background underneath**. Dark ink
on `#333`.

It is easy to miss twice over: the chip only fails **at rest**, because
`.fx-pagination .fx-current a:hover, :focus` re-asserts `#fff` at higher specificity. Hovering
the element to inspect it makes the bug disappear.

Two correct shapes, both acceptable:

```css
/* Leave the chip alone */
.exe-content .fx-pagination li:not(.fx-current) a { color: #b14900; }

/* Or restyle it whole — both halves of the pair, never just the colour */
.exe-content .fx-pagination .fx-current a { background: #145cb1; color: #ffffff; }
```

### The carousel pagination is not a separate component

Its list carries **both** `fx-carousel-pagination` and `fx-pagination`, and the PR deleted the
duplicated link rules from `exe_effects.css` accordingly. So in a style:

- A third selector for `.fx-carousel-pagination a` alongside `.fx-pagination a` is
  **duplication**, not a defect — fold it into `.fx-pagination a` and say so.
- `.fx-carousel-pagination` on its own is **not** dead: it still positions the prev/next
  arrows and sets their font size. Do not delete rules that use it for layout.

### Underlines

The sheet now guarantees **no underline** on the controls in every state (WCAG 1.4.1: they are
not links inside prose), and **keeps** the underline on `.fx-timeline-minor h3 a`, which are
plain text links inside the event list.

- A style adding `text-decoration: underline` to an FX control now fights the sheet.
- A style that carried `text-decoration: none` workarounds for these controls can drop them.
- Removing the underline from `.fx-timeline-minor h3 a` **is** a finding: those are prose links.
