import { schema, normalize, denormalize } from '../src'

describe('normalize', () => {
  [42, null, undefined, '42str', () => {}].forEach((input) => {
    test(`cannot normalize input that == ${input}`, () => {
      expect(() => normalize(input, new schema.Entity('test'))).toThrow()
    })
  })

  test('cannot normalize without a schema', () => {
    expect(() => normalize({})).toThrow()
  })

  test('normalizes entities', () => {
    const mySchema = new schema.Entity('tacos')

    expect(normalize([{ id: 1, type: 'foo' }, { id: 2, type: 'bar' }], [mySchema])).toMatchSnapshot()
  })

  test('normalizes entities with circular references', () => {
    const user = new schema.Entity('users')
    user.define({
      friends: [user]
    })

    const input1 = { id: 123, friends: [] }
    input1.friends.push(input1)

    expect(normalize(input1, user)).toMatchSnapshot()

    const book = new schema.Entity('books')
    const person = new schema.Entity('persons', { books: [book] })
    book.define({
      author: [person]
    })

    const input2 = { id: 123, books: [{ id: 345 }] }
    input2.books[0].author = input2

    expect(normalize(input2, person)).toMatchSnapshot()
  })

  test('normalizes nested entities', () => {
    const user = new schema.Entity('users')
    const comment = new schema.Entity('comments', {
      user: user
    })
    const article = new schema.Entity('articles', {
      author: user,
      comments: {
        result: [comment]
      }
    })

    const input = {
      id: '123',
      title: 'A Great Article',
      author: {
        id: '8472',
        name: 'Paul'
      },
      body: 'This article is great.',
      comments: {
        total: 100,
        result: [
          {
            id: 'comment-123-4738',
            comment: 'I like it!',
            user: {
              id: '10293',
              name: 'Jane'
            }
          }
        ]
      }
    }
    expect(normalize(input, article)).toMatchSnapshot()
  })

  test('does not modify the original input', () => {
    const user = new schema.Entity('users')
    const article = new schema.Entity('articles', { author: user })
    const input = Object.freeze({
      id: '123',
      title: 'A Great Article',
      author: Object.freeze({
        id: '8472',
        name: 'Paul'
      })
    })
    expect(() => normalize(input, article)).not.toThrow()
  })

  test('ignores null values', () => {
    const myEntity = new schema.Entity('myentities')
    expect(normalize([null], [myEntity])).toMatchSnapshot()
    expect(normalize([undefined], [myEntity])).toMatchSnapshot()
    expect(normalize([false], [myEntity])).toMatchSnapshot()
  })

  test('passes over pre-normalized values', () => {
    const userEntity = new schema.Entity('users')
    const articleEntity = new schema.Entity('articles', { author: userEntity })

    expect(normalize({ id: '123', title: 'normalizr is great!', author: 1 }, articleEntity)).toMatchSnapshot()
  })

  test('can normalize object without proper object prototype inheritance', () => {
    const test = { id: 1, elements: [] }
    test.elements.push(
      Object.assign(Object.create(null), {
        id: 18,
        name: 'test'
      })
    )

    const testEntity = new schema.Entity('test', {
      elements: [new schema.Entity('elements')]
    })

    expect(() => normalize(test, testEntity)).not.toThrow()
  })
})

describe('denormalize', () => {
  test('cannot denormalize without a schema', () => {
    expect(() => denormalize({})).toThrow()
  })

  test('returns the input if undefined', () => {
    expect(denormalize(undefined, {}, {})).toBeUndefined()
  })

  test('denormalizes entities', () => {
    const mySchema = new schema.Entity('tacos')
    const entities = {
      tacos: {
        1: { id: 1, type: 'foo' },
        2: { id: 2, type: 'bar' }
      }
    }
    expect(denormalize([1, 2], [mySchema], entities)).toMatchSnapshot()
  })

  test('denormalizes nested entities', () => {
    const user = new schema.Entity('users')
    const comment = new schema.Entity('comments', {
      user: user
    })
    const article = new schema.Entity('articles', {
      author: user,
      comments: [comment]
    })

    const entities = {
      articles: {
        123: {
          author: '8472',
          body: 'This article is great.',
          comments: ['comment-123-4738'],
          id: '123',
          title: 'A Great Article'
        }
      },
      comments: {
        'comment-123-4738': {
          comment: 'I like it!',
          id: 'comment-123-4738',
          user: '10293'
        }
      },
      users: {
        10293: {
          id: '10293',
          name: 'Jane'
        },
        8472: {
          id: '8472',
          name: 'Paul'
        }
      }
    }
    expect(denormalize('123', article, entities)).toMatchSnapshot()
  })

  test('set to undefined if schema key is not in entities', () => {
    const user = new schema.Entity('users')
    const comment = new schema.Entity('comments', {
      user: user
    })
    const article = new schema.Entity('articles', {
      author: user,
      comments: [comment]
    })

    const entities = {
      articles: {
        123: {
          id: '123',
          author: '8472',
          comments: ['1']
        }
      },
      comments: {
        1: {
          user: '123'
        }
      }
    }
    expect(denormalize('123', article, entities)).toMatchSnapshot()
  })

  test('does not modify the original entities', () => {
    const user = new schema.Entity('users')
    const article = new schema.Entity('articles', { author: user })
    const entities = Object.freeze({
      articles: Object.freeze({
        123: Object.freeze({
          id: '123',
          title: 'A Great Article',
          author: '8472'
        })
      }),
      users: Object.freeze({
        8472: Object.freeze({
          id: '8472',
          name: 'Paul'
        })
      })
    })
    expect(() => denormalize('123', article, entities)).not.toThrow()
  })

  test('denormalizes entities with circular references', () => {
    const user = new schema.Entity('users')
    user.define({
      friends: [user]
    })

    const input1 = {
      entities: {
        users: {
          123: {
            friends: [123],
            id: 123
          }
        }
      },
      result: 123
    }

    expect(denormalize(input1.result, user, input1.entities)).toMatchSnapshot()

    const book = new schema.Entity('books')
    const person = new schema.Entity('persons', { books: [book] })
    book.define({
      author: [person]
    })

    const input2 = {
      entities: {
        books: {
          345: {
            author: 123,
            id: 345
          }
        },
        persons: {
          123: {
            books: [
              345
            ],
            id: 123
          }
        }
      },
      result: 123
    }

    expect(denormalize(input2.result, person, input2.entities)).toMatchSnapshot()
  })
})
