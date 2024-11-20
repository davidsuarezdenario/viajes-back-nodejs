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
curl --location 'http://localhost:3000/travel/add_multi_elements' \
--header 'Content-Type: application/json' \
--header 'x-api-key: viajesAuth' \
--data-raw '{
    "passengers": [
        {
            "documentType": "P",
            "nationality": "COL",
            "documentNumber": "1616160",
            "gender": "M",
            "name": "Yared",
            "surname": "Toro",
            "passengerType": "ADT",
            "dateOfBirth": "23AUG98",
            "expirationDate": "31JUL26"
        }
    ],
    "contactInfo": "9808014 + ()",
    "airlineCode": "LA",
    "frequentFlyerNumber": "NI1616160",
    "email": "johndoe@example.com",
    "emailFormatted": "JOHN..1AWS..DOE//EMAIL.COM",
    "phoneNumber": "3212833648/CO"
}'
```