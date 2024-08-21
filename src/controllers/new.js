

const { create } = require('xmlbuilder2');

exports.newModel = async (req, res) => {
    const data = req.body;
  
    // Validar los datos mínimos requeridos para cada pasajero
    if (!data.passengers || !Array.isArray(data.passengers) || data.passengers.length === 0) {
        return res.status(400).send('Faltan datos requeridos para los pasajeros.');
    }
  
    // Validar datos adicionales
    if (!data.contactInfo || !data.airlineCode || !data.frequentFlyerNumber || !data.email || !data.docsInfo || !data.emailFormatted || !data.phoneNumber) {
        return res.status(400).send('Faltan datos adicionales requeridos.');
    }
  
    // Validar cada pasajero
    for (const passenger of data.passengers) {
        if (!passenger.name || !passenger.surname || !passenger.passengerType || !passenger.dateOfBirth) {
            return res.status(400).send('Faltan datos requeridos para uno o más pasajeros.');
        }
    }
  
    try {
        const pnrXml = createPNRAddMultiElements(data);
        res.set('Content-Type', 'application/xml');
        res.send(pnrXml);
    } catch (error) {
        res.status(500).send('Error al generar el mensaje PNR_AddMultiElements');
    }
  }
  
function createPNRAddMultiElements(data) {
    const passengers = data.passengers.map((passenger, index) => ({
        travellerInfo: {
            elementManagementPassenger: {
                reference: {
                    qualifier: 'PR',
                    number: (index + 1).toString()  // El número de referencia debe ser único por pasajero
                },
                segmentName: 'NM'
            },
            passengerData: {
                travellerInformation: {
                    traveller: {
                        surname: passenger.surname,
                        quantity: '1'
                    },
                    passenger: {
                        firstName: passenger.name,
                        type: passenger.passengerType
                    }
                },
                dateOfBirth: {
                    dateAndTimeDetails: {
                        date: passenger.dateOfBirth
                    }
                }
            }
        }
    }));

    const xmlObj = {
        'soap:Envelope': {
            '@xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
            '@xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
            '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@xmlns:ses': 'http://xml.amadeus.com/2010/06/Session_v3',
            'soap:Header': {
                'ses:Session': {
                    '@TransactionStatusCode': 'InSeries',
                    'ses:SessionId': '00LIIVTILB',
                    'ses:SequenceNumber': '3',
                    'ses:SecurityToken': '1XBO0Q1K8LO6C1UZ9GZNXIHLFS'
                },
                'add:MessageID': {
                    '@xmlns:add': 'http://www.w3.org/2005/08/addressing',
                    '#text': '652d90f7-0007-4f02-8bb0-c54ed5ee3bec'
                },
                'add:Action': {
                    '@xmlns:add': 'http://www.w3.org/2005/08/addressing',
                    '#text': 'http://webservices.amadeus.com/PNRADD_21_1_1A'
                },
                'add:To': {
                    '@xmlns:add': 'http://www.w3.org/2005/08/addressing',
                    '#text': 'https://noded5.test.webservices.amadeus.com/1ASIWWANWPS'
                },
                'link:TransactionFlowLink': {
                    '@xmlns:link': 'http://wsdl.amadeus.com/2010/06/ws/Link_v1'
                }
            },
            'soap:Body': {
                'PNR_AddMultiElements': {
                    'pnrActions': {
                        'optionCode': '0'
                    },
                    'travellerInfo': passengers,  // Se incluye el array de pasajeros aquí
                    'dataElementsMaster': {
                        'marker1': {},
                        'dataElementsIndiv': [
                            {
                                'elementManagementData': {
                                    'reference': {
                                        'qualifier': 'OT',
                                        'number': '1'
                                    },
                                    'segmentName': 'AP'
                                },
                                'freetextData': {
                                    'freetextDetail': {
                                        'subjectQualifier': '3',
                                        'type': '6'
                                    },
                                    'longFreetext': data.contactInfo
                                }
                            },
                            {
                                'elementManagementData': {
                                    'reference': {
                                        'qualifier': 'OT',
                                        'number': '2'
                                    },
                                    'segmentName': 'AP'
                                },
                                'freetextData': {
                                    'freetextDetail': {
                                        'subjectQualifier': '3',
                                        'type': 'P02'
                                    },
                                    'longFreetext': data.email
                                }
                            },
                            {
                                'elementManagementData': {
                                    'reference': {
                                        'qualifier': 'OT',
                                        'number': '3'
                                    },
                                    'segmentName': 'SSR'
                                },
                                'serviceRequest': {
                                    'ssr': {
                                        'type': 'FOID',
                                        'status': 'HK',
                                        'quantity': '1',
                                        'companyId': data.airlineCode,
                                        'freetext': data.frequentFlyerNumber
                                    }
                                },
                                'referenceForDataElement': {
                                    'reference': {
                                        'qualifier': 'PR',
                                        'number': '1'
                                    }
                                }
                            },
                            {
                                'elementManagementData': {
                                    'reference': {
                                        'qualifier': 'OT',
                                        'number': '4'
                                    },
                                    'segmentName': 'SSR'
                                },
                                'serviceRequest': {
                                    'ssr': {
                                        'type': 'DOCS',
                                        'status': 'HK',
                                        'quantity': '1',
                                        'companyId': 'YY',
                                        'freetext': data.docsInfo
                                    }
                                },
                                'referenceForDataElement': {
                                    'reference': {
                                        'qualifier': 'PR',
                                        'number': '1'
                                    }
                                }
                            },
                            {
                                'elementManagementData': {
                                    'segmentName': 'SSR'
                                },
                                'serviceRequest': {
                                    'ssr': {
                                        'type': 'CTCE',
                                        'status': 'HK',
                                        'companyId': 'YY',
                                        'freetext': data.emailFormatted
                                    }
                                }
                            },
                            {
                                'elementManagementData': {
                                    'segmentName': 'SSR'
                                },
                                'serviceRequest': {
                                    'ssr': {
                                        'type': 'CTCM',
                                        'status': 'HK',
                                        'companyId': 'YY',
                                        'freetext': data.phoneNumber
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    };

    const doc = create(xmlObj);
    return doc.end({ prettyPrint: true });
}
