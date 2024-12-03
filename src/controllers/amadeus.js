const { format, parseISO } = require("date-fns");
const fs = require('fs');
const sql = require("mssql"), requesthttp = require('request'), qs = require('qs'), xml2js = require('xml2js'), builder = new xml2js.Builder(), headerAmadeus = require('../controllers/headerAmadeus'), wanderlust = require('../controllers/wanderlust'), deleteText = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const authentication = { url: 'https://test.api.amadeus.com/', client_id: 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', client_secret: 'N0hFslmwu3zpofYQ' }; //Pruebas
const phpAuth = { url: 'https://amad.wlustpay.com/' };
let token = '', arrayIata = [];

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
exports.Fare_MasterPricerTravelBoardSearch11 = async (req, res) => {
    const flightDetails = {
        flightInformation: {
            productDateTime: {
                dateOfDeparture: '281224',
                timeOfDeparture: '0700',
                dateOfArrival: '281224',
                timeOfArrival: '0910'
            },
            location: [
                { locationId: 'MAD', terminal: '4' },
                { locationId: 'BCN', terminal: '1' }
            ],
            companyId: { marketingCarrier: 'IB', operatingCarrier: 'IB' },
            flightOrtrainNumber: '592',
            productDetail: { equipmentType: '321' },
            addProductDetail: { electronicTicketing: 'Y', productDetailQualifier: 'AVR' },
            attributeDetails: { attributeType: 'EFT', attributeDescription: '0210' }
        }
    };

    const flightDetailsArray = convertObjectToArray(flightDetails);
    console.log(flightDetailsArray);
    res.end();
}
function convertObjectToArray(obj) {
    return Object.keys(obj).map(key => obj[key]);
}
exports.Fare_MasterPricerTravelBoardSearch = async (req, res) => {
    const body = req.body, bodyOk = {
        departureLocation: body.iataFrom,
        arrivalLocation: body.iataTo,
        date: body.timeFrom,
        passengers: [
            { type: "ADT", count: body.adult },
            { type: "CNN", count: body.child },
            { type: "INF", count: body.infant }
        ]
    };
    const response = await procesosAmadeus('fare-search', 'POST', bodyOk);
    let result = [];
    if (response.response.recommendation) {
        if ((response.response.recommendation).length > 0) {
            response.response.flightIndex = response.response.flightIndex.requestedSegmentRef ? [response.response.flightIndex] : Object.keys(response.response.flightIndex).map(key => response.response.flightIndex[key]);
            if (response.response.flightIndex.length == 1) {
                /* if (response.response.flightIndex) { */
                for (recommendation of response.response.recommendation) {
                    recommendation.segmentFlightRef = recommendation.segmentFlightRef.referencingDetail ? [recommendation.segmentFlightRef] : Object.keys(recommendation.segmentFlightRef).map(key => recommendation.segmentFlightRef[key]);
                    for (recommendationSegment of recommendation.segmentFlightRef) {
                        /* response.response.flightIndex[0].groupOfFlights = response.response.flightIndex[0].groupOfFlights.flightDetails ? [response.response.flightIndex[0].groupOfFlights] : Object.keys(response.response.flightIndex[0].groupOfFlights).map(key => response.response.flightIndex[0].groupOfFlights[key]); */
                        for (groupOfFlights of response.response.flightIndex[0].groupOfFlights) {
                            if (recommendation.segmentFlightRef[0].referencingDetail[0].refNumber == groupOfFlights.propFlightGrDetail.flightProposal[0].ref) {
                                let idaTemp = [];
                                groupOfFlights.flightDetails = groupOfFlights.flightDetails.flightInformation ? [groupOfFlights.flightDetails] : Object.keys(groupOfFlights.flightDetails).map(key => groupOfFlights.flightDetails[key]);
                                for (flightDetails of groupOfFlights.flightDetails) {
                                    idaTemp.push({
                                        iataFrom: flightDetails.flightInformation.location[0].locationId,
                                        iataTo: flightDetails.flightInformation.location[1].locationId,
                                        dateFrom: flightDetails.flightInformation.productDateTime.dateOfDeparture,
                                        dateTo: flightDetails.flightInformation.productDateTime.dateOfArrival,
                                        dateVariaton: flightDetails.flightInformation.productDateTime?.dateVariation ?? null,
                                        timeFrom: flightDetails.flightInformation.productDateTime.timeOfDeparture,
                                        timeTo: flightDetails.flightInformation.productDateTime.timeOfArrival,
                                        terminalFrom: flightDetails.flightInformation.location[0]?.terminal ?? null,
                                        terminalTo: flightDetails.flightInformation.location[1]?.terminal ?? null,
                                        marketingCarrier: flightDetails.flightInformation.companyId.marketingCarrier,
                                        operatingCarrier: flightDetails.flightInformation.companyId?.operatingCarrier ?? flightDetails.flightInformation.companyId.marketingCarrier,
                                        numberTrip: flightDetails.flightInformation.flightOrtrainNumber,
                                        aircraft: flightDetails.flightInformation.productDetail.equipmentType,
                                        electronicTicketing: flightDetails.flightInformation.addProductDetail.electronicTicketing,
                                        productDetailQualifier: flightDetails.flightInformation.addProductDetail.productDetailQualifier,
                                        commercialAgreement: flightDetails.commercialAgreement ? {
                                            codeShareType: flightDetails.commercialAgreement.codeshareDetails.codeShareType,
                                            flightNumber: flightDetails.commercialAgreement.codeshareDetails.flightNumber
                                        } : null,
                                        technicalStop: flightDetails.technicalStop ? {
                                            iataCode: flightDetails.technicalStop[0].stopDetails[0].locationId,
                                            date1: flightDetails.technicalStop[0].stopDetails[0].date,
                                            time1: flightDetails.technicalStop[0].stopDetails[0].firstTime,
                                            date2: flightDetails.technicalStop[0].stopDetails[1].date,
                                            time2: flightDetails.technicalStop[0].stopDetails[1].firstTime
                                        } : null
                                    });
                                }
                                let paxOk = [];
                                for (paxPtc of recommendation.paxFareProduct) {
                                    let travellerDetails = [];
                                    /* for (pax of paxPtc.paxReference.traveller) { travellerDetails.push({ measurementValue: pax.ref[0] }); } */
                                    travellerDetails.push({ measurementValue: paxPtc.paxReference.traveller.ref });
                                    paxOk.push({ ptc: paxPtc.paxReference.ptc[0], ref: travellerDetails, total: paxPtc.paxReference.traveller.length });
                                }
                                recommendation.paxFareProduct[0].fareDetails.groupOfFares = recommendation.paxFareProduct[0].fareDetails.groupOfFares.productInformation ? [recommendation.paxFareProduct[0].fareDetails.groupOfFares] : Object.keys(recommendation.paxFareProduct[0].fareDetails.groupOfFares).map(key => recommendation.paxFareProduct[0].fareDetails.groupOfFares[key]);
                                for (let i = 0; i < idaTemp.length; i++) {
                                    idaTemp[i].rbd = recommendation.paxFareProduct[0].fareDetails.groupOfFares[i].productInformation.cabinProduct.rbd;
                                    idaTemp[i].avlStatus = recommendation.paxFareProduct[0].fareDetails.groupOfFares[i].productInformation.cabinProduct.avlStatus;
                                }
                                result.push({
                                    id: `${recommendation.itemNumber.itemNumberId.number}-${recommendationSegment.referencingDetail[0].refNumber}-${recommendationSegment.referencingDetail[1].refNumber}`,
                                    precio: { total: recommendation.recPriceInfo.monetaryDetail[0].amount, fee: recommendation.recPriceInfo.monetaryDetail[1].amount },
                                    pax: paxOk,
                                    vc: recommendation.paxFareProduct[0].paxFareDetail.codeShareDetails.company,
                                    detalle: recommendation.segmentFlightRef,
                                    ida: idaTemp
                                });
                            }
                        }
                    }
                }
                res.status(200).json({ error: false, data: result, session: {} });
            } else if (response.response.flightIndex.length == 2) {
                for (recommendation of response.response.recommendation) {
                    recommendation.segmentFlightRef = recommendation.segmentFlightRef.referencingDetail ? [recommendation.segmentFlightRef] : Object.keys(recommendation.segmentFlightRef).map(key => recommendation.segmentFlightRef[key]);
                    for (recommendationSegment of recommendation.segmentFlightRef) {
                        let idaTemp = [], vueltaTemp = [];
                        /* response.response.flightIndex[0].groupOfFlights = Object.keys(response.response.flightIndex[0].groupOfFlights).map(key => response.response.flightIndex[0].groupOfFlights[key]); */
                        for (groupOfFlights of response.response.flightIndex[0].groupOfFlights) {
                            if (recommendationSegment.referencingDetail[0].refNumber == groupOfFlights.propFlightGrDetail.flightProposal[0].ref) {
                                idaTemp = [];
                                groupOfFlights.flightDetails = groupOfFlights.flightDetails.flightInformation ? [groupOfFlights.flightDetails] : Object.keys(groupOfFlights.flightDetails).map(key => groupOfFlights.flightDetails[key]);
                                for (flightDetails of groupOfFlights.flightDetails) {
                                    idaTemp.push({
                                        iataFrom: flightDetails.flightInformation.location[0].locationId,
                                        iataTo: flightDetails.flightInformation.location[1].locationId,
                                        dateFrom: flightDetails.flightInformation.productDateTime.dateOfDeparture,
                                        dateTo: flightDetails.flightInformation.productDateTime.dateOfArrival,
                                        dateVariaton: flightDetails.flightInformation.productDateTime?.dateVariation ?? null,
                                        timeFrom: flightDetails.flightInformation.productDateTime.timeOfDeparture,
                                        timeTo: flightDetails.flightInformation.productDateTime.timeOfArrival,
                                        terminalFrom: flightDetails.flightInformation.location[0]?.terminal ?? null,
                                        terminalTo: flightDetails.flightInformation.location[1]?.terminal ?? null,
                                        marketingCarrier: flightDetails.flightInformation.companyId.marketingCarrier,
                                        operatingCarrier: flightDetails.flightInformation.companyId?.operatingCarrier ?? flightDetails.flightInformation.companyId.marketingCarrier,
                                        numberTrip: flightDetails.flightInformation.flightOrtrainNumber,
                                        aircraft: flightDetails.flightInformation.productDetail.equipmentType,
                                        electronicTicketing: flightDetails.flightInformation.addProductDetail.electronicTicketing,
                                        productDetailQualifier: flightDetails.flightInformation.addProductDetail.productDetailQualifier,
                                        commercialAgreement: flightDetails.commercialAgreement ? {
                                            codeShareType: flightDetails.commercialAgreement.codeshareDetails.codeShareType,
                                            flightNumber: flightDetails.commercialAgreement.codeshareDetails.flightNumber
                                        } : null,
                                        technicalStop: flightDetails.technicalStop ? {
                                            iataCode: flightDetails.technicalStop[0].stopDetails[0].locationId,
                                            date1: flightDetails.technicalStop[0].stopDetails[0].date,
                                            time1: flightDetails.technicalStop[0].stopDetails[0].firstTime,
                                            date2: flightDetails.technicalStop[0].stopDetails[1].date,
                                            time2: flightDetails.technicalStop[0].stopDetails[1].firstTime
                                        } : null
                                    });
                                }
                            }
                        }
                        for (groupOfFlights of response.response.flightIndex[1].groupOfFlights) {
                            if (recommendationSegment.referencingDetail[1].refNumber == groupOfFlights.propFlightGrDetail.flightProposal[0].ref) {
                                vueltaTemp = [];
                                groupOfFlights.flightDetails = groupOfFlights.flightDetails.flightInformation ? [groupOfFlights.flightDetails] : Object.keys(groupOfFlights.flightDetails).map(key => groupOfFlights.flightDetails[key]);
                                for (flightDetails of groupOfFlights.flightDetails) {
                                    vueltaTemp.push({
                                        iataFrom: flightDetails.flightInformation.location[0].locationId,
                                        iataTo: flightDetails.flightInformation.location[1].locationId,
                                        dateFrom: flightDetails.flightInformation.productDateTime.dateOfDeparture,
                                        dateTo: flightDetails.flightInformation.productDateTime.dateOfArrival,
                                        dateVariaton: flightDetails.flightInformation.productDateTime?.dateVariation ?? null,
                                        timeFrom: flightDetails.flightInformation.productDateTime.timeOfDeparture,
                                        timeTo: flightDetails.flightInformation.productDateTime.timeOfArrival,
                                        terminalFrom: flightDetails.flightInformation.location[0]?.terminal ?? null,
                                        terminalTo: flightDetails.flightInformation.location[1]?.terminal ?? null,
                                        marketingCarrier: flightDetails.flightInformation.companyId.marketingCarrier,
                                        operatingCarrier: flightDetails.flightInformation.companyId?.operatingCarrier ?? flightDetails.flightInformation.companyId.marketingCarrier,
                                        numberTrip: flightDetails.flightInformation.flightOrtrainNumber,
                                        aircraft: flightDetails.flightInformation.productDetail.equipmentType,
                                        electronicTicketing: flightDetails.flightInformation.addProductDetail.electronicTicketing,
                                        productDetailQualifier: flightDetails.flightInformation.addProductDetail.productDetailQualifier,
                                        commercialAgreement: flightDetails.commercialAgreement ? {
                                            codeShareType: flightDetails.commercialAgreement.codeshareDetails.codeShareType,
                                            flightNumber: flightDetails.commercialAgreement.codeshareDetails.flightNumber
                                        } : null,
                                        technicalStop: flightDetails.technicalStop ? {
                                            iataCode: flightDetails.technicalStop[0].stopDetails[0].locationId,
                                            date1: flightDetails.technicalStop[0].stopDetails[0].date,
                                            time1: flightDetails.technicalStop[0].stopDetails[0].firstTime,
                                            date2: flightDetails.technicalStop[0].stopDetails[1].date,
                                            time2: flightDetails.technicalStop[0].stopDetails[1].firstTime
                                        } : null
                                    });
                                }
                            }
                        }
                        let paxOk = [];
                        for (paxPtc of recommendation.paxFareProduct) {
                            let travellerDetails = [];
                            /* for (pax of paxPtc.paxReference.traveller) { travellerDetails.push({ measurementValue: pax.ref[0] }); } */
                            travellerDetails.push({ measurementValue: paxPtc.paxReference.traveller.ref });
                            paxOk.push({ ptc: paxPtc.paxReference.ptc[0], ref: travellerDetails, total: paxPtc.paxReference.traveller.length });
                        }
                        for (let i = 0; i < idaTemp.length; i++) {
                            idaTemp[i].rbd = recommendation.paxFareProduct[0].fareDetails.groupOfFares[i].productInformation.cabinProduct.rbd;
                            idaTemp[i].avlStatus = recommendation.paxFareProduct[0].fareDetails.groupOfFares[i].productInformation.cabinProduct.avlStatus;
                        }
                        for (let j = 0; j < vueltaTemp.length; j++) {
                            vueltaTemp[j].rbd = recommendation.paxFareProduct[0].fareDetails[1].groupOfFares[j].productInformation.cabinProduct.rbd;
                            vueltaTemp[j].avlStatus = recommendation.paxFareProduct[0].fareDetails[1].groupOfFares[j].productInformation.cabinProduct.avlStatus;
                        }
                        result.push({
                            id: `${recommendation.itemNumber.itemNumberId.number}-${recommendationSegment.referencingDetail[0].refNumber}-${recommendationSegment.referencingDetail[1].refNumber}`,
                            precio: { total: recommendation.recPriceInfo.monetaryDetail[0].amount, fee: recommendation.recPriceInfo.monetaryDetail[1].amount },
                            pax: paxOk,
                            vc: recommendation.paxFareProduct[0].paxFareDetail.codeShareDetails.company,
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
    /* console.log(response);
    res.status(200).json({ error: false, data: response }); */

}

async function procesosAmadeus(path, method, body) {
    return new Promise((resolve, reject) => {
        let options = {};
        if (method == 'GET') {
            options = { method: method, url: phpAuth.url + path, headers: { accept: 'application/json', 'content-type': 'application/json' } };
        } else {
            options = { method: method, url: phpAuth.url + path, headers: { accept: 'application/json', 'content-type': 'application/json' }, body: body, json: true };
        }
        requesthttp(options, async (error, response, body) => {
            if (error) { reject({ error: true, data: error }); } else { resolve(response.body); }
        })
    });
}
/* function esperar(data) { return new Promise(resolve => setTimeout(resolve, data)); } */