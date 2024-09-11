

exports.createPNRAddMultiElements = (data) => {
    // const passengers = data.passengers.map((passenger, index) => ({
    //     travellerInfo: {
    //         elementManagementPassenger: {
    //             reference: {
    //                 qualifier: 'PR',
    //                 number: (index + 1).toString()  // El número de referencia debe ser único por pasajero
    //             },
    //             segmentName: 'NM'
    //         },
    //         passengerData: {
    //             travellerInformation: {
    //                 traveller: {
    //                     surname: passenger.surname,
    //                     quantity: '1'
    //                 },
    //                 passenger: {
    //                     firstName: passenger.name,
    //                     type: passenger.passengerType
    //                 }
    //             },
    //             dateOfBirth: {
    //                 dateAndTimeDetails: {
    //                     date: passenger.dateOfBirth
    //                 }
    //             }
    //         }
    //     }
    // }));
    const passengers = data.passengers.map((passenger, index) => ({
        elementManagementPassenger: {
            reference: {
                qualifier: 'PR',
                number: (index + 1).toString()  // El número de referencia debe ser único por pasajero
            },
            segmentName: 'NM'  // Cambiado de 'NM' a 'AP'
        },
        passengerData: {
            travellerInformation: {
                traveller: {
                    surname: passenger.surname
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
    }));

    const freeText = (passenger) => {
        const {
            documentType,
            nationality,
            documentNumber,
            dateOfBirth,
            gender,
            expirationDate,
            name,
            surname
        } = passenger;

        return `${documentType}-COL-${documentNumber}-${nationality}-${dateOfBirth}-${gender}-${expirationDate}-${name.toUpperCase()}-${surname.toUpperCase()}`;
    };

    const docsInfo = data.passengers.map((passenger) => {
        return freeText(passenger);
    });
    const body = {
        "soapenv:Body": {
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
                                    'freetext': docsInfo
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
    };
    return body;
    // const doc = create(body);
    // return doc.end({ prettyPrint: true });
}