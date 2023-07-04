const express = require('express')
const app = express()
const db = require('@cyclic.sh/dynamodb')
var cors = require('cors');
const axios = require('axios');
const moment = require('moment');

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

const restrictionsID = 'restrictionID';
const restrictionGroupsID = 'groupID';

function NaNZero(v){
  if(isNaN(v))
    return 0;
  return v;
}

async function updateCreateREST(req, col, key){
  const id = req.body[key];
  var toSet = req.body;
  delete toSet[key];
  var newID = "0";
  if(id == 'NEW'){
    const latest = await db.collection(col).latest();
    if(latest)
      newID = String(NaNZero(Number(latest.key)) + 1);
  }
  console.log(toSet);
  const result = await db.collection(col).set(newID, toSet);
  return {...result.props, [key]: result.key};
}

app.get('/dbtest', async (req, res) => {
  await db.collection('test').set('yolo', {one: 'two'});
  const a = await db.collection('test').list();
  res.json(a).end();
})

app.post('/restriction', async (req, res) => {
  const item = await updateCreateREST(req, restrictionsCol, restrictionsID);
  res.json(item).end();
})

app.post('/restrictionGroup', async (req, res) => {
  const item = await updateCreateREST(req, restrictionGroupsCol, restrictionGroupsID);
  res.json(item).end();
})

function adaptDBToJson(list, key){
  return list.results.map((a) => ({...a.props, [key]: a.key}));
}

app.get('/fotv', async (req, res) => {
  const sunset = await getSunsetTime();
  const restrictions = await db.collection(restrictionsCol).list();
  const restrictionGroups = await db.collection(restrictionGroupsCol).list();
  console.log(restrictions.results[0].props);
  res.json({
    sunset: sunset.format(),
    restrictions: adaptDBToJson(restrictions, restrictionsID), 
    restrictionGroups: adaptDBToJson(restrictionGroups, restrictionGroupsID),
    activeProgramID: 0
  }).end();
});

var lastSunset = null;
var lastTime = moment();

async function getSunsetTime() {
  if(lastSunset == null || Math.abs(lastTime.diff(moment(), 'hour')) >= 12){
    const axiosRes = await axios.get('https://api.sunrise-sunset.org/json?lat=42.3598986&lng=-71.0730733&formatted=0');
    const timeInUTC = moment(axiosRes.data.results.sunset);
    lastSunset = timeInUTC.utcOffset(-5);
    if(lastSunset.isDST()){
      lastSunset = lastSunset.add(1, 'hour');
    }
    lastTime = moment();
  }
  return lastSunset;
}

const flagRegex = /".*"/

app.get('/flag-color', (req, res) => {
  axios.get('https://api.community-boating.org/api/flag').then((axiosRes) => {
    const flagColor = axiosRes.data.toString().match(flagRegex)[0].replaceAll('\"', '');
    res.json({
      flagColor: flagColor
    }).end();
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
