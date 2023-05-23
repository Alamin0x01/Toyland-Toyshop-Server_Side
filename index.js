const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
console.log(process.env.USER);
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://alaminmmc5:93Jq6h8TvSotbksx@cluster0.exyylxe.mongodb.net/?retryWrites=true&w=majority";

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const toyCollection = client.db("toyDB").collection("toys");

    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });
    app.get("/totaltoy", async (req, res) => {
      const result = await toyCollection.estimatedDocumentCount();
      res.send({ result });
    });

    app.post("/toys", async (req, res) => {
      const toy = req.body;
      const result = await toyCollection.insertOne(toy);
      res.send(result);
    });

    app.get("/mytoys", async (req, res) => {
      const id = req.query.userId;
      const query = { uid: id };
      const sortOption = req.query.sort;

      let sortQuery = {};
      if (sortOption) {
        if (sortOption === "asc") {
          sortQuery = { name: 1 };
        } else if (sortOption === "desc") {
          sortQuery = { name: -1 };
        }
      }

      const result = await toyCollection.find(query).sort(sortQuery).toArray();
      res.send(result);
    });

    app.delete("/mytoys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/mytoys/:id", async (req, res) => {
      const id = req.params.id;
      const toy = req.body;

      const query = { _id: new ObjectId(id) };

      const updatedToy = {
        $set: {
          picture_url: toy?.picture_url,
          name: toy?.name,
          sub_category: toy?.sub_category,
          price: toy?.price,
          rating: toy?.rating,
          quantity: toy?.quantity,
          description: toy?.description,
        },
      };

      const result = await toyCollection.updateOne(query, updatedToy, {
        upsert: true,
      });

      res.send(result);
    });

    app.get("/toys", async (req, res) => {
      const data = req.query;

      const cetagory = req.query.cetagory;
      const search = req.query.search;

      let query = {};

      if (cetagory) {
        query = { sub_category: cetagory };
      }

      if (search) {
        query = { name: { $regex: search, $options: "i" } };
      }

      const page = parseInt(data.page) || 0;
      const limit = parseInt(data.limit) || 20;
      const skip = page * limit;

      const result = await toyCollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Toy Marketplace Server is running");
});

app.listen(port, () => {
  console.log(`Toy Marketplace Server is running on port ${port}`);
});
