import assert from "assert";
import Database from "./database";

interface Person {
	name: string;
	age: number;
}

const db = new Database();
const table = db.createTable<Person>("Person");

const create = table.create({
	name: "John",
	age: 42,
});

const update = table.update(create.key, (john) => {
	if (john == null)
		throw new Error("Expected to see existing entry");

	return { ...john, age: john.age + 1 };
});

if (!update.updated)
	throw new Error("Expected entry to be updated");

const entry = table.read(create.key);

if (!entry.exists)
	throw new Error("Expected to see existing entry");

else
	assert.strictEqual(entry.value!.age, 43, "John's age should have been equal to 43");

const deleted = table.delete(create.key);

if (table.read(deleted.key).exists)
	throw new Error("Expected entry to be deleted");
