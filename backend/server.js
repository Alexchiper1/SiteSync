import app from "./app.js";

//use PORT from the environment or 5000 when developing locally.
const PORT = process.env.PORT || 5000;
// Start the HTTP server, bind to PORT on all interfaces and run the callback once listening succeeds.
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
