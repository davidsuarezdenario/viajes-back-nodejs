const { format, parseISO } = require("date-fns");
const fs = require('fs');


const sql = require("mssql"), requesthttp = require('request'), qs = require('qs'), xml2js = require('xml2js'), builder = new xml2js.Builder(), headerAmadeus = require('../controllers/headerAmadeus'), querypnrAddMultiElementsBuilder = require('./PnrAddMultiElementsBuilder'), deleteText = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const authentication = { url: 'https://test.api.amadeus.com/', client_id: 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', client_secret: 'N0hFslmwu3zpofYQ' }; //Pruebas
let token = '';

exports.iataCodes = async (req, res) => {
    const request = new sql.Request();
    await request.query(`SELECT * FROM IataCodesPlaces WHERE available=1`).then((object) => {
        res.status(200).json({ error: false, data: object.recordset })
    }).catch((err) => {
        res.status(400).json({ error: true, data: err });
    });
}
exports.Fare_MasterPricerTravelBoardSearch = async (req, res) => {
    const body = req.body;
    const requestedSegmentRef = body.type == 'idaVuelta' ? [{ requestedSegmentRef: [{ segRef: ["1"] }], departureLocalization: [{ departurePoint: [{ locationId: [body.iataFrom] }] }], arrivalLocalization: [{ arrivalPointDetails: [{ locationId: [body.iataTo] }] }], timeDetails: [{ firstDateTimeDetail: [{ date: [format(parseISO(body.timeFrom), 'ddMMyy')] }] }] }, { requestedSegmentRef: [{ segRef: ["2"] }], departureLocalization: [{ departurePoint: [{ locationId: [body.iataTo] }] }], arrivalLocalization: [{ arrivalPointDetails: [{ locationId: [body.iataFrom] }] }], timeDetails: [{ firstDateTimeDetail: [{ date: [format(parseISO(body.timeTo), 'ddMMyy')] }] }] }] : [{ requestedSegmentRef: [{ segRef: ["1"] }], departureLocalization: [{ departurePoint: [{ locationId: [body.iataFrom] }] }], arrivalLocalization: [{ arrivalPointDetails: [{ locationId: [body.iataTo] }] }], timeDetails: [{ firstDateTimeDetail: [{ date: [format(parseISO(body.timeFrom), 'ddMMyy')] }] }] }];
    body.nonStop ? (requestedSegmentRef[0].flightInfo = [{ flightDetail: [{ flightType: ["N"] }] }]) : false;
    let contPax = 1;
    const paxAdt = await Array.from({ length: body.adult }, () => ({ ref: [(contPax++) + ''] })), paxCnn = await Array.from({ length: body.child }, () => ({ ref: [(contPax++) + ''] })), paxInf = await Array.from({ length: body.infant }, (_, i) => ({ ref: [(i + 1) + ''], infantIndicator: [(i + 1) + ''] }));
    let paxReference = [{ ptc: ["ADT"], traveller: paxAdt }];
    body.child > 0 ? paxReference.push({ ptc: ["CNN"], traveller: paxCnn }) : false; body.infant > 0 ? paxReference.push({ ptc: ["INF"], traveller: paxInf }) : false;
    const bodyNew = { data: { "soapenv:Body": { Fare_MasterPricerTravelBoardSearch: [{ numberOfUnit: [{ unitNumberDetail: [{ numberOfUnits: [body.adult + body.child], typeOfUnit: ["PX"] }, { numberOfUnits: ["250"], typeOfUnit: ["RC"] }] }], paxReference: paxReference, fareOptions: [{ pricingTickInfo: [{ pricingTicketing: [{ priceType: ["ET", "RP", "RU"] }] }] }], travelFlightInfo: [{ cabinId: [{ cabin: [body.cabin] }] }], itinerary: requestedSegmentRef }] } } };
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
                                for (paxPtc of recommendation.paxFareProduct) { let travellerDetails = []; for (pax of paxPtc.paxReference[0].traveller) { travellerDetails.push({ measurementValue: [pax.ref[0]] }); } paxOk.push({ ptc: paxPtc.paxReference[0].ptc[0], ref: travellerDetails, total: paxPtc.paxReference[0].traveller.length }); }
                                for (let i = 0; i < idaTemp.length; i++) { idaTemp[i].rbd = recommendation.paxFareProduct[0].fareDetails[0].groupOfFares[i].productInformation[0].cabinProduct[0].rbd[0]; idaTemp[i].avlStatus = recommendation.paxFareProduct[0].fareDetails[0].groupOfFares[i].productInformation[0].cabinProduct[0].avlStatus[0]; }
                                result.push({
                                    id: `${recommendation.itemNumber[0].itemNumberId[0].number[0]}-${recommendationSegment.referencingDetail[0].refNumber[0]}-${recommendationSegment.referencingDetail[1].refNumber[0]}`,
                                    precio: { total: recommendation.recPriceInfo[0].monetaryDetail[0].amount[0], fee: recommendation.recPriceInfo[0].monetaryDetail[1].amount[0] },
                                    pax: paxOk,
                                    detalle: recommendation.segmentFlightRef,
                                    ida: idaTemp
                                });
                            }
                        }
                    }
                }
                res.status(200).json({ error: false, data: result, session: {}, resOk: resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0] });
            } else if (resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].flightIndex.length == 2) {
                for (recommendation of resOk.newJSON['soapenv:Envelope']['soapenv:Body'][0].Fare_MasterPricerTravelBoardSearchReply[0].recommendation) {
                    for (recommendationSegment of recommendation.segmentFlightRef) {
                        let idaTemp = [], vueltaTemp = [];
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
                        for (paxPtc of recommendation.paxFareProduct) { let travellerDetails = []; for (pax of paxPtc.paxReference[0].traveller) { travellerDetails.push({ measurementValue: [pax.ref[0]] }); } paxOk.push({ ptc: paxPtc.paxReference[0].ptc[0], ref: travellerDetails, total: paxPtc.paxReference[0].traveller.length }); }
                        for (let i = 0; i < idaTemp.length; i++) { idaTemp[i].rbd = recommendation.paxFareProduct[0].fareDetails[0].groupOfFares[i].productInformation[0].cabinProduct[0].rbd[0]; idaTemp[i].avlStatus = recommendation.paxFareProduct[0].fareDetails[0].groupOfFares[i].productInformation[0].cabinProduct[0].avlStatus[0]; }
                        for (let j = 0; j < vueltaTemp.length; j++) { vueltaTemp[j].rbd = recommendation.paxFareProduct[0].fareDetails[1].groupOfFares[j].productInformation[0].cabinProduct[0].rbd[0]; vueltaTemp[j].avlStatus = recommendation.paxFareProduct[0].fareDetails[1].groupOfFares[j].productInformation[0].cabinProduct[0].avlStatus[0]; }
                        result.push({
                            id: `${recommendation.itemNumber[0].itemNumberId[0].number[0]}-${recommendationSegment.referencingDetail[0].refNumber[0]}-${recommendationSegment.referencingDetail[1].refNumber[0]}`,
                            prec: recommendation.recPriceInfo[0].monetaryDetail,
                            precio: { total: recommendation.recPriceInfo[0].monetaryDetail[0].amount[0], fee: recommendation.recPriceInfo[0].monetaryDetail[1].amount[0] },
                            pax: paxOk,
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
        }
        else {
            res.status(200).json({ error: true, data: { title1: 'Ups', title2: 'No se encontraron vuelos 2', title3: 'Intenta con otros parametros de busqueda.' }, session: {} });
        }
    } else {
        res.status(200).json({ error: true, data: { title1: 'Ups', title2: 'No se encontraron vuelos 3', title3: 'Intenta con otros parametros de busqueda.' }, session: {} });
    }
}
exports.Fare_InformativePricingWithoutPNR = async (req, res) => {
    const body = req.body;
    let passengersGroup = [], segmentGroup = [];
    if (body) {
        let contItem = 0;
        for (pax of body.pax) {
            passengersGroup.push({
                segmentRepetitionControl: [{
                    segmentControlDetails: [{
                        quantity: [pax.ptc == "ADT" ? "1" : (pax.ptc == "CNN" ? "2" : "3")], numberOfUnits: [pax.total + '']
                    }]
                }],
                travellersID: [{ travellerDetails: pax.ref }], discountPtc: [{ valueQualifier: [pax.ptc] }]
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
    const bodyFare_InformativePricingWithoutPNR = {
        "soapenv:Body": {
            Fare_InformativePricingWithoutPNR: [{
                passengersGroup: passengersGroup,
                segmentGroup: segmentGroup,
                pricingOptionGroup: [
                    { pricingOptionKey: [{ pricingOptionKey: ["RP"] }] },
                    { pricingOptionKey: [{ pricingOptionKey: ["RLO"] }] },
                    { pricingOptionKey: [{ pricingOptionKey: ["FCO"] }], currency: [{ firstCurrencyDetails: [{ currencyQualifier: ["FCO"], currencyIsoCode: ["COP"] }] }] }
                ]
            }]
        }
    }
    const resOk = await procesosAmadeusXML('POST', bodyFare_InformativePricingWithoutPNR, 'TIPNRQ_23_1_1A', 1, {});
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
    let segmentInformationIda = [], quantity = 0, segmentInformationVuelta = [], fare = {}, seats = [], segVuelta = false, body = { session: session };
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

/* exports.Air_SellFromRecommendation = async (req, res) => {
    
    const body = req.body;
    console.log('Air_SellFromRecommendation: ', body);
    const resOk = await procesosAmadeusXML('POST', body.data, 'ITAREQ_05_2_IA', 2, body.session);
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
} */


exports.PNR_AddMultiElements = async (req, res) => {
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
  
    const method = 'POST';
    const body = querypnrAddMultiElementsBuilder.createPNRAddMultiElements(data);
    // const action = 'PNR_AddMultiElements';
    const action = 'PNRADD_21_1_1A';
    const type = 0; // o el tipo adecuado para la solicitud
    const session = { /* información de sesión, si es necesaria */ };
    const response = await procesosAmadeusXML(method, body, action, type, session);
    
    // const body = req.body;
    // const resOk = await procesosAmadeusXML('POST', body.data, 'PNRADD_21_1_1A', 0, {});

    res.set('Content-Type', 'application/xml');
    res.send(response);
    // res.status(200).json({ error: false, data: response.newJSON, session: response.dataOut });
}
exports.FOP_CreateFormOfPayment = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'TFOPCQ_19_2_1A', 0, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
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
                headerOk.dataOut.securityToken = newJSON['soapenv:Envelope']['soapenv:Header'][0]['awsse:Session'][0]['awsse:SecurityToken'][0]; headerOk.dataOut.sequenceNumber = `${parseInt(newJSON['soapenv:Envelope']['soapenv:Header'][0]['awsse:Session'][0]['awsse:SequenceNumber'][0]) + 1}`; headerOk.dataOut.sessionId = newJSON['soapenv:Envelope']['soapenv:Header'][0]['awsse:Session'][0]['awsse:SessionId'][0]; headerOk.dataOut.transaction = newJSON['soapenv:Envelope']['soapenv:Header'][0]['awsse:Session'][0]['$'].TransactionStatusCode;
                /* console.log('headerOk: ', headerOk.dataOut); */
                resolve({ newJSON: newJSON, dataOut: headerOk.dataOut });
            }
        })
    });
}
async function getToken() {
    return new Promise((resolve, reject) => { const body = qs.stringify({ 'grant_type': 'client_credentials', 'client_id': 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', 'client_secret': 'N0hFslmwu3zpofYQ' }); const options = { method: 'post', url: authentication.url + 'v1/security/oauth2/token', headers: { 'Content-type': 'application/x-www-form-urlencoded' }, body: body, json: true }; requesthttp(options, async (error, response, body) => { if (error) { reject(false); } else { token = response.body.access_token; resolve(true); } }) });
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
        const parser = new xml2js.Parser(); parser.parseString(xml, function (err, result) { resolve(result); });
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