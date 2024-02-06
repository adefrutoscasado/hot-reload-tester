import { datetime, RRule } from 'rrule'
import ExtendedRRule, { ExtendedRRuleArgsOptions } from './../src'


const _ = (obj) => {
  return JSON.stringify(obj)
}



describe('ExtendedRRule behaves similar to RRule while lacking duration', () => {

  const RRuleDefinition = {
    freq: RRule.WEEKLY,
    interval: 5,
    byweekday: [RRule.MO, RRule.FR],
    dtstart: datetime(2012, 2, 1, 10, 30),
    until: datetime(2012, 12, 31),
  }

  const originalRRule = new RRule(RRuleDefinition)
  const extendedRRule = new ExtendedRRule(RRuleDefinition)
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



describe('ExtendedRRule works correctly with a duration of 2 hours', () => {

  const RRuleDefinition: ExtendedRRuleArgsOptions = {
    freq: RRule.DAILY,
    byweekday: [RRule.MO, RRule.FR],
    dtstart: datetime(2024, 1, 29, 10, 0),
    duration: {
      amount: 2,
      unit: 'hours'
    }
  }

  const extendedRRule = new ExtendedRRule(RRuleDefinition)
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



describe('ExtendedRRule works correctly with a duration of 15 days', () => {

  const RRuleDefinition: ExtendedRRuleArgsOptions = {
    freq: RRule.MONTHLY,
    dtstart: datetime(2024, 1, 1, 10, 0),
    duration: {
      amount: 15,
      unit: 'days'
    }
  }

  const extendedRRule = new ExtendedRRule(RRuleDefinition)
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



describe('ExtendedRRule works correctly with duration overlapping', () => {

  const RRuleDefinition: ExtendedRRuleArgsOptions = {
    freq: RRule.DAILY,
    dtstart: datetime(2024, 1, 1, 10, 0),
    count: 5,
    duration: {
      amount: 5,
      unit: 'days'
    }
  }

  const extendedRRule = new ExtendedRRule(RRuleDefinition)
  test('When a single day contains 5 overlapping ocurrences', () => {
    const after = new Date('2024-01-05T11:00:00.000Z')
    const before = new Date('2024-01-05T12:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(
        [
          '2024-01-01T10:00:00.000Z', // -> (return this)
          '2024-01-02T10:00:00.000Z', // -> (return this)
          '2024-01-03T10:00:00.000Z', // -> (return this)
          '2024-01-04T10:00:00.000Z', // -> (return this)
          '2024-01-05T10:00:00.000Z', // -> (return this) (range is here, but intersects ALL ocurrences since the last for 5 days)
        ]
      )
    )
  })
  test('When a single day contains 2 ocurrences that are about to finish', () => {
    const after = new Date('2024-01-08T11:00:00.000Z')
    const before = new Date('2024-01-08T12:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(
        [
          '2024-01-04T10:00:00.000Z', // (return this) (finish at 2024-01-09T10:00:00.000Z)
          '2024-01-05T10:00:00.000Z'  // (return this) (finish at 2024-01-10T10:00:00.000Z)
        ]
      )
    )
  })
  test('When a contains 2 ocurrences that are about to finish', () => {
    const after = new Date('2024-01-10T11:00:00.000Z')
    const before = new Date('2024-01-10T12:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      // last event finishes at 2024-01-10T10:00:00.000Z, so no intersections.
      .toBe(_([])
    )
  })
})

describe('ExtendedRRule works correctly with duration overlapping for a duration of 1 month', () => {

  const RRuleDefinition: ExtendedRRuleArgsOptions = {
    freq: RRule.DAILY,
    dtstart: datetime(2024, 1, 1, 10, 0),
    count: 5,
    duration: {
      amount: 1,
      unit: 'month'
    }
  }

  const extendedRRule = new ExtendedRRule(RRuleDefinition)
  test('When we are checking the start of the recurrence', () => {
    const after = new Date('2024-01-01T09:00:00.000Z')
    const before = new Date('2024-01-15T12:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(
        [
          // range start here
          '2024-01-01T10:00:00.000Z', // -> (return this)
          '2024-01-02T10:00:00.000Z', // -> (return this)
          '2024-01-03T10:00:00.000Z', // -> (return this)
          '2024-01-04T10:00:00.000Z', // -> (return this)
          '2024-01-05T10:00:00.000Z', // -> (return this) 
          // range finish here
        ]
      )
    )
  })
  test('When we are checking the middle of the recurrence', () => {
    const after = new Date('2024-01-16T09:00:00.000Z')
    const before = new Date('2024-01-16T12:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(
        [
          '2024-01-01T10:00:00.000Z', // -> (return this)
          '2024-01-02T10:00:00.000Z', // -> (return this)
          '2024-01-03T10:00:00.000Z', // -> (return this)
          '2024-01-04T10:00:00.000Z', // -> (return this)
          '2024-01-05T10:00:00.000Z', // -> (return this) 
          // (range is here, but intersects ALL ocurrences since they last for 1 month)
        ]
      )
    )
  })
  test('When we are checking the entire recurrence', () => {
    const after = new Date('2023-01-01T09:00:00.000Z') // 2023!
    const before = new Date('2025-01-01T12:00:00.000Z') // 2025!
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(
        [
          // range start here
          //
          '2024-01-01T10:00:00.000Z', // -> (return this)
          '2024-01-02T10:00:00.000Z', // -> (return this)
          '2024-01-03T10:00:00.000Z', // -> (return this)
          '2024-01-04T10:00:00.000Z', // -> (return this)
          '2024-01-05T10:00:00.000Z', // -> (return this)
          //
          // range finish here
        ]
      )
    )
  })
  test('When we are checking the end of the recurrence', () => {
    const after = new Date('2024-02-01T09:00:00.000Z')
    const before = new Date('2024-02-15T12:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(
        [
          '2024-01-01T10:00:00.000Z', // -> (return this)
          '2024-01-02T10:00:00.000Z', // -> (return this)
          '2024-01-03T10:00:00.000Z', // -> (return this)
          '2024-01-04T10:00:00.000Z', // -> (return this)
          '2024-01-05T10:00:00.000Z', // -> (return this)
          //  (range is here, but intersects ALL ocurrences since they last for 1 month)
        ]
      )
    )
  })
  test('When we are checking the end of the recurrence (removing first ocurrence)', () => {
    const after = new Date('2024-02-01T11:00:00.000Z')
    const before = new Date('2024-02-15T12:00:00.000Z')
    expect(_(extendedRRule.between(after, before)))
      .toBe(_(
        [
          // '2024-01-01T10:00:00.000Z', // -> out of range
          // range starts here
          '2024-01-02T10:00:00.000Z', // -> (return this)
          '2024-01-03T10:00:00.000Z', // -> (return this)
          '2024-01-04T10:00:00.000Z', // -> (return this)
          '2024-01-05T10:00:00.000Z', // -> (return this)
          // range finish here
        ]
      )
    )
  })
})