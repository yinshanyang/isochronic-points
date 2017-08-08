const fs = require('fs')
const turf = require('@turf/turf')

const DISTANCE = 0.2
const UNIT = 'kilometers'

// create bounding box
const singapore = require('./data/singapore.geo.json')
const bbox = turf.bbox(
  turf.buffer(singapore, 1, UNIT)
)

// how to get width and height? lol
const width = Math.ceil(turf.distance(
  [bbox[0], bbox[1]],
  [bbox[2], bbox[1]],
  UNIT
) / DISTANCE)
const height = Math.ceil(turf.distance(
  [bbox[0], bbox[1]],
  [bbox[0], bbox[3]],
  UNIT
) / DISTANCE)

// generate point pointGrid & point set
const pointGrid = turf.pointGrid(bbox, DISTANCE, UNIT)
pointGrid.features = pointGrid.features.map((feature, index) => Object.assign(feature, {properties: { index }}))
pointGrid.properties = { width, height }

const pointSet = turf.featureCollection(
  pointGrid.features.filter((point) => turf.inside(point, singapore))
)

// save them points
const csv = [
  ['lat', 'lon', 'index'].join(',')
].concat(
  pointGrid.features.map((point) =>
    [
      point.geometry.coordinates[1],
      point.geometry.coordinates[0],
      point.properties.index
    ].join(',')
  )
).join('\n')

fs.writeFileSync('./output/point-grid.geo.json', JSON.stringify(pointGrid))
fs.writeFileSync('./output/point-grid.csv', csv)
fs.writeFileSync('./output/point-set.geo.json', JSON.stringify(pointSet))

// for my future self
console.log(`
Starting Parameters
distance: ${DISTANCE} ${UNIT}

Generated Point Grid
width:  ${width}
height: ${height}
points: ${pointGrid.features.length}

Generated Point Set
points: ${pointSet.features.length}

Expected Points in Point Set
singapore: ${Math.round(turf.area(singapore) / 1000 / 1000)} km square
points: ${(Math.round(turf.area(singapore) / 1000 / 1000) / DISTANCE / DISTANCE)}
`)
