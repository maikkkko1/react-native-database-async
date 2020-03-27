# react-native-database-async
## Database service based on AsyncStorage

#### Installation
```
npm i react-native-database-async --save
```

First of all, you must define your database schema.

To do this, just create a .json file like the example below and define your tables and columns. It is not yet possible to define a type for each column, so at the moment they accept any value.

**DbSchema.json**
```json
[
  {
    "name": "users",
    "columns": ["iduser", "name", "lastname", "age"]
  },
  {
    "name": "products",
    "columns": ["idproduct", "description", "price", "quantity"]
  }
]
```

*"name" = Name of the table.*

*"columns" = Table columns.*

### Create database
Always create your database in your project's initial file, so that it is the first thing to be executed. If the database already exists, he just ignored it.

Using the above schema, we will create our database in the example below.

```javascript
import DbSchema from "./DbSchema.json";
import AsyncDatabase from "react-native-database-async";

async componentDidMount() {
  /** Creates a database called "db_default" using the schema contained in the DbSchema.json file */
  const createDb = await AsyncDatabase.createDatabase("db_default", DbSchema);

  console.log(createDb); // Should return true.
}
```

### Delete database
Permanently deletes the database and all its data.

```javascript
import AsyncDatabase from "react-native-database-async";

async componentDidMount() {
  const deleteDb = await AsyncDatabase.deleteDatabase("db_default");
}
```

### Add new tables to the database.
You can add new tables to the database without affecting those that already exist, just create a new .json file with the schema of the new tables and proceed as the example below.

```javascript
import UpdatedSchema from "./UpdatedSchema.json";
import AsyncDatabase from "react-native-database-async";

async componentDidMount() {
  /** Adds the new schema tables to the "db_default" database, if the table already exists does nothing. */
  const addNewTablesDb = await AsyncDatabase.addDatabaseTable("db_default", UpdatedSchema);

  console.log(addNewTablesDb); // Should return true.
}
```

### Update a table in the database.
You can update a table in the database by adding new fields to it.

```javascript
import AsyncDatabase from "react-native-database-async";

async componentDidMount() {
  /** Adds the "city" and "state" fields to the "users" table. */
  const newFields = ["city", "state"];
  const updateTableDb = await AsyncDatabase.updateDatabaseTable("db_default", "users", newFields);

  console.log(updateTableDb); // Should return true.
}
```

### Insert statement.
Insert a new record in the database.

```javascript
import AsyncDatabase from "react-native-database-async";

async componentDidMount() {
  const insertValues = {
    iduser: 1,
    name: "John",
    lastname: "Doe",
    age: 25
  };
  
  /** Insert a value in "users" table, if the column does not exist in the table schema it will return an exception. */
  const insert = await AsyncDatabase.insert("users", insertValues);

  console.log(updateTableDb); // Should return true.
}
```

### Where statement.
It is not yet possible to use multiple wheres, currently supporting only one per instruction.

Where types:
* eq: Equal
* bt: Bigger than
* be: Bigger equal
* lt: Less than
* le: Less equal

Where equal type example
```javascript
const where = {
  type: 'eq',
  field: 'iduser', // Field to compare.
  toBe: 1 // Value to be.,
  fetch: true // Available only in select statement, returns only the first value.
}
```

### OrderBy statement.
OrderBy types:
* desc: DESC
* asc: ASC

OrderBy desc type example
```javascript
const orderBy = {
  type: 'desc',
  field: 'age', // Field to order.
}
```

### Select statement.
Returns a value or values from the database.

```javascript
import AsyncDatabase from "react-native-database-async";

async componentDidMount() {
  const where = {
    type: "eq",
    field: "iduser",
    toBe: 1,
    fetch: true
  };
  
  const orderBy = {
    type: "desc",
    field: "age"
  };
  
  /** Select all, without using where or orderBy. */
  const selectAll = await AsyncDatabase.select("users"); // Return array of values.

  const selectWithWhere = await AsyncDatabase.select("users", where); // Return only value that match with iduser == 1.
  
  /** Without where. **/
  const selectWithOrderBy =  await AsyncDatabase.select("users", null, orderBy); // Return all values, ordened by age DESC.
}
```

### Update statement.
Updates the values in the database.

```javascript
import AsyncDatabase from "react-native-database-async";

async componentDidMount() {
  const where = {
    type: "eq",
    field: "iduser",
    toBe: 1,
  };
  
  const updateValues = {
    age: 30,
    name: "Torvald"
  };
  
  /** Updates the values in "iduser" == 1 */
  const update = await AsyncDatabase.update("users", updateValues, where); // Returns true.
}
```

### Delete statement.
Deletes a value from the database.

```javascript
import AsyncDatabase from "react-native-database-async";

async componentDidMount() {
  const where = {
    type: "eq",
    field: "iduser",
    toBe: 1,
  };
  
  /** Delete the values in "iduser" == 1 */
  const delete = await AsyncDatabase.delete("users", where); // Returns true.
}
```

### Docs

* createDatabase(databaseName, schema)
* deleteDatabase(databaseName)
* addDatabaseTable(databaseName, schema)
* updateDatabaseTable(databaseName, tableName, newColumns)
* insert(tableName, values)
* select(tableName, whereStatement = null, orderByStatement = null)
* update(tableName, values, whereStatement) // Pass type = null in where to update all records.
* delete(tableName, where)
