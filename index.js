/**
 * @author Maikon Ferreira
 * @email mai.kon96@hotmail.com
 * @create date 2020-02-11 19:58:41
 * @modify date 2020-02-11 19:58:41
 * @desc Async database.
 */

import Util from './util';
import { AsyncStorage as storage } from "react-native";

const databasePrefix = "__db__";

export default class AsyncDatabase {
  static async createDatabase(name, tables) {
    if (!Util.isValid(name) || !Util.isValid(tables)) {
      throw Error("Invalid parameters");
    }

    name = databasePrefix + name;

    if (!(await this.storageGet(name))) {
      await this.storageSet(name, this.mountDatabaseSchema(tables));
    } else {
      return false;
    }

    return true;
  }

  static async addDatabaseTable(databaseName, tables) {
    const database = await this.getDatabase(databaseName);

    tables.map(table => {
      const tableExists = database["tables"].find(
        tbl => tbl["name"] == table["name"]
      );

      if (tableExists) {
        console.log(
          `WARNING: Table ${table["name"]} already exists, did you mean updateDatabaseTable()?`
        );
      } else {
        const tableSchema = {
          name: table["name"],
          fields: table["columns"],
          data: []
        };

        database["tables"].push(tableSchema);
      }
    });

    await this.storageSet(databasePrefix + databaseName, database);

    return true;
  }

  static async updateDatabaseTable(databaseName, tableName, columns) {
    const database = await this.getDatabase(databaseName);

    this.tableExists(tableName, database);

    database["tables"].map((table, index) => {
      if (table["name"] == tableName) {
        const newColumns = [];

        columns.map(column => {
          if (!table["fields"].includes(column)) {
            newColumns.push(column);
          } else {
            console.log(
              `WARNING: Column ${column} already exists in table ${tableName}.`
            );
          }
        });

        database["tables"][index]["fields"] = [
          ...table["fields"],
          ...newColumns
        ];
      }
    });

    await this.storageSet(databasePrefix + databaseName, database);

    return true;
  }

  static async insert(tableName, values) {
    const database = await this.getFirstDatabase();

    this.tableExists(tableName, database);

    database["tables"].map((table, index) => {
      if (table["name"] == tableName) {
        this.validateTableFields(table["fields"], Object.keys(values));

        values = this.addTimeStamp(values);

        database["tables"][index]["data"].push(values);
      }
    });

    await this.storageSet(await this.getFirstDatabaseName(), database);

    return true;
  }

  static async select(tableName, where = null, orderBy = null) {
    const database = await this.getFirstDatabase();

    this.tableExists(tableName, database);

    const tableData = database["tables"].find(
      table => table["name"] == tableName
    )["data"];

    let result = null;

    if (!where && !orderBy) {
      result = tableData;
    }

    if (where && !orderBy) {
      result = this.handleWhereStatement(tableData, where);
    }

    if (!where && orderBy) {
      result = this.handleOrderByStatement(tableData, orderBy);
    }

    if (where && orderBy) {
      const processWhere = this.handleWhereStatement(tableData, where);

      result = this.handleOrderByStatement(processWhere, orderBy);
    }

    if (where && where["fetch"]) {
      return this.handleFetch(result);
    }

    return result;
  }

  static async update(tableName, values, where) {
    const database = await this.getFirstDatabase();

    this.tableExists(tableName, database);

    let useWhere = true;

    if (where["type"] == null) useWhere = false;

    database["tables"].map((table, tableIndex) => {
      if (table["name"] == tableName) {
        this.validateTableFields(table["fields"], Object.keys(values));

        values = this.addTimeStamp(values, true);

        if (useWhere) {
          const tableData = this.handleWhereStatement(table["data"], where);

          tableData.map(data => {
            table["data"].find((tbl, index) => {
              if (JSON.stringify(tbl) == JSON.stringify(data)) {
                database["tables"][tableIndex]["data"].splice(index, 1);
              }
            });

            const updatedObject = data;

            Object.keys(values).map(key => {
              updatedObject[key] = values[key];
            });

            database["tables"][tableIndex]["data"].push(updatedObject);
          });
        } else {
          table["data"].map((data, index) => {
            Object.keys(values).map(key => {
              database["tables"][tableIndex]["data"][index][key] = values[key];
            });
          });
        }
      }
    });

    await this.storageSet(await this.getFirstDatabaseName(), database);

    return true;
  }

