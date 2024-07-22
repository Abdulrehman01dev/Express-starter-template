const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const colors = require('colors');
const { faker } = require('@faker-js/faker');
const connectDB = require('./config/connectDb');

// Connect to the database
connectDB();

// Get the "models" folder path
const modelsFolderPath = path.join(__dirname, 'models');

// Read all the files in the "models" folder
const modelFiles = fs.readdirSync(modelsFolderPath);

// Import all the models dynamically
const models = [];

modelFiles.forEach((file) => {
  const model = require(path.join(modelsFolderPath, file));
  const modelName = file.split('.')[0];

  if (typeof model === 'object') {
    // If model is an object, it contains multiple models
    // Iterate over the sub-models and push each one to the 'models' array
    for (const subModelName in model) {
      models.push({ name: subModelName, model: model[subModelName] });
    }
  } else {
    // If model is not an object, it's a single model
    // Push it to the 'models' array
    models.push({ name: modelName, model });
  }
});

console.log(models)


const saveDataToJSON = async (model, modelName) => {
  try {
    if(!model)
    return
    // Fetch all data from the model
    const data = await model.find();

    // Convert the data to JSON format
    const jsonData = JSON.stringify(data, null, 2);

    // Write the JSON data to a file
    const filePath = path.join(__dirname, `data/${modelName.toLowerCase()}s.json`);

    // Check if the file already exists
    if (!fs.existsSync(filePath)) {
      // If the file does not exist, create it
      fs.writeFileSync(filePath, jsonData);
      console.log(`New file "${modelName.toLowerCase()}s.json" created...`.green.inverse);
    } else {
      // If the file already exists, update its content
      fs.writeFileSync(filePath, jsonData);
      console.log(`Data saved to "${modelName.toLowerCase()}s.json"...`.green.inverse);
    }

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Import into DB
const importData = async (model, modelName) => {
  try {
    const data = JSON.parse(
      fs.readFileSync(`${__dirname}/data/${modelName.toLowerCase()}s.json`, 'utf-8')
    );

    await model.create(data);
    console.log(`Data Imported for model "${modelName}"...`.green.inverse);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Delete data
const deleteData = async (model, modelName) => {
  try {
    await model.deleteMany();
    console.log(`Data Destroyed for model "${modelName}"...`.red.inverse);
  
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};



const generateFakeDataForFieldType = (fieldType) => {
 
  if (fieldType === "String") {
    return faker.person.firstName(); // Generate a random first name as an example
  } else if (fieldType === "Number") {
    return faker.datatype.number(); // Generate a random number
  } else if (fieldType === "Boolean") {
    return faker.datatype.boolean(); // Generate a random boolean
  } else if (fieldType === "Date") {
    return faker.date.past(); // Generate a random past date
  } else if (fieldType === "ObjectId") {
    return new mongoose.Types.ObjectId(); // Generate a random ObjectId
  } else if (fieldType === "Object") {
    console.log(fieldType);
    // If the field type is an object, generate fake data for each field in the object recursively
    const fakeData = {};
    for (const key in fieldType) {
      fakeData[key] = generateFakeDataForFieldType(fieldType[key]);
    }
    return fakeData;
  }
  
  // Add more cases for other field types if needed

  return null;
};



// Function to populate fake data for a model
const populateFakeDataForModel = (model, modelName) => {
  const fakeDataArray = [];
  const schemaPaths = model.schema.paths;

  for (let i = 0; i < 10; i++) {
    const fakeData = {};
    for (const path in schemaPaths) {
      if (path !== '__v') {
        const fieldType = schemaPaths[path].instance;
        console.log(fieldType)
        const fakeValue = generateFakeDataForFieldType(fieldType);
        fakeData[path] = fakeValue;
      }
    }
    fakeDataArray.push(fakeData);
  }
   const jsonData = JSON.stringify(fakeDataArray, null, 2);

    // Write the JSON data to a file
    const filePath = path.join(__dirname, `data/${modelName.toLowerCase()}s.json`);
       // Check if the file already exists
       if (!fs.existsSync(filePath)) {
        // If the file does not exist, create it
        fs.writeFileSync(filePath, jsonData);
        console.log(`New file "${modelName.toLowerCase()}s.json" created...`.green.inverse);
      } else {
        // If the file already exists, update its content
        fs.writeFileSync(filePath, jsonData);
        console.log(`Data saved to "${modelName.toLowerCase()}s.json"...`.green.inverse);
      }
};






const performTaskForEachModel = async (operation) => {
  // Loop through each model object and perform the specified operation
  for (const { name: modelName, model } of models) {
    switch (operation) {
      case '-i':
        await importData(model, modelName);
        break;
      case '-d':
        await deleteData(model, modelName);
        break;
      case '-s':
        await saveDataToJSON(model, modelName);
        break;
      case '-p':
        await populateFakeDataForModel(model, modelName);
        break;
      default:
        console.log('Invalid operation. Use "-i" for import, "-d" for delete, or "-s" for save to JSON.'.red.inverse);
      }
    }
    console.log("done")
    process.exit(1);
};



// Process the command-line arguments
if (process.argv.length < 3) {
  console.log('No operation specified. Use "-i" for import, "-d" for delete, or "-s" for save to JSON.'.red.inverse);
  process.exit(1);
}

performTaskForEachModel(process.argv[2]);