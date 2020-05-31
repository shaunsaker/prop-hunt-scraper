import { db } from '../database';

export const deletePropertiesWithoutTitleDeeds = async () => {
  const keys = db
    .get('properties')
    .keys()
    .valueOf();

  for (const key of keys) {
    const property = db.get(`properties.${key}`).value();

    if (!property.titleDeed) {
      db.get('properties')
        .unset(key)
        .write();
    }
  }
};

deletePropertiesWithoutTitleDeeds();
