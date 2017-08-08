# isochronic-points

A script to generate:

- a point grid (GeoJSON and CSV)
- a point set (GeoJSON)

The point grid is to be used as the base grid for OpenTripPlanner for performing the Dijkstra analysis. Use the CSV version for importing into OpenTripPlanner, as it doesn’t see to do well with GeoJSON. Use the GeoJSON version to remap the results back to the grid.

The point set is for querying against OpenTripPlanner.
