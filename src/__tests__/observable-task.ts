import { autorun, observable } from 'mobx'
import { observableTask } from '../observable-task'

test('autorun has to be called on response of yield and effect data change', async () => {
	interface Data {
		finished: boolean
		data?: number
	}

	class Store {
		@observable
		public a = 1

		public task = observableTask(
			() => this.a,
			async function*(a): AsyncIterableIterator<Data> {
				for (let i = 0; i < 3; i++) {
					await new Promise(res => setTimeout(res, 100))
					yield { data: i * a, finished: false }
				}

				return { finished: true }
			},
			{ initialValue: { finished: false } }
		)
	}

	const store = new Store()

	const callResult = await new Promise(res => {
		const results: Data[] = []

		autorun(r => {
			results.push(store.task.value)

			if (store.task.value.finished) {
				if (store.a === 2) {
					r.dispose()
					setTimeout(() => res(results), 500)
				} else {
					setTimeout(() => {
						store.a++
					}, 100)
				}
			}
		})
	})

	expect(callResult).toEqual([
		{ finished: false },
		{ finished: false, data: 0 },
		{ finished: false, data: 1 },
		{ finished: false, data: 2 },
		{ finished: true },
		{ finished: false },
		{ finished: false, data: 0 },
		{ finished: false, data: 2 },
		{ finished: false, data: 4 },
		{ finished: true },
	])
}, 5000)

test('data fetch', async () => {
	interface User {
		id: number
		name: string
	}

	interface Result {
		status: 'empty' | 'pending' | 'result' | 'error'
		result?: User
		error?: Error
	}

	const fetchUser = (id: number): Promise<User> =>
		new Promise(res => setTimeout(() => res({ id, name: `Bob-${id}` }), 100))

	// const fetchUserFail = (id: number) => new Promise((res, rej) => setTimeout(() => rej(new Error('ERROR while user fetch ')), 100))

	class UserStore {
		public id = 100
		public user = observableTask(
			() => this.id,
			async function*(id): AsyncIterableIterator<Result> {
				yield { status: 'pending' }
				try {
					const user = await fetchUser(id)

					return { status: 'result', result: user }
				} catch (error) {
					return { status: 'error', error }
				}
			},
			{ initialValue: { status: 'empty' } }
		)
	}

	const userStore = new UserStore()

	autorun(_ => {
		console.log('!!!!!!!!!!!!!!', userStore.user.value)
	})

	await new Promise(res => setTimeout(res, 1000))

	expect(userStore.user.value.status).toBe('result')
})
