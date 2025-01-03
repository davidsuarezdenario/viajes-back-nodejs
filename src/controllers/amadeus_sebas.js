const { format, parseISO } = require("date-fns");
const fs = require('fs');
const sql = require("mssql"), requesthttp = require('request'), qs = require('qs'), xml2js = require('xml2js'), builder = new xml2js.Builder(), headerAmadeus = require('../controllers/headerAmadeus'), wanderlust = require('../controllers/wanderlust'), deleteText = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const authentication = { url: 'https://test.api.amadeus.com/', client_id: 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', client_secret: 'N0hFslmwu3zpofYQ' }; //Pruebas
let token = '', arrayIata = [];

console.log('arrayIata: ', arrayIata);

exports.iataCodes = async (req, res) => {
    const request = new sql.Request();
    await request.query(`SELECT * FROM IataCodesPlaces WHERE available=1`).then((object) => {
        res.status(200).json({ error: false, data: object.recordset })
    }).catch((err) => {
        res.status(400).json({ error: true, data: err });
    });
}
exports.updateArrayIata = async (req, res) => {
    const request = new sql.Request();
    await request.query(`SELECT * FROM IataCodesPlaces WHERE available=1`).then((object) => {
        arrayIata = object.recordset;
        res.status(200).json({ error: false })
    }).catch((err) => {
        res.status(400).json({ error: true });
    });
}
exports.searchArrayIata = async (req, res) => {
    const search = (normalizeString(req.body.search)).trim();
    if (search.length > 2) {
        let result = arrayIata.filter((item) => normalizeString(item.iata).includes(search) || normalizeString(item.airport).includes(search) || normalizeString(item.city).includes(search) || normalizeString(item.country).includes(search));
        res.status(200).json({ error: false, data: result });
    } else {
        res.status(400).json({ error: true, data: 'not found' });
    }
    res.end();
    /* let result = arrayIata.filter((item) => item.iataCode == iata);
    res.status(200).json({ error: false, data: result }); */
}

function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
exports.Fare_MasterPricerTravelBoardSearch = async (req, res) => {
    const body = req.body;
    const requestedSegmentRef = body.type == 'idaVuelta' ? [{ requestedSegmentRef: [{ segRef: ["1"] }], departureLocalization: [{ departurePoint: [{ locationId: [body.iataFrom] }] }], arrivalLocalization: [{ arrivalPointDetails: [{ locationId: [body.iataTo] }] }], timeDetails: [{ firstDateTimeDetail: [{ date: [format(parseISO(body.timeFrom), 'ddMMyy')] }] }] }, { requestedSegmentRef: [{ segRef: ["2"] }], departureLocalization: [{ departurePoint: [{ locationId: [body.iataTo] }] }], arrivalLocalization: [{ arrivalPointDetails: [{ locationId: [body.iataFrom] }] }], timeDetails: [{ firstDateTimeDetail: [{ date: [format(parseISO(body.timeTo), 'ddMMyy')] }] }] }] : [{ requestedSegmentRef: [{ segRef: ["1"] }], departureLocalization: [{ departurePoint: [{ locationId: [body.iataFrom] }] }], arrivalLocalization: [{ arrivalPointDetails: [{ locationId: [body.iataTo] }] }], timeDetails: [{ firstDateTimeDetail: [{ date: [format(parseISO(body.timeFrom), 'ddMMyy')] }] }] }];
    body.nonStop ? (requestedSegmentRef[0].flightInfo = [{ flightDetail: [{ flightType: ["N"] }] }]) : false;
    let contPax = 1;
    const paxAdt = await Array.from({ length: body.adult }, () => ({ ref: [(contPax++) + ''] })),
        paxCnn = await Array.from({ length: body.child }, () => ({ ref: [(contPax++) + ''] })),
        paxInf = await Array.from({ length: body.infant }, (_, i) => ({ ref: [(i + 1) + ''], infantIndicator: [(i + 1) + ''] }));
    let paxReference = [{ ptc: ["ADT"], traveller: paxAdt }];
    body.child > 0 ? paxReference.push({ ptc: ["CNN"], traveller: paxCnn }) : false;
    body.infant > 0 ? paxReference.push({ ptc: ["INF"], traveller: paxInf }) : false;
    const bodyNew = { data: { "soapenv:Body": { Fare_MasterPricerTravelBoardSearch: [{ numberOfUnit: [{ unitNumberDetail: [{ numberOfUnits: [body.adult + body.child], typeOfUnit: ["PX"] }, { numberOfUnits: ["250"], typeOfUnit: ["RC"] }] }], paxReference: paxReference, fareOptions: [{ pricingTickInfo: [{ pricingTicketing: [{ priceType: ["ET", "RP", "RU", "TAC"] }] }] }], travelFlightInfo: [{ cabinId: [{ cabin: [body.cabin] }] }], itinerary: requestedSegmentRef }] } } };
    const resOk = await procesosAmadeusXML('POST', bodyNew.data, 'FMPTBQ_23_1_1A', 0, {});
    let result = [];
    if (resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].recommendation) {
        if ((resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].recommendation).length > 0) {
            if (resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].flightIndex.length == 1) {
                for (recommendation of resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].recommendation) {
                    for (recommendationSegment of recommendation.segmentFlightRef) {
                        for (groupOfFlights of resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].flightIndex[0].groupOfFlights) {
                            if (recommendation.segmentFlightRef[0].referencingDetail[0].refNumber[0] == groupOfFlights.propFlightGrDetail[0].flightProposal[0].ref[0]) {
                                let idaTemp = [];
                                for (flightDetails of groupOfFlights.flightDetails) {
                                    idaTemp.push({
                                        iataFrom: flightDetails.flightInformation[0].location[0].locationId[0],
                                        iataTo: flightDetails.flightInformation[0].location[1].locationId[0],
                                        dateFrom: flightDetails.flightInformation[0].productDateTime[0].dateOfDeparture[0],
                                        dateTo: flightDetails.flightInformation[0].productDateTime[0].dateOfArrival[0],
                                        dateVariaton: flightDetails.flightInformation[0].productDateTime[0].dateVariation?.[0] ?? null,
                                        timeFrom: flightDetails.flightInformation[0].productDateTime[0].timeOfDeparture[0],
                                        timeTo: flightDetails.flightInformation[0].productDateTime[0].timeOfArrival[0],
                                        terminalFrom: flightDetails.flightInformation[0].location[0].terminal?.[0] ?? null,
                                        terminalTo: flightDetails.flightInformation[0].location[1].terminal?.[0] ?? null,
                                        marketingCarrier: flightDetails.flightInformation[0].companyId[0].marketingCarrier[0],
                                        operatingCarrier: flightDetails.flightInformation[0].companyId[0].operatingCarrier?.[0] ?? flightDetails.flightInformation[0].companyId[0].marketingCarrier[0],
                                        numberTrip: flightDetails.flightInformation[0].flightOrtrainNumber[0],
                                        aircraft: flightDetails.flightInformation[0].productDetail[0].equipmentType[0],
                                        electronicTicketing: flightDetails.flightInformation[0].addProductDetail[0].electronicTicketing[0],
                                        productDetailQualifier: flightDetails.flightInformation[0].addProductDetail[0].productDetailQualifier[0],
                                        commercialAgreement: flightDetails.commercialAgreement ? {
                                            codeShareType: flightDetails.commercialAgreement[0].codeshareDetails[0].codeShareType[0],
                                            flightNumber: flightDetails.commercialAgreement[0].codeshareDetails[0].flightNumber[0]
                                        } : null,
                                        technicalStop: flightDetails.technicalStop ? {
                                            iataCode: flightDetails.technicalStop[0].stopDetails[0].locationId[0],
                                            date1: flightDetails.technicalStop[0].stopDetails[0].date[0],
                                            time1: flightDetails.technicalStop[0].stopDetails[0].firstTime[0],
                                            date2: flightDetails.technicalStop[0].stopDetails[1].date[0],
                                            time2: flightDetails.technicalStop[0].stopDetails[1].firstTime[0]
                                        } : null
                                    });
                                }
                                let paxOk = [];
                                for (paxPtc of recommendation.paxFareProduct) {
                                    let travellerDetails = [];
                                    for (pax of paxPtc.paxReference[0].traveller) { travellerDetails.push({ measurementValue: pax.ref[0] }); }
                                    paxOk.push({ ptc: paxPtc.paxReference[0].ptc[0], ref: travellerDetails, total: paxPtc.paxReference[0].traveller.length });
                                }
                                for (let i = 0; i < idaTemp.length; i++) {
                                    idaTemp[i].rbd = recommendation.paxFareProduct[0].fareDetails[0].groupOfFares[i].productInformation[0].cabinProduct[0].rbd[0];
                                    idaTemp[i].avlStatus = recommendation.paxFareProduct[0].fareDetails[0].groupOfFares[i].productInformation[0].cabinProduct[0].avlStatus[0];
                                }
                                result.push({
                                    id: `${recommendation.itemNumber[0].itemNumberId[0].number[0]}-${recommendationSegment.referencingDetail[0].refNumber[0]}-${recommendationSegment.referencingDetail[1].refNumber[0]}`,
                                    precio: { total: recommendation.recPriceInfo[0].monetaryDetail[0].amount[0], fee: recommendation.recPriceInfo[0].monetaryDetail[1].amount[0] },
                                    pax: paxOk,
                                    vc: recommendation.paxFareProduct[0].paxFareDetail[0].codeShareDetails[0].company[0],
                                    detalle: recommendation.segmentFlightRef,
                                    ida: idaTemp
                                });
                            }
                        }
                    }
                }
                res.status(200).json({ error: false, data: result, session: {} });
            } else if (resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].flightIndex.length == 2) {
                for (recommendation of resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].recommendation) {
                    for (recommendationSegment of recommendation.segmentFlightRef) {
                        let idaTemp = [],
                            vueltaTemp = [];
                        for (groupOfFlights of resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].flightIndex[0].groupOfFlights) {
                            if (recommendationSegment.referencingDetail[0].refNumber[0] == groupOfFlights.propFlightGrDetail[0].flightProposal[0].ref[0]) {
                                idaTemp = [];
                                for (flightDetails of groupOfFlights.flightDetails) {
                                    idaTemp.push({
                                        iataFrom: flightDetails.flightInformation[0].location[0].locationId[0],
                                        iataTo: flightDetails.flightInformation[0].location[1].locationId[0],
                                        dateFrom: flightDetails.flightInformation[0].productDateTime[0].dateOfDeparture[0],
                                        dateTo: flightDetails.flightInformation[0].productDateTime[0].dateOfArrival[0],
                                        dateVariaton: flightDetails.flightInformation[0].productDateTime[0].dateVariation?.[0] ?? null,
                                        timeFrom: flightDetails.flightInformation[0].productDateTime[0].timeOfDeparture[0],
                                        timeTo: flightDetails.flightInformation[0].productDateTime[0].timeOfArrival[0],
                                        terminalFrom: flightDetails.flightInformation[0].location[0].terminal?.[0] ?? null,
                                        terminalTo: flightDetails.flightInformation[0].location[1].terminal?.[0] ?? null,
                                        marketingCarrier: flightDetails.flightInformation[0].companyId[0].marketingCarrier[0],
                                        operatingCarrier: flightDetails.flightInformation[0].companyId[0].operatingCarrier?.[0] ?? flightDetails.flightInformation[0].companyId[0].marketingCarrier[0],
                                        numberTrip: flightDetails.flightInformation[0].flightOrtrainNumber[0],
                                        aircraft: flightDetails.flightInformation[0].productDetail[0].equipmentType[0],
                                        electronicTicketing: flightDetails.flightInformation[0].addProductDetail[0].electronicTicketing[0],
                                        productDetailQualifier: flightDetails.flightInformation[0].addProductDetail[0].productDetailQualifier[0],
                                        commercialAgreement: flightDetails.commercialAgreement ? {
                                            codeShareType: flightDetails.commercialAgreement[0].codeshareDetails[0].codeShareType[0],
                                            flightNumber: flightDetails.commercialAgreement[0].codeshareDetails[0].flightNumber[0]
                                        } : null,
                                        technicalStop: flightDetails.technicalStop ? {
                                            iataCode: flightDetails.technicalStop[0].stopDetails[0].locationId[0],
                                            date1: flightDetails.technicalStop[0].stopDetails[0].date[0],
                                            time1: flightDetails.technicalStop[0].stopDetails[0].firstTime[0],
                                            date2: flightDetails.technicalStop[0].stopDetails[1].date[0],
                                            time2: flightDetails.technicalStop[0].stopDetails[1].firstTime[0]
                                        } : null
                                    });
                                }
                            }
                        }
                        for (groupOfFlights of resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].flightIndex[1].groupOfFlights) {
                            if (recommendationSegment.referencingDetail[1].refNumber[0] == groupOfFlights.propFlightGrDetail[0].flightProposal[0].ref[0]) {
                                vueltaTemp = [];
                                for (flightDetails of groupOfFlights.flightDetails) {
                                    vueltaTemp.push({
                                        iataFrom: flightDetails.flightInformation[0].location[0].locationId[0],
                                        iataTo: flightDetails.flightInformation[0].location[1].locationId[0],
                                        dateFrom: flightDetails.flightInformation[0].productDateTime[0].dateOfDeparture[0],
                                        dateTo: flightDetails.flightInformation[0].productDateTime[0].dateOfArrival[0],
                                        dateVariaton: flightDetails.flightInformation[0].productDateTime[0].dateVariation?.[0] ?? null,
                                        timeFrom: flightDetails.flightInformation[0].productDateTime[0].timeOfDeparture[0],
                                        timeTo: flightDetails.flightInformation[0].productDateTime[0].timeOfArrival[0],
                                        terminalFrom: flightDetails.flightInformation[0].location[0].terminal?.[0] ?? null,
                                        terminalTo: flightDetails.flightInformation[0].location[1].terminal?.[0] ?? null,
                                        marketingCarrier: flightDetails.flightInformation[0].companyId[0].marketingCarrier[0],
                                        operatingCarrier: flightDetails.flightInformation[0].companyId[0].operatingCarrier?.[0] ?? flightDetails.flightInformation[0].companyId[0].marketingCarrier[0],
                                        numberTrip: flightDetails.flightInformation[0].flightOrtrainNumber[0],
                                        aircraft: flightDetails.flightInformation[0].productDetail[0].equipmentType[0],
                                        electronicTicketing: flightDetails.flightInformation[0].addProductDetail[0].electronicTicketing[0],
                                        productDetailQualifier: flightDetails.flightInformation[0].addProductDetail[0].productDetailQualifier[0],
                                        commercialAgreement: flightDetails.commercialAgreement ? {
                                            codeShareType: flightDetails.commercialAgreement[0].codeshareDetails[0].codeShareType[0],
                                            flightNumber: flightDetails.commercialAgreement[0].codeshareDetails[0].flightNumber[0]
                                        } : null,
                                        technicalStop: flightDetails.technicalStop ? {
                                            iataCode: flightDetails.technicalStop[0].stopDetails[0].locationId[0],
                                            date1: flightDetails.technicalStop[0].stopDetails[0].date[0],
                                            time1: flightDetails.technicalStop[0].stopDetails[0].firstTime[0],
                                            date2: flightDetails.technicalStop[0].stopDetails[1].date[0],
                                            time2: flightDetails.technicalStop[0].stopDetails[1].firstTime[0]
                                        } : null
                                    });
                                }
                            }
                        }
                        let paxOk = [];
                        for (paxPtc of recommendation.paxFareProduct) {
                            let travellerDetails = [];
                            for (pax of paxPtc.paxReference[0].traveller) { travellerDetails.push({ measurementValue: pax.ref[0] }); }
                            paxOk.push({ ptc: paxPtc.paxReference[0].ptc[0], ref: travellerDetails, total: paxPtc.paxReference[0].traveller.length });
                        }
                        for (let i = 0; i < idaTemp.length; i++) {
                            idaTemp[i].rbd = recommendation.paxFareProduct[0].fareDetails[0].groupOfFares[i].productInformation[0].cabinProduct[0].rbd[0];
                            idaTemp[i].avlStatus = recommendation.paxFareProduct[0].fareDetails[0].groupOfFares[i].productInformation[0].cabinProduct[0].avlStatus[0];
                        }
                        for (let j = 0; j < vueltaTemp.length; j++) {
                            vueltaTemp[j].rbd = recommendation.paxFareProduct[0].fareDetails[1].groupOfFares[j].productInformation[0].cabinProduct[0].rbd[0];
                            vueltaTemp[j].avlStatus = recommendation.paxFareProduct[0].fareDetails[1].groupOfFares[j].productInformation[0].cabinProduct[0].avlStatus[0];
                        }
                        result.push({
                            id: `${recommendation.itemNumber[0].itemNumberId[0].number[0]}-${recommendationSegment.referencingDetail[0].refNumber[0]}-${recommendationSegment.referencingDetail[1].refNumber[0]}`,
                            precio: { total: recommendation.recPriceInfo[0].monetaryDetail[0].amount[0], fee: recommendation.recPriceInfo[0].monetaryDetail[1].amount[0] },
                            pax: paxOk,
                            vc: recommendation.paxFareProduct[0].paxFareDetail[0].codeShareDetails[0].company[0],
                            detalle: recommendation.segmentFlightRef,
                            ida: idaTemp,
                            vuelta: vueltaTemp
                        });
                    }
                }
                res.status(200).json({ error: false, data: result, session: {} });
            } else {
                res.status(200).json({ error: true, data: { title1: 'Ups', title2: 'No se encontraron vuelos 1', title3: 'Intenta con otros parametros de busqueda.' }, session: {} });
            }
        } else {
            res.status(200).json({ error: true, data: { title1: 'Ups', title2: 'No se encontraron vuelos 2', title3: 'Intenta con otros parametros de busqueda.' }, session: {} });
        }
    } else {
        res.status(200).json({ error: true, data: { title1: 'Ups', title2: 'No se encontraron vuelos 3', title3: 'Intenta con otros parametros de busqueda.' }, session: {} });
    }
}
exports.Fare_InformativePricingWithoutPNR = async (req, res) => {
    const body = req.body;
    let passengersGroup = [],
        segmentGroup = [];
    if (body) {
        let contItem = 0;
        for (pax of body.pax) {
            passengersGroup.push({
                segmentRepetitionControl: [{
                    segmentControlDetails: [{
                        quantity: [pax.ptc == "ADT" ? "1" : (pax.ptc == "CNN" ? "2" : "3")],
                        numberOfUnits: [pax.total + '']
                    }]
                }],
                travellersID: [{ travellerDetails: pax.ref }],
                discountPtc: [pax.ptc == "INF" ? { valueQualifier: [pax.ptc], fareDetails: [{ qualifier: ["766"] }] } : { valueQualifier: [pax.ptc] }]
            });
        }
        for (ida of body.ida) {
            contItem++;
            segmentGroup.push({
                segmentInformation: [{
                    flightDate: [{ departureDate: [ida.dateFrom], departureTime: [ida.timeFrom] }],
                    boardPointDetails: [{ trueLocationId: [ida.iataFrom] }],
                    offpointDetails: [{ trueLocationId: [ida.iataTo] }],
                    companyDetails: [{ marketingCompany: [ida.marketingCarrier] }],
                    flightIdentification: [{ flightNumber: [ida.numberTrip], bookingClass: [ida.rbd] }],
                    flightTypeDetails: [{ flightIndicator: ["1"] }],
                    itemNumber: [contItem + ""]
                }]
            });
        }
        if (body.vuelta) {
            for (vuelta of body.vuelta) {
                contItem++;
                segmentGroup.push({
                    segmentInformation: [{
                        flightDate: [{ departureDate: [vuelta.dateFrom], departureTime: [vuelta.timeFrom] }],
                        boardPointDetails: [{ trueLocationId: [vuelta.iataFrom] }],
                        offpointDetails: [{ trueLocationId: [vuelta.iataTo] }],
                        companyDetails: [{ marketingCompany: [vuelta.marketingCarrier] }],
                        flightIdentification: [{ flightNumber: [vuelta.numberTrip], bookingClass: [vuelta.rbd] }],
                        flightTypeDetails: [{ flightIndicator: ["2"] }],
                        itemNumber: [contItem + ""]
                    }]
                });
            }
        }
    }
    const body_Fare_InformativePricingWithoutPNR = {
        "soapenv:Body": {
            Fare_InformativePricingWithoutPNR: [{
                passengersGroup: passengersGroup,
                segmentGroup: segmentGroup,
                pricingOptionGroup: [
                    { pricingOptionKey: [{ pricingOptionKey: ["VC"] }], carrierInformation: [{ companyIdentification: [{ otherCompany: [body.vc] }] }] },
                    { pricingOptionKey: [{ pricingOptionKey: ["RP"] }] },
                    { pricingOptionKey: [{ pricingOptionKey: ["RLO"] }] },
                    { pricingOptionKey: [{ pricingOptionKey: ["FCO"] }], currency: [{ firstCurrencyDetails: [{ currencyQualifier: ["FCO"], currencyIsoCode: ["COP"] }] }] }
                ]
            }]
        }
    }
    const resOk = await procesosAmadeusXML('POST', body_Fare_InformativePricingWithoutPNR, 'TIPNRQ_23_1_1A', 1, {});
    const Fare_InformativePricingWithoutPNRResponse = resOk.newJSON["soapenv:Envelope"]["soapenv:Body"][0].Fare_InformativePricingWithoutPNRReply[0].mainGroup;
    for (pricingGroupLevelGroup of Fare_InformativePricingWithoutPNRResponse[0].pricingGroupLevelGroup) {
        /* console.log('pricingGroupLevelGroup: ', pricingGroupLevelGroup.fareInfoGroup[0].fareAmount[0].otherMonetaryDetails); */
        pricingGroupLevelGroup.fareInfoGroup[0].fareAmount[0].otherMonetaryDetails[0].amount[0] = parseInt(pricingGroupLevelGroup.fareInfoGroup[0].fareAmount[0].otherMonetaryDetails[0].amount[0]);
        if (pricingGroupLevelGroup.fareInfoGroup[0].fareAmount[0].otherMonetaryDetails.length > 1) {
            pricingGroupLevelGroup.fareInfoGroup[0].fareAmount[0].otherMonetaryDetails[1].amount[0] = parseInt(pricingGroupLevelGroup.fareInfoGroup[0].fareAmount[0].otherMonetaryDetails[1].amount[0]);
        }
        pricingGroupLevelGroup.numberOfPax[0].segmentControlDetails[0].numberOfUnits[0] = parseInt(pricingGroupLevelGroup.numberOfPax[0].segmentControlDetails[0].numberOfUnits[0]);
    }
    const resOk1 = await Air_SellFromRecommendation(Fare_InformativePricingWithoutPNRResponse[0], resOk.dataOut, body);
    res.status(200).json({ error: false, data: resOk1.newJSON, fare: resOk1.fare, session: resOk1.dataOut });
}
async function Air_SellFromRecommendation(response, session, flight) {
    let segmentInformationIda = [],
        quantity = 0,
        segmentInformationVuelta = [],
        fare = {},
        seats = [],
        segVuelta = false,
        body = { session: session };
    for (pricingGroupLevelGroup of response.pricingGroupLevelGroup) {
        if (pricingGroupLevelGroup.numberOfPax[0].segmentControlDetails[0].quantity[0] != '3') {
            quantity = quantity + parseInt(pricingGroupLevelGroup.numberOfPax[0].segmentControlDetails[0].numberOfUnits[0]);
        }
    }
    if (flight.vuelta) {
        for (segmentLevelGroup of response.pricingGroupLevelGroup[0].fareInfoGroup[0].segmentLevelGroup) {
            if (!segVuelta) {
                segmentInformationIda.push({
                    travelProductInformation: [{
                        flightDate: [{ departureDate: [segmentLevelGroup.segmentInformation[0].flightDate[0].departureDate[0]] }],
                        boardPointDetails: [{ trueLocationId: [segmentLevelGroup.segmentInformation[0].boardPointDetails[0].trueLocationId[0]] }],
                        offpointDetails: [{ trueLocationId: [segmentLevelGroup.segmentInformation[0].offpointDetails[0].trueLocationId[0]] }],
                        companyDetails: [{ marketingCompany: [segmentLevelGroup.segmentInformation[0].companyDetails[0].marketingCompany[0]] }],
                        flightIdentification: [{ flightNumber: [segmentLevelGroup.segmentInformation[0].flightIdentification[0].flightNumber[0]], bookingClass: [segmentLevelGroup.segmentInformation[0].flightIdentification[0].bookingClass[0]] }]
                    }],
                    relatedproductInformation: [{ quantity: [quantity + ""], statusCode: ["NN"] }]
                });
                flight.ida[flight.ida.length - 1].iataTo == segmentLevelGroup.segmentInformation[0].offpointDetails[0].trueLocationId[0] ? segVuelta = true : false;
            } else {
                segmentInformationVuelta.push({
                    travelProductInformation: [{
                        flightDate: [{ departureDate: [segmentLevelGroup.segmentInformation[0].flightDate[0].departureDate[0]] }],
                        boardPointDetails: [{ trueLocationId: [segmentLevelGroup.segmentInformation[0].boardPointDetails[0].trueLocationId[0]] }],
                        offpointDetails: [{ trueLocationId: [segmentLevelGroup.segmentInformation[0].offpointDetails[0].trueLocationId[0]] }],
                        companyDetails: [{ marketingCompany: [segmentLevelGroup.segmentInformation[0].companyDetails[0].marketingCompany[0]] }],
                        flightIdentification: [{ flightNumber: [segmentLevelGroup.segmentInformation[0].flightIdentification[0].flightNumber[0]], bookingClass: [segmentLevelGroup.segmentInformation[0].flightIdentification[0].bookingClass[0]] }]
                    }],
                    relatedproductInformation: [{ quantity: [quantity + ""], statusCode: ["NN"] }]
                });
            }
        }
    } else {
        for (segmentLevelGroup of response.pricingGroupLevelGroup[0].fareInfoGroup[0].segmentLevelGroup) {
            segmentInformationIda.push({
                travelProductInformation: [{
                    flightDate: [{ departureDate: [segmentLevelGroup.segmentInformation[0].flightDate[0].departureDate[0]] }],
                    boardPointDetails: [{ trueLocationId: [segmentLevelGroup.segmentInformation[0].boardPointDetails[0].trueLocationId[0]] }],
                    offpointDetails: [{ trueLocationId: [segmentLevelGroup.segmentInformation[0].offpointDetails[0].trueLocationId[0]] }],
                    companyDetails: [{ marketingCompany: [segmentLevelGroup.segmentInformation[0].companyDetails[0].marketingCompany[0]] }],
                    flightIdentification: [{ flightNumber: [segmentLevelGroup.segmentInformation[0].flightIdentification[0].flightNumber[0]], bookingClass: [segmentLevelGroup.segmentInformation[0].flightIdentification[0].bookingClass[0]] }]
                }],
                relatedproductInformation: [{ quantity: [quantity + ""], statusCode: ["NN"] }]
            });
        }
    }
    if (flight.vuelta) {
        body.data = { "soapenv:Body": { Air_SellFromRecommendation: [{ messageActionDetails: [{ messageFunctionDetails: [{ messageFunction: ["183"], additionalMessageFunction: ["M1"] }] }], itineraryDetails: [{ originDestinationDetails: [{ origin: [flight.ida[0].iataFrom], destination: [flight.ida[flight.ida.length - 1].iataTo] }], message: [{ messageFunctionDetails: [{ messageFunction: ["183"] }] }], segmentInformation: segmentInformationIda }, { originDestinationDetails: [{ origin: flight.vuelta[0].iataFrom, destination: flight.vuelta[flight.vuelta.length - 1].iataTo }], message: [{ messageFunctionDetails: [{ messageFunction: ["183"] }] }], segmentInformation: segmentInformationVuelta }] }] } }
    } else {
        body.data = { "soapenv:Body": { Air_SellFromRecommendation: [{ messageActionDetails: [{ messageFunctionDetails: [{ messageFunction: ["183"], additionalMessageFunction: ["M1"] }] }], itineraryDetails: [{ originDestinationDetails: [{ origin: [flight.ida[0].iataFrom], destination: [flight.ida[flight.ida.length - 1].iataTo] }], message: [{ messageFunctionDetails: [{ messageFunction: ["183"] }] }], segmentInformation: segmentInformationIda }] }] } }
    }
    for (resp of response.pricingGroupLevelGroup) {
        let measurementValue = [];
        for (travellerId of resp.passengersID[0].travellerDetails) { measurementValue.push(travellerId.measurementValue[0]); }
        fare[`${resp.numberOfPax[0].segmentControlDetails[0].quantity[0] == '1' ? 'ADT' : (resp.numberOfPax[0].segmentControlDetails[0].quantity[0] == '2' ? 'CNN' : 'INF')}`] = {
            passenger: resp.numberOfPax[0].segmentControlDetails[0].quantity[0] == '1' ? 'ADT' : (resp.numberOfPax[0].segmentControlDetails[0].quantity[0] == '2' ? 'CNN' : 'INF'),
            quantity: resp.numberOfPax[0].segmentControlDetails[0].numberOfUnits[0],
            passengersId: measurementValue,
            total: resp.fareInfoGroup[0].fareAmount[0].otherMonetaryDetails?.[1] ? resp.fareInfoGroup[0].fareAmount[0].otherMonetaryDetails?.[1].amount[0] : resp.fareInfoGroup[0].fareAmount[0].otherMonetaryDetails[0].amount[0]
        };
    }
    const airSellFromRecommendationResponse = await procesosAmadeusXML('POST', body.data, 'ITAREQ_05_2_IA', 2, body.session);
    for (recommendations of airSellFromRecommendationResponse.newJSON['soapenv:Envelope']['soapenv:Body'][0].Air_SellFromRecommendationReply[0].itineraryDetails) {
        let details = [];
        for (recommendation of recommendations.segmentInformation) {
            details.push({
                seats: recommendation.actionDetails[0].quantity[0],
                state: recommendation.actionDetails[0].statusCode[0],
                terminal: recommendation.apdSegment?.[0].departureStationInfo?.[0].terminal?.[0] ?? null,
                equipment: recommendation.apdSegment?.[0].legDetails?.[0].equipment?.[0] ?? null,
                from: recommendation.flightDetails[0].boardPointDetails[0].trueLocationId[0],
                to: recommendation.flightDetails[0].offpointDetails[0].trueLocationId[0],
                dateFrom: recommendation.flightDetails[0].flightDate[0].departureDate[0],
                dateTo: recommendation.flightDetails[0].flightDate[0].arrivalDate[0],
                timeFrom: recommendation.flightDetails[0].flightDate[0].departureTime[0],
                timeTo: recommendation.flightDetails[0].flightDate[0].arrivalTime[0],
                variation: recommendation.flightDetails[0].flightDate[0].dateVariation?.[0] ?? null,
                marketingCompany: recommendation.flightDetails[0].companyDetails[0].marketingCompany[0],
                flightIndicator: recommendation.flightDetails[0].flightTypeDetails[0].flightIndicator[0],
                specialSegment: recommendation.flightDetails[0].specialSegment?.[0] ?? null,
                bookingClass: recommendation.flightDetails[0].flightIdentification[0].bookingClass?.[0] ?? null,
                flightNumber: recommendation.flightDetails[0].flightIdentification[0].flightNumber?.[0] ?? null
            });
        }
        seats.push({
            origin: recommendations.originDestination[0].origin[0],
            destination: recommendations.originDestination[0].destination[0],
            details: details
        });
    }
    return { newJSON: { seats: seats, message: airSellFromRecommendationResponse.newJSON['soapenv:Envelope']['soapenv:Body'][0].Air_SellFromRecommendationReply[0].message[0].messageFunctionDetails[0].messageFunction[0] }, fare: fare, dataOut: airSellFromRecommendationResponse.dataOut };
}
exports.PNR_AddMultiElements = async (req, res) => {
    const body = req.body.data, session = req.body.session;
    console.log('PNR_AddMultiElements: ', body);
    let travellerCont = 2, travellerInfo = [],
        dataElementsIndiv = [
            { elementManagementData: [{ reference: [{ qualifier: ["OT"], number: ["1"] }], segmentName: ["AP"] }], freetextData: [{ freetextDetail: [{ subjectQualifier: ["3"], type: ["6"] }], longFreetext: [body.contact.phone] }] },
            { elementManagementData: [{ reference: [{ qualifier: ["OT"], number: ["2"] }], segmentName: ["AP"] }], freetextData: [{ freetextDetail: [{ subjectQualifier: ["3"], type: ["P02"] }], longFreetext: [body.contact.email] }] },
            { elementManagementData: [{ segmentName: ["SSR"] }], serviceRequest: [{ ssr: [{ type: ["CTCM"], status: ["HK"], companyId: ["YY"], freetext: [body.contact.phone + ''] }] }] },
            { elementManagementData: [{ segmentName: ["SSR"] }], serviceRequest: [{ ssr: [{ type: ["CTCE"], status: ["HK"], companyId: ["YY"], freetext: [(body.contact.email).replace("@", "//")] }] }] }
        ];
    for (passenger of body.passengers) {
        const dateParse = parseISO(passenger.dateOfBirth);
        if (passenger.type != 'INF') {
            travellerCont++;
            travellerInfo.push({ elementManagementPassenger: [{ reference: [{ qualifier: ["PR"], number: [passenger.id + ''] }], segmentName: ["NM"] }], passengerData: [{ travellerInformation: [{ traveller: [{ surname: [passenger.surname], quantity: ["1"] }], passenger: [{ firstName: [passenger.name], type: [passenger.type] }] }], dateOfBirth: [{ dateAndTimeDetails: [{ date: [format(dateParse, 'ddMMMyy').toUpperCase()] }] }] }] });
            dataElementsIndiv.push({
                elementManagementData: [{ reference: [{ qualifier: ["OT"], number: [travellerCont + ''] }], segmentName: ["SSR"] }],
                serviceRequest: [
                    { ssr: [{ type: ["FOID"], status: ["HK"], quantity: ["1"], companyId: [body.airline], freetext: [passenger.num_id + ''] }] }
                ],
                referenceForDataElement: [{ reference: [{ qualifier: ["PR"], number: [passenger.id + ''] }] }]
            });
            travellerCont++;
            dataElementsIndiv.push({
                elementManagementData: [{ reference: [{ qualifier: ["OT"], number: [travellerCont + ''] }], segmentName: ["SSR"] }],
                serviceRequest: [
                    { ssr: [{ type: ["DOCS"], status: ["HK"], quantity: ["1"], companyId: ["YY"], freetext: [`${passenger.documentType}-${passenger.nationality}-${passenger.num_id}-${passenger.nationality}-${format(dateParse, 'ddMMMyy').toUpperCase()}-${passenger.gender}-${passenger.surname.toUpperCase()}-${passenger.name.toUpperCase()}`] }] }
                ],
                referenceForDataElement: [{ reference: [{ qualifier: ["PR"], number: [passenger.id + ''] }] }]
            });
        } else {
            dataElementsIndiv.push({
                elementManagementData: [{ reference: [{ qualifier: ["OT"], number: [travellerCont + ''] }], segmentName: ["SSR"] }],
                serviceRequest: [
                    { ssr: [{ type: ["DOCS"], status: ["HK"], quantity: ["1"], companyId: ["YY"], freetext: [`${passenger.documentType}-${passenger.nationality}-${passenger.num_id}-${passenger.nationality}-${format(dateParse, 'ddMMMyy').toUpperCase()}-${passenger.gender}-${passenger.surname.toUpperCase()}-${passenger.name.toUpperCase()}`] }] }
                ],
                referenceForDataElement: [{ reference: [{ qualifier: ["PR"], number: [passenger.number + ''] }] }]
            });
        }
    }
    for (infant of body.passengers) {
        if (infant.type == 'INF') {
            travellerCont++;
            const dateParse = parseISO(infant.dateOfBirth);
            travellerInfo[infant.number - 1].passengerData[0].travellerInformation[0].traveller[0].quantity[0] = "2";
            travellerInfo[infant.number - 1].passengerData[0].travellerInformation[0].passenger[0].infantIndicator = ["3"];
            travellerInfo[infant.number - 1].passengerData.push({ travellerInformation: [{ traveller: [{ surname: [infant.surname], quantity: ["1"] }], passenger: [{ firstName: [infant.name], type: [infant.type] }] }], dateOfBirth: [{ dateAndTimeDetails: [{ date: [format(dateParse, 'ddMMMyy').toUpperCase()] }] }] });
        }
    }
    console.log('travellerInfo: ', JSON.stringify(travellerInfo));
    console.log('travellerInfo: ', JSON.stringify(dataElementsIndiv));
    console.log('travellerInfo: ', travellerInfo.length);
    const body_PNR_AddMultiElements_1 = { "soapenv:Body": { PNR_AddMultiElements: { pnrActions: [{ optionCode: ["11"] }], travellerInfo: travellerInfo, dataElementsMaster: [{ marker1: [""], dataElementsIndiv: dataElementsIndiv }] } } };
    const resOk = await procesosAmadeusXML('POST', body_PNR_AddMultiElements_1, 'PNRADD_21_1_1A', 2, session);
    wanderlust.localSaveBookingId({ body: body, session: session });
    console.log('travellerInfo: ', resOk.newJSON);
    /* console.log('travellerInfo: ', PNR_AddMultiElements);
    console.log('travellerInfo: ', JSON.stringify(PNR_AddMultiElements)); */
    res.status(200).json({ error: (resOk.dataOut.securityToken == null || resOk.dataOut.sessionId == null || resOk.dataOut.transaction == null) ? true: false, data: resOk.newJSON, session: resOk.dataOut });
    //res.end();
}
exports.FOP_CreateFormOfPayment = async (req, res) => {
    const body = req.body;
    const body_FOP_CreateFormOfPayment = {
        FOP_CreateFormOfPayment: [{
            transactionContext: [{ transactionDetails: [{ code: ["FP"] }] }],
            fopGroup: [{
                fopReference: [""],
                mopDescription: [{
                    fopSequenceNumber: [{ sequenceDetails: [{ number: ["1"] }] }],
                    mopDetails: [{ fopPNRDetails: [{ fopDetails: [{ fopCode: [`${body.data.typeCard}${body.data.vendorCode}`] }] }] }],
                    paymentModule: [{
                        groupUsage: [{ attributeDetails: [{ attributeType: ["FP"] }] }],
                        mopInformation: [{
                            fopInformation: [{ formOfPayment: [{ type: [body.data.typeCard] }] }],
                            dummy: [""],
                            creditCardData: [{ creditCardDetails: [{ ccInfo: [{ vendorCode: [body.data.vendorCode], cardNumber: [body.data.cardNumber], securityId: [body.data.securityCode], expiryDate: [body.data.expiryDate] }] }] }]
                        }],
                        dummy: [""],
                        mopDetailedData: [{
                            fopInformation: [{ formOfPayment: [{ type: [body.data.typeCard] }] }],
                            dummy: [""],
                            creditCardDetailedData: [{ authorisationSupplementaryData: [""], approvalDetails: [{ approvalCodeData: [{ approvalCode: [body.data.approvalCode], sourceOfApproval: ["M"] }] }] }]
                        }]
                    }]
                }]
            }]
        }]
    };
    const body_Fare_PricePNRWithBookingClass = {
        Fare_PricePNRWithBookingClass: {
            pricingOptionGroup: [
                { pricingOptionKey: [{ pricingOptionKey: ["RP"] }] },
                { pricingOptionKey: [{ pricingOptionKey: ["RLO"] }] },
                { pricingOptionKey: [{ pricingOptionKey: ["VC"] }], carrierInformation: [{ companyIdentification: [{ otherCompany: ["AM"] }] }] },
                { pricingOptionKey: [{ pricingOptionKey: ["FCO"] }], currency: [{ firstCurrencyDetails: [{ currencyQualifier: ["FCO"], currencyIsoCode: ["COP"] }] }] }
            ]
        }
    };
    const body_Ticket_CreateTSTFromPricing = {
        Ticket_CreateTSTFromPricing: {
            psaList: [
                { itemReference: [{ referenceType: ["TST"], uniqueReference: ["1"] }] },
                { itemReference: [{ referenceType: ["TST"], uniqueReference: ["2"] }] },
                { itemReference: [{ referenceType: ["TST"], uniqueReference: ["3"] }] }
            ]
        }
    };
    const body_PNR_AddMultiElements_2 = {
        PNR_AddMultiElements: {
            pnrActions: [{ optionCode: ["11"] }],
            dataElementsMaster: [{
                marker1: [""],
                dataElementsIndiv: [{
                    elementManagementData: [{ reference: [{ qualifier: ["OT"], number: ["2"] }], segmentName: ["TK"] }],
                    ticketElement: [{ ticket: [{ indicator: ["OK"] }] }]
                },
                {
                    elementManagementData: [{ segmentName: ["RF"] }],
                    freetextData: [{ freetextDetail: [{ subjectQualifier: ["3"], type: ["P22"] }], longFreetext: ["Tayrona - Application"] }]
                }
                ]
            }]
        }
    };
    const body_Security_SignOut = {
        Security_SignOut: ""
    };
    /* const resOk = await procesosAmadeusXML('POST', newBody, 'TFOPCQ_19_2_1A', 0, body.session);
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut }); */
    res.end();
}
exports.Fare_PricePNRWithBookingClass = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'TPCBRQ_23_2_1A', 0, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
}
exports.Ticket_CreateTSTFromPricing = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'TAUTCQ_04_1_1A', 0, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
}
exports.Security_SignOut = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'VLSSOQ_04_1_1A', 3, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
}
//Funciones globales
async function procesosAmadeusXML(method, body, action, type, session) {
    return new Promise(async (resolve, reject) => {
        let options = {};
        const path = 'https://nodeD1.test.webservices.amadeus.com/1ASIWWANWPS';
        const newXML = type == 3 ? `<soapenv:Body> <Security_SignOut xmlns="http://xml.amadeus.com/${action}"></Security_SignOut> </soapenv:Body>` : await json2xml(body);
        const headerOk = type < 2 ? await headerAmadeus.generateHeader(action, type) : await headerAmadeus.generateHeaderStateful(action, type, session);
        /* console.log('headerOk: ', headerOk); */
        const envelop = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sec="http://xml.amadeus.com/2010/06/Security_v1" xmlns:typ="http://xml.amadeus.com/2010/06/Types_v1" xmlns:iat="http://www.iata.org/IATA/2007/00/IATA2010.1" xmlns:app="http://xml.amadeus.com/2010/06/AppMdw_CommonTypes_v3" xmlns:link="http://wsdl.amadeus.com/2010/06/ws/Link_v1" xmlns:ses="http://xml.amadeus.com/2010/06/Session_v3">${headerOk.header}${newXML}</soapenv:Envelope>`;
        console.log(envelop);
        await saveXml(envelop, action + '_request');
        /* resolve(envelop); */
        /* console.log('envelop: ', envelop); */
        if (method == 'GET') {
            options = { method: method, url: path, headers: { 'content-type': 'text/xml', 'POST': 'https://nodeD1.test.webservices.amadeus.com/HTTP/1.1', 'SOAPAction': `http://webservices.amadeus.com/${action}` } };
        } else {
            options = { method: method, url: path, headers: { 'content-type': 'text/xml', 'POST': 'https://nodeD1.test.webservices.amadeus.com/HTTP/1.1', 'SOAPAction': `http://webservices.amadeus.com/${action}` }, body: envelop };
        }
        requesthttp(options, async (error, response, body) => {
            if (error) {
                reject({ error: true, data: error });
            } else {
                /* console.log(response.body); */
                await saveXml(response.body, action + '_response');
                const newJSON = await xml2json(response.body);
                /* console.log(newJSON); */
                headerOk.dataOut.securityToken = newJSON['soapenv:Envelope']?.['soapenv:Header']?.[0]?.['awsse:Session']?.[0]?.['awsse:SecurityToken']?.[0] ?? null;
                headerOk.dataOut.sequenceNumber = `${parseInt(newJSON['soapenv:Envelope']?.['soapenv:Header']?.[0]?.['awsse:Session']?.[0]?.['awsse:SequenceNumber']?.[0] ?? '-1') + 1}`;
                headerOk.dataOut.sessionId = newJSON['soapenv:Envelope']?.['soapenv:Header']?.[0]?.['awsse:Session']?.[0]?.['awsse:SessionId']?.[0] ?? null;
                headerOk.dataOut.transaction = newJSON['soapenv:Envelope']?.['soapenv:Header']?.[0]?.['awsse:Session']?.[0]?.['$']?.TransactionStatusCode ?? null;
                /* console.log('headerOk: ', headerOk.dataOut); */
                resolve({ newJSON: newJSON, dataOut: headerOk.dataOut });
            }
        })
    });
}
async function getToken() {
    return new Promise((resolve, reject) => {
        const body = qs.stringify({ 'grant_type': 'client_credentials', 'client_id': 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', 'client_secret': 'N0hFslmwu3zpofYQ' });
        const options = { method: 'post', url: authentication.url + 'v1/security/oauth2/token', headers: { 'Content-type': 'application/x-www-form-urlencoded' }, body: body, json: true };
        requesthttp(options, async (error, response, body) => {
            if (error) { reject(false); } else {
                token = response.body.access_token;
                resolve(true);
            }
        })
    });
}
async function procesosAmadeus(path, method, body) {
    return new Promise((resolve, reject) => {
        let options = {};
        if (method == 'GET') {
            options = { method: method, url: authentication.url + path, headers: { accept: 'application/json', 'content-type': 'application/json', 'Authorization': 'Bearer ' + token } };
        } else {
            options = { method: method, url: authentication.url + path, headers: { accept: 'application/json', 'content-type': 'application/json', 'Authorization': 'Bearer ' + token }, body: body, json: true };
        }
        requesthttp(options, async (error, response, body) => {
            if (error) { reject({ error: true, data: error }); } else { resolve(JSON.parse(response.body)); }
        })
    });
}
async function xml2json(xml) {
    return new Promise((resolve, reject) => {
        const parser = new xml2js.Parser();
        parser.parseString(xml, function (err, result) { resolve(result); });
    });
}
async function json2xml(json) {
    return new Promise((resolve, reject) => {
        resolve((builder.buildObject(json)).replace(deleteText, ''));
    });
}

function saveXml(string, nombre) {
    return new Promise((resolve, reject) => {
        const filePath = `./files_xml/${nombre}.xml`;
        fs.writeFile(filePath, string, (err) => {
            if (err) {
                console.error('Error al guardar el archivo XML:', err);
                resolve(false);
            } else {
                console.log('Archivo XML guardado exitosamente en', filePath);
                resolve(true);
            }
        });
    });
}
/* function esperar(data) { return new Promise(resolve => setTimeout(resolve, data)); } */
exports.xml2jsonReq = async (req, res) => {
    const resOk = await xml2json(req.body.xml);
    res.status(200).json({ error: false, data: resOk });
}
exports.json2xmlReq = async (req, res) => {
    const resOk = await json2xml(req.body);
    res.status(200).json({ error: false, data: resOk });
}