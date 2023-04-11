import PocketBase from "../pocketbase/js-sdk/dist/pocketbase.es.mjs";

let serverURL = "https://eurotally-db.fly.dev";

if (window.location.hostname === "localhost") {
  serverURL = "http://localhost:8090";
}

const pb = new PocketBase(serverURL);

// const temp = new PocketBase("http://127.0.0.1:8090");

// const data = await temp.collection("countries").getFullList();
// for (const c of data) {
//   await pb.collection("countries").create({
//     "country": c.country,
//     "song": c.song,
//     "band": c.band,
//     "flag": c.flag,
//     "profile": c.profile,
//   });
// }

export default pb;