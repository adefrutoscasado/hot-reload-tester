

import { datetime, RRule, RRuleSet, rrulestr } from 'rrule'
import moment = require('moment')

/**
 * Returns if two ranges of dates are in intersection
 *
 * @param {Moment} eventStart
 * @param {Moment} eventEnd
 * @param {Moment} startThresoldDate
 * @param {Moment} endThresoldDate
 * @return {boolean}
 */
const eventIntersectThresold = (
  eventStart: moment.Moment,
  eventEnd: moment.Moment,
  startThresoldDate: moment.Moment,
  endThresoldDate: moment.Moment
) =>
  (
    (
    // case when thresold contains entirely the event. Cases when event limits cut the thresold.
      eventStart.isBetween(startThresoldDate, endThresoldDate, null, '[]') ||
      eventEnd.isBetween(startThresoldDate, endThresoldDate, null, '[]')
    )
      ||
    (
    // case when event contains entirely the thresold.
      eventStart.isSameOrBefore(startThresoldDate) &&
      eventEnd.isSameOrAfter(endThresoldDate)
    )
  )

type RRuleArgs = ConstructorParameters<typeof RRule> 

// RRule has two arguments: options, noCache
type RRuleArgsOptions = RRuleArgs[0] 
type RRuleArgsNoCache = RRuleArgs[1] 

// Our argument extension type: duration
type Duration = {
  // TODO: should be always positive
  amount: moment.DurationInputArg1,
  unit: moment.unitOfTime.DurationConstructor,
}

// We extend the original arguments of rrule adding duration
export type ExtendedRRuleArgsOptions = RRuleArgsOptions & {duration?: Duration}

export default class ExtendedRRule {
  duration?: Duration;
  rruleOptions: RRuleArgsOptions;
  rrule: RRule;
  constructor(extendedRRuleArgsOptions: ExtendedRRuleArgsOptions, noCache?: RRuleArgsNoCache) {
    const { duration, ...rruleOptions } = extendedRRuleArgsOptions
    this.duration = duration
    this.rruleOptions = rruleOptions
    this.rrule = new RRule(rruleOptions, noCache)
  }

  all(...args: Parameters<typeof this.rrule.all>) {
    return this.rrule.all(...args)
  }

  // returns the ocurrences that intersects the given range in arguments (considering duration)
  between(...args: Parameters<typeof this.rrule.between>) {

    // The inc argument (third argument) defines what happens if dt is an occurrence. With inc == true, if dt itself is an occurrence, it will be returned.
    args[2] = true

    // if no duration, return the result of the original method
    if (!this.duration) {
      return this.rrule.between(...args) 
    }

    // "after" and "before" naming is pretty confusing. Rename to "inferior" and "superior" limits
    const [ after, before ] = args
    const [ inferiorLimit, superiorLimit ] = [ after, before ]


    let durationIntersectingOcurrences = [] as string[]

    const searchDurationIntersectingOcurrences = (passedInferiorLimit: Date) => {      
      if (!this.duration) {
        return
      }

      // we get the closest ocurrence on left to check if the duration intersects the analyzed range
      const adjancentInferiorDateStart = this.rrule.before(passedInferiorLimit)
      // The right ocurrence will never intersect since the duration is walys positive. Ignore.
      // const adjancentInferiorDate = this.rrule.after(after)
      // TODO: que pasa si mas de una ocurrencia intersecciona el rango inferior? solo estoy teniendo en cuenta una fecha

      if (!adjancentInferiorDateStart) {
        return
      }

      const adjancentInferiorDateEnd = moment(adjancentInferiorDateStart).add(this.duration.amount, this.duration.unit)

      const intersectsTheThresold = eventIntersectThresold(
        moment(adjancentInferiorDateStart),
        adjancentInferiorDateEnd,
        moment(inferiorLimit),
        moment(superiorLimit)
      )
      if (intersectsTheThresold) {
        durationIntersectingOcurrences = [adjancentInferiorDateStart.toISOString(), ...durationIntersectingOcurrences]
        // We continue searching ocurences until we find one that doesnt intersects.
        // Could be more than one ocurrence overlapping
        searchDurationIntersectingOcurrences(adjancentInferiorDateStart)
      }
      return
    }

    searchDurationIntersectingOcurrences(inferiorLimit)

    return [...durationIntersectingOcurrences, ...this.rrule.between(...args)]
  }
  // returns the first ocurrence before the given date in arguments
  before(...args: Parameters<typeof this.rrule.before>) {
    return this.rrule.before(...args)
  }
  // returns the first ocurrence after the given date in arguments
  after(...args: Parameters<typeof this.rrule.after>) {
    return this.rrule.after(...args)
  }

}