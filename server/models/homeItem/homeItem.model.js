'use strict'

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var HomeItemSchema = new Schema({
  owner: String,
  body: String,
  images: [ String ],
  title: String,
  size: String,
  rent: String,
  location: String,
  date: Date,
  url: String,
  dateCreated: {
    type: Date,
    default: Date.now
  },
  dateModified: {
    type: Date,
    default: Date.now
  },
  dateRemoved: {
    // Approximate as I cannot know exactly when it was removed
    type: Date
  },
  active: {
    // For slowly changing dimensions like data
    type: Boolean,
    default: true
  },
  disabled: Boolean
});


HomeItemSchema.pre('save', function (next) {
  this.dateModified = new Date();
  
  next();
});

module.exports = mongoose.model('HomeItem', HomeItemSchema);