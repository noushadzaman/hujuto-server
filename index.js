let brands = require("./brands.json");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x4h5cla.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //  client.connect();

    const brandCollection = client.db("hujuto").collection("brands");
    const vehicleCollection = client.db("hujuto").collection("vehicle");
    const cartProductCollection = client
      .db("hujuto")
      .collection("cartProducts");

    app.get("/brand", async (req, res) => {
      const cursor = brandCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/brand/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await brandCollection.findOne(query);
      res.send(result);
    });

    // app.post("/vehicle", async (req, res) => {
    //   const vehicle = req.body;
    //   const result = await vehicleCollection.insertOne(vehicle);
    //   res.send(result);
    // });

    app.get("/vehicle", async (req, res) => {
      let query = {};
      if (req.query.brandName) {
        query = { brandName: req.query.brandName };
      }
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await vehicleCollection
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.get("/vehicleCount", async (req, res) => {
      let query = {};
      if (req.query.brandName) {
        query = { brandName: req.query.brandName };
      }
      const result = await vehicleCollection
        .find(query)
        .toArray();
      res.send(result);
    });

    app.get("/vehicle/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await vehicleCollection.findOne(query);
      res.send(result);
    });

    app.post("/cartProduct", async (req, res) => {
      const product = req.body;
      const result = await cartProductCollection.insertOne(product);
      res.send(result);
    });

    app.get("/cartProduct", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { userEmail: req.query.email };
      }
      const cursor = cartProductCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // app.get("/vehicleUpdate/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await vehicleCollection.findOne(query);
    //   res.send(result);
    // });

    // app.put("/update/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const options = { upsert: true };
    //   const updatedVehicle = req.body;
    //   const vehicle = {
    //     $set: {
    //       imageUrl: updatedVehicle.imageUrl,
    //       name: updatedVehicle.name,
    //       brandName: updatedVehicle.brandName,
    //       type: updatedVehicle.type,
    //       price: updatedVehicle.price,
    //       rating: updatedVehicle.rating,
    //       shortDescription: updatedVehicle.shortDescription,
    //     },
    //   };
    //   const result = await vehicleCollection.updateOne(query, vehicle, options);
    //   res.send(result);
    // });

    // app.get("/cartProduct/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await cartProductCollection.findOne(query);
    //   res.send(result);
    // });

    app.delete("/cartProduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartProductCollection.deleteOne(query);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`hujuto running`);
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
