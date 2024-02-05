import { datetime, RRule } from 'rrule'
import ExtendedRRule, { ExtendedRRuleArgsOptions } from './../src'


const _ = (obj) => {
  return JSON.stringify(obj)
}


const RRuleDefinitionA = {
  freq: RRule.WEEKLY,
  interval: 5,
  byweekday: [RRule.MO, RRule.FR],
  dtstart: datetime(2012, 2, 1, 10, 30),
  until: datetime(2012, 12, 31),
}


describe('ExtendedRRule behaves similar to RRule while lacking duration', () => {
  const originalRRule = new RRule(RRuleDefinitionA)
  const extendedRRule = new ExtendedRRule(RRuleDefinitionA)
  test('when using "all" method', () => {
    expect(_(originalRRule.all())).toBe(_(extendedRRule.all()))
    // console.log('all', originalRRule.all())
      // ...
      // 2012-06-22T10:30:00.000Z,
      // 2012-07-23T10:30:00.000Z,
      // 2012-07-27T10:30:00.000Z,
      // 2012-08-27T10:30:00.000Z,
      // ...
  })
  test('when using "between" method', () => {
    const after = new Date('2012-06-22T10:30:00.000Z')
    const before = new Date('2012-08-27T10:30:00.000Z')
    expect(_(originalRRule.between(after, before, true))) // extendedRRule sets 'include' as true by default
      .toBe(_(extendedRRule.between(after, before)))
    // console.log('between', originalRRule.between(after, before))
      // ...
      // 2012-06-22T10:30:00.000Z, (after this)
      // 2012-07-23T10:30:00.000Z, -> (return this)
      // 2012-07-27T10:30:00.000Z, -> (return this)
      // 2012-08-27T10:30:00.000Z, (before this)
      // ...
  })
  test('when using "before" method', () => {
    const before = new Date('2012-08-27T10:30:00.000Z')
    expect(_(originalRRule.before(before)))
      .toBe(_(extendedRRule.before(before)))
    // console.log('before', originalRRule.before(before))
      // ...
      // 2012-06-22T10:30:00.000Z,
      // 2012-07-23T10:30:00.000Z,
      // 2012-07-27T10:30:00.000Z, -> (return this)
      // 2012-08-27T10:30:00.000Z, (before this)
      // ...
  })
  test('when using "after" method', () => {
    const after = new Date('2012-06-22T10:30:00.000Z')
    expect(_(originalRRule.after(after)))
      .toBe(_(extendedRRule.after(after)))
    // console.log('after', originalRRule.after(after))
      // ...
      // 2012-06-22T10:30:00.000Z, (after this)
      // 2012-07-23T10:30:00.000Z, -> (return this)
      // 2012-07-27T10:30:00.000Z,
      // 2012-08-27T10:30:00.000Z, 
      // ...
  })
})

const RRuleDefinitionB: ExtendedRRuleArgsOptions = {
  freq: RRule.DAILY,
  byweekday: [RRule.MO, RRule.FR],
  dtstart: datetime(2024, 1, 29, 10, 0),
  duration: {
    amount: 2,
    unit: 'hours'
  }
}

describe('ExtendedRRule works correctly with a duration of 2 hours', () => {
  const extendedRRule = new ExtendedRRule(RRuleDefinitionB)
  test('when first limit of range intersects the duration of first ocurrence', () => {
    const after = new Date('2024-01-29T11:00:00.000Z')
    const before = new Date('2024-02-02T11:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(['2024-01-29T10:00:00.000Z', '2024-02-02T10:00:00.000Z']))
    // [
    //   '2024-01-29T10:00:00.000Z', -> (return this)
    //                               (range intersects the duration of the first element)
    //   '2024-02-02T10:00:00.000Z', -> (return this)
    //   '2024-02-05T10:00:00.000Z',
    //   '2024-02-09T10:00:00.000Z',
    //   '2024-02-12T10:00:00.000Z',
    //   '2024-02-16T10:00:00.000Z',
    //   ...
  })
  test('when first limit of range intersects the duration of second ocurrence', () => {
    const after = new Date('2024-02-02T09:00:00.000Z')
    const before = new Date('2024-02-02T11:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(['2024-02-02T10:00:00.000Z']))
    // [
    //   '2024-01-29T10:00:00.000Z', -> (return this)
    //                               (range intersects the duration of the first element)
    //   '2024-02-02T10:00:00.000Z',
    //   '2024-02-05T10:00:00.000Z',
    //   '2024-02-09T10:00:00.000Z',
    //   '2024-02-12T10:00:00.000Z',
    //   '2024-02-16T10:00:00.000Z',
    //   ...
  })
  test('when limits of range match exact ocurrences', () => {
    const after = new Date('2024-02-02T10:00:00.000Z')
    const before = new Date('2024-02-09T10:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(['2024-02-02T10:00:00.000Z', '2024-02-05T10:00:00.000Z', '2024-02-09T10:00:00.000Z']))
    // [
    //   '2024-01-29T10:00:00.000Z',
    //   '2024-02-02T10:00:00.000Z', (after) -> (return this)
    //   '2024-02-05T10:00:00.000Z',         -> (return this)
    //   '2024-02-09T10:00:00.000Z', (before)-> (return this)
    //   '2024-02-12T10:00:00.000Z',
    //   '2024-02-16T10:00:00.000Z',
    //   ...
  })
})

const RRuleDefinitionC: ExtendedRRuleArgsOptions = {
  freq: RRule.MONTHLY,
  dtstart: datetime(2024, 1, 1, 10, 0),
  duration: {
    amount: 15,
    unit: 'days'
  }
}

describe('ExtendedRRule works correctly with a duration of 15 days', () => {
  const extendedRRule = new ExtendedRRule(RRuleDefinitionC)
  test('when limit of range (of 1 day) intersects the duration of first ocurrence', () => {
    const after = new Date('2024-02-05T11:00:00.000Z')
    const before = new Date('2024-02-06T11:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(['2024-02-01T10:00:00.000Z']))
    // [
    //   '2024-01-01T10:00:00.000Z',
    //   '2024-02-01T10:00:00.000Z', -> (return this)
    //                               (range intersects the duration of the previous element, but not the event itself)
    //   '2024-03-01T10:00:00.000Z',
    //   ...
  })
  test('when limit of range (of 2 hours) intersects the duration on superior limit', () => {
    const after = new Date('2024-02-16T09:00:00.000Z')
    const before = new Date('2024-02-16T11:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(['2024-02-01T10:00:00.000Z']))
    // [
    //   '2024-01-01T10:00:00.000Z',
    //   '2024-02-01T10:00:00.000Z', -> (return this)
    //                               (range intersects the duration of the previous element, but not the event itself)
    //   '2024-03-01T10:00:00.000Z',
    //   ...
  })
  test('when limit of range (of 5 days) doesnt intersect the duration', () => {
    const after = new Date('2024-02-20T09:00:00.000Z')
    const before = new Date('2024-02-25T11:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_([]))
    // [
    //   '2024-01-01T10:00:00.000Z',
    //   '2024-02-01T10:00:00.000Z', -> (return this)
    //                               (range intersects the duration of the previous element, but not the event itself)
    //   '2024-03-01T10:00:00.000Z',
    //   ...
  })
})
