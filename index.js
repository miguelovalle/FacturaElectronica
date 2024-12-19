const express = require('express');
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
const fs = require('fs');

const app = express();

app.use(
  bodyParser.xml()
);

// todo lo que exporte  el archivo ./routes/dianDos lo va a habilitar en la ruta del  endpoint api/dianDocs
app.use('/api/dianDocs', require('./routes/dianDocs'));

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
