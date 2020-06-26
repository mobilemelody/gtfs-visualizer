const express = require('express');
const pug = require('pug');
const bodyParser = require('body-parser');
const csv = require('csvtojson');

const app = express();

const PORT = process.env.PORT || 3000;

app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

// Use data from test folder
app.get('/', async function (req, res) {
  let trips = await csv().fromFile('test/trips.txt');
  let times = await csv().fromFile('test/stop_times.txt');
  let data = buildDataTable(trips, times);
  res.render('visualizer', data);
});

// Use data from form submission
app.post('/', async function (req, res) {
  let trips = await csv().fromString(req.body["trips"]);
  let times = await csv().fromString(req.body["times"]);
  let data = buildDataTable(trips, times);
  res.render('visualizer', data);
});

// Function to create data table object from trips and times
function buildDataTable(trips, times) {
  let data = {}

  // Build data arrays by service ID
  data.service_ids = [];
  data.blocks = {};
  for (const idx in trips) {
    let tripArr = [];

    // Get service ID
    let service_id = trips[idx].service_id;
    if (!data.service_ids.includes(service_id)) {
      data.service_ids.push(service_id);
      data.blocks[service_id] = [["block", "trip", {type:'date', label: 'start'}, {type: 'date', label: 'end'}]];
    }

    // Add block and trip IDs
    tripArr.push(trips[idx].block_id);
    tripArr.push(trips[idx].trip_id);

    // Get trip start time
    let start = times.find((e) => e.trip_id == trips[idx].trip_id).arrival_time;
    let [h, m, s] = start.split(':');
    tripArr.push("Date(0, 0, 0, " + h + ", " + m + ")");

    // Get trip end time
    let end = times.slice().reverse().find((e) => e.trip_id == trips[idx].trip_id).departure_time;
    [h, m, s] = end.split(':');
    tripArr.push("Date(0, 0, 0, " + h + ", " + m + ")");

    data.blocks[service_id].push(tripArr);
  }

  return data;
}

app.listen(PORT, function(){
  console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});