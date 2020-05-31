import { db } from '../database';

export const deletePropertiesWithoutTitleDeeds = async () => {
  const keys = db
    .get('properties')
    .keys()
    .valueOf();

  let count = 0;
  for (const key of keys) {
    const property = db.get(`properties.${key}`).value();

    if (!property.titleDeed) {
      count += 1;
      console.log(`Removing property: ${count}`);
      db.get('properties')
        .unset(key)
        .write();
    }
  }
};

deletePropertiesWithoutTitleDeeds();
