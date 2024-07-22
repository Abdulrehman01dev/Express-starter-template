const Is_Required = () => {
    return [true,`{PATH} is required`]
};
const Field_Length = (len,msg) => {
    return [len,`{PATH} is ${msg}`]
};



const mongooseCustomErrors={
    DocumentNotFoundError: null,
    general: {
      default: '{PATH}  was invalid; please contact us if necessary.',
      required: '{PATH} is required.',
      unique: '{PATH} is not unique.'
    },
    Number: {
      min: '{PATH} is less than minimum allowed value of ({MIN}).',
      max: '{PATH} is more than maximum allowed value ({MAX}).'
    },
    Date: {
      min: '{PATH} is before minimum allowed value ({MIN}).',
      max: '{PATH} is after maximum allowed value ({MAX}).'
    },
    String: {
      enum: '{PATH} has an invalid selection.',
      match: '{PATH} has an invalid value.',
      minlength: '{PATH} is shorter than the minimum allowed length ({MINLENGTH}).',
      maxlength: '{PATH} is longer than the maximum allowed length ({MAXLENGTH}).'
    }
  }

const customCastPlugin = (schema) => {
  // Set the custom 'cast' message for all paths in the schema
  schema.eachPath((path) => {
    console.log(path);
    schema.path(path).options.cast = `{PATH} is of type {KIND}`;
  });
};

module.exports={

  Is_Required,
  Field_Length,
  customCastPlugin,
  mongooseCustomErrors
}