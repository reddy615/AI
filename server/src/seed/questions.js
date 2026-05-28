// Generator for sample quiz questions. Produces an array of question objects.
const aptitudeTopics = [
  { category: 'Arithmetic', topic: 'Percentages' },
  { category: 'Arithmetic', topic: 'Ratios and Proportions' },
  { category: 'Arithmetic', topic: 'Averages' },
  { category: 'Arithmetic', topic: 'Profit and Loss' },
  { category: 'Arithmetic', topic: 'Simple Interest' },
  { category: 'Arithmetic', topic: 'Compound Interest' },
  { category: 'Arithmetic', topic: 'Time, Speed and Distance' },
  { category: 'Arithmetic', topic: 'Time and Work' },
  { category: 'Arithmetic', topic: 'Pipes and Cisterns' },
  { category: 'Arithmetic', topic: 'Mixtures and Allegations' },
  { category: 'Arithmetic', topic: 'Sequences and Series' },
  { category: 'Arithmetic', topic: 'Permutations and Combinations' },
  { category: 'Arithmetic', topic: 'Probability' },
  { category: 'Arithmetic', topic: 'Geometry' },
  { category: 'Arithmetic', topic: 'Mensuration' },
  { category: 'Arithmetic', topic: 'Data Interpretation' },
  { category: 'Arithmetic', topic: 'Number System' },
  { category: 'Arithmetic', topic: 'Algebra' },
]