  static async delete(tableName, where) {
    const database = await this.getFirstDatabase();

    this.tableExists(tableName, database);

    let useWhere = true;

    if (where["type"] == null) useWhere = false;

    database["tables"].map((table, tableIndex) => {
      if (table["name"] == tableName) {
        if (useWhere) {
          const tableData = this.handleWhereStatement(table["data"], where);

          tableData.map(data => {
            table["data"].find((tbl, index) => {
              if (JSON.stringify(tbl) == JSON.stringify(data)) {
                database["tables"][tableIndex]["data"].splice(index, 1);
              }
            });
          });
        } else {
          database["tables"][tableIndex]["data"] = [];
        }
      }
    });

    await this.storageSet(await this.getFirstDatabaseName(), database);

    return true;
  }

  static handleFetch(tableData) {
    return tableData[0];
  }

  static addTimeStamp(values, update = null) {
    values[update ? "updated_at" : "created_at"] = Util.getDate();

    return values;
  }

  static handleOrderByStatement(tableData, statement) {
    switch (statement["type"]) {
      case "desc":
        return tableData.sort((a, b) =>
          b[statement["field"]] < a[statement["field"]] ? -1 : 1
        );
      case "asc":
        return tableData.sort((a, b) =>
          a[statement["field"]] > b[statement["field"]] ? 1 : -1
        );
    }
  }

  static handleWhereStatement(tableData, statement) {
    const field = statement["field"];

    const result = [];

    switch (statement["type"]) {
      case "eq":
        tableData.map(data => {
          if (data[field] == statement["toBe"]) {
            result.push(data);
          }
        });

        break;
      case "bt":
        tableData.map(data => {
          if (data[field] > statement["toBe"]) {
            result.push(data);
          }
        });

        break;
      case "be":
        tableData.map(data => {
          if (data[field] >= statement["toBe"]) {
            result.push(data);
          }
        });

        break;
      case "lt":
        tableData.map(data => {
          if (data[field] < statement["toBe"]) {
            result.push(data);
          }
        });

        break;
      case "le":
        tableData.map(data => {
          if (data[field] <= statement["toBe"]) {
            result.push(data);
          }
        });
    }

    return result;
  }

  static validateTableFields(tableFields, fields) {
    fields.map(field => {
      if (!tableFields.includes(field)) {
        throw Error(`Field ${field} not found.`);
      }
    });
  }

  static tableExists(tableName, database) {
    const tableExists = database["tables"].find(tbl => tbl.name == tableName);

    if (!tableExists) {
      throw Error(`Table ${tableName} not found.`);
    }

    return true;
  }

  static async deleteDatabase(name) {
    return await this.storageDelete(databasePrefix + name);
  }

  static async getFirstDatabase() {
    let database = await this.getFirstDatabaseName();

    if (database) {
      database = database.replace("__db__", "");
    }

    return await this.getDatabase(database);
  }

  static async getFirstDatabaseName() {
    const keys = await storage.getAllKeys();

    for (const key in keys) {
      if (keys[key].includes("__db__")) {
        return keys[key];
      }
    }
  }

  static async getDatabase(databaseName) {
    const database = await this.storageGet(databasePrefix + databaseName);

    if (!database) {
      throw Error("Database not found.");
    }

    return database;
  }

  static async storageSet(key, value) {
    await storage.setItem(key, this.toJSON(value));
  }

  static async storageGet(key) {
    const get = await storage.getItem(key);

    return get ? this.parseJSON(get) : get;
  }

  static async storageDelete(key) {
    return await storage.removeItem(key);
  }

  static mountDatabaseSchema(tables) {
    let schema = { tables: [] };

    tables.map(table => {
      const tableSchema = {
        name: table["name"],
        fields: table["columns"],
        data: []
      };

      if (!schema["tables"].find(tbl => tbl["name"] == table["name"])) {
        schema["tables"].push(tableSchema);
      }
    });

    return schema;
  }

  static parseJSON(value) {
    return JSON.parse(decodeURIComponent(escape(value)));
  }

  static toJSON(value) {
    return unescape(encodeURIComponent(JSON.stringify(value)));
  }
}
