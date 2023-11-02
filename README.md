<div style="object-fit:cover; width:100%; margin-bottom:16px;"><img src="./banner.png"></div>

Truck Log API Documentation
===========================

Overview
--------

The Truck Log API provides a way to store and retrieve logs related to truck activities. Each log contains information about the truck's location, mass, and other optional metadata.

Models
------

### `TruckLog`

*   `deviceId`: (string) A unique identifier for the device.
*   `timestamp`: (string) The time at which the log was recorded.
*   `location`: (object) Contains the truck's location data.
    *   `latitude`: (number) The latitude of the truck's location.
    *   `longitude`: (number) The longitude of the truck's location.
    *   `altitude`: (number) The altitude of the truck's location.
    *   `precision?`: (number, optional) Precision metadata for location accuracy.
*   `mass`: (object) Contains the truck's mass data.
    *   `value`: (number) The mass value.
    *   `unit`: (MassUnit) The unit of the mass.
*   `metadata?`: (object, optional) Additional metadata related to the truck log.
    *   `fleet?`: (string, optional) The fleet to which the truck belongs.
    *   `company?`: (string, optional) The company owning the truck.
    *   `logProcessedAt?`: (string, optional) The timestamp of when the log was processed by the server.

### `MassUnit`

A string representing the unit of mass, which can be one of the following: `'kg'`, `'t'`, `'lb'`.

API Endpoints
-------------

### GET `/truck-logs`

Retrieves truck logs from the database.

#### Query Parameters

*   `deviceId`: (string, optional) The device ID to filter logs.
*   `limit`: (number, optional) The maximum number of logs to retrieve. Default is 10.

#### Response

*   `200 OK`: Returns an array of `TruckLog` objects.
*   `404 Not Found`: No logs were found matching the criteria.
*   `500 Internal Server Error`: An error occurred on the server.

### POST `/truck-logs`

Stores a new truck log in the database.

#### Request Body

A `TruckLog` object.

#### Response

*   `201 Created`: The truck log was successfully created.
*   `400 Bad Request`: The request was invalid. Possible reasons could be an empty body, invalid JSON, or missing required fields.
*   `500 Internal Server Error`: An error occurred on the server.

Usage Example
-------------

### cURL

#### GET Request

`curl -X GET "https://YOUR_API_ENDPOINT/truck-logs?limit=10" -H "x-api-key: API_KEY"`

#### POST Request


`curl -X POST "https://YOUR_API_ENDPOINT/truck-logs" -H "Content-Type: application/json" -H "x-api-key: API_KEY" -d '{"deviceId": "123", "timestamp": "2023-11-01T00:00:00Z", "location": {"latitude": 40.7128, "longitude": -74.0060, "altitude": 10}, "mass": {"value": 2000, "unit": "kg"}}'`

Security
--------

Access to the API is secured via API keys. Ensure that your API key is kept confidential.

**************************
