# Maplewood conventions

Maplewood is a children's day camp and school-year center. The look is warm and
plain: cream pages, camp-green actions, Poppins headlines, Lato body text.
This is not a redesign kit. Build pages that look like the live site.

## Setup

No provider is needed. Every component reads its colors and fonts from
`styles.css`, which imports Poppins, Lato and Halant from Google Fonts and the
compiled Tailwind stylesheet. Put components on a `bg-background` (cream) or
`bg-card` (white) surface so text has the right contrast.

`Form` is react-hook-form's provider. Create the form with the bundled `useForm`
and spread it: `<Form {...form}>`. `FormField`, `FormItem`, `FormLabel`,
`FormControl`, `FormDescription` and `FormMessage` only work inside `Form`.
`Toaster` shows messages fired with the bundled `toast()` function.

## Styling idiom: Tailwind utility classes with Maplewood tokens

Style layout glue with these class families. Do not invent new color classes
and do not override a button's height, padding or radius.

| Job | Classes |
| --- | --- |
| Page and card surfaces | `bg-background` (cream), `bg-card` (white), `bg-fill-cream`, `bg-fill-forest` (camp green), `bg-fill-panel` (deep green), `bg-fill-night` (ink) |
| Text colors | `text-foreground`, `text-muted-foreground`, `text-primary`, `text-primary-foreground` |
| Action color | `bg-primary`, `hover:bg-primary-hover`, `text-destructive` |
| Borders | `border-border`, `border-input` |
| Type scale | `text-display-hero`, `text-display-page`, `text-headline`, `text-title-lg`, `text-title`, `text-eyebrow`, `text-label` |
| Font families | `font-display` (Poppins) for headlines, body text inherits Lato, `font-accent` (Halant) for a rare handwritten note |
| Shape | `rounded-control` (pill) on controls, `rounded-lg` on cards |
| Section rhythm | `container-content` for the page column, `py-section` for section padding |
| Focus | `focus-ring` on any custom interactive element |

Headlines: `font-display text-headline text-foreground`. Eyebrow above a
headline: `TagLine`. Body copy: plain `text-foreground` or
`text-muted-foreground`, no font class.

## Where the truth lives

Read `styles.css` and its import `_ds_bundle.css` for every token (the
`--color-*`, `--font-*`, `--radius-*` custom properties) before adding a color.
Each component's `.prompt.md` has its props and working examples. The
`guidelines/DESIGN.md` file holds the brand rules: colors, type hierarchy,
shadows and the do's and don'ts.

## One idiomatic build

```jsx
<section className="bg-background py-section">
  <div className="container-content grid gap-6">
    <TagLine title="Summer Camp" />
    <h2 className="font-display text-headline text-foreground">
      Nine weeks of swimming, sports and field trips
    </h2>
    <p className="max-w-prose text-muted-foreground">
      Camp runs 9 am to 4 pm with free extended care from 7 am to 6 pm.
    </p>
    <div className="flex flex-wrap gap-4">
      <Button size="hero" emphasis>Register for Summer 2026</Button>
      <Button variant="outline">Schedule a Tour</Button>
    </div>
  </div>
</section>
```
