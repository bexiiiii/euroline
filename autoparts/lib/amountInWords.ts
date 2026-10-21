// Число прописью по-русски: для накладной ("Всего ... на сумму (прописью)").

const ONES_M = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
const ONES_F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
const TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
  'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать']
const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто']
const HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот']

// [один, два-четыре, пять+], женский род
const SCALES: { forms: [string, string, string]; feminine: boolean }[] = [
  { forms: ['', '', ''], feminine: false },
  { forms: ['тысяча', 'тысячи', 'тысяч'], feminine: true },
  { forms: ['миллион', 'миллиона', 'миллионов'], feminine: false },
  { forms: ['миллиард', 'миллиарда', 'миллиардов'], feminine: false },
]

export function plural(n: number, forms: [string, string, string]): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 19) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}

function triad(n: number, feminine: boolean): string[] {
  const words: string[] = []
  words.push(HUNDREDS[Math.floor(n / 100)])
  const rest = n % 100
  if (rest >= 10 && rest < 20) {
    words.push(TEENS[rest - 10])
  } else {
    words.push(TENS[Math.floor(rest / 10)])
    words.push((feminine ? ONES_F : ONES_M)[rest % 10])
  }
  return words.filter(Boolean)
}

/** Целое число прописью, мужской род ("сто двадцать три"). */
export function numberToWords(value: number, feminine = false): string {
  let n = Math.floor(Math.abs(value))
  if (n === 0) return 'ноль'
  const parts: string[] = []
  for (let scale = 0; n > 0 && scale < SCALES.length; scale++) {
    const chunk = n % 1000
    n = Math.floor(n / 1000)
    if (chunk === 0) continue
    const { forms, feminine: scaleFeminine } = SCALES[scale]
    const words = triad(chunk, scale === 0 ? feminine : scaleFeminine)
    if (scale > 0) words.push(plural(chunk, forms))
    parts.unshift(words.join(' '))
  }
  return parts.join(' ')
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "Одна тысяча двести тенге 50 тиын" */
export function tengeInWords(amount: number): string {
  const tenge = Math.floor(Math.abs(amount))
  const tiyn = Math.round((Math.abs(amount) - tenge) * 100)
  return `${capitalize(numberToWords(tenge))} тенге ${String(tiyn).padStart(2, '0')} тиын`
}
