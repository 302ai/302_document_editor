import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface IInformationSourceList {
  id?: number;
  title: string;
  url: string;
  description?: string;
  author?: string;
  pubDate?: string;
  summaryContent?: string;
}

const DB_NAME = 'ai-novel-information-source-list-name';
const STORE_NAME = 'ai-novel-information-source-list-store';

interface MyDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: IInformationSourceList
    indexes: {
      'byId': number;
    };
  };
}

export async function initDB(): Promise<IDBPDatabase<MyDB>> {
  const db = await openDB<MyDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('byId', 'id');  // 创建索引
      }
    },
  });
  return db;
}

export async function addData(dataArray: Array<Omit<IInformationSourceList, 'id'>>): Promise<Array<IInformationSourceList>> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const data of dataArray) {
    await store.add(data);
  }

  await tx.done;
  return await getAllData();
}

export async function getAllData(): Promise<Array<IInformationSourceList>> {
  const db = await initDB();
  const reault = await db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
  return reault.sort((a, b) => b.id - a.id);
}

export async function deleteData(ids: number[]): Promise<Array<IInformationSourceList>> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const id of ids) {
    await store.delete(id);
  }

  await tx.done;

  return await getAllData();
}

export async function updateData(id: number, data: Partial<IInformationSourceList>): Promise<Array<IInformationSourceList>> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const existingData = await store.get(id);
  if (!existingData) {
    throw new Error(`No data found with id ${id}`);
  }

  const updatedData = { ...existingData, ...data };
  await store.put(updatedData);
  await tx.done;

  return await getAllData();
}
