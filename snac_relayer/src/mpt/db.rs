use std::collections::HashMap;
use std::error::Error;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::mpt::errors::MemDBError;

/// "DB" defines the "trait" of trie and database interaction.
/// You should first write the data to the cache and write the data
/// to the database in bulk after the end of a set of operations.
pub trait AsyncDB {
    type Error: Error;

    async fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>, Self::Error>;

    /// Insert data into the cache.
    async fn insert(&self, key: &[u8], value: Vec<u8>) -> Result<(), Self::Error>;

    /// Remove data with given key.
    async fn remove(&self, key: &[u8]) -> Result<(), Self::Error>;

    /// Insert a batch of data into the cache.
    async fn insert_batch(
        &self,
        keys: Vec<Vec<u8>>,
        values: Vec<Vec<u8>>,
    ) -> Result<(), Self::Error> {
        for i in 0..keys.len() {
            let key = &keys[i];
            let value = values[i].clone();
            self.insert(key, value).await?;
        }
        Ok(())
    }

    /// Remove a batch of data into the cache.
    async fn remove_batch(&self, keys: &[Vec<u8>]) -> Result<(), Self::Error> {
        for key in keys {
            self.remove(key).await?;
        }
        Ok(())
    }

    /// Flush data to the DB from the cache.
    async fn flush(&self) -> Result<(), Self::Error>;

    #[cfg(test)]
    fn len(&self) -> Result<usize, Self::Error>;
    #[cfg(test)]
    fn is_empty(&self) -> Result<bool, Self::Error>;
}

/// "DB" defines the "trait" of trie and database interaction.
/// You should first write the data to the cache and write the data
/// to the database in bulk after the end of a set of operations.
pub trait DB: Send + Sync {
    type Error: Error;

    fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>, Self::Error>;

    /// Insert data into the cache.
    fn insert(&self, key: &[u8], value: Vec<u8>) -> Result<(), Self::Error>;

    /// Remove data with given key.
    fn remove(&self, key: &[u8]) -> Result<(), Self::Error>;

    /// Insert a batch of data into the cache.
    fn insert_batch(&self, keys: Vec<Vec<u8>>, values: Vec<Vec<u8>>) -> Result<(), Self::Error> {
        for i in 0..keys.len() {
            let key = &keys[i];
            let value = values[i].clone();
            self.insert(key, value)?;
        }
        Ok(())
    }

    /// Remove a batch of data into the cache.
    fn remove_batch(&self, keys: &[Vec<u8>]) -> Result<(), Self::Error> {
        for key in keys {
            self.remove(key)?;
        }
        Ok(())
    }

    /// Flush data to the DB from the cache.
    fn flush(&self) -> Result<(), Self::Error>;

    #[cfg(test)]
    fn len(&self) -> Result<usize, Self::Error>;
    #[cfg(test)]
    fn is_empty(&self) -> Result<bool, Self::Error>;
}

#[derive(Default, Debug)]
pub struct MemoryDB {
    // If "light" is true, the data is deleted from the database at the time of submission.
    light: bool,
    storage: Arc<RwLock<HashMap<Vec<u8>, Vec<u8>>>>,
}

impl MemoryDB {
    pub fn new(light: bool) -> Self {
        MemoryDB {
            light,
            storage: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

impl AsyncDB for MemoryDB {
    type Error = MemDBError;

    async fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>, Self::Error> {
        if let Some(value) = self.storage.read().await.get(key) {
            Ok(Some(value.clone()))
        } else {
            Ok(None)
        }
    }

    async fn insert(&self, key: &[u8], value: Vec<u8>) -> Result<(), Self::Error> {
        self.storage.write().await.insert(key.to_vec(), value);
        Ok(())
    }

    async fn remove(&self, key: &[u8]) -> Result<(), Self::Error> {
        if self.light {
            self.storage.write().await.remove(key);
        }
        Ok(())
    }

    async fn flush(&self) -> Result<(), Self::Error> {
        Ok(())
    }

    #[cfg(test)]
    async fn len(&self) -> Result<usize, Self::Error> {
        Ok(self.storage.try_read().unwrap().len())
    }
    #[cfg(test)]
    async fn is_empty(&self) -> Result<bool, Self::Error> {
        Ok(self.storage.try_read().unwrap().is_empty())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memdb_get() {
        let memdb = MemoryDB::new(true);
        memdb.insert(b"test-key", b"test-value".to_vec()).unwrap();
        let v = memdb.get(b"test-key").unwrap().unwrap();

        assert_eq!(v, b"test-value")
    }

    #[test]
    fn test_memdb_remove() {
        let memdb = MemoryDB::new(true);
        memdb.insert(b"test", b"test".to_vec()).unwrap();

        memdb.remove(b"test").unwrap();
        let contains = memdb.get(b"test").unwrap();
        assert_eq!(contains, None)
    }
}
