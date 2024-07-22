const swaggerAutogen = require("swagger-autogen")();
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const requireDir = require("require-dir");
const fs = require("fs");
requireDir("../models", { recurse: true });
const outputFile = "src/utils/swagger-output.json";
const ip = require("ip");
const ipAddress = ip.address();

const doc = {
  info: {
    title: "My API",
    description: "Description",
  },
  host: `${ipAddress}:${process.env.PORT || 5000}`,
  schemes: ["http", "https"],
  consumes: ["application/json"],
  produces: ["application/json"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: "Bearer token to access these api endpoints",
      scheme: "bearer",
    },
  },

  security: [
    {
      bearerAuth: [],
    },
  ],
  definitions: {},
};

for (const [modelName, model] of Object.entries(mongoose.models)) {
  doc.definitions[modelName] = model.schema.obj;
}
const endpointsFiles = ["src/config/routes.js"];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  addParametersInBody();
});

const addParametersInBody = () => {
  const swaggerPath = "src/utils/swagger-output.json"; // Replace with your Swagger file path
  const existingSwagger = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));
  for (const route in existingSwagger.paths) {
    // Check if the route has the desired HTTP methods (POST, PUT, PATCH)
    const methods = ["post", "put", "patch"]; // Add other methods as needed
    for (const method of methods) {
      if (existingSwagger.paths[route][method]) {
        const schema = generateSchemaFromModel(route);
        // Add the schema to the requestBody
        if (
          existingSwagger.paths[route][method].parameters &&
          existingSwagger.paths[route][method].parameters[0].schema
        )
          existingSwagger.paths[route][method].parameters[0].schema = schema;
        else {
          existingSwagger.paths[route][method].parameters.push({
            name: "body",
            in: "body",
            schema,
          });
        }
      }
    }
  }
  fs.writeFileSync(
    "src/utils/swagger-output.json",
    JSON.stringify(existingSwagger, null, 2),
    "utf8"
  );
};
function generateSchemaFromModel(apiName) {
  const schema = { type: "object", properties: {} };
  for (const [modelName, model] of Object.entries(mongoose.models)) {
    if (!apiName?.includes(modelName.toLowerCase())) continue;
    // Iterate over the model's paths and add them to the schema
    for (const [fieldName, field] of Object.entries(model.schema.paths)) {
      // Extract field type based on the instance
      let fieldType = "string"; // Default to string
      if (field.instance === "Number") {
        fieldType = "number";
      } else if (field.instance === "Date") {
        fieldType = "string"; // You can customize this for dates
      } else if (field.instance === "Boolean") {
        fieldType = "boolean";
      }
if(["_id","createdAt","updatedAt"].includes(fieldName))
continue
      // Add the field to the schema
      schema.properties[fieldName] = { type: fieldType };

      // If the field is required, mark it as such
      if (field.isRequired) {
        if (!schema.required) {
          schema.required = [];
        }
        schema.required.push(fieldName);
      }
    }
  }
  return schema;
}
