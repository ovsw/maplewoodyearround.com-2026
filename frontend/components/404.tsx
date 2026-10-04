import Image from "next/image";
import Link from "next/link";
import styles from "./404.module.css";

export default function Custom404() {
  return (
    <section className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.card}>
        <Image
          src="/images/maplewood-404.avif"
          alt="Maplewood staff member dressed as a leprechaun"
          width={1200}
          height={1200}
          sizes="(max-width: 479px) 84vw, 400px"
          className={styles.photo}
        />
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
