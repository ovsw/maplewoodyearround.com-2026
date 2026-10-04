import Image from "next/image";
import Link from "next/link";
import styles from "./404.module.css";
import { fetchSanitySettings } from "@/sanity/lib/fetch";
import { getDynamicFetchOptions } from "@/sanity/lib/live";
import { urlFor } from "@/sanity/lib/image";

export default async function Custom404() {
  const options = await getDynamicFetchOptions();
  const settings = await fetchSanitySettings(options);
  const photo = settings?.notFoundImage;
  const dimensions = photo?.asset?.metadata?.dimensions;
  return (
    <section className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.card}>
        {photo?.asset && dimensions?.width && dimensions.height && (
          <Image
            src={urlFor(photo).width(800).url()}
            alt={photo.alt ?? ""}
            width={dimensions.width}
            height={dimensions.height}
            sizes="(max-width: 479px) 84vw, 400px"
            className={styles.photo}
          />
        )}
        <h1 id="not-found-title">😅 Oops!</h1>
        <p>
          The page you are looking for doesn&apos;t exist
          <br />
          or has been moved...
        </p>
        <h2>Better luck next time!🍀</h2>
        <Link href="/" className={styles.home}>
          Back to Homepage
        </Link>
      </div>
    </section>
  );
}
