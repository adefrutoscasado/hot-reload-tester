import { returnArg } from './../src'

const myBeverage = {
  delicious: true,
  sour: false,
}

describe('my beverage', () => {
  test('is delicious', () => {
    expect(returnArg(myBeverage.delicious)).toBeTruthy()
  })

  test('is not sour', () => {
    expect(returnArg(myBeverage.sour)).toBeFalsy()
  })
})
