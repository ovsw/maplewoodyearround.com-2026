import { documentId, reference, key, destination, plainBlocks, portableText } from './html.mjs';
import { equal } from './write.mjs';

const common = { name: 'title', slug: 'slug', order: 'order', description: 'description' };
const facility = { ...common, 'main-image': 'image', published: 'visible', 'indoor-outdoor': 'location' };
const staff = { name: 'name', slug: 'slug', photo: 'image', 'role-title-position': 'role', 'years-at-maplewood': 'yearsAtMaplewood', order: 'order', live: 'visible' };
const schedule = { ...common, activity: 'activity', image: 'image', program: 'audience' };

// Explicit field contract from content-model.md. Unknown fields fail closed.
export const mappings = {
  'SC Facilities': ['facility', 'summerCamp', { ...facility, 'category-multi': 'categories' }],
  'SC Facility Categories': ['facilityCategory', 'summerCamp', { name: 'title', slug: 'slug' }],
  Seasons: ['season', null, { name: 'title', slug: 'slug' }],
  'SY Activities': ['activity', 'schoolYear', { ...common, 'main-image': 'image', availability: 'availability', programs: 'programs', live: 'visible', 'is-playground-2': 'playgroundLabel', 'indoor-outdoor-special': 'location' }],
  'SY Programs': ['programOffering', 'schoolYear', { name: 'title', slug: 'slug', days: 'days', 'activities-2': 'activities', color: 'color', 'program-page': 'destination', live: 'visible' }],
  Testimonials: ['testimonial', null, { name: 'internalTitle', slug: 'slug', 'author-name': 'name', 'testimonial-text': 'body', 'plural-parents-vs-parent': 'pluralParents', location: 'origin', season: 'program', live: 'visible', order: 'order' }],
  'Blog Posts': ['post', null, { name: 'title', slug: 'slug', 'post-date': 'publishedAt', 'post-body': 'body', 'post-summary': 'excerpt', 'main-image': 'image', author: 'author', category: 'category', 'seo-title': 'meta.title', 'seo-description': 'meta.description' }],
  'Blog Authors': ['author', null, { name: 'name', slug: 'slug', picture: 'image', role: 'role' }],
  'Blog Categories': ['category', null, { name: 'title', slug: 'slug', color: 'color' }],
  'SC Activity Categories': ['activityCategory', null, { name: 'title', slug: 'slug', activities: 'activities' }],
  'SC Activities': ['activity', 'summerCamp', { ...common, category: 'category', 'main-image': 'image', published: 'visible', 'sc-groups-ages': 'groups', 'entering-grade-from-group': 'gradeLabel', 'group-text': 'groupText', 'order-2': 'order' }],
  'SC Staff Members': ['staffMember', 'summerCamp', { ...staff, 'year-round-staff-member': 'yearRound', 'former-camper': 'formerCamper' }],
  'SY Staff Members': ['staffMember', 'schoolYear', { ...staff, 'degrees-training': 'training', 'does-sy-tours': 'givesTours', 'is-preschool-teacher': 'preschoolTeacher' }],
  'SC Groups': ['campGroup', null, { name: 'title', slug: 'slug', 'entering-grade-2': 'grades', gender: 'gender', activities: 'activities', live: 'visible', 'group-schedule-pdf': null, 'welcome-letter-pdf': null }],
  'SC Grades': ['grade', null, { name: 'title', slug: 'slug' }],
  'SY Playground Characters': ['playgroundCharacter', null, { name: 'title', slug: 'slug', image: 'image', live: 'visible', order: 'order' }],
  'SY Playground Guests': ['playgroundGuest', null, { name: 'title', slug: 'slug', time: 'time', subtitle: 'subtitle', 'person-name': 'personName', 'company-name': 'companyName', 'main-image': 'image', link: 'destination' }],
  'SY Playground Calendars': ['playgroundEvent', null, { name: 'title', slug: 'slug', 'calendar-date': 'date', 'special-guest': 'guest', character: 'character', 'day-of-the-week': 'dayLabel', agenda: 'agenda', 'has-guest-2': 'hasGuest', 'custom-day': 'customDay' }],
  FAQs: ['faq', null, { name: 'title', slug: 'slug', answer: 'body', category: 'categories', order: 'order', grouping: 'program' }],
  'FAQ Categories': ['faqCategory', null, { name: 'title', slug: 'slug' }],
  'Job Opportunities': ['jobOpportunity', null, { name: 'title', slug: 'slug', 'job-description': 'description', 'summer-camp': null, 'school-year': null, seasonal: 'seasonal', live: 'visible', order: 'order' }],
  'Parent Dashboard Cards': ['dashboardCard', null, { name: 'title', slug: 'slug', 'color-theme': 'colorTheme', image: 'image', 'show-image': 'showImage', 'show-icon': 'showIcon', 'icon-code': 'iconCode', 'card-text': 'text', 'link-text': 'linkText', 'link-url': null, 'use-attachment': null, attachment: null, season: 'seasons', order: 'order', live: 'visible', 'use-link': null }],
  'SY Facility Categories': ['facilityCategory', 'schoolYear', { name: 'title', slug: 'slug' }],
  'SY Facilities': ['facility', 'schoolYear', { ...facility, category: 'categories' }],
  'SC Sample Schedules': ['sampleSchedule', 'summerCamp', schedule],
  'SY Sample Schedules': ['sampleSchedule', 'schoolYear', schedule],
  'Playground Calendar PDFs': ['playgroundCalendar', null, { name: 'title', slug: 'slug', pdf: 'file', 'effective-from': 'effectiveFrom' }],
};

