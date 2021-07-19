require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const { uniqueNamesGenerator, starWars, animals, colors } = require("unique-names-generator");
const express = require("express");
const shortid = require("shortid");
const dataLakes = require("./lakeData.json");
const dataSlang = require("./slangData.json");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger_output.json");
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const appPort = 3000;

app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

app.listen(appPort, () => {
  console.log(new Date().toISOString(), `Hello ssh! Port: ${appPort}`);
});



app.use("/api/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  ); // If needed
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  ); // If needed
  res.setHeader("Access-Control-Allow-Credentials", true); // If needed
  next();
});

app.use('/meteo', createProxyMiddleware({
  target: 'https://api.meteo.lt/v1',
  changeOrigin: true,
  pathRewrite: {
      [`^/meteo`]: '',
  },
}));

app.get("/api/test", (req, res, next) => {
  res.json({});
});

app.get("/api/get-random-lake", (req, res, next) => {
  const index = Math.floor(dataLakes.length * Math.random());
  res.json(dataLakes[index]);
});

app.get("/api/get-random-slang", (req, res, next) => {
  const index = Math.floor(dataSlang.length * Math.random());
  res.json(dataSlang[index]);
});

app.get("/api/generate-shopping-cart", (req, res, next) => {
  const { limit, exclude } = req.query;
  const total = limit ? limit : Math.floor(Math.random() * 100 + 10);
  const response = [];
  for (let i = 0; i < total; i++) {
    response.push({
      id: shortid.generate(),
      name: uniqueNamesGenerator({
        dictionaries: [starWars],
        style: "capital",
      }),
      animal: uniqueNamesGenerator({
        dictionaries: [animals],
        style: "capital",
      }),
      color: uniqueNamesGenerator({
        dictionaries: [colors],
        style: "lowerCase",
      }),
      price: Math.random() * 100,
      vegan: Math.random() > 0.5,
    });
  }
  res.json(response);
});

const url = "mongodb://127.0.0.1:27017";

MongoClient.connect(url, function (err, client) {
  require("./board")(app, client);
});
/**
 * (1 * css + 1 * js && js > 0.1 && js < 0.9) *
 * original idea *
 * process + 0.2 *
 * extra work
 *
 */

//  db.board.aggregate( [
//   // first we add the ``sortr`` field so that we can deal with empty arrays.
//   // if we see an empty array, we create one with a large negative number
//   { $project: {
//       x: 1,
//       y: 1,
//       history: 1,
//       sortr: { $cond: [ { $eq : [ '$history', []  ] }, [ -100000 ], '$history' ] }
//   } },

//   // then we unwind on our sorting-r-variant
//   { $unwind: '$sortr' },

//   // so that we can group by ID and pick out the last of the $sortr values
//   { $group: {
//       _id: '$_id',
//       x: { $first: '$x' },
//       y: { $first: '$y' },
//       history: { $first: '$history' },
//       sortr: { $last: '$sortr' }
//   } },

//   // then we sort by the last items over all the documents
//   { $sort: { sortr: 1 } },

//   // and reproject so that we get rid of the ``sortr`` field
//   { $project: { x: 1, y: 1, history: 1 } }
// ] )
