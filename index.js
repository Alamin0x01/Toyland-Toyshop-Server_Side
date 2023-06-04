const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json("Server IS Running");
});

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.exyylxe.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const toyCollection = client.db("toyshop").collection("toys");

    app.get("/toysName/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await toyCollection
        .find({
          $or: [{ name: { $regex: searchText, $options: "i" } }],
        })
        .limit(20)
        .toArray();
      res.json(result);
    });

    // All data
    app.get("/toys", async (req, res) => {
      const cursor = toyCollection.find().limit(20);
      const result = await cursor.toArray();
      res.json(result);
    });

    app.get("/toysBy", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = {
          sellerEmail: req.query.email,
        };
      }
      let sortQuery = { price: 1 };
      if (req.query.sort === "desc") {
        sortQuery = { price: -1 };
      }
      const result = await toyCollection.find(query).sort(sortQuery).toArray();
      res.json(result);
    });

    // adding new toy
    app.post("/toys", async (req, res) => {
      const newToy = req.body;
      const result = await toyCollection.insertOne(newToy);
      res.json(result);
    });

    // update data
    app.put("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedToy = req.body;
      const toys = {
        $set: {
          price: updatedToy.price,
          availableQuantity: updatedToy.availableQuantity,
          description: updatedToy?.description,
        },
      };
      const result = await toyCollection.updateOne(filter, toys, options);
      res.json(result);
    });

    // Data by id
    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      //   const query = { _id: new ObjectId(id) };
      const query = { _id: id };
      const result = await toyCollection.findOne(query);
      res.send(result);
      //   console.log(id);
    });

    // Data by category
    app.get("/toys/:category", async (req, res) => {
      const { category } = req.params;
      const query = { category };
      const cursor = toyCollection
        .find(query)
        .project({ name: 1, pictureUrl: 1, price: 1, rating: 1 });
      const result = await cursor.toArray();
      res.json(result);
    });

    // Delete data
    app.delete("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
