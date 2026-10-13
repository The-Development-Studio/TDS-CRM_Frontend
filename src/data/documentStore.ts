export interface StoredDocument {
  id: string;
  name: string;
  category: string;
  client: string;
  size: number;
  mimeType: string;
  updated: string;
  file: Blob;
}

const databaseName = 'tds-crm-documents';
const storeName = 'files';

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  if (!('indexedDB' in window)) {
    reject(new Error('Local document storage is unavailable in this browser.'));
    return;
  }

  const request = indexedDB.open(databaseName, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(storeName)) {
      request.result.createObjectStore(storeName, { keyPath: 'id' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('Could not open document storage.'));
});

export const listStoredDocuments = async () => {
  const database = await openDatabase();
  return new Promise<StoredDocument[]>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => resolve((request.result as StoredDocument[]).sort((left, right) => right.updated.localeCompare(left.updated)));
    request.onerror = () => reject(request.error ?? new Error('Could not load uploaded documents.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Could not read document storage.'));
    };
  });
};

export const saveStoredDocument = async (document: StoredDocument) => {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(document);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error('Could not save document.')); };
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error('Document save was cancelled.')); };
  });
};

export const deleteStoredDocument = async (id: string) => {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error('Could not delete document.')); };
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error('Document deletion was cancelled.')); };
  });
};
