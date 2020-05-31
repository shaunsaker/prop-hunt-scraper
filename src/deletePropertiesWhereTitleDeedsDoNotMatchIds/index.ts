import { db } from '../database';

export const deletePropertiesWhereTitleDeedsDoNotMatchIds = async () => {
  const keys = db
    .get('properties')
    .keys()
    .valueOf();

  let count = 0;
  for (const key of keys) {
    const property = db.get(`properties.${key}`).value();

    if (property.titleDeed !== key) {
      count += 1;
      console.log(`Processing property: ${count}`);
      console.log(`${key} does not match ${property.titleDeed}`);
      db.get('properties')
        .set(property.titleDeed, property)
        .write();
      db.get('properties')
        .unset(key)
        .write();
    }
  }
};

deletePropertiesWhereTitleDeedsDoNotMatchIds();
