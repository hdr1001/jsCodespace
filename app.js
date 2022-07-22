import { faker } from '@faker-js/faker';
import { RateLimiter } from 'limiter';
import * as path from 'path';
import { promises as fs, createWriteStream } from 'fs';

const limiter = new RateLimiter({ tokensPerInterval: 2, interval: 'second' });

const filePathData = { root: '', dir: 'data' };
const filePathOut = { root: '', dir: 'out' };

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
               .then( /* console.log(`Wrote file ${base} successfully`) */ )
               .catch(err => console.error(err.message));
         })
         .catch(err => console.error(err.message))
   }
}

//createUsers(5);

function addFileWriteStreamlisteners(ws, file) {
   ws.on('open', () => console.log(`Opened write stream for file ${file}`));

   ws.on('close', () => console.log(`Closed write stream for file ${file}`));

   ws.on('error', err => console.error(err.message));
}

function processUser(file) {
   return new Promise((resolve, reject) => {
      fs.readFile(file)
         .then(jsonData => {
            let usr;
            
            try {
               usr = JSON.parse(jsonData);
            }
            catch(err) {
               reject(err)
            }

            resolve(`${usr.firstName} ${usr.lastName}\n`);
         })
         .catch(err => reject(err))
   })
}

function processUsers() {
   const dataPath = path.format(filePathData);

   fs.readdir(dataPath)
      .then(dirFileNames => {
         const jsonFiles = dirFileNames.filter(fileName => fileName.endsWith('.json'));
         
         Promise.all(jsonFiles.map(jsonFile => processUser(dataPath + jsonFile)))
            .then(values => {
               const fileOut = path.format({ ...filePathOut, base: 'users.txt' });

               const fileWs = createWriteStream(fileOut);

               addFileWriteStreamlisteners(fileWs, fileOut);

               values.forEach(elem => fileWs.write(elem));

               fileWs.end();
            })
            .catch(err => console.error(err.message))
      })
      .catch(err => console.error(err.message))
}

processUsers();
