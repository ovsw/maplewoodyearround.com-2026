import { key, text, destination, reference } from './html.mjs';
import { pageId } from './pages.mjs';

export function globalDocuments(snapshot, context) {
  const dom=context.pageDocuments.get('/');
  const footer=dom.querySelector('footer');
  const nav=dom.querySelector('.navbar19_menu');
  if(!footer||!nav)throw new Error('Public source navigation or footer is missing');
  const link=(node,type,prefix)=>{
    const target=destination(node.getAttribute('href'),context);
    return target?{_key:key(prefix),_type:type,label:text(node),destination:{...target,_type:type.startsWith('footer')?'footerDestination':'navigationDestination',openInNewTab:node.target==='_blank'}}:undefined;
  };
  const links=(node,selector,type,prefix)=>[...node.querySelectorAll(selector)].map((n,i)=>link(n,type,`${prefix}-${i}`)).filter(Boolean);
  const featured=[...nav.querySelectorAll('.navbar19_link-large')].map((node,i)=>{
    const item=link(node,'navigationLink',`featured-${i}`);
    if(!item)return undefined;
    item.accent=[...node.classList].find((c)=>c.startsWith('u-accent-'))?.slice(9)??'none';
    const svg=node.querySelector('svg')?.cloneNode(true);
    if(svg) {
      svg.querySelectorAll('script,foreignObject,use').forEach((n)=>n.remove());
      for(const element of [svg,...svg.querySelectorAll('*')])for(const attr of [...element.attributes])if(/^on/i.test(attr.name)||/href/i.test(attr.name))element.removeAttribute(attr.name);
      item.icon={_type:'icon',svg:svg.outerHTML};
    }
    return item;
  }).filter(Boolean);
  const groups=[...nav.querySelectorAll('.navbar19_link-column')].map((node,i)=>({_key:key(`group-${i}`),_type:'navigationGroup',label:text(node.firstElementChild),
    ...(node.firstElementChild.querySelector('a[href]')?{destination:link(node.firstElementChild.querySelector('a[href]'),'navigationLink','group').destination}:{}),
    links:links(node,'.navbar19_link-list a[href]','navigationChildLink',`group-${i}`)}));
  const navigation={_id:'navigation',_type:'navigation',items:[...featured,...groups],actions:links(dom,'.navbar19_link-wrapper a[href]','navigationAction','action')};
  const columns=[...footer.querySelectorAll('.footer16_link-column')].map((node,i)=>({_key:key(`column-${i}`),_type:'footerColumn',heading:text(node.firstElementChild),links:links(node,'a[href]','footerLink',`footer-${i}`)}));
  const credit=text(footer.querySelector('.footer16_credit-text'));
  const copyright=credit.match(/©\s*(\d{4})\s*(.*?)\s*All rights reserved\./);
  if(!copyright)throw new Error('Footer copyright source shape changed');
  const aca=footer.querySelector('.aca-logo');
  const footerImage=aca?context.asset(aca.src,'image',aca.alt):undefined;
  if(footerImage)delete footerImage.alt; // The footerLogo parent owns its alt field.
  const footerDoc={_id:'footer',_type:'footer',columns,legalLinks:links(footer,'.footer16_legal-link','footerLink','legal'),
    copyrightStartYear:Number(copyright[1]),copyrightOwner:copyright[2],
    logos:aca?[{_key:'aca',_type:'footerLogo',alt:aca.alt,image:footerImage}]:[],
    newsletter:{heading:'',description:text(footer.querySelector('.footer16_left-wrapper > .text-size-small')),successMessage:text(footer.querySelector('.w-form-done')),errorMessage:text(footer.querySelector('.w-form-fail'))}};
  const contactNode=footer.querySelector('.display-inlineflex .text-size-small');
  const contactText=text(contactNode);
  const address=contactText.match(/Location:\s*(.*?)Mailing address:\s*(.*)/);
  if(!address)throw new Error('Footer address source shape changed');
  const location=address[1].trim();const mailing=address[2].match(/^(P\.O\. Box \d+)\s*(.*)$/);
  if(!mailing)throw new Error('Footer mailing address source shape changed');
  const logo=dom.querySelector('.navbar19_logo');
  const socialLabels=new Map(columns.flatMap((c)=>c.links).filter((l)=>l.destination.kind==='external').map((l)=>[new URL(l.destination.external).hostname,l.label]));
  const socialLinks=[...nav.querySelectorAll('.navbar19_social-link')].map((a,i)=>({_key:key(`social-${i}`),_type:'socialLink',label:socialLabels.get(new URL(a.href).hostname)??(a.href.includes('linkedin.com')?'LinkedIn':a.href.includes('twitter.com')?'X':undefined),url:a.href}));
  if(socialLinks.some((l)=>!l.label))throw new Error('A social link has no public label');
  const settings={_id:'settings',_type:'settings',siteName:text(footer.querySelector('.footer_big-logo'))||'Maplewood',
    logo:{light:context.asset(logo.src,'image',logo.alt)},socialLinks,
    gaMeasurementId:dom.documentElement.innerHTML.match(/G-[A-Z0-9]{10}/)?.[0],hotjarSiteId:dom.documentElement.innerHTML.match(/hjid\s*:\s*(\d+)/)?.[1],
    contact:{_type:'contactDetails',phone:text(contactNode.querySelector('a[href^="tel:"]')),email:new URL(contactNode.querySelector('a[href^="mailto:"]').href).pathname,
      fax:contactText.match(/Fax:\s*([\d-]+)/)?.[1],addressLines:[`Location: ${location}`,`Mailing address: ${mailing[1]}`,mailing[2]],
      menuAddress:text(nav.querySelector('.navbar19_menu-left-bottom')).replace(/^.*?([\d]+ Foundry)/,'$1')}};
  const notFoundPage=snapshot.pageRecords.find((page)=>page.publishedPath==='/404');
  const notFoundNode=snapshot.pageDom[notFoundPage?.id]?.find((node)=>node.type==='image'&&node.image.assetId);
  const notFoundAsset=snapshot.assets.find((asset)=>asset.id===notFoundNode?.image.assetId);
  if(notFoundAsset)settings.notFoundImage=context.asset(notFoundAsset.hostedUrl,'image',notFoundNode.image.alt??notFoundAsset.altText??'');
  return [settings,navigation,footerDoc,...sourceRedirects(context)];
}

// Webflow site redirects are not in the Data API snapshot. The live site
// answers these old paths with a 301 (checked 2026-10-04).
const SOURCE_REDIRECTS=[['/school-year/programs/indoor-outdoor-playground','/school-year/programs/indoor-outdoor-play-center']];

export function sourceRedirects(context) {
  return SOURCE_REDIRECTS.map(([source,target])=>{
    if(!context.routes?.has(target))throw new Error(`A redirect target is not an imported page: ${target}`);
    return {_id:`wf-redirect-${key(source)}`,_type:'redirect',status:'active',source:{_type:'slug',current:source},destinationReference:reference(pageId(target)),permanent:'true'};
  });
}
