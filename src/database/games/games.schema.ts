import { Schema } from 'mongoose';
import { findByName } from './games.statics';
import { setLastUpdated } from './games.methods';

const GameSchema = new Schema({
  name: String,
  releaseDate: Date,
  crackDate: Date,
  drm: String,
  sceneGroup: String,
  dateOfEntry: {
    type: Date,
    default: new Date(),
  },
  lastUpdated: {
    type: Date,
    default: new Date(),
  },
});

GameSchema.statics.findByName = findByName;

GameSchema.methods.setLastUpdated = setLastUpdated;

export default GameSchema;
