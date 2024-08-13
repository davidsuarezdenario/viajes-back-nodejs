

const { create } = require('xmlbuilder2');

exports.newModel = async (req, res) => {
  const data = req.body;

    // Validar los datos mínimos requeridos
    if (!data.name || !data.surname || !data.passengerType || !data.dateOfBirth || !data.contactInfo || !data.airlineCode || !data.frequentFlyerNumber) {
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