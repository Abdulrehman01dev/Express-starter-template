const fs = require('fs');
const path = require('path');

// Get the model name from command line arguments
const modelName = process.argv[2];

if (!modelName) {
  console.error('Please provide a model name as a parameter.');
  process.exit(1);
}

// Create controller content
const controllerContent = `
const ${modelName} = require("../models/${modelName}");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");

module.exports = {
  add${modelName}: factory.createOne(${modelName}),
  put${modelName}: factory.updateOne(${modelName}),
  delete${modelName}: factory.deleteOne(${modelName}),
  get${modelName}: factory.getOne(${modelName}),
  getAll${modelName}s: factory.getAll(${modelName}),
};
`;

// Create route content
const routeContent = `
const express = require("express");

const {
  add${modelName},
  put${modelName},
  delete${modelName},
  get${modelName},
  getAll${modelName}s,
} = require("../controllers/${modelName.toLowerCase()}Controller");
const requireAuth = require("../middlewares/requireAuth");
const restrictTo = require("../middlewares/restrictTo");
const { uploadMulter, uploadHandler } = require("../utils/uploadHelper");
const ReferenceUser = require("../utils/ReferenceUser");

const router = express.Router();

router.post("/", requireAuth, add${modelName});
router.get("/", requireAuth, getAll${modelName}s);
router.get("/:id", requireAuth, get${modelName});
router.put("/:id", requireAuth, put${modelName});
router.delete("/:id", requireAuth, delete${modelName});

module.exports = router;
`;


// Create directories if they don't exist
const controllerDirectory = path.join(__dirname, '..', 'controllers');
const routeDirectory = path.join(__dirname, '..', 'routes');


if (!fs.existsSync(controllerDirectory)) {
  fs.mkdirSync(controllerDirectory);
}

if (!fs.existsSync(routeDirectory)) {
  fs.mkdirSync(routeDirectory);
}

// Write controller and route files
const controllerFileName = `${modelName.toLowerCase()}Controller.js`;
const routeFileName = `${modelName.toLowerCase()}Routes.js`;

fs.writeFileSync(path.join(controllerDirectory, controllerFileName), controllerContent);
fs.writeFileSync(path.join(routeDirectory, routeFileName), routeContent);
const indexFilePath = path.join(routeDirectory, 'index.js');

// Read the content of the existing index file
fs.readFile(indexFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the index file:', err);
    process.exit(1);
  }

  // Define the export statement for the new route
  const newRouteExport = `  ${modelName.toLowerCase()}Routes: require("./${routeFileName}"),\n`;

  // Find the last occurrence of "module.exports = {"
  const lastExportIndex = data.lastIndexOf('module.exports = {');

  // Find the last occurrence of "}"
  const lastIndexExportIndex = data.lastIndexOf('}');

  // Remove the last "}" from the module.exports object
  const updatedData = data.substring(0, lastIndexExportIndex) + newRouteExport +  '}';



  // Write the updated content back to the index file
  fs.writeFileSync(indexFilePath, updatedData);
})
console.log(`Controller and route files for ${modelName} created successfully.`);
