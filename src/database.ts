type Key = symbol & {
	readonly __type__: unique symbol;
};

type WithKey = { key: Key };
type WithOldValue<Value> = { oldValue?: Value };
type WithNewValue<Value> = { newValue: Value };
type WithExisted<Existed extends boolean = boolean> = { existed: Existed }; // type arg is not 'Value' to avoid confusion

interface ReadResult<Value> extends WithKey {
	value?: Value;
	exists: boolean;
}

interface ReadAllResult<Value> extends WithKey {
	value: Value;
	exists: true;
}

interface CreateResult<Value> extends WithKey, WithExisted<false>, WithNewValue<Value> {
	created: true;
}

interface SetResult<Value> extends WithKey, WithOldValue<Value>, WithNewValue<Value>, WithExisted {
	didSet: true;
}

interface UpdateResult<Value> extends WithKey, WithOldValue<Value>, Partial<WithNewValue<Value>>, WithExisted {
	updated: boolean;
}

interface DeleteResult<Value> extends WithKey, WithOldValue<Value>, WithExisted {
	deleted: boolean;
}

interface Thunk<Value extends object> {
	(existing?: Readonly<Value>): /* updated */ Value | /* omitted */ void | undefined;
}

/** @internal */
class Table<Value extends object> {
	protected readonly values = new Map<Key, Value>();

	constructor(
		public name: string,
	) {}

	protected createKey(): Key {
		return Symbol(Math.random().toString().slice(2)) as Key;
	}

	create(newValue: Value): CreateResult<Value> {
		const key = this.createKey();

		this.values.set(key, newValue);

		return { key, newValue, existed: false, created: true };
	}

	set(key: Key, newValue: Value): SetResult<Value> {
		const { exists: existed, value: oldValue } = this.read(key);

		this.values.set(key, newValue);

		return { key, oldValue, newValue, existed, didSet: true };
	}

	read(key: Key): ReadResult<Value> {
		return {
			key,
			value: this.values.get(key),
			exists: this.values.has(key),
		};
	}

	*readAll(): IterableIterator<ReadAllResult<Value>> {
		for (const [ key, value ] of this.values.entries())
			yield { key, value, exists: true };
	}

	update(key: Key, thunk: Thunk<Value>): UpdateResult<Value> {
		const { exists: existed, value: oldValue } = this.read(key);
		const thunkResult = thunk(oldValue);

		let updated = false; // by default
		let newValue: Value | undefined;

		if (thunkResult != null) {
			updated = true;
			this.set(key, newValue = thunkResult);
		}

		return { key, oldValue, newValue, existed, updated };
	}

	delete(key: Key): DeleteResult<Value> {
		const { exists: existed, value: oldValue } = this.read(key);

		return { key, oldValue, existed, deleted: this.values.delete(key) };
	}
}

export default class Database {
	private readonly tables = new Map<string, Table<object>>();

	createTable<Value extends object>(name: string): Table<Value> {
		if (this.tables.has(name))
			throw new Error(`Cannot create duplicate table "${name}"`);

		return new Table<Value>(name);
	}

	usingTable<Value extends object = object>(name: string): Table<Value> {
		const table = this.tables.get(name);

		if (table == null)
			throw new Error(`Cannot find table "${name}"`);

		return table as Table<Value>;
	}
}
