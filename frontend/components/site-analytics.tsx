import Script from "next/script";

export function SiteAnalytics({
  settings,
  draft = false,
}: {
  settings?: {
    gaMeasurementId?: string | null;
    hotjarSiteId?: string | null;
  } | null;
  draft?: boolean;
}) {
  if (
    draft ||
    process.env.VERCEL_ENV !== "production" ||
    process.env.NEXT_PUBLIC_SITE_ENV !== "production"
  )
    return null;
  const ga = settings?.gaMeasurementId ?? "G-KGKH7W09NG";
  const hotjar = settings?.hotjarSiteId ?? "3477876";
  return (
    <>
      {/^G-[A-Z0-9]+$/.test(ga) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="maplewood-google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', ${JSON.stringify(ga)});
      `}</Script>
        </>
      )}
      {/^[1-9][0-9]*$/.test(hotjar) && (
        <Script id="maplewood-hotjar" strategy="afterInteractive">{`
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${hotjar},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `}</Script>
      )}
    </>
  );
}
