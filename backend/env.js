import dotenv from "dotenv";

// Tell dotenv which file to read and merge into process.env 
dotenv.config({
  // Path to the .env file, same folder as this env.js file
  // import.meta.url is this module's file url, new URL resolves to an absolute path that works on Windows and Unix.
  path: new URL("./.env", import.meta.url)
});
