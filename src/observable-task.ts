import { IReactionPublic } from 'mobx/lib/internal'
import { ComputedReaction, ComputedReactionOptions } from './computed-reaction'

export interface ObservableTask<V> {
	value: V
	done: boolean
}

export const observableTask = <T, R>(
	expression: (r: IReactionPublic) => R,
	effect: (arg: R, r: IReactionPublic) => AsyncIterableIterator<T>,
	opts: ComputedReactionOptions<T>
): ObservableTask<T> => new ComputedReaction(expression, effect, opts)
