const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});

const Settings = mongoose.model('Settings', settingsSchema);

/**
 * Helper function to get a setting value.
 * @param {string} key The key of the setting to retrieve.
 * @param {*} defaultValue The default value to return if the key doesn't exist.
 * @returns {*} The value of the setting.
 */
async function getSetting(key, defaultValue = null) {
  const setting = await Settings.findOne({ key });
  return setting ? setting.value : defaultValue;
}

/**
 * Helper function to set a setting value.
 * @param {string} key The key of the setting to set.
 * @param {*} value The value to set.
 */
async function setSetting(key, value) {
  await Settings.findOneAndUpdate(
    { key },
    { value },
    { upsert: true, new: true }
  );
}

module.exports = {
  Settings,
  getSetting,
  setSetting,
};
