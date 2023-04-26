import PocketBase from '../pocketbase/js-sdk/dist/pocketbase.es.mjs';

let serverURL = 'https://eurotally-db.fly.dev';

if (window.location.hostname === 'localhost') {
  serverURL = 'http://localhost:8090';
}

const pb = new PocketBase(serverURL);

export default pb;
