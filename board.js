const dbName = "simutis-2020";
const ObjectId = require("mongodb").ObjectID;

module.exports = function (app, client) {
  console.log("Connected successfully to server");

  const db = client.db(dbName);
  const messagesCollection = db.collection("messages");

  const boardCollection = db.collection("board");

  const boardStatusCollection = db.collection("board-status");

  const cannumoCollection = db.collection("cannumo");

  const kaimasCollection = db.collection("kaimas");

  const incrementCollection = db.collection("incrementCollection");

  setInterval(() => {
    incrementCollection.updateOne(
      {},
      {
        $setOnInsert: {
          update: 0,
        },
        $inc: {
          fakeIncrement: 1,
        },
      },
      {
        upsert: true,
      }
    );
  }, 4000);

  app.get("/api/generate-rectangle", async (req, res, next) => {
    // const {  } = req.query;
    const response = [];
    const w = 38;
    const h = 38;
    const { fakeIncrement } = await incrementCollection.findOne();
    for (let x = 0; x < w; x++) {
      const row = [];
      for (let y = 0; y < h; y++) {
        row.push(Math.floor(Math.random() * 100));
      }
      response.push(row);
    }
    res.json({ updated: fakeIncrement, data: response });
  });

  app.get("/api/kaimas", async (req, res, next) => {
    const { type } = req.query;
    const data = await kaimasCollection
      .find(
        {
          type,
        },
        {
          sort: {
            createdAt: -1,
          },
        }
      )
      .toArray();
    res.json(data);
  });

  app.post("/api/kaimas", (req, res, next) => {
    const { type, data } = req.body;
    kaimasCollection.insertOne({
      type,
      createdAt: new Date(),
      data,
    });
    res.json();
  });

  boardStatusCollection.updateOne(
    {},
    {
      $setOnInsert: {
        update: 0,
        minX: Infinity,
        maxX: 0,
        minY: Infinity,
        maxY: 0,
      },
      $inc: {
        serverRestart: 1,
      },
    },
    {
      upsert: true,
    }
  );

  app.get("/api/messages", async (req, res, next) => {
    const messages = await messagesCollection
      .find(
        {},
        {
          sort: {
            createdAt: -1,
          },
          limit: 10,
        }
      )
      .toArray();
    res.json(messages);
  });

  app.post("/api/messages", (req, res, next) => {
    const { message, name } = req.body;
    if (message && name) {
      messagesCollection.insertOne({
        message,
        createdAt: new Date(),
        name,
      });
    }
    res.json();
  });

  app.post("/api/cannumo", (req, res, next) => {
    const { email, name, type, data } = req.body;
    cannumoCollection.insertOne({
      email,
      name,
      type,
      data,
      createdAt: new Date(),
    });
    res.json();
  });

  app.get("/api/board/status", async (req, res) => {
    // #swagger.description = 'Returns status of board api. Response include bounding rectangle of all points and update count'
    const status = await boardStatusCollection
      .aggregate([
        {
          $match: {},
        },
        {
          $project: {
            _id: 0,
            serverRestart: 0,
          },
        },
      ])
      .toArray();
    /*
    #swagger.responses[200] = {
      description: "Returns board status",
      schema: { $ref: "#/definitions/boardStatus" }
    }
    */
    res.status(200);
    res.json(status);
  });

  app.get("/api/board", async (req, res) => {
    // #swagger.description = 'Get all points in rectangle, filter, if necessary, by userId.'
    /* 
    #swagger.parameters['x'] = {
      in: 'query',
      description: 'x position of rectangle origin',
      required: true,
      type: 'number'
    }
    #swagger.parameters['y'] = {
      in: 'query',
      description: 'y position of rectangle origin',
      required: true,
      type: 'number'
    }
    #swagger.parameters['w'] = {
      in: 'query',
      description: 'width of rectangle',
      required: true,
      type: 'number'
    }
    #swagger.parameters['h'] = {
      in: 'query',
      description: 'height of rectangle',
      required: true,
      type: 'number'
    }
    #swagger.parameters['userId'] = {
      in: 'query',
      description: 'filter by userId',
      required: false,
      type: 'string'
    }
    */
    let { x, y, w, h, userId } = req.query;
    x = Number(x);
    y = Number(y);
    w = Number(w);
    h = Number(h);
    const allGoodCells = await boardCollection
      .aggregate([
        {
          $match: {
            // Bad practice, prone to injection
            ...(userId ? { userId } : {}),
            x: {
              $gte: x,
              $lt: x + w,
            },
            y: {
              $gte: y,
              $lt: y + h,
            },
          },
        },
        {
          $project: {
            _id: 1,
            x: 1,
            y: 1,
            userId: 1,
            data: {
              $arrayElemAt: ["$history", -1],
            },
          },
        },
      ])
      .toArray();
    /*
    #swagger.responses[200] = {
      description: "Returns all matched cells/points",
      schema: { $ref: "#/definitions/board" }
    }
    */
    res.status(200);
    res.json(allGoodCells);
  });

  app.post("/api/board/cell/delete", async (req, res) => {
    // #swagger.description = 'Delete point by ID'
    /* 
    #swagger.parameters['id'] = {
      in: 'body',
      description: 'unique ID of cell/point',
      required: true,
      type: 'string'
    }
    */
    const { id } = req.body;
    const deleted = await boardCollection.deleteOne({
      _id: ObjectId(id),
    });
    await boardStatusCollection.updateOne(
      {},
      {
        $inc: {
          update: 1,
        },
      }
    );
    res.json(deleted);
  });

  app.get("/api/board/cell", async (req, res) => {
    // #swagger.description = 'Get point by ID OR x and y'
    /* 
    #swagger.parameters['x'] = {
      in: 'query',
      description: 'x position of cell/point',
      required: false,
      type: 'number'
    }
    #swagger.parameters['y'] = {
      in: 'query',
      description: 'y position of cell/point',
      required: false,
      type: 'number'
    }
    #swagger.parameters['id'] = {
      in: 'query',
      description: 'unique ID of cell/point',
      required: false,
      type: 'string'
    }
    */
    const { x, y, id } = req.query;
    const allGoodCells = await boardCollection
      .aggregate([
        {
          $match: id
            ? {
                _id: ObjectId(id),
              }
            : {
                x: Number(x),
                y: Number(y),
              },
        },
        {
          $project: {
            _id: 1,
            x: 1,
            y: 1,
            userId: 1,
            history: 1,
          },
        },
      ])
      .toArray();
    /*
    #swagger.responses[200] = {
      description: "Returns cell/point",
      schema: { $ref: "#/definitions/cell" }
    }
    */
    res.status(200);
    res.json(allGoodCells);
  });

  app.post("/api/board", async (req, res) => {
    // #swagger.description = 'Create new point by providing minimum of x and y. If cell/point exists with same x and y, or ID provided, pushes all data provided to history array'
    /* 
    #swagger.parameters['x'] = {
      in: 'body',
      description: 'x position of cell/point',
      required: true,
      type: 'number'
    }
    #swagger.parameters['y'] = {
      in: 'body',
      description: 'y position of cell/point',
      required: true,
      type: 'number'
    }
    #swagger.parameters['name'] = {
      in: 'body',
      description: 'name given to cell/point',
      required: false,
      type: 'string'
    }
    #swagger.parameters['color'] = {
      in: 'body',
      description: 'color given to cell/point',
      required: false,
      type: 'string'
    }
    #swagger.parameters['data'] = {
      in: 'body',
      description: 'any custom data attached to cell/point',
      required: false,
      type: 'any'
    }
    #swagger.parameters['id'] = {
      in: 'body',
      description: 'update specific cell/point',
      required: false,
      type: 'string'
    }
    #swagger.parameters['userId'] = {
      in: 'body',
      description: 'filter by userId',
      required: false,
      type: 'string'
    }
    */
    const { x, y, name, color, data, id, userId } = req.body;
    if (
      (typeof x !== "number" && x !== undefined) ||
      (typeof y !== "number" && y !== undefined)
    ) {
      throw new Error("X AND Y ARE WRONG TYPES!");
    }
    let idToReturn = null;
    try {
      let toUpdateCell = null;
      if (id) {
        idToReturn = id;
        toUpdateCell = await boardCollection.findOne({
          _id: ObjectId(id),
        });
      } else {
        toUpdateCell = await boardCollection.findOne({
          x,
          y,
          userId,
        });
      }
      const historyBlock = {
        name,
        color,
        data,
        createdAt: new Date(),
      };
      if (toUpdateCell) {
        idToReturn = toUpdateCell._id;
        await boardCollection.updateOne(toUpdateCell, {
          $push: {
            history: historyBlock,
          },
        });
      } else {
        idToReturn = (
          await boardCollection.insertOne({
            x,
            y,
            userId,
            history: [historyBlock],
          })
        ).insertedId;
      }
      await boardStatusCollection.updateOne(
        {},
        {
          $inc: {
            update: 1,
          },
          $min: {
            minX: x,
            minY: y,
          },
          $max: {
            maxX: x,
            maxY: y,
          },
        }
      );
      /*
      #swagger.responses[200] = {
        description: "Returns ID of created/updated cell/point",
        schema: { $ref: "#/definitions/createCell" }
      }
      */
      res.status(200);
      res.json({
        status: "OK",
        id: idToReturn,
      });
    } catch (e) {
      console.log(e);
      res.status(500);
      res.json(e);
    }
  });
};
