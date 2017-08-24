const fs = require('fs')
const path = require('path')
const turf = require('@turf/turf')
const program = require('commander')

program
  .version(require('./package.json').version)
  .option('-i, --input <path>', 'Input GeoJSON file')
  .option('-o, --output <path>', 'Path to output files to')
  .option('-d, --distance <value>', 'Distance between grid points', parseFloat)
  .option('-b, --buffer <value>', 'Buffer to add around bounding box', parseFloat)
  .option('-u, --unit <meters|kilometers|miles>', 'Unit of measure for distance and buffer')
  .parse(process.argv)

const INPUT = program.input || './data/singapore.geo.json'
const OUTPUT = program.output || './output'
const DISTANCE = +program.distance || 0.2
const BUFFER = +program.buffer || 1
const UNIT = program.unit || 'kilometers'

// create bounding box
const geojson = require(path.resolve(__dirname, INPUT))
const bbox = turf.bbox(
  turf.buffer(geojson, BUFFER, UNIT)
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
  pointGrid.features
    .filter((point) => turf.inside(point, geojson))
    .map((feature, index) => Object.assign(feature, { properties: { index, gridIndex: feature.properties.index } }))
)

// save them points
const headers = ['lat', 'lon', 'index']
const csvs = {
  pointGrid: [headers]
    .concat(
      pointGrid.features.map((point) => [
        point.geometry.coordinates[1],
        point.geometry.coordinates[0],
        point.properties.index
      ])
    )
    .map((row) => row.join(','))
    .join('\n'),
  pointSet: [headers]
    .concat(
      pointSet.features.map((point) => [
        point.geometry.coordinates[1],
        point.geometry.coordinates[0],
        point.properties.index
      ])
    )
    .map((row) => row.join(','))
    .join('\n')
}
const outputPath = path.resolve(__dirname, OUTPUT)

fs.writeFileSync(`${outputPath}/point-grid.geo.json`, JSON.stringify(pointGrid))
fs.writeFileSync(`${outputPath}/point-set.geo.json`, JSON.stringify(pointSet))
fs.writeFileSync(`${outputPath}/point-grid.csv`, csvs.pointGrid)
fs.writeFileSync(`${outputPath}/point-set.csv`, csvs.pointSet)

// for my future self
console.log(`
Starting Parameters
buffer:   ${BUFFER} ${UNIT}
distance: ${DISTANCE} ${UNIT}

Generated Point Grid
width:  ${width}
height: ${height}
points: ${pointGrid.features.length}

Generated Point Set
points: ${pointSet.features.length}

Expected Points in Point Set
geojson: ${Math.round(turf.area(geojson) / 1000 / 1000)} km square
points: ${(Math.round(turf.area(geojson) / 1000 / 1000) / DISTANCE / DISTANCE)}
`)
