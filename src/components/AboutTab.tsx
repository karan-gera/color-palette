import {
  ArrowUpRight,
  Braces,
  CheckCircle2,
  Github,
  HardDrive,
  Monitor,
  Palette,
  Star,
} from 'lucide-react'

const PROJECT_URL = 'https://github.com/karan-gera/color-palette'
const ISSUES_URL = `${PROJECT_URL}/issues/new`
const LICENSE_URL = `${PROJECT_URL}/blob/main/LICENSE`

const CAPABILITIES = [
  {
    icon: Palette,
    title: 'build a palette',
    description: 'generate from color relationships, try presets, extract from an image, or tune every color yourself.',
  },
  {
    icon: CheckCircle2,
    title: 'check the result',
    description: 'review contrast, color-vision simulations, harmony, names, variations, and realistic interface previews.',
  },
  {
    icon: Braces,
    title: 'put it to work',
    description: 'copy code, share a url, or export formats for development, design tools, and image workflows.',
  },
]

function ProjectLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex min-h-10 items-center justify-between gap-3 rounded-md border bg-card px-3 py-2 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>{children}</span>
      <ArrowUpRight
        className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
    </a>
  )
}

export default function AboutTab() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 border-b pb-10 md:grid-cols-[minmax(0,1.45fr)_minmax(220px,0.55fr)] md:items-end">
        <div className="space-y-4">
          <p className="text-xs tracking-[0.16em] text-muted-foreground">about paletteport</p>
          <h2
            className="max-w-2xl text-4xl leading-[1.08] tracking-tight md:text-5xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            a color workspace for building, testing, and using palettes.
          </h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            paletteport is made for designers and developers who want practical color tools without an account, a subscription, or a handoff between separate apps.
          </p>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-l pl-4 text-xs">
          <dt className="text-muted-foreground">release</dt>
          <dd>v{__APP_VERSION__}</dd>
          <dt className="text-muted-foreground">stage</dt>
          <dd>public alpha</dd>
        </dl>
      </section>

      <section aria-labelledby="about-capabilities" className="space-y-4">
        <h3 id="about-capabilities" className="text-xs tracking-[0.16em] text-muted-foreground">
          what it helps you do
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-lg border bg-card p-4">
              <Icon className="mb-5 size-4 text-muted-foreground" aria-hidden="true" />
              <h4 className="mb-2 text-sm font-medium">{title}</h4>
              <p className="text-xs leading-5 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="about-data" className="space-y-4">
        <h3 id="about-data" className="text-xs tracking-[0.16em] text-muted-foreground">
          data and limits
        </h3>
        <div className="grid overflow-hidden rounded-lg border md:grid-cols-2 md:divide-x">
          <div className="space-y-3 p-5">
            <HardDrive className="size-4 text-muted-foreground" aria-hidden="true" />
            <h4 className="text-sm font-medium">saved in your browser</h4>
            <p className="text-xs leading-5 text-muted-foreground">
              palettes and preferences use this browser's local storage. there are no accounts, analytics, or palette servers. sharing and exporting are actions you choose.
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              there is no app-level save limit; browser storage limits apply. exports are the safest way to keep a backup.
            </p>
          </div>
          <div className="space-y-3 border-t p-5 md:border-t-0">
            <Monitor className="size-4 text-muted-foreground" aria-hidden="true" />
            <h4 className="text-sm font-medium">public alpha scope</h4>
            <p className="text-xs leading-5 text-muted-foreground">
              the current release supports desktop browsers. mobile layout work is deferred, and offline startup is not yet guaranteed.
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              color generation and analysis are deterministic. no generative ai runs in the product; ai programming assistance was used to help build it.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-project" className="space-y-4">
        <div className="flex items-center gap-2">
          <Github className="size-4 text-muted-foreground" aria-hidden="true" />
          <h3 id="about-project" className="text-xs tracking-[0.16em] text-muted-foreground">
            project
          </h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <ProjectLink href={PROJECT_URL}>view source</ProjectLink>
          <ProjectLink href={PROJECT_URL}>
            <span className="inline-flex items-center gap-2">
              <Star className="size-3.5" aria-hidden="true" />
              star on github
            </span>
          </ProjectLink>
          <ProjectLink href={ISSUES_URL}>report an issue or request a feature</ProjectLink>
          <ProjectLink href={LICENSE_URL}>read the mit license</ProjectLink>
        </div>
        <p className="text-[11px] leading-5 text-muted-foreground">
          paletteport is an open-source project from kaydigit llc.
        </p>
      </section>
    </div>
  )
}
