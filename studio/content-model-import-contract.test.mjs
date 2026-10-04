import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

// Check the schema that typegen and import tools consume, without a live dataset.
const schema = JSON.parse(readFileSync(new URL('./schema.json', import.meta.url), 'utf8'))
function definition(name) {
  const entry = schema.find((item) => item.name === name)
  assert.ok(entry, `Missing import target ${name}`)
  return entry.type === 'document' ? entry : entry.value
}
function field(object, name) {
  assert.ok(object.attributes?.[name], `Missing import field ${name}`)
  return object.attributes[name].value
}
const values = (type) => type.of.map((member) => member.value).sort()
const arrayReference = (type) => type.of.rest.name

test('mapped collection targets exist with independent Summer Camp and School Year programs', () => {
  for (const name of ['activity', 'facility', 'staffMember', 'testimonial', 'faq', 'sampleSchedule']) {
    assert.deepEqual(values(field(definition(name), 'program')), ['schoolYear', 'summerCamp'])
  }
  for (const name of ['activityCategory', 'facilityCategory', 'faqCategory', 'grade', 'campGroup',
    'programOffering', 'playgroundCharacter', 'playgroundGuest', 'playgroundEvent', 'playgroundCalendar',
    'jobOpportunity', 'dashboardCard', 'season', 'summerDocuments', 'post', 'category']) {
    definition(name)
  }
})

test('source multi-references remain arrays, and facility grade mappings can remain unset', () => {
  assert.equal(arrayReference(field(definition('faq'), 'categories')), 'faqCategory.reference')
  assert.equal(arrayReference(field(definition('facility'), 'categories')), 'facilityCategory.reference')
  assert.equal(arrayReference(field(definition('facility'), 'grades')), 'grade.reference')
  assert.equal(definition('facility').attributes.grades.optional, true)
  assert.equal(arrayReference(field(definition('activity'), 'groups')), 'campGroup.reference')
  assert.equal(arrayReference(field(definition('activity'), 'programs')), 'programOffering.reference')
  assert.equal(arrayReference(field(definition('campGroup'), 'grades')), 'grade.reference')
})

test('summer files retain grade, group and document kind instead of flattening PDF URLs', () => {
  const group = field(definition('summerDocuments'), 'gradeGroups').of
  assert.equal(field(group, 'grade').name, 'grade.reference')
  const entry = field(group, 'entries').of
  assert.equal(field(entry, 'group').name, 'campGroup.reference')
  assert.deepEqual(values(field(entry, 'kind')), ['schedule', 'welcomeLetter'])
  assert.equal(field(field(entry, 'file'), 'asset').name, 'sanity.fileAsset.reference')
})

test('destinations preserve file assets and CMS references alongside external URLs', () => {
  const destination = definition('contentDestination')
  assert.deepEqual(values(field(destination, 'kind')), ['external', 'file', 'internal'])
  assert.equal(field(field(destination, 'file'), 'asset').name, 'sanity.fileAsset.reference')
  assert.equal(field(destination, 'external').type, 'string')
  const targets = field(destination, 'internal').of.map((member) => member.name)
  for (const target of ['page.reference', 'post.reference', 'parentDashboard.reference', 'blogIndex.reference']) {
    assert.ok(targets.includes(target), `Missing destination ${target}`)
  }
})

test('testimonial CMS titles do not overwrite the public author name', () => {
  const testimonial = definition('testimonial')
  assert.equal(field(testimonial, 'internalTitle').type, 'string')
  assert.equal(field(testimonial, 'name').type, 'string')
  assert.equal(field(testimonial, 'pluralParents').type, 'boolean')
})

test('pages accept the source-specific interactive and collection sections', () => {
  const sections = field(definition('page'), 'blocks').of.of.map((member) => member.rest.name)
  for (const name of ['videoHero', 'videoZoomGrid', 'tabbedHero', 'scrollPanels', 'busMap',
    'imageReveal', 'filterableCards', 'cardSlider', 'summerDocumentList', 'parentDashboardSection']) {
    assert.ok(sections.includes(name), `Page Builder cannot accept ${name}`)
    definition(name)
  }
})
