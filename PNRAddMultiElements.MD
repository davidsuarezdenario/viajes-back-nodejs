# Solicitud para agregar elementos a un PNR

## Endpoint

`http://localhost:3000/travel/add_multi_elements`

## Método

`POST`

## Headers

* `Content-Type`: `application/json`
* `x-api-key`: `viajesAuth`

## Body

```json
{
  "passengers": [
    {
      "name": "Yared",
      "surname": "Toro",
      "passengerType": "ADT",
      "dateOfBirth": "23AGO98"
    },
    {
      "name": "John",
      "surname": "Doe",
      "passengerType": "ADT",
      "dateOfBirth": "24DEC88"
    }
  ],
  "contactInfo": "9808014 + ()",
  "airlineCode": "LA",
  "frequentFlyerNumber": "NI1616160",
  "email": "johndoe@example.com",
  "docsInfo": [
    "P-COL-1616160-COL-23AGO98-M-31JUL26-YARED-TORO",
    "P-COL-1616160-COL-24DEC88-M-31DEC28-JOHN-DOE"
  ],
  "emailFormatted": "JOHN..1AWS..DOE//EMAIL.COM",
  "phoneNumber": "3212833648/CO"
}
```

```json
curl --location 'http://localhost:3000/travel/add_multi_elements' \
--header 'Content-Type: application/json' \
--header 'x-api-key: viajesAuth' \
--data-raw '{
  "passengers": [
    {
      "name": "Yared",
      "surname": "Toro",
      "passengerType": "ADT",
      "dateOfBirth": "23AGO98"
    },
    {
      "name": "John",
      "surname": "Doe",
      "passengerType": "ADT",
      "dateOfBirth": "24DEC88"
    }
  ],
  "contactInfo": "9808014 + ()",
  "airlineCode": "LA",
  "frequentFlyerNumber": "NI1616160",
  "email": "johndoe@example.com",
  "docsInfo": [
    "P-COL-1616160-COL-23AGO98-M-31JUL26-YARED-TORO",
    "P-COL-1616160-COL-24DEC88-M-31DEC28-JOHN-DOE"
  ],
  "emailFormatted": "JOHN..1AWS..DOE//EMAIL.COM",
  "phoneNumber": "3212833648/CO"
}'
```