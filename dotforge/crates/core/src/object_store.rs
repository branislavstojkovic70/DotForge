use crate::object_id::ObjectId;

pub mod in_memory;
pub mod directory;

pub trait ObjectStore {
    type Error: std::fmt::Debug;

    fn has(&self, id: ObjectId) -> Result<bool, Self::Error>;
    fn read(&self, id: ObjectId) -> Result<Option<Vec<u8>>, Self::Error>;
    fn insert(&mut self, object: &[u8]) -> Result<ObjectId, Self::Error>;

    fn insert_with_id(
        &mut self,
        id: ObjectId,
        object: &[u8],
    ) -> Result<(), Self::Error> {
        let computed = self.insert(object)?;
        assert_eq!(computed, id, "provided id does not match content hash");
        Ok(())
    }
}