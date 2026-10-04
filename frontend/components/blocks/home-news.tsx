import Link from "next/link";
import { stegaClean } from "next-sanity";
import { SectionImage, type SectionProps } from "./maplewood-section";
import css from "./maplewood-home.module.css";

type Article = NonNullable<SectionProps<"latestArticles">["articles"]>[number];
function NewsArticle({
  article,
  featured,
}: {
  article: Article;
  featured?: boolean;
}) {
  const slug = stegaClean(article.slug?.current);
  return (
    <article className={featured ? css.newsFeatured : css.newsCard}>
      <SectionImage
        image={article.image}
        sizes={
          featured
            ? "(max-width: 767px) 90vw, 45vw"
            : "(max-width: 767px) 90vw, 30vw"
        }
      />
      <div className={css.newsContent}>
        {article.category?.title ? (
          <span
            className={css.newsCategory}
            style={{
              backgroundColor: stegaClean(article.category.color) || undefined,
            }}
          >
            {article.category.title}
          </span>
        ) : null}
        <h3>
          {slug ? (
            <Link href={`/post/${slug}`}>{article.title}</Link>
          ) : (
            article.title
          )}
        </h3>
        <p>{article.excerpt}</p>
        <div className={css.newsAuthor}>
          <SectionImage image={article.author?.image} sizes="48px" />
          <span>
            {article.author?.name}
            {article.publishedAt ? (
              <time dateTime={stegaClean(article.publishedAt)}>
                {new Intl.DateTimeFormat("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(stegaClean(article.publishedAt)))}
              </time>
            ) : null}
          </span>
        </div>
      </div>
    </article>
  );
}
export default function HomeNews({
  title,
  eyebrow,
  description,
  selectedArticles,
  articles,
  limit,
  dataAttribute,
}: SectionProps<"latestArticles">) {
  const posts = (
    selectedArticles?.length
      ? selectedArticles.filter((post) => post !== null)
      : articles || []
  ).slice(0, Math.max(1, Math.min(12, limit ?? 4)));
  return (
    <section className={css.news} id="blog-header-7">
      <div className={css.container}>
        {eyebrow ? (
          <p className={css.eyebrow} data-sanity={dataAttribute?.("eyebrow")}>
            {eyebrow}
          </p>
        ) : null}
        <h2 data-sanity={dataAttribute?.("title")}>{title}</h2>
        <p
          className={css.newsIntro}
          data-sanity={dataAttribute?.("description")}
        >
          {description}
        </p>
        <div data-sanity={dataAttribute?.("selectedPosts")}>
          {posts[0] ? <NewsArticle article={posts[0]} featured /> : null}
          <div className={css.newsGrid}>
            {posts.slice(1).map((post) => (
              <NewsArticle key={post._id} article={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