export function program(value) {
  if (value === 'Summer Camp') return 'summerCamp';
  if (value === 'School Year' || value === 'School-Year') return 'schoolYear';
  throw new Error('Unknown source program label');
}

export function identityMap(snapshot) {
  const identities = new Map();
  for (const collection of snapshot.collections) {
    const live = new Set(collection.live.map((item) => item.id));
    for (const item of [...collection.live, ...collection.staged]) identities.set(`${collection.id}:${item.id}`, {
      id: documentId(collection.id, item.id), live: live.has(item.id),
    });
  }
  return identities;
}

export function mapItem(collection, item, context) {
  const mapping = mappings[collection.displayName];
  if (!mapping) throw new Error(`Unmapped collection: ${collection.displayName}`);
  const [type, selectedProgram, fields] = mapping;
  const result = { _id: documentId(collection.id, item.id), _type: type };
  if (selectedProgram) result.program = selectedProgram;
  if (type === 'staffMember') result.profileGroup = 'roster';
  const source = item.fieldData;
  for (const [fieldName, raw] of Object.entries(source)) {
    if (!Object.hasOwn(fields, fieldName)) throw new Error(`Unmapped field ${collection.displayName}.${fieldName}`);
    const target = fields[fieldName];
    if (!target || raw === null || raw === undefined) continue;
    const definition = collection.fields.find((field) => field.slug === fieldName);
    if (!definition) throw new Error(`Missing field schema ${collection.displayName}.${fieldName}`);
    let value = raw;
    if (fieldName === 'slug') value = { _type: 'slug', current: raw };
    else if (definition.type === 'Option' && raw !== '') {
      const option = definition.validations?.options?.find((candidate) => candidate.id === raw);
      if (!option) throw new Error(`Unknown option ${collection.displayName}.${fieldName}`);
      value = target === 'program' ? program(option.name) : option.name;
    } else if (definition.type === 'Image' || definition.type === 'File') value = context.asset(raw, definition.type === 'Image' ? 'image' : 'file');
    else if (definition.type === 'Link') value = destination(raw, context);
    else if (definition.type === 'RichText') value = portableText(raw, context, `${result._id}-${fieldName}`);
    else if (definition.type === 'Reference' || definition.type === 'MultiReference') {
      const makeRef = (id) => {
        const identity = context.identities.get(`${definition.validations?.collectionId}:${id}`);
        if (!identity) throw new Error(`Unresolved reference in ${collection.displayName}.${fieldName}`);
        return { ...reference(identity.id), ...(!identity.live ? { _weak: true } : {}) };
      };
      value = definition.type === 'MultiReference' ? raw.map((id) => ({ ...makeRef(id), _key: key(id) })) : raw ? makeRef(raw) : undefined;
    } else if (type === 'testimonial' && target === 'body' || type === 'post' && target === 'excerpt') value = plainBlocks(raw, `${result._id}-${fieldName}`);
    if (value === undefined) continue;
    if (target.includes('.')) { const [parent, child] = target.split('.'); result[parent] ??= {}; result[parent][child] = value; }
    else result[target] = value;
  }
  if (type === 'season') result.program = program(source.name);
  if (type === 'jobOpportunity') {
    result.programs = [source['summer-camp'] && 'summerCamp', source['school-year'] && 'schoolYear'].filter(Boolean);
    if (context.jobApplication) result.applyLink = destination(context.jobApplication, context);
  }
  if (type === 'programOffering') result.listingGroup = context.programListingGroup?.(item) ?? 'main';
  if (type === 'dashboardCard') {
    const file = source['use-attachment'] && source.attachment?.url;
    const link = source['use-link'] && source['link-url'];
    if (file && link) {
      const shown = context.dashboardLinks?.get(source.slug);
      if (!shown) throw new Error('Dashboard has conflicting destination modes without a rendered link');
      result.destination = destination(shown, context);
    } else if (file) result.destination = { _type: 'contentDestination', kind: 'file', file: context.asset(source.attachment, 'file') };
    else if (link) result.destination = destination(link, context);
    if (!result.destination) delete result.destination;
    // Exact source artwork remains inert; no guessed Lucide replacement.
    if (source['show-icon'] && source['icon-code']) context.warnings.add('dashboard-source-icon-retained-for-page-implementation');
  }
  return result;
}

export function cmsDocuments(snapshot, context) {
  const documents = [], counts = [];
  for (const collection of snapshot.collections) {
    const live = new Map(collection.live.map((item) => [item.id, item]));
    const staged = new Map(collection.staged.map((item) => [item.id, item]));
    for (const item of collection.live) documents.push(mapItem(collection, item, context));
    let drafts = 0;
    for (const item of collection.staged) {
      const published = live.get(item.id);
      if (!published || !equal(item.fieldData, published.fieldData) || item.isDraft || item.isArchived) {
        documents.push({ ...mapItem(collection, item, context), _id: `drafts.${documentId(collection.id, item.id)}` });
        drafts++;
      }
    }
    counts.push({ collection: collection.displayName, prefix:`wf-${collection.id}-`, staged: staged.size, live: live.size, unique: new Set([...live.keys(), ...staged.keys()]).size, publishedDocuments: live.size, draftDocuments: drafts });
  }
  return { documents, counts };
}
