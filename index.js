const express = require("express");
const { Worker } = require("worker_threads");
const redis = require('redis');
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const client = redis.createClient({
  url: 'redis://redis:6379',
  legacyMode: true,
  });
(async () => {
    await client.connect();
})();
  
console.log("Connecting to the Redis");
  
client.on("ready", () => {
    console.log("Connected!");
});
  
client.on("error", (err) => {
    console.log("Error in the Connection");
});

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let ticket_id = 1;
app.post("/input", async (req, res) => {
  const number = +req.body.number - 1;
  const worker = new Worker("./worker.js", {
    workerData: { num: number },
  });
  worker.on("message", async (data) => {
    // console.log(client.connect);
    await client.set(ticket_id.toString(), data , function(err,reply) {
      if(!err) {
        console.log(reply);
        res.status(200).send({'ticket':ticket_id});
        ticket_id++;
      }
    });
    
  });

  worker.on("error", (data) => {
    res.status(404).send(`An error occurred: ${data}`);
  });
});

app.get("/output", async (req, res) => {
  const ticket = req.query.ticket;  
  console.log(ticket);
  await client.get(ticket.toString(), function(err, reply) {
    console.log(reply);
    if(reply == null) {
      res.status(200).send({'answer':'not found'});
    } else {
      res.status(200).send({'Fibonacci':reply});
    }
  });       
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
