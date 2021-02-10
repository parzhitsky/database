import assert from "assert";
import Database from "./database";

interface Person {
	name: string;
	age: number;
}

const db = new Database();
const table = db.createTable<Person>("Person");

const { key: johnKey } = table.create({
	name: "John",
	age: 42,
});

table.update(johnKey, (john) => {
	if (john == null)
		throw new Error("Expected to see existing entry");

	return { ...john, age: john.age + 1 };
});

{
	const entry = table.read(johnKey);

	if (!entry.exists)
		throw new Error("Expected to see existing entry");

	else
		assert.strictEqual(entry.value!.age, 43, "John's age should have been equal to 43");
}

table.delete(johnKey);

if (table.read(johnKey).exists)
	throw new Error("Expected entry to be deleted");
