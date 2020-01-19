# mobx-observable-task

Easy creation of async tasks with observing intermediate results.

# Idea

Beefed up version of reaction. Main conceptual items are:

1. Reaction can produce intermediate results which can be observed
2. Reaction fired only when you start observing its result, so you do not need to manually trigger your reaction. If you do not observe than reaction is not called.
3. Deliver intermediate results using simple async generator syntax

# Usage Examples

Note: this is just simplified example aimed to show main point of this lib

Before:

```jsx harmony
class TodoStore {
	@observable
	loading = false

	@observable.ref
	todos = null

	async loadTodos() {
		this.loading = true
		this.todos = await fetchTodosApi()
		this.loading = false
	}
}

@observer
class MyCmp extends React.Component {
	store = new TodoStore()

	componentDidMount() {
		// note: you have to call this explicitly
		this.store.loadTodos()
	}

	render() {
		const { todos, loading } = this.store

		if (loading || !todos) {
			return 'Loading...'
		}

		return <div>{todos}</div>
	}
}
```

After:

```jsx harmony
@observer
class MyCmp extends React.Component {
	loadTodosTask = observableTask(
		() => {},
		// note: next will be called only when it becomes observed (in render method)
		async function*() {
			yield { status: 'loading' }
			const todos = await fetchTodosApi()
			return { status: 'result', todos }
		},
		{ initialValue: { status: 'empty' } }
	)

	render() {
		const { status, todos } = this.loadTodosTask.value

		if (status !== 'result') {
			return 'Loading...'
		}

		return <div>{todos}</div>
	}
}
```

# Todo

-   [ ] Cancel current reaction when effect triggers new one
-   [ ] Autodispose option
