const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Definición del esquema del usuario
  // ...
});

const User = mongoose.model('User', userSchema);

module.exports = User; // Asegúrate de exportar el modelo