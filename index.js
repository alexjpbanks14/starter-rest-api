const express = require('express')
const app = express()
const db = require('@cyclic.sh/dynamodb')
var cors = require('cors');
const axios = require('axios');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

var allowedOrigins = ['http://localhost:8081',
                      'http://yourapp.com'];
app.use(cors({
  origin: function(origin, callback){
    return callback(null, true);
  }
}));

// #############################################################################
// This configures static hosting for files in /public that have the extensions
// listed in the array.
// var options = {
//   dotfiles: 'ignore',
//   etag: false,
//   extensions: ['htm', 'html','css','js','ico','jpg','jpeg','png','svg'],
//   index: ['index.html'],
//   maxAge: '1m',
//   redirect: false
// }
// app.use(express.static('public', options))
// #############################################################################

// Create or Update an item
/*app.post('/:col/:key', async (req, res) => {
  console.log(req.body)

  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} delete key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).set(key, req.body)
  item.
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Delete an item
app.delete('/:col/:key', async (req, res) => {
  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} delete key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).delete(key)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Get a single item
app.get('/:col/:key', async (req, res) => {
  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} get key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).get(key)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Get a full listing
app.get('/:col', async (req, res) => {
  const col = req.params.col
  console.log(`list collection: ${col} with params: ${JSON.stringify(req.params)}`)
  const items = await db.collection(col).list()
  console.log(JSON.stringify(items, null, 2))
  res.json(items).end()
})
*/

//42.35989864993693, -71.07307337127115

const restrictionsCol = 'restrictions';
const restrictionGroupsCol = 'restrictionGroups';

app.put('/restriction', async (req, res) => {
  const id = req.json.restrictionID;
  const value = await db.collection(restrictionsCol).set(id, req.json);
  res.json(value);
})

app.put('/restrictionGroup', async (req, res) => {
  const id = req.json.groupID;
  const value = await db.collection(restrictionGroupsCol).set(id, req.json);
  res.json(value);
})

app.get('/fotv', (req, res) => {
  getSunsetTime(async (timeInUTC) => {
    const restrictions = await db.collection(restrictionsCol).list();
    const restrictionGroups = await db.collection(restrictionGroups).list();
    res.json({
      sunset: timeInUTC,
      restrictions: restrictions,
      restrictionGroups: restrictionGroups,
      activeProgramID: 0
    }).end();
  })
});

function getSunsetTime(res) {
  axios.get('https://api.sunrise-sunset.org/json?lat=42.3598986&lng=-71.0730733').then((axiosRes) => {
    const timeInUTC = axiosRes.data.results.sunset
    res(timeInUTC);
  }).catch((e) => {
    throw e;
  })
}

const flagRegex = /".*"/

app.get('/flag-color', (req, res) => {
  axios.get('https://api.community-boating.org/api/flag').then((axiosRes) => {
    const flagColor = axiosRes.data.toString().match(flagRegex)[0].replaceAll('\"', '');
    res.json({
      flagColor: flagColor
    })
  }).catch((e) => {
    throw e;
  })
});

// Catch all handler for all other request.
app.use('*', (req, res) => {
  res.json({ msg: 'no route handler found' }).end()
})

// Start the server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`index.js listening on ${port}`)
})
