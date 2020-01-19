import { createAtom, IAtom, reaction } from 'mobx'
import { IReactionOptions } from 'mobx/lib/api/autorun'
import { IReactionPublic } from 'mobx/lib/internal'

export interface ComputedReactionOptions<T> extends IReactionOptions {
	fireImmediately?: boolean // true by default
	autoDispose?: boolean // true by default
	initialValue: T
}

export class ComputedReaction<T, R> {
	private atom: IAtom
	private resultStack: IteratorResult<T>[] = []
	private disposeReaction: (() => void) | undefined
	private disposed: boolean = false

	public get value(): T {
		this.atom.reportObserved()
		// ignore yielded value if it was empty
		const values = this.resultStack.map(({ value }) => value).filter(Boolean)

		return values.length ? values[values.length - 1] : this.opts.initialValue
	}

	public get done(): boolean {
		this.atom.reportObserved()

		return !!(this.resultStack.length && this.resultStack[this.resultStack.length - 1].done)
	}

	constructor(
		private expression: (r: IReactionPublic) => R,
		private effect: (arg: R, r: IReactionPublic) => AsyncIterableIterator<T>,
		private opts: ComputedReactionOptions<T>
	) {
		this.atom = createAtom('atom', this.onBecomeObserved, this.onBecomeUnobserved)
	}

	private async setup() {
		this.disposed = false
		this.disposeReaction = reaction(
			this.expression,
			async (args, r) => {
				this.resultStack = []
				const gen = this.effect(args, r)

				while (!this.disposed) {
					this.resultStack.push(await gen.next())
					this.atom.reportChanged()

					if (this.done) {
						break
					}
				}
			},
			{ fireImmediately: true, ...this.opts }
		)
	}

	private dispose() {
		this.disposed = true
		this.resultStack = []
		if (this.disposeReaction) {
			this.disposeReaction()
			this.disposeReaction = void 0
		}
	}

	private onBecomeObserved = () => {
		this.setup()
	}

	private onBecomeUnobserved = () => {
		this.dispose()
	}
}
