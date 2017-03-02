
# Swagger API Example generator

This tool generates examples for a swagger-api spec using json-schema-faker.

It has an API and a simple CLI:

    swagger-examples --spec api.swagger.yaml --examples examples.json

It will print a JSON file containing examples keyed to the schemas from the
api spec by json pointers. By default it creates a single example request for 
every operation and one for each of the declared responses 
found in the API spec.

