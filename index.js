let brands = require("./brands.json");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.es2kkf9.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const vehicleCollection = client.db("hujutoDB").collection("vehicles");

    app.post("/vehicle", async (req, res) => {
      const user = req.body;
      const result = await vehicleCollection.insertOne(user);
      res.send(result);
    });

    app.get("/vehicle", async (req, res) => {
      const cursor = vehicleCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/vehicle/:id", async (req, res) => {
      const id = req.params._id;
      const query = { id: new ObjectId(id) };
      const result = await vehicleCollection.findOne();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(brands);
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
