import { Client, Identifiers, Values, MysqlConfiguration } from './types';
import { Pool, createPool } from 'mysql';

let client: Pool = null;

export const createMysqlPool = ({ host, user, password, database, port }: MysqlConfiguration): Pool => {
  if (!client) {
    client = createPool({ user, password, host, database, port, dateStrings: true });
  }

  return client;
};

export const promisifyQuery = <T>(client: Pool, query, values, resultFn?: (result: any) => T): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    client.query(query, values, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      if (resultFn) {
        resolve(resultFn(result));
      }

      resolve(result)
    })
  });
};

export class MySQLClient<T extends Pool = Pool> implements Client<T> {
  constructor(private readonly dbClient: T) {}

  get connection(): T {
    return this.dbClient;
  }

  insert(collection: string, values: Values) {
    return promisifyQuery<void>(this.dbClient, `INSERT INTO ${collection} SET ?`, values, () => {});
  }

  delete(collection: string, identifiers: Identifiers) {
    const condition = Object.keys(identifiers).map((column) => {
      return `"${column}" = ?`;
    });

    return promisifyQuery<void>(
      this.dbClient,
      `DELETE FROM ${collection} WHERE ${condition}`,
      Object.values(identifiers),
      () => {}
      );
  }

  async update(collection: string, values: any[], identifiers: any[]) {
    const setter = Object.keys(values).map((column) => {
      return `"${column}" = ?`;
    });

    const condition = Object.keys(identifiers).map((column) => {
      return `"${column}" = ?`;
    });

    return promisifyQuery<void>(
      this.dbClient,
      `UPDATE ${collection} SET ${setter} WHERE ${condition}`,
      [...Object.values(values), ...Object.values(identifiers)],
      () => {}
      );
  }
}
