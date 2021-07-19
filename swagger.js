const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./board.js"];

swaggerAutogen(outputFile, endpointsFiles, {
  info: {
    title: "API Documentation",
  },
  host: "simutis.dev",
  schemes: ["https"],
  definitions: {
    boardStatus: [
      {
        update: 3162,
        minX: -102,
        maxX: 32722.9431028047,
        minY: -216.73828125,
        maxY: 10724,
      },
    ],
    board: [
      {
        _id: "607abcf503a79a5f2db4320a",
        x: -4.565473550710278,
        y: -216.73828125,
        data: {
          name: "user123",
          color: "#000000",
          data: {
            radius: 264874.44413730345,
          },
          createdAt: "2021-04-17T10:48:21.576Z",
        },
      },
    ],
    cell: [
      {
        _id: "607abcf503a79a5f2db4320a",
        x: -4.565473550710278,
        y: -216.73828125,
        history: [
          {
            name: "user123",
            color: "#000000",
            data: {
              radius: 264874.44413730345,
            },
            createdAt: "2021-04-17T10:48:21.576Z",
          },
        ],
      },
    ],
    createCell: {
      status: "OK",
      id: "607abcf503a79a5f2db4320a",
    },
  },
});
