const app = require('./server/server');

/*******************************************************************
Define the PORT to listen on
********************************************************************/
const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(
    `Server is listening on port ${PORT} in ${process.env.NODE_ENV} mode`
  )
);
