import { faker } from '@faker-js/faker';
import { RateLimiter } from 'limiter';
import * as path from 'path';
import { promises as fs } from 'fs';

const limiter = new RateLimiter({ tokensPerInterval: 2, interval: 'second' });

const filePathData = { root: '', dir: 'data' };

const dateUserCreatedTo = new Date();
const dateUserCreatedFrom = new Date();

dateUserCreatedFrom.setFullYear(dateUserCreatedFrom.getFullYear() - 15);

function createUser() {
   return {
      id: faker.datatype.uuid(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      created: faker.date.between(dateUserCreatedFrom, dateUserCreatedTo),
   };
}

function createUsers(numUsers) {
   for (let i = 0; i < numUsers; i++) {
      const usr = createUser();
      const base = `usr-${usr.id}.json`;

      limiter.removeTokens(1)
         .then(() => {
            fs.writeFile(
               path.format({ ...filePathData, base }),
               JSON.stringify(usr, null, 3),
               { encoding: 'utf8' }
            )
               .then(console.log(`Wrote file ${base} successfully`))
               .catch(err => console.error(err.message));
         })
         .catch(err => console.error(err.message))
   }
}

createUsers(10);
