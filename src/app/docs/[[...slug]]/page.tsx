import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Markdown, { headingId } from '@/components/articles/Markdown';
import { DOCS_MENU, DOC_SLUGS, docHref, readDoc } from '@/lib/docs';
import { sharePreview, SITE_NAME } from '@/lib/site-pages';

type Props = { params: Promise<{ slug?: string[] }> };

export function generateStaticParams() {
  return DOC_SLUGS.map(slug => ({ slug: slug === 'index' ? [] : slug.split('/') }));
}

function slugOf(parts: string[] | undefined): string {
  return parts?.length ? parts.join('/') : 'index';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = readDoc(slugOf((await params).slug));
  if (!page) return { title: 'Docs', robots: { index: false } };
  const title = `${page.title} | Docs`;
  return { title, description: page.description, alternates: { canonical: docHref(page.slug) }, ...sharePreview(`${title} | ${SITE_NAME}`, page.description, docHref(page.slug)) };
}

/** A Mintlify-style docs page: the menu, the page, and its headings */
export default async function DocsPage({ params }: Props) {
  const page = readDoc(slugOf((await params).slug));
  if (!page) notFound();
  const index = DOC_SLUGS.indexOf(page.slug);
  const previous = index > 0 ? readDoc(DOC_SLUGS[index - 1]) : null;
  const next = index < DOC_SLUGS.length - 1 ? readDoc(DOC_SLUGS[index + 1]) : null;
  const headings = [...page.body.matchAll(/^## (.+)$/gm)].map(match => match[1]);

  return (
    <div className="mx-auto grid max-w-7xl gap-8 p-4 md:p-10 lg:grid-cols-[220px_minmax(0,1fr)_200px]">
      <nav aria-label="Docs" className="space-y-6 text-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        {DOCS_MENU.map(tab => (
          <div key={tab.tab} className="space-y-4">
            <p className="font-semibold uppercase tracking-wide text-muted-foreground text-xs">{tab.tab}</p>
            {tab.groups.map(group => (
              <div key={group.group} className="space-y-1">
                <p className="font-semibold">{group.group}</p>
                <ul className="space-y-1 border-l">
                  {group.pages.map(slug => {
                    const item = readDoc(slug);
                    const current = slug === page.slug;
                    return (
                      <li key={slug}>
                        <Link href={docHref(slug)} aria-current={current ? 'page' : undefined}
                          className={`-ml-px block border-l py-1 pl-3 hover:text-foreground ${current ? 'border-primary font-medium text-foreground' : 'border-transparent text-muted-foreground'}`}>
                          {item?.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <article className="min-w-0 space-y-6">
        <header className="space-y-2 border-b pb-6">
          <h1 className="text-3xl font-headline md:text-4xl">{page.title}</h1>
          <p className="text-lg text-muted-foreground">{page.description}</p>
        </header>
        <Markdown text={page.body} />
        <div className="flex justify-between gap-4 border-t pt-6 text-sm">
          {previous ? <Link href={docHref(previous.slug)} className="flex items-center gap-1 hover:text-primary"><ChevronLeft className="h-4 w-4" aria-hidden="true" />{previous.title}</Link> : <span />}
          {next && <Link href={docHref(next.slug)} className="flex items-center gap-1 text-right hover:text-primary">{next.title}<ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>}
        </div>
      </article>

      {headings.length > 0 && (
        <aside aria-label="On this page" className="hidden text-sm lg:sticky lg:top-20 lg:block lg:self-start">
          <p className="mb-2 font-semibold">On this page</p>
          <ul className="space-y-1">
            {headings.map(heading => <li key={heading}><a href={`#${headingId(heading)}`} className="text-muted-foreground hover:text-foreground">{heading}</a></li>)}
          </ul>
        </aside>
      )}
    </div>
  );
}
