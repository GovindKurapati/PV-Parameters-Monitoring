const moongoose = require('mongoose');
const Schema = moongoose.Schema;

const ParametersSchema = new Schema({
    date:String,
    power:String
})

module.exports = moongoose.model('Paramters',ParametersSchema)