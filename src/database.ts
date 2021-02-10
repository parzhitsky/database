type Key = symbol;

interface EntryBase {
	key: Key;
	exists: boolean;
}

interface Entry<Value> extends EntryBase {
	value?: Value;
}

interface EntryExists<Value> extends Entry<Value> {
	value: Value; // override
	exists: true;
}

interface Thunk<Value> {
	(existing?: Value): /* updated */ Value;
}

interface UpdateResult<Value> extends EntryBase {
	oldValue?: Value;
	newValue: Value;
}

interface DeleteResult<Value> extends Entry<Value> {
	deleted: boolean;
}

/** @internal */
class Table<Value extends object> {
	protected readonly values = new Map<Key, Value>();

	constructor(
		public name: string,
	) {}

	protected createKey(): Key {
		return Symbol(Math.random().toString().slice(2));
	}

	create(value: Value): EntryExists<Value> {
		const key = this.createKey();

		this.values.set(key, value);

		return { key, value, exists: true };
	}

	read(key: Key): Entry<Value> {
		return {
			key,
			value: this.values.get(key),
			exists: this.values.has(key),
		};
	}

	*readAll(): IterableIterator<EntryExists<Value>> {
		for (const [ key, value ] of this.values.entries())
			yield { key, value, exists: true };
	}

	update(key: Key, thunk: Thunk<Value>): UpdateResult<Value> {
		const exists = this.values.has(key);

		if (exists) {
			const oldValue = this.values.get(key)!;
			const newValue = thunk(oldValue);

			return { key, exists, oldValue, newValue };
		}

		return { key, exists, newValue: thunk() };
	}

	delete(key: Key): DeleteResult<Value> {
		return {
			...this.read(key),
			deleted: this.values.delete(key),
		};
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
