const AWS = require('aws-sdk');
const dotenv = require('dotenv');

// Load variables from .env1
const envConfig = dotenv.config({ path: "../../.env" }).parsed;

// Configure AWS SDK with your credentials
AWS.config.update({
  region: 'us-west-1', // e.g., 'us-west-2'
  accessKeyId: '',
  secretAccessKey: ''
});

const elasticbeanstalk = new AWS.ElasticBeanstalk();

const envVariables = Object.keys(envConfig).map(key => ({
  Namespace: 'aws:elasticbeanstalk:application:environment',
  OptionName: key,
  Value: envConfig[key]
}));

const params = {
  ApplicationName: 'name',
  EnvironmentName: 'name-env',
  OptionSettings: envVariables
};

elasticbeanstalk.updateEnvironment(params, function(err, data) {
  if (err) {
    console.error('Error', err);
  } else {
    console.log(params);
    console.log('Environment updated successfully', data);
  }
});