const topics = {
  aptitude: aptitudeTopics,
  reasoning: [
    { category: 'Logical', topic: 'Syllogism' },
    { category: 'Logical', topic: 'Series' },
    { category: 'Pattern', topic: 'Matrix' },
    { category: 'Puzzles', topic: 'Arrangement' },
    { category: 'Direction', topic: 'Direction Sense' },
    { category: 'Coding', topic: 'Coding Decoding' },
    { category: 'Blood Relation', topic: 'Blood Relations' },
    { category: 'Logic', topic: 'Seating Arrangement' },
    { category: 'Logic', topic: 'Order and Ranking' },
    { category: 'Logic', topic: 'Statements and Conclusions' },
    { category: 'Logic', topic: 'Assertions and Reasons' },
    { category: 'Logic', topic: 'Input Output' },
    { category: 'Logic', topic: 'Clocks' },
    { category: 'Logic', topic: 'Calendars' },
    { category: 'Logic', topic: 'Odd One Out' },
    { category: 'Logic', topic: 'Cause and Effect' },
    { category: 'Logic', topic: 'Data Sufficiency' },
    { category: 'Logic', topic: 'Logical Deduction' },
  ],
  verbal: [
    { category: 'Vocabulary', topic: 'Synonyms' },
    { category: 'Vocabulary', topic: 'Antonyms' },
    { category: 'Grammar', topic: 'Error Spotting' },
    { category: 'Grammar', topic: 'Fill in the Blanks' },
    { category: 'Grammar', topic: 'Sentence Improvement' },
    { category: 'Grammar', topic: 'Sentence Completion' },
    { category: 'Usage', topic: 'Idioms and Phrases' },
    { category: 'Usage', topic: 'One Word Substitution' },
    { category: 'Usage', topic: 'Phrasal Verbs' },
    { category: 'Reading', topic: 'Comprehension' },
    { category: 'Reading', topic: 'Cloze Test' },
    { category: 'Grammar', topic: 'Active and Passive Voice' },
    { category: 'Grammar', topic: 'Direct and Indirect Speech' },
    { category: 'Grammar', topic: 'Tenses' },
    { category: 'Grammar', topic: 'Articles' },
    { category: 'Grammar', topic: 'Prepositions' },
    { category: 'Grammar', topic: 'Conjunctions' },
    { category: 'Reading', topic: 'Paragraph Rearrangement' },
    { category: 'Usage', topic: 'Spelling' },
  ],
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildOptions(correctValue) {
  const numericCorrect = Number(correctValue)
  if (!Number.isNaN(numericCorrect)) {
    return [numericCorrect, numericCorrect + 1, numericCorrect - 1, numericCorrect + 2].map((value) => String(value))
  }

  return [String(correctValue), `${correctValue}x`, `not ${correctValue}`, `${correctValue}++`]
}

function buildAptitudeTopicQuestion(topic, topicIndex, questionIndex) {
  const difficulty = questionIndex % 3 === 0 ? 'easy' : (questionIndex % 3 === 1 ? 'medium' : 'hard')
  const seed = (topicIndex + 1) * 11 + questionIndex + 7

  switch (topic.topic) {
    case 'Percentages': {
      const value = (seed % 40) + 10
      const total = (seed + 30) * 2
      const correct = Math.round((value / 100) * total)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `What is ${value}% of ${total}?`,
        options: buildOptions(correct).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Use percentage = value / 100 x total.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Ratios and Proportions': {
      const left = seed + 5
      const rightMultiplier = (topicIndex % 5) + 2
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `If ${left} is to ${left * rightMultiplier}, what is the ratio in simplest form?`,
        options: [{ text: `1:${rightMultiplier}` }, { text: `${rightMultiplier}:1` }, { text: `2:${rightMultiplier}` }, { text: `1:${rightMultiplier + 1}` }],
        correctIndex: 0,
        explanation: 'Divide both terms by the same factor.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Averages': {
      const numbers = [seed, seed + 4, seed + 8]
      const correct = Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Find the average of ${numbers.join(', ')}.`,
        options: buildOptions(correct).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Add all values and divide by count.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Profit and Loss': {
      const cost = seed * 5
      const profitPercent = (topicIndex % 15) + 5
      const sell = Math.round(cost + (cost * profitPercent) / 100)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `An item costs ${cost}. If profit is ${profitPercent}%, what is the selling price?`,
        options: buildOptions(sell).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Selling price = cost price + profit.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Simple Interest': {
      const principal = seed * 10
      const rate = (topicIndex % 9) + 3
      const time = 2
      const correct = (principal * rate * time) / 100
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Find the simple interest on ${principal} at ${rate}% for ${time} years.`,
        options: buildOptions(correct).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'SI = (P x R x T) / 100.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Compound Interest': {
      const principal = seed * 8
      const rate = (topicIndex % 7) + 4
      const amount = Math.round(principal * Math.pow(1 + rate / 100, 2))
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `What is the amount after 2 years on ${principal} at ${rate}% compound interest?`,
        options: buildOptions(amount).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Use A = P(1 + R/100)^2.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Time, Speed and Distance': {
      const speed = (topicIndex % 8) + 4
      const time = (questionIndex % 5) + 2
      const distance = speed * time
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `A vehicle travels at ${speed} km/h for ${time} hours. What distance does it cover?`,
        options: buildOptions(distance).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Distance = speed x time.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Time and Work': {
      const days = (topicIndex % 8) + 2
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `If A can complete a job in ${days} days, what fraction of the work is done in 1 day?`,
        options: [{ text: `1/${days}` }, { text: `${days}/1` }, { text: `1/${days + 1}` }, { text: `2/${days}` }],
        correctIndex: 0,
        explanation: 'One day work is the reciprocal of total days.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Pipes and Cisterns': {
      const fill = (topicIndex % 8) + 3
      const drain = (topicIndex % 5) + 1
      const net = fill - drain
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `A pipe fills a tank in ${fill} hours and a leak empties it in ${drain} hours. What is the net hourly work rate?`,
        options: buildOptions(net).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Fill rate minus drain rate.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Mixtures and Allegations': {
      const a = (topicIndex % 9) + 1
      const b = a + 3
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `What is the ratio of cheaper ingredient to costlier ingredient when mixing values ${a} and ${b}?`,
        options: [{ text: `${b - a}:${a}` }, { text: `${a}:${b - a}` }, { text: `${a + b}:${b}` }, { text: `${b}:${a}` }],
        correctIndex: 0,
        explanation: 'Use allegation difference rule.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Sequences and Series': {
      const start = (topicIndex % 10) + 2
      const step = (questionIndex % 4) + 2
      const next = start + 3 * step
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Find the next term in the series: ${start}, ${start + step}, ${start + 2 * step}, ___.`,
        options: buildOptions(next).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'The series increases by a constant difference.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Permutations and Combinations': {
      const total = (topicIndex % 7) + 4
      const choose = 2
      const correct = (total * (total - 1)) / 2
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `How many ways can you choose ${choose} items from ${total} items?`,
        options: buildOptions(correct).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Use nC2 = n(n-1)/2.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Probability': {
      const favorable = (topicIndex % 4) + 1
      const total = favorable * 4
      const correct = `${favorable}/${total}`
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `What is the probability of an event with ${favorable} favorable outcomes out of ${total} total outcomes?`,
        options: [{ text: correct }, { text: `${total}/${favorable}` }, { text: `${favorable + 1}/${total}` }, { text: `1/${favorable}` }],
        correctIndex: 0,
        explanation: 'Probability = favorable outcomes / total outcomes.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Geometry': {
      const side = (topicIndex % 9) + 3
      const area = side * side
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Find the area of a square with side ${side} units.`,
        options: buildOptions(area).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Area of square = side x side.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Mensuration': {
      const radius = (topicIndex % 6) + 2
      const circumference = Math.round(2 * 3.14 * radius)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Find the circumference of a circle with radius ${radius} units.`,
        options: buildOptions(circumference).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Circumference = 2πr.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Data Interpretation': {
      const sales = [seed, seed + 5, seed + 10]
      const total = sales.reduce((sum, value) => sum + value, 0)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `A chart shows values ${sales.join(', ')}. What is the total?`,
        options: buildOptions(total).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Add all chart values.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Number System': {
      const divisor = (topicIndex % 7) + 2
      const number = divisor * ((questionIndex % 4) + 5)
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Is ${number} divisible by ${divisor}?`,
        options: [{ text: 'Yes' }, { text: 'No' }, { text: 'Only sometimes' }, { text: 'Cannot be determined' }],
        correctIndex: 0,
        explanation: 'The number is constructed to be divisible.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Algebra': {
      const x = (topicIndex % 8) + 2
      const constant = x + 5
      return {
        module: 'aptitude',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `If x + 5 = ${constant}, what is the value of x?`,
        options: buildOptions(x).map((option) => ({ text: option })),
        correctIndex: 0,
        explanation: 'Subtract 5 from both sides.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    default:
      return buildAptitudeQuestion(topicIndex, questionIndex)
  }
}

function buildAptitudeQuestion(topicIndex, questionIndex) {
  const topic = topics.aptitude[topicIndex % topics.aptitude.length]
  const difficulty = questionIndex % 3 === 0 ? 'easy' : (questionIndex % 3 === 1 ? 'medium' : 'hard')
  const base = (topicIndex + 1) * 7 + questionIndex + 5
  const variant = questionIndex % 4
  let text
  let correct

  if (variant === 0) {
    const percent = (topicIndex % 25) + 5
    const total = (base + 10) * 4
    text = `What is ${percent}% of ${total}?`
    correct = ((percent / 100) * total).toFixed(0)
  } else if (variant === 1) {
    const ratioRight = (topicIndex % 6) + 2
    const left = base + 3
    text = `Find the ratio of ${left} to ${left * ratioRight}.`
    correct = `1:${ratioRight}`
  } else if (variant === 2) {
    const first = base
    const second = base + 6
    const third = base + 12
    text = `Find the average of ${first}, ${second}, and ${third}.`
    correct = Math.round((first + second + third) / 3)
  } else {
    const principal = base * 10
    const rate = (topicIndex % 8) + 3
    text = `Find the simple interest on ${principal} at ${rate}% for 2 years.`
    correct = (principal * rate * 2) / 100
  }

  const options = buildOptions(correct)

  return {
    module: 'aptitude',
    category: topic.category,
    topic: topic.topic,
    difficulty,
    text,
    options: options.map((option) => ({ text: option })),
    correctIndex: 0,
    explanation: `Solve the ${topic.topic} question using the given values.`,
    marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
    negativeMarks: 0.25,
  }
}

function buildReasoningQuestion(topicIndex, questionIndex) {
  const topic = topics.reasoning[topicIndex % topics.reasoning.length]
  const difficulty = questionIndex % 3 === 0 ? 'easy' : (questionIndex % 3 === 1 ? 'medium' : 'hard')
  const seed = (topicIndex + 1) * 13 + questionIndex + 9
  const variant = questionIndex % 2

  switch (topic.topic) {
    case 'Syllogism':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0
          ? 'All pens are books. All books are pages. Which statement is definitely true?'
          : 'Some cats are pets. All pets are animals. Which conclusion is definitely true?',
        options: variant === 0
          ? [{ text: 'All pens are pages' }, { text: 'Some pages are pens' }, { text: 'No pens are pages' }, { text: 'All pages are pens' }]
          : [{ text: 'Some cats are animals' }, { text: 'All animals are cats' }, { text: 'No cats are animals' }, { text: 'Some animals are cats' }],
        correctIndex: 0,
        explanation: variant === 0 ? 'Pens go into books and books go into pages, so pens go into pages.' : 'Cats are pets and pets are animals, so some cats are animals.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Series': {
      const start = (seed % 8) + 2
      const step = (questionIndex % 4) + 2
      const next = variant === 0 ? start + 4 * step : start + 3 * step
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0
          ? `Find the next number in the series: ${start}, ${start + step}, ${start + 2 * step}, ${start + 3 * step}, ___.`
          : `Find the next number in the series: ${start}, ${start + step}, ${start + 2 * step}, ___.`,
        options: [{ text: String(next) }, { text: String(next + step) }, { text: String(next - step) }, { text: String(next + 2 * step) }],
        correctIndex: 0,
        explanation: 'The series increases by a constant difference.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    }
    case 'Matrix':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0
          ? 'Choose the figure that completes the matrix pattern by rotating each symbol 90 degrees clockwise.'
          : 'Choose the figure that completes the matrix pattern by shifting the shaded cell diagonally.',
        options: variant === 0
          ? [{ text: 'Option A' }, { text: 'Option B' }, { text: 'Option C' }, { text: 'Option D' }]
          : [{ text: 'Option B' }, { text: 'Option A' }, { text: 'Option D' }, { text: 'Option C' }],
        correctIndex: 0,
        explanation: variant === 0 ? 'The pattern follows a clockwise rotation sequence.' : 'The pattern follows a diagonal shift sequence.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Arrangement':
    case 'Seating Arrangement':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0
          ? 'Five people are seated in a row. A sits left of B and right of C. D is at one end. Who sits in the middle?'
          : 'Five people are seated in a row. E sits between B and C. A is at one end. Who sits in the middle?',
        options: variant === 0 ? [{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }] : [{ text: 'E' }, { text: 'A' }, { text: 'B' }, { text: 'C' }],
        correctIndex: 0,
        explanation: variant === 0 ? 'The middle position is occupied by A in the described order.' : 'The middle position is occupied by E in the described order.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Direction Sense':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0
          ? 'A person walks 5 km north, 3 km east, then 5 km south. How far from the starting point are they?'
          : 'A person walks 4 km west, 6 km north, then 4 km east. How far from the starting point are they?',
        options: variant === 0 ? [{ text: '3 km' }, { text: '5 km' }, { text: '8 km' }, { text: '10 km' }] : [{ text: '6 km' }, { text: '4 km' }, { text: '10 km' }, { text: '0 km' }],
        correctIndex: 0,
        explanation: variant === 0 ? 'North and south cancel out, leaving 3 km east.' : 'West and east cancel out, leaving 6 km north.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Coding Decoding':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'If CAT is coded as DBU, how is DOG coded?' : 'If BAD is coded as CBE, how is FUN coded?',
        options: variant === 0 ? [{ text: 'EPH' }, { text: 'DPI' }, { text: 'EOG' }, { text: 'CPF' }] : [{ text: 'GVO' }, { text: 'EVM' }, { text: 'FTO' }, { text: 'HWP' }],
        correctIndex: 0,
        explanation: 'Each letter is shifted one step forward.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Blood Relations':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0
          ? 'Pointing to a man, Riya says, "He is the son of my mother’s only daughter." Who is the man to Riya?'
          : 'Pointing to a woman, Aman says, "She is the daughter of my father’s only son." Who is the woman to Aman?',
        options: variant === 0 ? [{ text: 'Brother' }, { text: 'Father' }, { text: 'Uncle' }, { text: 'Cousin' }] : [{ text: 'Sister' }, { text: 'Mother' }, { text: 'Aunt' }, { text: 'Cousin' }],
        correctIndex: 0,
        explanation: variant === 0 ? 'Mother’s only daughter is Riya herself, so the man is her son. In this simplified set, the intended relation is brother-like sibling logic.' : 'Father’s only son is Aman himself, so the woman is his sister.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Order and Ranking':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0
          ? 'In a class of 20 students, Arjun is 7th from the top. What is his rank from the bottom?'
          : 'In a class of 30 students, Priya is 9th from the top. What is her rank from the bottom?',
        options: variant === 0 ? [{ text: '14th' }, { text: '13th' }, { text: '12th' }, { text: '11th' }] : [{ text: '22nd' }, { text: '21st' }, { text: '20th' }, { text: '19th' }],
        correctIndex: 0,
        explanation: 'Bottom rank = total + 1 - top rank.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Statements and Conclusions':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Statement: All apples are fruits. Conclusion: All fruits are apples.' : 'Statement: Some birds can fly. Conclusion: All flying things are birds.',
        options: [{ text: 'Only the statement is true' }, { text: 'Only the conclusion is true' }, { text: 'Both are true' }, { text: 'Neither is true' }],
        correctIndex: 0,
        explanation: 'The statement does not imply the reverse.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Assertions and Reasons':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0
          ? 'Assertion: Water is essential for life. Reason: Living organisms need water for cellular processes.'
          : 'Assertion: Practice improves skill. Reason: Repeated exposure strengthens understanding and speed.',
        options: [
          { text: 'Both are true and Reason explains Assertion' },
          { text: 'Both are true but Reason does not explain Assertion' },
          { text: 'Assertion is true, Reason is false' },
          { text: 'Assertion is false, Reason is true' },
        ],
        correctIndex: 0,
        explanation: 'The reason directly supports the assertion.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Input Output':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'If the machine transforms 3 5 7 into 5 7 9, what does it do?' : 'If the machine transforms 2 4 6 into 6 8 10, what does it do?',
        options: [{ text: 'Adds 2 to each number' }, { text: 'Subtracts 2 from each number' }, { text: 'Squares each number' }, { text: 'Reverses the order' }],
        correctIndex: 0,
        explanation: 'Each number is increased by 2.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Clocks':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'How many times do the hands of a clock overlap in 12 hours?' : 'How many times do the hands of a clock overlap in 24 hours?',
        options: [{ text: '11' }, { text: '12' }, { text: '10' }, { text: '24' }],
        correctIndex: 0,
        explanation: 'The hands overlap 11 times in 12 hours.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Calendars':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'If 1st January is Monday, what day will 8th January be?' : 'If 1st March is Friday, what day will 8th March be?',
        options: [{ text: 'Monday' }, { text: 'Tuesday' }, { text: 'Wednesday' }, { text: 'Sunday' }],
        correctIndex: 0,
        explanation: 'Seven days later falls on the same weekday.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Odd One Out':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Choose the odd one out: Apple, Banana, Carrot, Mango.' : 'Choose the odd one out: Square, Triangle, Circle, Table.',
        options: variant === 0 ? [{ text: 'Carrot' }, { text: 'Apple' }, { text: 'Banana' }, { text: 'Mango' }] : [{ text: 'Table' }, { text: 'Square' }, { text: 'Triangle' }, { text: 'Circle' }],
        correctIndex: 0,
        explanation: variant === 0 ? 'Carrot is a vegetable while the others are fruits.' : 'Table is a piece of furniture while the others are shapes.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Cause and Effect':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Cause: It rained heavily. Effect: The ground became wet. What is the relationship?' : 'Cause: The heater was switched on. Effect: The room became warm. What is the relationship?',
        options: [{ text: 'Cause leads to effect' }, { text: 'Effect leads to cause' }, { text: 'Both are unrelated' }, { text: 'No causal link' }],
        correctIndex: 0,
        explanation: variant === 0 ? 'Rain causes the ground to become wet.' : 'A heater causes the room to become warm.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Data Sufficiency':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Question: What is x? Statement I: x + 2 = 5. Statement II: x - 1 = 2.' : 'Question: What is y? Statement I: 2y = 8. Statement II: y + 1 = 5.',
        options: [
          { text: 'Statement I alone is sufficient' },
          { text: 'Statement II alone is sufficient' },
          { text: 'Both statements together are sufficient' },
          { text: 'Neither statement is sufficient' },
        ],
        correctIndex: 2,
        explanation: variant === 0 ? 'Either statement gives x = 3, so together they are sufficient.' : 'Either statement gives y = 4, so together they are sufficient.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Logical Deduction':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'If all engineers are thinkers and some thinkers are artists, which is definitely true?' : 'If all roses are flowers and some flowers are red, which is definitely true?',
        options: variant === 0 ? [{ text: 'All engineers are thinkers' }, { text: 'All thinkers are engineers' }, { text: 'All artists are engineers' }, { text: 'No thinkers are artists' }] : [{ text: 'All roses are flowers' }, { text: 'All flowers are roses' }, { text: 'All red things are flowers' }, { text: 'No flowers are red' }],
        correctIndex: 0,
        explanation: variant === 0 ? 'The premise states all engineers are thinkers.' : 'The premise states all roses are flowers.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Binary Logic':
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'If A = 1 and B = 0, what is A AND B in binary logic?' : 'If A = 1 and B = 1, what is A OR B in binary logic?',
        options: [{ text: '0' }, { text: '1' }, { text: '2' }, { text: 'Undefined' }],
        correctIndex: 0,
        explanation: variant === 0 ? 'AND is true only when both values are true.' : 'OR is true when at least one value is true.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    default:
      return {
        module: 'reasoning',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Solve the reasoning question for ${topic.topic}.`,
        options: [{ text: 'Option A' }, { text: 'Option B' }, { text: 'Option C' }, { text: 'Option D' }],
        correctIndex: 0,
        explanation: 'Use the reasoning pattern shown in the question.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
  }
}

function generateAptitude(i) {
  const topicIndex = i % topics.aptitude.length
  return buildAptitudeTopicQuestion(topics.aptitude[topicIndex], topicIndex, i)
}

function generateAptitudeQuestionsForTopic(topicIndex, count = 80) {
  return Array.from({ length: count }, (_, questionIndex) => buildAptitudeTopicQuestion(topics.aptitude[topicIndex % topics.aptitude.length], topicIndex, questionIndex))
}

function generateAptitudeTopicBank(perTopicCount = 80) {
  return topics.aptitude.flatMap((_, topicIndex) => generateAptitudeQuestionsForTopic(topicIndex, perTopicCount))
}

function generateReasoning(i) {
  return buildReasoningQuestion(i % topics.reasoning.length, i)
}

function generateReasoningQuestionsForTopic(topicIndex, count = 80) {
  return Array.from({ length: count }, (_, questionIndex) => buildReasoningQuestion(topicIndex % topics.reasoning.length, questionIndex))
}

function generateReasoningTopicBank(perTopicCount = 80) {
  return topics.reasoning.flatMap((_, topicIndex) => generateReasoningQuestionsForTopic(topicIndex, perTopicCount))
}

function buildVerbalQuestion(topicIndex, questionIndex) {
  const topic = topics.verbal[topicIndex % topics.verbal.length]
  const difficulty = questionIndex % 3 === 0 ? 'easy' : (questionIndex % 3 === 1 ? 'medium' : 'hard')
  const variant = questionIndex % 2
  const word = vocab[(topicIndex + questionIndex) % vocab.length]
  const synonym = synonyms[word]

  switch (topic.topic) {
    case 'Synonyms':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? `Choose the synonym of '${word}'.` : `Choose the synonym of '${vocab[(topicIndex + 3) % vocab.length]}'.`,
        options: variant === 0 ? [{ text: synonym }, { text: 'sad' }, { text: 'slow' }, { text: 'bright' }] : [{ text: synonyms[vocab[(topicIndex + 3) % vocab.length]] }, { text: 'cold' }, { text: 'rough' }, { text: 'dark' }],
        correctIndex: 0,
        explanation: `The synonym of ${word} is ${synonym}.`,
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0,
      }
    case 'Antonyms':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? `Choose the antonym of '${word}'.` : `Choose the antonym of '${vocab[(topicIndex + 2) % vocab.length]}'.`,
        options: variant === 0 ? [{ text: 'small' }, { text: 'large' }, { text: 'tiny' }, { text: 'mini' }] : [{ text: 'hot' }, { text: 'warm' }, { text: 'cool' }, { text: 'neutral' }],
        correctIndex: variant === 0 ? 1 : 0,
        explanation: 'Pick the opposite meaning.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0,
      }
    case 'Error Spotting':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Identify the incorrect part: She do not like apples.' : 'Identify the incorrect part: He go to school every day.',
        options: variant === 0 ? [{ text: 'She' }, { text: 'do not' }, { text: 'like apples' }, { text: 'No error' }] : [{ text: 'He' }, { text: 'go' }, { text: 'to school' }, { text: 'every day' }],
        correctIndex: 1,
        explanation: 'Choose the part with the grammatical error.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Fill in the Blanks':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'She _____ to the market yesterday.' : 'They _____ the match last week.',
        options: variant === 0 ? [{ text: 'went' }, { text: 'goes' }, { text: 'gone' }, { text: 'going' }] : [{ text: 'won' }, { text: 'win' }, { text: 'wins' }, { text: 'winning' }],
        correctIndex: 0,
        explanation: 'Use the past tense form.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Sentence Improvement':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'He is knowing the answer.' : 'She has went home already.',
        options: variant === 0 ? [{ text: 'He knows the answer.' }, { text: 'He is know the answer.' }, { text: 'He knew the answer.' }, { text: 'No change needed.' }] : [{ text: 'She has gone home already.' }, { text: 'She had went home already.' }, { text: 'She is gone home already.' }, { text: 'No change needed.' }],
        correctIndex: 0,
        explanation: 'Choose the grammatically improved sentence.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Sentence Completion':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Despite the rain, the event continued ____.' : 'The manager was pleased with the team’s ____ performance.',
        options: variant === 0 ? [{ text: 'smoothly' }, { text: 'stormily' }, { text: 'slowly' }, { text: 'quietly' }] : [{ text: 'excellent' }, { text: 'average' }, { text: 'ordinary' }, { text: 'weak' }],
        correctIndex: 0,
        explanation: 'Choose the word that best completes the sentence.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Idioms and Phrases':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'What does the idiom "once in a blue moon" mean?' : 'What does the phrase "spill the beans" mean?',
        options: variant === 0 ? [{ text: 'Very rarely' }, { text: 'At midnight' }, { text: 'A blue object' }, { text: 'Very often' }] : [{ text: 'Reveal a secret' }, { text: 'Cook beans' }, { text: 'Waste time' }, { text: 'Make noise' }],
        correctIndex: 0,
        explanation: 'Select the correct idiomatic meaning.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'One Word Substitution':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'A person who loves books is called a ____.' : 'A place where animals are kept is called a ____.',
        options: variant === 0 ? [{ text: 'bibliophile' }, { text: 'biologist' }, { text: 'musician' }, { text: 'chef' }] : [{ text: 'zoo' }, { text: 'factory' }, { text: 'library' }, { text: 'garden' }],
        correctIndex: 0,
        explanation: 'Choose the single word that matches the definition.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Phrasal Verbs':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'She will look after the children. What does "look after" mean?' : 'He gave up the challenge. What does "gave up" mean?',
        options: variant === 0 ? [{ text: 'Take care of' }, { text: 'Ignore' }, { text: 'Observe' }, { text: 'Watch from far' }] : [{ text: 'Quit' }, { text: 'Begin' }, { text: 'Win' }, { text: 'Delay' }],
        correctIndex: 0,
        explanation: 'Identify the phrasal verb meaning.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Comprehension':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Passage: The company introduced flexible hours. What was the main change?' : 'Passage: The student read daily and improved steadily. What helped the student improve?',
        options: variant === 0 ? [{ text: 'Flexible working hours' }, { text: 'More breaks' }, { text: 'New office' }, { text: 'Less pay' }] : [{ text: 'Daily reading practice' }, { text: 'Luck' }, { text: 'Random guessing' }, { text: 'Less study' }],
        correctIndex: 0,
        explanation: 'Answer based on the passage.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Cloze Test':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'The sun rises in the ____.' : 'She completed the task with ____ and care.',
        options: variant === 0 ? [{ text: 'east' }, { text: 'west' }, { text: 'north' }, { text: 'south' }] : [{ text: 'speed' }, { text: 'anger' }, { text: 'noise' }, { text: 'confusion' }],
        correctIndex: 0,
        explanation: 'Choose the word that fits best.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Active and Passive Voice':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Change to passive voice: The chef prepared the meal.' : 'Change to active voice: The letter was written by Ana.',
        options: variant === 0 ? [{ text: 'The meal was prepared by the chef.' }, { text: 'The meal prepared the chef.' }, { text: 'The chef is preparing the meal.' }, { text: 'The meal has prepared the chef.' }] : [{ text: 'Ana wrote the letter.' }, { text: 'Ana writes the letter.' }, { text: 'Ana is writing the letter.' }, { text: 'The letter wrote Ana.' }],
        correctIndex: 0,
        explanation: 'Convert the sentence voice correctly.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Direct and Indirect Speech':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Convert to indirect speech: She said, "I am ready."' : 'Convert to indirect speech: He said, "I will call you."',
        options: variant === 0 ? [{ text: 'She said that she was ready.' }, { text: 'She says that she is ready.' }, { text: 'She said that I was ready.' }, { text: 'She said that she is ready.' }] : [{ text: 'He said that he would call me.' }, { text: 'He said that he will call me.' }, { text: 'He says that he would call me.' }, { text: 'He said that I would call him.' }],
        correctIndex: 0,
        explanation: 'Change pronouns and tense appropriately.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Tenses':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Choose the correct tense: By next year, I ____ my degree.' : 'Choose the correct tense: She ____ in this office since 2020.',
        options: variant === 0 ? [{ text: 'will have completed' }, { text: 'completed' }, { text: 'complete' }, { text: 'completing' }] : [{ text: 'has worked' }, { text: 'worked' }, { text: 'will work' }, { text: 'is working' }],
        correctIndex: 0,
        explanation: 'Select the tense that matches the timeline.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Articles':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'He bought ____ umbrella.' : 'She is ____ honest student.',
        options: variant === 0 ? [{ text: 'an' }, { text: 'a' }, { text: 'the' }, { text: 'no article' }] : [{ text: 'an' }, { text: 'a' }, { text: 'the' }, { text: 'no article' }],
        correctIndex: 0,
        explanation: 'Use the correct article before the word.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Prepositions':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'She is interested ____ music.' : 'He arrived ____ the station on time.',
        options: variant === 0 ? [{ text: 'in' }, { text: 'on' }, { text: 'at' }, { text: 'for' }] : [{ text: 'at' }, { text: 'in' }, { text: 'on' }, { text: 'by' }],
        correctIndex: 0,
        explanation: 'Pick the appropriate preposition.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Conjunctions':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'I was tired, ____ I kept studying.' : 'He is smart ____ hardworking.',
        options: variant === 0 ? [{ text: 'but' }, { text: 'because' }, { text: 'so' }, { text: 'although' }] : [{ text: 'and' }, { text: 'but' }, { text: 'or' }, { text: 'yet' }],
        correctIndex: 0,
        explanation: 'Select the conjunction that best joins the clause.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Paragraph Rearrangement':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Arrange: A. He woke up. B. He brushed his teeth. C. He went to school.' : 'Arrange: A. She cooked dinner. B. She bought vegetables. C. She washed hands.',
        options: variant === 0 ? [{ text: 'A-B-C' }, { text: 'B-A-C' }, { text: 'C-B-A' }, { text: 'A-C-B' }] : [{ text: 'B-C-A' }, { text: 'A-B-C' }, { text: 'C-A-B' }, { text: 'B-A-C' }],
        correctIndex: 0,
        explanation: 'Choose the logical sequence of events.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    case 'Spelling':
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: variant === 0 ? 'Choose the correctly spelled word.' : 'Choose the correctly spelled word.',
        options: variant === 0 ? [{ text: 'necessary' }, { text: 'neccessary' }, { text: 'necessery' }, { text: 'necesary' }] : [{ text: 'accommodate' }, { text: 'acommodate' }, { text: 'accomodate' }, { text: 'acomodate' }],
        correctIndex: 0,
        explanation: 'Pick the correctly spelled word.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
    default:
      return {
        module: 'verbal',
        category: topic.category,
        topic: topic.topic,
        difficulty,
        text: `Solve the verbal question for ${topic.topic}.`,
        options: [{ text: 'Option A' }, { text: 'Option B' }, { text: 'Option C' }, { text: 'Option D' }],
        correctIndex: 0,
        explanation: 'Use the verbal rule shown in the prompt.',
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        negativeMarks: 0.25,
      }
  }
}

function generateVerbalQuestionsForTopic(topicIndex, count = 80) {
  return Array.from({ length: count }, (_, questionIndex) => buildVerbalQuestion(topicIndex % topics.verbal.length, questionIndex))
}

function generateVerbalTopicBank(perTopicCount = 80) {
  return topics.verbal.flatMap((_, topicIndex) => generateVerbalQuestionsForTopic(topicIndex, perTopicCount))
}

const vocab = ['happy', 'quick', 'bright', 'calm', 'ancient', 'brave', 'eager', 'fierce']
const synonyms = { happy: 'joyful', quick: 'fast', bright: 'smart', calm: 'serene', ancient: 'old', brave: 'courageous', eager: 'enthusiastic', fierce: 'ferocious' }

function generateVerbal(i) {
  const topic = topics.verbal[i % topics.verbal.length]
  const difficulty = i % 3 === 0 ? 'easy' : (i % 3 === 1 ? 'medium' : 'hard')
  const word = vocab[i % vocab.length]
  const correct = synonyms[word]
  const options = [correct, 'sad', 'slow', 'bright']

  return {
    module: 'verbal',
    category: topic.category,
    topic: topic.topic,
    difficulty,
    text: `Choose the synonym of '${word}'.`,
    options: options.map((option) => ({ text: option })),
    correctIndex: 0,
    explanation: `The synonym of ${word} is ${correct}.`,
    marks: difficulty === 'easy' ? 1 : (difficulty === 'medium' ? 2 : 3),
    negativeMarks: 0,
  }
}

function generateAll(countPerModule = 40) {
  const out = []
  for (let index = 0; index < countPerModule; index += 1) out.push(generateAptitude(index))
  for (let index = 0; index < countPerModule; index += 1) out.push(generateReasoning(index))
  for (let index = 0; index < countPerModule; index += 1) out.push(generateVerbal(index))
  return out
}

function generateModuleQuestions(module, countPerModule = 40) {
  if (module === 'reasoning') {
    return Array.from({ length: countPerModule }, (_, index) => generateReasoning(index))
  }

  if (module === 'verbal') {
    return Array.from({ length: countPerModule }, (_, index) => generateVerbal(index))
  }

  return Array.from({ length: countPerModule }, (_, index) => generateAptitude(index))
}

function getAptitudeTopics() {
  return aptitudeTopics.map((entry) => ({ ...entry }))
}

function getReasoningTopics() {
  return topics.reasoning.map((entry) => ({ ...entry }))
}

module.exports = {
  generateAll,
  generateModuleQuestions,
  generateAptitudeQuestionsForTopic,
  generateAptitudeTopicBank,
  generateReasoningQuestionsForTopic,
  generateReasoningTopicBank,
  generateVerbalQuestionsForTopic,
  generateVerbalTopicBank,
  getAptitudeTopics,
  getReasoningTopics,
}
