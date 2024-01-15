const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

app.use(
  cors({
    origin: ["http://localhost:5173", "https://hujuto.web.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x4h5cla.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const brandCollection = client.db("hujuto").collection("brands");
    const vehicleCollection = client.db("hujuto").collection("vehicle");
    const cartProductCollection = client
      .db("hujuto")
      .collection("cartProducts");
    const orderCollection = client.db("hujuto").collection("orders");
    const userCollection = client.db("hujuto").collection("users");

    const verifyAdmin = async (req, res, next) => {
      const email = req?.user?.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post(`/logout`, async (req, res) => {
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

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

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const result = await userCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });

    app.post("/vehicle", verifyToken, verifyAdmin, async (req, res) => {
      const vehicle = req.body;
      const result = await vehicleCollection.insertOne(vehicle);
      res.send(result);
    });

    app.get("/vehicle", async (req, res) => {
      let query = {};
      if (req.query.brandName) {
        query = { brandName: req.query.brandName };
      }
      let sortObj = {};
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;
      if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder;
      }
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await vehicleCollection
        .find(query)
        .skip(page * size)
        .limit(size)
        .sort(sortObj)
        .toArray();
      res.send(result);
    });

    app.get("/vehicleCount", async (req, res) => {
      let query = {};
      if (req.query.brandName) {
        query = { brandName: req.query.brandName };
      }
      const result = await vehicleCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/vehicle/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await vehicleCollection.findOne(query);
      res.send(result);
    });

    app.post("/cartProduct", verifyToken, async (req, res) => {
      const product = req.body;
      const result = await cartProductCollection.insertOne(product);
      res.send(result);
    });

    app.get("/cartProduct", verifyToken, async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { userEmail: req.query.email };
      }
      const cursor = cartProductCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.patch("/vehicle/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedVehicle = req.body;
      const vehicle = {
        $set: {
          name: updatedVehicle.name,
          brandName: updatedVehicle.brandName,
          location: updatedVehicle.location,
          type: updatedVehicle.type,
          price: updatedVehicle.price,
          rating: updatedVehicle.rating,
          shortDescription: updatedVehicle.shortDescription,
          imageUrls: updatedVehicle.imageUrls,
          direction: updatedVehicle.direction,
        },
      };
      const result = await vehicleCollection.updateOne(query, vehicle, options);
      res.send(result);
    });

    app.patch("/vehicleIncrease/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedNumber = req.body;
      console.log(updatedNumber.orderedNumber)
      const vehicle = {
        $set: {
          orderedNumber: updatedNumber.orderedNumber
        },
      };
      const result = await vehicleCollection.updateOne(query, vehicle, options);
      res.send(result);
    });
    
    app.delete("/cartProduct/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartProductCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/order", verifyToken, verifyAdmin, async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result);
    });

    app.post("/order", verifyToken, async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    app.delete("/order/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

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
