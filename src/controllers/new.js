

const { create } = require('xmlbuilder2');

exports.newModel = async (req, res) => {
  const data = req.body;

  // Validar los datos mínimos requeridos
  if (!data.name || !data.surname || !data.passengerType || !data.dateOfBirth || !data.contactInfo || !data.airlineCode || !data.frequentFlyerNumber || !data.email || !data.docsInfo || !data.emailFormatted || !data.phoneNumber) {
      return res.status(400).send('Faltan datos requeridos.');
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
    const xmlObj = {
        'PNR_AddMultiElements': {
            'pnrActions': {
                'optionCode': '0'
            },
            'travellerInfo': {
                'elementManagementPassenger': {
                    'reference': {
                        'qualifier': 'PR',
                        'number': '1'
                    },
                    'segmentName': 'NM'
                },
                'passengerData': {
                    'travellerInformation': {
                        'traveller': {
                            'surname': data.surname,
                            'quantity': '1'
                        },
                        'passenger': {
                            'firstName': data.name,
                            'type': data.passengerType
                        }
                    },
                    'dateOfBirth': {
                        'dateAndTimeDetails': {
                            'date': data.dateOfBirth
                        }
                    }
                }
            },
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
    };

    const doc = create(xmlObj);
    return doc.end({ prettyPrint: true });
}